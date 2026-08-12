import { A, G, O, pipe } from "@mobily/ts-belt";
import {
	type SchemaInformation,
	schemaInformationSchema,
} from "../../../features/sync/types/syncType";
import { schemaInformationToText } from "../../../features/sync/utils/syncUtil";
import { parse } from "../../../features/sync/utils/zodParse";
import type { MysqlToZodOption } from "../../../options/options";
import { schemaOptionSchema } from "../../../options/schema";
import { separateOptionSchema } from "../../../options/separate";
import { typeOptionSchema } from "../../../options/type";
import { formatByPrettier } from "../../formatByPrettier";
import type { Column, SchemaResult } from "../types/buildSchemaTextType";
import {
	type CreateSchemaModeUnion,
	combineSchemaNameAndSchemaString,
	composeColumnStringList,
	composeSchemaName,
	composeTableSchemaTextList,
	composeTypeString,
} from "./buildSchemaTextUtil";

type MergeSchemaTextWithOldInformationProps = {
	schemaName: string;
	schemaInformation: SchemaInformation;
	schemaText: string;
};

export const mergeSchemaTextWithOldInformation = async ({
	schemaName,
	schemaInformation,
	schemaText,
}: MergeSchemaTextWithOldInformationProps) => {
	/* 完成したテキストからschemaInformationをつくる */
	const formatted = await formatByPrettier(schemaText);
	const nextSchemaInformation = pipe(
		formatted,
		parse,
		A.head,
		O.flatMap((x) =>
			O.fromNullable(schemaInformationSchema.safeParse(x).data),
		),
	);

	/* パースできない場合や、nameが一致しないときは、そのまま返す */
	if (O.isNone(nextSchemaInformation)) return schemaText;
	const { tableName, properties } = O.getExn(nextSchemaInformation);
	if (tableName !== schemaName) return schemaText;

	/* 一致しているときは、propertiesからfindして、あったら入れ替える */
	const nextProperties = properties.map((property) => {
		const replaceElement = schemaInformation.properties.find(
			(y) => y.name === property.name,
		);
		if (G.isNullable(replaceElement)) return property;
		return replaceElement;
	});

	const replacedSchemaInformation = {
		tableName,
		properties: nextProperties,
	};
	const rawNextSchemaText = schemaInformationToText(
		replacedSchemaInformation,
	).join("");
	const formattedSchemaText = await formatByPrettier(rawNextSchemaText);
	return formattedSchemaText.trim();
};

type CreateSchemaProps = {
	tableName: string;
	columns: Column[];
	options: MysqlToZodOption;
	tableComment: string | undefined;
	schemaInformationList: readonly SchemaInformation[];
	mode: CreateSchemaModeUnion;
};
export const createSchema = async ({
	tableName,
	columns,
	options,
	tableComment,
	schemaInformationList,
	mode,
}: CreateSchemaProps): Promise<SchemaResult> => {
	const schemaString = columns
		.map((x) =>
			composeColumnStringList({ column: x, option: options, mode }).join("\n"),
		)
		.join("");

	const schemaOption = schemaOptionSchema.parse(options.schema);
	const separateOption = separateOptionSchema.parse(options.separate);
	const typeOption = typeOptionSchema.parse(options.type);

	const schemaName = composeSchemaName({
		schemaOption,
		tableName,
		mode,
		separateOption,
	});

	const schemaText = combineSchemaNameAndSchemaString({
		schemaName,
		schemaString,
	});

	/* schemaTextを古いschemaInformationとmergeする */
	const thisSchemaInformation = schemaInformationList.find(
		(x) => x.tableName === schemaName,
	);

	const merged = G.isNullable(thisSchemaInformation)
		? schemaText
		: await mergeSchemaTextWithOldInformation({
				schemaName,
				schemaText,
				schemaInformation: thisSchemaInformation,
			});

	const typeString = composeTypeString({
		typeOption,
		tableName,
		schemaName,
		mode,
		separateOption,
	});

	const schema = composeTableSchemaTextList({
		schemaText: merged,
		typeString,
		tableComment,
	});

	/* isSeparateのとき、関数をinsert modeで再実行する */
	const separateInsertSchema =
		separateOption.isSeparate && mode === "select"
			? `\n${await createSchema({
					tableName,
					columns,
					options,
					tableComment,
					schemaInformationList,
					mode: "insert",
				}).then((x) => x.schema)}`
			: "";

	return {
		schema: schema.join("\n") + separateInsertSchema,
		columns,
	};
};
