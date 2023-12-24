import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import { pipe } from "fp-ts/function";
import { readFileSync } from "fs-extra";
import { join } from "path";
import { includes, isNil } from "ramda";
import { MysqlToZodOption } from "../../../options";
import { formatByPrettier } from "../../../process/formatByPrettier";
import { SchemaInformation, SchemaProperty } from "../types/syncType";

export const getSchemaProperty = (text: string): O.Option<SchemaProperty> =>
	pipe(text.split(":"), ([name, schema]) => {
		if (isNil(name) || isNil(schema)) return O.none;
		return O.some({
			name: name.trim(),
			schema: schema.trim().replace(",", ""),
		});
	});

export const getTableName = (text: string): O.Option<string> =>
	pipe(
		text.split("="),
		A.lookup(0),
		O.filter(includes("export const")),
		O.map((x) => x.split(" ")[2]),
		O.chain(O.fromNullable),
	);

export const getSchemaInformation = (
	text: string,
): O.Option<SchemaInformation> => {
	const tableName = getTableName(text);

	/* 1行だった場合（\nが存在しなかったときの処理） */
	if (!text.includes("\n")) {
		/* =で区切る */
		const r = pipe(text.split("="), ([name, schema]) => {
			if (isNil(name) || isNil(schema)) return O.none;
			const names = name.split(" ");
			const nextTN = A.lookup(2, names);
			const property = getSchemaProperty(
				schema.replace("z.object({ ", "").replace(" });", ""),
			);
			if (O.isNone(nextTN) || O.isNone(property)) return O.none;
			const result = O.some({
				tableName: nextTN.value.trim(),
				properties: [property.value],
			});
			return result;
		});

		return r;
	}

	const schemaProperties = text
		.split("\n")
		.map((x) => getSchemaProperty(x))
		.flatMap((x) => (O.isNone(x) ? [] : x.value));
	if (O.isNone(tableName)) return O.none;
	return O.some({
		tableName: tableName.value,
		properties: schemaProperties,
	});
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
			if (isNil(left) || isNil(right)) return [];
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
			if (isNil(validLeft) || isNil(validRight)) return [];

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
	filePath: string;
};

export const parseZodSchemaFile = ({
	filePath,
}: ParseZodSchemaFileProps): SchemaInformation[] => {
	const result = pipe(
		filePath,
		(x) => readFileSync(x, { encoding: "utf-8" }),
		splitSchemaText,
		A.map(parseZodSchema),
	);
	return result;
};
