import { Array as A, Option, Predicate, pipe } from "effect";
import type { Create } from "node-sql-parser";
import { toCamel, toPascal, toSnake } from "ts-case-convert";
import { match } from "ts-pattern";
import {
	type OptionTableComments,
	defaultColumnCommentFormat,
	defaultTableCommentFormat,
	optionTableCommentsSchema,
} from "../../../options/comments";
import type { CaseUnion } from "../../../options/common";
import type { MysqlToZodOption } from "../../../options/options";
import type { SchemaOption } from "../../../options/schema";
import type { separateOption } from "../../../options/separate";
import type { TypeOption } from "../../../options/type";
import {
	type Column,
	commentKeywordSchema,
} from "../types/buildSchemaTextType";

const isMaybeRegExp = (str: string): boolean =>
	str.startsWith("/") && str.endsWith("/");

// 1文字目が数字の場合は、先頭と末尾に''をつける関数
const addSingleQuotation = (str: string): string => {
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
	if (Predicate.isNullable(before) || Predicate.isNullable(after)) {
		return tableName;
	}

	/* if notRegexp -> replace */
	if (!isMaybeRegExp(before)) return tableName.replace(before, after);

	/* if regexp -> replace */
	const regex = new RegExp(before.slice(1, -1));
	return tableName.replace(regex, after);
};

type ConvertCommentParams = {
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
}: ConvertCommentParams): string => {
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
}: GetTableCommentParams): string | undefined => {
	const parsedOptionCommentsTable = optionTableCommentsSchema.parse(
		optionCommentsTable ?? {},
	);

	if (parsedOptionCommentsTable.active === false) return undefined;

	const tableOptions = ast?.table_options;
	if (Predicate.isNullable(tableOptions)) return undefined;

	const comment = commentKeywordSchema.parse(
		tableOptions.find((x) => x.keyword === "comment"),
	);

	if (Predicate.isNullable(comment)) return undefined;

	return convertComment({
		name: tableName,
		comment: comment.value.slice(1, -1),
		format: parsedOptionCommentsTable.format,
		isTable: true,
	});
};

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
	const tableCommentString = Predicate.isNullable(tableComment)
		? ""
		: `\n${tableComment}`;
	return [tableCommentString, schemaText, typeString].filter((x) => x !== "");
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
		if (!Predicate.isNullable(reference)) return `globalSchema.${reference[1]}`;

		/* !inline && not includes reference */
		return `globalSchema.mysql${type}`;
	}

	const reference = option?.schema?.zod?.implementation?.find(
		(x) => x[0] === type,
	);
	if (!Predicate.isNullable(reference)) return reference[1];

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
	if (!Predicate.isNullable(impl)) return impl;
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

type GetCommentStringParams = {
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
}: GetCommentStringParams): string | undefined => {
	if (Predicate.isNullable(comment) || !active) return undefined;
	const { comments } = option;
	return convertComment({
		name: column.column,
		comment,
		format: comments?.column?.format ?? defaultColumnCommentFormat,
		isTable: false,
	});
};

export type CreateSchemaModeUnion = "select" | "insert";

type AddNullTypeParams = {
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
}: AddNullTypeParams): string => {
	if (mode === "select") {
		return nullable ? `.${option.schema?.nullType ?? "nullable"}()` : "";
	}
	/* In insert mode, auto_increment is also nullable. */
	return nullable || autoIncrement
		? `.${option.schema?.nullType ?? "nullable"}()`
		: "";
};

type ComposeColumnStringListParams = {
	column: Column;
	option: MysqlToZodOption;
	mode: CreateSchemaModeUnion;
};
export const composeColumnStringList = ({
	column,
	option,
	mode,
}: ComposeColumnStringListParams): string[] => {
	const { comment, nullable, type, autoIncrement, length } = column;
	const { comments } = option;

	const zodType = convertToZodType({
		type,
		option,
	});
	const maybeNullable = addNullType({ nullable, option, mode, autoIncrement });

	const isValidLength = (value: typeof length, datatype: string): boolean =>
		option.schema?.zod?.maxLength?.active === true &&
		option.schema?.inline === false &&
		Predicate.isNotNullable(value) &&
		value > 0 &&
		datatype !== "DATE" &&
		datatype !== "TIMESTAMP";

	const lengthAsString = isValidLength(length, type) ? length?.toString() : "";
	const inlineLengthMsg =
		lengthAsString && option.schema?.zod?.maxLength?.inline
			? `, \`${option.schema.zod.maxLength.inline}\``.replace(
					"${limit}",
					lengthAsString,
				)
			: "";

	const max = lengthAsString
		? `.refine((arg) => globalSchema.maxLength(arg, ${lengthAsString})${inlineLengthMsg})`
		: "";

	// add other schema details here

	// assemble final schema string
	const zodSchema = zodType + max + maybeNullable;

	return [
		getCommentString({
			comment,
			active: comments?.column?.active ?? true,
			column,
			option,
		}),
		`${addSingleQuotation(column.column)}: ${zodSchema},\n`,
	].flatMap((x) => (Predicate.isNullable(x) ? [] : [x]));
};

type ConvertTableNameParams = {
	tableName: string;
	format: CaseUnion;
	replacements: string[][];
};

const loopReplace = (
	replacements: readonly string[][],
	tableName: string,
): string => {
	if (A.isEmptyReadonlyArray(replacements)) return tableName;
	const headReplacements = pipe(replacements, A.head, Option.getOrThrow);
	const tailReplacements = pipe(replacements, A.tail, Option.getOrThrow);
	const replaced = replaceTableName({
		tableName,
		replacements: headReplacements,
	});
	return loopReplace(tailReplacements, replaced);
};

export const convertTableName = ({
	tableName,
	format,
	replacements,
}: ConvertTableNameParams): string => {
	const replaced = A.isEmptyReadonlyArray(replacements)
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
}: CombineSchemaNameAndSchemaStringParams): string =>
	`export const ${schemaName} = z.object({${schemaString}});`;

type ComposeSchemaNameParams = {
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
}: ComposeSchemaNameParams): string => {
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
		return `export ${declared} ${prefix}${convertTableName({
			tableName: `${insertPrefix ?? ""}_${tableName}${insertSuffix ?? ""}`,
			format,
			replacements,
		})}${suffix} = z.infer<typeof ${schemaName}>;`;
	}

	return `export ${declared} ${prefix}${convertTableName({
		tableName,
		format,
		replacements,
	})}${suffix} = z.infer<typeof ${schemaName}>;`;
};

export const strListToStrLf = (strList: string[]): string => strList.join("\n");
