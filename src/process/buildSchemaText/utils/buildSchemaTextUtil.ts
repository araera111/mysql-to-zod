import { A, G, O, pipe } from "@mobily/ts-belt";
import { produce } from "immer";
import { Create } from "node-sql-parser";
import { toCamel, toPascal, toSnake } from "ts-case-convert";
import { match } from "ts-pattern";
import {
	OptionTableComments,
	defaultColumnCommentFormat,
	defaultTableCommentFormat,
	optionCommentsSchema,
	optionTableCommentsSchema,
} from "../../../options/comments";
import { CaseUnion } from "../../../options/common";
import { MysqlToZodOption } from "../../../options/options";
import { SchemaOption } from "../../../options/schema";
import { separateOption } from "../../../options/separate";
import { TypeOption } from "../../../options/type";
import { Column, commentKeywordSchema } from "../types/buildSchemaTextType";
export const isMaybeRegExp = (str: string): boolean =>
	str.startsWith("/") && str.endsWith("/");

/* 
  knex result
      {
      tinyint_column: -128,
      smallint_column: -32768,
      mediumint_column: -8388608,
      int_column: -2147483648,
      bigint_column: -9223372036854776000,
      float_column: -3.40282e+38,
      double_column: -1.7976931348623155e+308,
      decimal_column: '1234.56',
      date_column: 2023-07-12T15:00:00.000Z,
      time_column: '23:59:59',
      datetime_column: 2023-07-13T14:59:59.000Z,
      timestamp_column: 2023-07-13T14:59:59.000Z,
      year_column: 2023,
      char_column: 'char_value',
      varchar_column: 'varchar_value',
      binary_column: <Buffer 31 31 31 00 00 00 00 00 00 00>,
      varbinary_column: <Buffer 76 61 72 62 69 6e 61 72 79 5f 76 61 6c 75 65>,
      tinyblob_column: <Buffer 74 69 6e 79 62 6c 6f 62 5f 76 61 6c 75 65>,
      blob_column: <Buffer 62 6c 6f 62 5f 76 61 6c 75 65>,
      mediumblob_column: <Buffer 6d 65 64 69 75 6d 62 6c 6f 62 5f 76 61 6c 75 65>,
      longblob_column: <Buffer 6c 6f 6e 67 62 6c 6f 62 5f 76 61 6c 75 65>,
      tinytext_column: 'tinytext_value',
      text_column: 'text_value',
      mediumtext_column: 'mediumtext_value',
      longtext_column: 'longtext_value',
      enum_column: 'value1',
      set_column: 'value2'
    }
*/

/*
  const typeMap = {
    tinyint: "number",
    smallint: "number",
    mediumint: "number",
    int: "number",
    bigint: "number",
    float: "number",
    double: "number",
    decimal: "string",
    date: "date",
    time: "string",
    datetime: "date",
    timestamp: "date",
    year: "number",
    char: "string",
    varchar: "string",
    binary: "Buffer",
    varbinary: "Buffer",
    tinyblob: "Buffer",
    blob: "Buffer",
    mediumblob: "Buffer",
    longblob: "Buffer",
    tinytext: "string",
    text: "string",
    mediumtext: "string",
    longtext: "string",
    enum: "string",
    set: "string",
  };
  */

// 1文字目が数字の場合は、先頭と末尾に''をつける関数
export const addSingleQuotation = (str: string) => {
	if (str.match(/^[0-9]/)) {
		return `'${str}'`;
	}
	return str;
};

type ReplaceTableNameParams = {
	tableName: string;
	replacements: string[];
};

export const replaceTableName = ({
	tableName,
	replacements,
}: ReplaceTableNameParams): string => {
	const [before, after] = replacements;
	/* if replacement[0]or[1] undefined -> return original tableName */
	if (G.isNullable(before) || G.isNullable(after)) return tableName;

	/* if notRegexp -> replace */
	if (!isMaybeRegExp(before)) return tableName.replace(before, after);

	/* if regexp -> replace */
	const regex = new RegExp(before.slice(1, -1));
	return tableName.replace(regex, after);
};

type ConvertComment = {
	name: string;
	comment: string;
	format: string;
	isTable: boolean;
};
export const convertComment = ({
	name,
	comment,
	format,
	isTable,
}: ConvertComment) => {
	if (format === "") {
		const defaultFormat = isTable
			? defaultTableCommentFormat
			: defaultColumnCommentFormat;
		return defaultFormat.replace("!name", name).replace("!text", comment);
	}
	return format.replace("!name", name).replace("!text", comment);
};

