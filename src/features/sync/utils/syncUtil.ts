import { A, G, O, R, pipe } from "@mobily/ts-belt";
import { readFileSync } from "fs-extra";
import { join } from "path";
import { match } from "ts-pattern";
import { MysqlToZodOption } from "../../../options";
import { formatByPrettier } from "../../../process/formatByPrettier";
import { SchemaInformation, SchemaProperty } from "../types/syncType";
import { parse } from "./zodParse";

export const getSchemaInformation = (
	text: string,
): O.Option<SchemaInformation> => {
	const result = parse(text)[0];
	return O.Some(result) as O.Option<SchemaInformation>;
};

export const schemaInformationToText = (
	schemaInformation: SchemaInformation,
): string[] => {
	const result = [
		`export const ${schemaInformation.tableName} = z.object({\n`,
		...schemaInformation.properties.map((x) => `${x.name}: ${x.schema},\n`),
		"});\n",
	];
	return result;
};

export const getOutputFilePath = (option: MysqlToZodOption): string =>
	join(option.output?.outDir ?? "./mysqlToZod", option.output?.fileName ?? "");

export const splitSchemaText = (str: string): string[] => {
	const result: string[] = [];
	let isReading = false;
	let nowLine: string[] = [];
	const line = str.split("\n");
	// biome-ignore lint/complexity/noForEach: <explanation>
	line.forEach((x) => {
		if (x.includes("z.object({")) {
			isReading = true;
			nowLine.push(x);
			return;
		}

		if (isReading) {
			nowLine.push(x);
		}

		if (x.includes("});")) {
			isReading = false;
			result.push(nowLine.join(""));
			nowLine = [];
		}
	});
	const r = nowLine.length === 0 ? result : [...result, nowLine.join("")];
	return r.map((x) => formatByPrettier(x));
};

const getSchemaTitle = (schema: string) => {
	const split = schema.split(" ");
	let title = "";
	// biome-ignore lint/complexity/noForEach: <explanation>
	split.forEach((x, i) => {
		if (x.includes("const")) {
			const nextWord = split[i + 1] ?? "";
			title = nextWord;
		}
	});
	return title;
};

const getSchemaProperties = (schema: string): SchemaProperty[] => {
	const formatted = formatByPrettier(schema);
	const result = formatted
		.split("\n")
		.map((x) => x.split(":"))
		.filter((x) => x.length === 2)
		.flatMap(([left, right]) => {
			if (G.isNullable(left) || G.isNullable(right)) return [];
			/*
        when 1line
        ex: export const todoSchema = z.object({DB_ID: z.number()})
        split by "({" and right side(DB_ID) is valid
      */
			const validLeft = left.includes("export const")
				? left?.split("({")[1]
				: left;

			/*
        when 1line
        ex: export const todoSchema = z.object({DB_ID: z.number()})
        split by "})" and left side (z.number()) is valid
      */
			const validRight = right.includes("})") ? right?.split("})")[0] : right;
			if (G.isNullable(validLeft) || G.isNullable(validRight)) return [];

			return {
				name: validLeft.trim(),
				schema: validRight.trim().replaceAll(",", ""),
			};
		});
	return result;
};

export const parseZodSchema = (schema: string) => ({
	tableName: getSchemaTitle(schema),
	properties: getSchemaProperties(schema),
});

type ParseZodSchemaFileProps = {
	option: MysqlToZodOption;
	tableNames: readonly string[];
};
const readText = (path: string) => () => readFileSync(path, "utf-8");
export const parseZodSchemaFile = async ({
	option,
	tableNames,
}: ParseZodSchemaFileProps): Promise<
	R.Result<
		{
			schemaInformationList: readonly SchemaInformation[];
			tableNames: readonly string[];
			option: MysqlToZodOption;
		},
		string
	>
> => {
	return pipe(option?.sync?.active ?? false, (x) =>
		match(x)
			.with(true, () =>
				pipe(
					getOutputFilePath(option),
					(x) => R.fromExecution(readText(x)),
					R.map((x) => splitSchemaText(x)),
					R.map((x) => ({
						schemaInformationList: A.map(parseZodSchema)(x),
						tableNames,
						option,
					})),
					R.mapError((x) => `parseZodSchemaFileError: ${x}`),
				),
			)
			.with(false, () =>
				R.Ok({ schemaInformationList: [], tableNames, option }),
			)
			.exhaustive(),
	);
};
