import { pipe } from "fp-ts/function";
import { isNil } from "ramda";
import { SchemaInformation } from "../../../features/sync/types/syncType";
import {
	parseZodSchema,
	schemaInformationToText,
} from "../../../features/sync/utils/syncUtil";
import { MysqlToZodOption } from "../../../options/options";
import { schemaOptionSchema } from "../../../options/schema";
import { separateOptionSchema } from "../../../options/separate";
import { typeOptionSchema } from "../../../options/type";
import { formatByPrettier } from "../../formatByPrettier";
import { Column, SchemaResult } from "../types/buildSchemaTextType";
import {
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
		schemaText.replaceAll("\n", ""),
		formatByPrettier,
		parseZodSchema,
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
		if (isNil(replaceElement)) return property;
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
	/* mergeしないときはundefinedにする */
	schemaInformationList: SchemaInformation[] | undefined;
};
export const createSchema = ({
	tableName,
	columns,
	options,
	tableComment,
	schemaInformationList,
}: CreateSchemaProps): SchemaResult => {
	const schemaString = columns
		.map((x) =>
			composeColumnStringList({ column: x, option: options }).join("\n"),
		)
		.join("");

	const schemaOption = schemaOptionSchema.parse(options.schema);

	const schemaName = composeSchemaName({ schemaOption, tableName });

	const schemaText = combineSchemaNameAndSchemaString({
		schemaName,
		schemaString,
	});

	/* schemaTextを古いschemaInformationとmergeする */
	const thisSchemaInformation = schemaInformationList?.find(
		(x) => x.tableName === schemaName,
	);

	const merged = isNil(thisSchemaInformation)
		? schemaText
		: mergeSchemaTextWithOldInformation({
				schemaName,
				schemaText,
				schemaInformation: thisSchemaInformation,
		  });

	const typeOption = typeOptionSchema.parse(options.type);

	const typeString = composeTypeString({
		typeOption,
		tableName,
		schemaName,
	});

	const schema = composeTableSchemaTextList({
		schemaText: merged,
		typeString,
		tableComment,
	});

	const separateSchema = separateOptionSchema.parse(options.separate);
	const separeteInsertSchema = separateSchema.isSeparate
		? schema.join("\n")
		: "";

	return {
		schema: schema.join("\n") + separeteInsertSchema,
		columns,
	};
};