type GetTableCommentParams = {
	tableName: string;
	ast: Create;
	optionCommentsTable: OptionTableComments | undefined;
};
export const getTableComment = ({
	tableName,
	ast,
	optionCommentsTable,
	/* TODO:wip, string | undefined -> Option<string> */
}: GetTableCommentParams): string | undefined =>
	pipe(
		optionCommentsTable ?? {},
		optionTableCommentsSchema.parse,
		(optionCommentsTable) =>
			optionCommentsTable.active === true
				? O.Some(optionCommentsTable)
				: O.None,
		O.flatMap((optionCommentsTable) =>
			pipe(
				ast?.table_options,
				O.fromNullable,
				// biome-ignore lint/suspicious/noExplicitAny: <explanation>
				O.map((x) => x.find((x: any) => x.keyword === "comment")),
				O.flatMap((x) => commentKeywordSchema.parse(x)),
				O.map((x) =>
					convertComment({
						name: tableName,
						comment: x.value.slice(1, -1),
						format: optionCommentsTable.format,
						isTable: true,
					}),
				),
				O.toUndefined,
			),
		),
		O.toUndefined,
	);

type ComposeTableSchemaTextParams = {
	schemaText: string;
	typeString: string;
	tableComment: string | undefined;
};
export const composeTableSchemaTextList = ({
	schemaText,
	typeString,
	tableComment,
}: ComposeTableSchemaTextParams): string[] => {
	const tableCommentString = G.isNullable(tableComment)
		? ""
		: `\n${tableComment}`;
	const strList = [tableCommentString, schemaText, typeString].filter(
		(x) => x !== "",
	);
	return strList;
};

type ToImplementationParams = {
	type: string;
	option: MysqlToZodOption;
};
export const toImplementation = ({
	type,
	option,
}: ToImplementationParams): string | undefined => {
	const inline = option?.schema?.inline ?? true;

	/* globalSchemaの場合 */
	if (!inline) {
		const reference = option?.schema?.zod?.references?.find(
			(x) => x[0] === type,
		);
		if (!G.isNullable(reference)) return `globalSchema.${reference[1]}`;

		/* !inline && not includes reference */
		return `globalSchema.mysql${type}`;
	}

	const reference = option?.schema?.zod?.implementation?.find(
		(x) => x[0] === type,
	);
	if (!G.isNullable(reference)) return reference[1];

	return undefined;
};

type ConvertToZodTypeParams = {
	type: string;
	option: MysqlToZodOption;
};
export const convertToZodType = ({
	type,
	option,
}: ConvertToZodTypeParams): string => {
	const impl = toImplementation({
		type,
		option,
	});
	if (!G.isNullable(impl)) return impl;
	return match(type)
		.with("TINYINT", () => "z.number()")
		.with("SMALLINT", () => "z.number()")
		.with("MEDIUMINT", () => "z.number()")
		.with("INT", () => "z.number()")
		.with("BIGINT", () => "z.number()")
		.with("FLOAT", () => "z.number()")
		.with("DOUBLE", () => "z.number()")
		.with("YEAR", () => "z.number()")
		.with("BIT", () => "z.boolean()")
		.with("DATE", () => "z.date()")
		.with("DATETIME", () => "z.date()")
		.with("TIMESTAMP", () => "z.date()")
		.with("CHAR", () => "z.string()")
		.with("VARCHAR", () => "z.string()")
		.with("DECIMAL", () => "z.string()")
		.with("NUMERIC", () => "z.string()")
		.with("TINYTEXT", () => "z.string()")
		.with("TEXT", () => "z.string()")
		.with("MEDIUMTEXT", () => "z.string()")
		.with("LONGTEXT", () => "z.string()")
		.with("ENUM", () => "z.string()")
		.with("SET", () => "z.string()")
		.with("TIME", () => "z.string()")
		.with("BINARY", () => "z.unknown()")
		.with("VARBINARY", () => "z.unknown()")
		.with("TINYBLOB", () => "z.unknown()")
		.with("BLOB", () => "z.unknown()")
		.with("MEDIUMBLOB", () => "z.unknown()")
		.with("LONGBLOB", () => "z.unknown()")
		.otherwise(() => "z.unknown()");
};

type ConvertCommentProps = {
	comment: string | undefined;
	active: boolean;
	column: Column;
	option: MysqlToZodOption;
};
const getCommentString = ({
	comment,
	active,
	column,
	option,
}: ConvertCommentProps): string | undefined => {
	if (G.isNullable(comment) || !active) return undefined;
	const { comments } = option;
	return convertComment({
		name: column.column,
		comment,
		format: comments?.column?.format ?? defaultColumnCommentFormat,
		isTable: false,
	});
};

export type CreateSchemaModeUnion = "select" | "insert";

type AddNullTypeProps = {
	autoIncrement: boolean;
	nullable: boolean;
	mode: CreateSchemaModeUnion;
	option: MysqlToZodOption;
};
const addNullType = ({
	autoIncrement,
	nullable,
	mode,
	option,
}: AddNullTypeProps) => {
	{
		if (mode === "select") {
			return nullable ? `.${option.schema?.nullType ?? "nullable"}()` : "";
		}
		/* In insert mode, auto_increment is also nullable. */
		return nullable || autoIncrement
			? `.${option.schema?.nullType ?? "nullable"}()`
			: "";
	}
};

