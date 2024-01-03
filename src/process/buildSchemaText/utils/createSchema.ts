import { G, pipe } from "@mobily/ts-belt";
import { MysqlToZodOption } from "../../../options/options";
import { schemaOptionSchema } from "../../../options/schema";
import { separateOptionSchema } from "../../../options/separate";
import { typeOptionSchema } from "../../../options/type";
import { formatByPrettier } from "../../formatByPrettier";
import { SchemaInformation } from "../../parseOldZodSchemaFile/types/syncType";
import { schemaInformationToText } from "../../parseOldZodSchemaFile/utils/syncUtil";
import { parse } from "../../parseOldZodSchemaFile/utils/zodParse";
import { Column, SchemaResult } from "../types/buildSchemaTextType";
import {
	CreateSchemaModeUnion,
	combineSchemaNameAndSchemaString,
	composeColumnStringList,
	composeSchemaName,
	composeTableSchemaTextList,
	composeTypeString,
} from "./buildSchemaTextUtil";
type UpdateSchemaTextProps = {
	schemaName: string;
	schemaText: string;
	schemaInformation: SchemaInformation;
};

export const mergeSchemaTextWithOldInformation = ({
	schemaName,
	schemaInformation,
	schemaText,
}: UpdateSchemaTextProps) => {
	/* 完成したテキストからschemaInformationをつくる */

	const nextSchemaInformation = pipe(
		schemaText,
		formatByPrettier,
		parse,
		(x) => x[0] as SchemaInformation,
		(x) => {
			return {
				tableName: x.tableName,
				properties: x.properties.flatMap((x) =>
					G.isNotNullable(x) ? [x] : [],
				),
			};
		},
	);

	/*
    完成したテキストとnameが一致していないときは、そのまま返す
    この前ですでにfindを使って取得しているはずだが、一応。
  */
	if (nextSchemaInformation.tableName !== schemaName) return schemaText;

	/* 一致しているときは、propertiesからfindして、あったら入れ替える */
	const nextProperties = nextSchemaInformation.properties.map((property) => {
		const replaceElement = schemaInformation.properties.find(
			(y) => y.name === property.name,
		);
		if (G.isNullable(replaceElement)) return property;
		return replaceElement;
	});

	const replacedSchemaInformation = {
		...nextSchemaInformation,
		properties: nextProperties,
	};
	const rawNextSchemaText = schemaInformationToText(
		replacedSchemaInformation,
	).join("");
	const formattedSchemaText = formatByPrettier(rawNextSchemaText);
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
export const createSchema = ({
	tableName,
	columns,
	options,
	tableComment,
	schemaInformationList,
	mode,
}: CreateSchemaProps): SchemaResult => {
	const schemaString = columns
		.map((x) =>
			composeColumnStringList({ column: x, option: options, mode }).join("\n"),
		)
		.join("");

	const schemaOption = schemaOptionSchema.parse(options.schema);
	const separateOption = separateOptionSchema.parse(options.separate);

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
		: mergeSchemaTextWithOldInformation({
				schemaName,
				schemaText,
				schemaInformation: {
					tableName: thisSchemaInformation.tableName,
					properties: thisSchemaInformation.properties.flatMap((x) =>
						G.isNotNullable(x) ? [x] : [],
					),
				},
		  });

	const typeOption = typeOptionSchema.parse(options.type);

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

	const separateSchema = separateOptionSchema.parse(options.separate);

	/* isSeparateのとき、関数をinsert modeで再実行する */
	const separeteInsertSchema =
		separateSchema.isSeparate && mode === "select"
			? `\n${
					createSchema({
						tableName,
						columns,
						options,
						tableComment,
						schemaInformationList,
						mode: "insert",
					}).schema
			  }`
			: "";

	return {
		schema: schema.join("\n") + separeteInsertSchema,
		columns,
	};
};