type ComposeColumnStringListProps = {
	column: Column;
	option: MysqlToZodOption;
	mode: CreateSchemaModeUnion;
};
export const composeColumnStringList = ({
	column,
	option,
	mode,
}: ComposeColumnStringListProps): string[] => {
	const { comment, nullable, type, autoIncrement } = column;
	const comments = optionCommentsSchema.parse(option?.comments);

	const result: string[] = [
		getCommentString({
			comment,
			active: comments?.column?.active ?? true,
			column,
			option,
		}),
		`${addSingleQuotation(column.column)}: ${convertToZodType({
			type,
			option,
		})}${addNullType({ nullable, option, mode, autoIncrement })},\n`,
	].flatMap((x) => (G.isNullable(x) ? [] : [x]));

	return result;
};

export const toPascalWrapper = (str: string) => toPascal(str);

type ConvertTableNameParams = {
	tableName: string;
	format: CaseUnion;
	replacements: string[][];
};

const loopReplace = (
	replacements: readonly string[][],
	tableName: string,
): string => {
	if (A.isEmpty(replacements)) return tableName;
	const headReplacements = pipe(replacements, A.head, O.getExn);
	const tailReplacements = pipe(replacements, A.tail, O.getExn);
	const string = replaceTableName({
		tableName,
		replacements: headReplacements,
	});
	return loopReplace(tailReplacements, string);
};
export const convertTableName = ({
	tableName,
	format,
	replacements,
}: ConvertTableNameParams) => {
	const replaced = A.isEmpty(replacements)
		? tableName
		: loopReplace(replacements, tableName);

	return match(format)
		.with("camel", () => toCamel(replaced))
		.with("pascal", () => toPascal(replaced))
		.with("snake", () => toSnake(replaced))
		.with("original", () => replaced)
		.exhaustive();
};

type CombineSchemaNameAndSchemaStringParams = {
	schemaName: string;
	schemaString: string;
};
export const combineSchemaNameAndSchemaString = ({
	schemaName,
	schemaString,
}: CombineSchemaNameAndSchemaStringParams) =>
	`export const ${schemaName} = z.object({${schemaString}});`;

type composeSchemaNameParams = {
	schemaOption: SchemaOption;
	tableName: string;
	mode: CreateSchemaModeUnion;
	separateOption: separateOption;
};

export const composeSchemaName = ({
	schemaOption,
	tableName,
	mode,
	separateOption,
}: composeSchemaNameParams): string => {
	const { prefix, suffix, format, replacements } = schemaOption;
	if (mode === "select") {
		return `${prefix}${convertTableName({
			tableName,
			format,
			replacements,
		})}${suffix}`;
	}

	/* insert */
	const { insertPrefix, insertSuffix } = separateOption;
	const ip =
		insertPrefix === "" || insertPrefix === undefined ? "" : `${insertPrefix}_`;
	return `${prefix}${convertTableName({
		tableName: `${ip}${tableName}${insertSuffix ?? ""}`,
		format,
		replacements,
	})}${suffix}`;
};

type ComposeTypeStringParams = {
	typeOption: TypeOption;
	tableName: string;
	schemaName: string;
	mode: CreateSchemaModeUnion;
	separateOption: separateOption;
};
export const composeTypeString = ({
	typeOption,
	tableName,
	schemaName,
	mode,
	separateOption,
}: ComposeTypeStringParams): string => {
	const { prefix, suffix, declared, format, replacements } = typeOption;
	if (declared === "none") return "";

	if (mode === "insert") {
		const { insertPrefix, insertSuffix } = separateOption;
		const str = `export ${declared} ${prefix}${convertTableName({
			tableName: `${insertPrefix ?? ""}_${tableName}${insertSuffix ?? ""}`,
			format,
			replacements,
		})}${suffix} = z.infer<typeof ${schemaName}>;`;
		return `${str}`;
	}

	/* export:prefix type:declared Todo:tableName = z.infer<typeof todo:schemaname>; */
	const str = `export ${declared} ${prefix}${convertTableName({
		tableName,
		format,
		replacements,
	})}${suffix} = z.infer<typeof ${schemaName}>;`;
	return `${str}`;
};
export const strListToStrLf = (strList: string[]): string => strList.join("\n");

type MakeImportDeclarationListProps = {
	option: MysqlToZodOption;
};
export const makeImportDeclarationList = ({
	option,
}: MakeImportDeclarationListProps): string[] =>
	produce(['import { z } from "zod";'], (draft) => {
		if (!option.schema?.inline) {
			draft.push("import { globalSchema } from './globalSchema';");
		}
		draft.push("\n");
	});
