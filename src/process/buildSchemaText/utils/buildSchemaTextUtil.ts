import { fromArray, head, tail } from "fp-ts/lib/NonEmptyArray";
import { isNone } from "fp-ts/lib/Option";
import { Create } from "node-sql-parser";
import { isEmpty, isNil } from "ramda";
import { toCamel, toPascal, toSnake } from "ts-case-convert";
import { match } from "ts-pattern";
import {
  OptionTableComments,
  defaultColumnCommentFormat,
  defaultTableCommentFormat,
  optionTableCommentsSchema,
} from "../../../options/comments";
import { CaseUnion, NullTypeUnion } from "../../../options/common";
import { MysqlToZodOption } from "../../../options/options";
import { SchemaOption, SchemaZodImplementation } from "../../../options/schema";
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

type GetNullTypeParams = {
  option: MysqlToZodOption;
};
export const getValidNullType = ({
  option,
}: GetNullTypeParams): NullTypeUnion => {
  const schemaNullType = option?.schema?.nullType;
  const oldNullType = option?.nullType;
  if (isNil(schemaNullType)) return oldNullType || "nullable";
  return schemaNullType;
};
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
  if (isNil(before) || isNil(after)) return tableName;

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
}: GetTableCommentParams): string | undefined => {
  const parsedOptionCommentsTable = optionTableCommentsSchema.parse(
    optionCommentsTable ?? {}
  );

  if (parsedOptionCommentsTable.active === false) return undefined;

  const tableOptions = ast?.table_options;
  if (isNil(tableOptions)) return undefined;

  const comment = commentKeywordSchema.parse(
    tableOptions.find((x: any) => x.keyword === "comment")
  );

  if (isNil(comment)) return undefined;

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
  const tableCommentString = isNil(tableComment) ? "" : `\n${tableComment}`;
  const strList = [tableCommentString, schemaText, typeString].filter(
    (x) => x !== ""
  );
  return strList;
};

type ToImplementationParams = {
  type: string;
  schemaZodImplementationList: SchemaZodImplementation[];
};
export const toImplementation = ({
  type,
  schemaZodImplementationList,
}: ToImplementationParams): string | undefined => {
  const f = schemaZodImplementationList.find((x) => x[0] === type);
  if (isNil(f)) return undefined;
  return f[1];
};

type ConvertToZodTypeParams = {
  type: string;
  schemaZodImplementationList: SchemaZodImplementation[];
};
export const convertToZodType = ({
  type,
  schemaZodImplementationList,
}: ConvertToZodTypeParams): string => {
  const impl = toImplementation({ type, schemaZodImplementationList });
  if (!isNil(impl)) return impl;

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

type ComposeColumnStringListParams = {
  column: Column;
  option: MysqlToZodOption;
};
export const composeColumnStringList = ({
  column,
  option,
}: ComposeColumnStringListParams): string[] => {
  const { comment, nullable, type } = column;
  const { comments } = option;

  const result: string[] = [
    !isNil(comment) && comments?.column?.active
      ? convertComment({
          name: column.column,
          comment,
          format: comments?.column?.format,
          isTable: false,
        })
      : undefined,
    `${addSingleQuotation(column.column)}: ${convertToZodType({
      type,
      schemaZodImplementationList: option?.schema?.zod?.implementation ?? [],
    })}${nullable ? `.${getValidNullType({ option })}()` : ""},\n`,
  ].flatMap((x) => (isNil(x) ? [] : [x]));

  return result;
};

export const toPascalWrapper = (str: string) => toPascal(str);

type ConvertTableNameParams = {
  tableName: string;
  format: CaseUnion;
  replacements: string[][];
};

const loopReplace = (replacements: string[][], tableName: string): string => {
  const nonEmptyReplacements = fromArray(replacements);
  if (isNone(nonEmptyReplacements)) return tableName;
  const headReplacements = head(nonEmptyReplacements.value);
  const tailReplacements = tail(nonEmptyReplacements.value);
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
  const replaced = isEmpty(replacements)
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
};

export const composeSchemaName = ({
  schemaOption,
  tableName,
}: composeSchemaNameParams): string => {
  const { prefix, suffix, format, replacements } = schemaOption;
  return `${prefix}${convertTableName({
    tableName,
    format,
    replacements,
  })}${suffix}`;
};

type ComposeTypeStringParams = {
  typeOption: TypeOption;
  tableName: string;
  schemaName: string;
};
export const composeTypeString = ({
  typeOption,
  tableName,
  schemaName,
}: ComposeTypeStringParams): string => {
  const { prefix, suffix, declared, format, replacements } = typeOption;

  if (declared === "none") return "";

  /* export:prefix type:declared Todo:tableName = z.infer<typeof todo:schemaname>; */
  const str = `export ${declared} ${prefix}${convertTableName({
    tableName,
    format,
    replacements,
  })}${suffix} = z.infer<typeof ${schemaName}>;`;
  return `${str}`;
};

type ReplaceOldTypeOptionParams = {
  isAddType: boolean | undefined;
  isCamel: boolean | undefined;
  isTypeUpperCamel: boolean | undefined;
  typeOption: TypeOption | undefined;
};
export const replaceOldTypeOption = ({
  isAddType,
  isCamel,
  isTypeUpperCamel,
  typeOption,
}: ReplaceOldTypeOptionParams): TypeOption => {
  if (isNil(typeOption)) {
    const base: TypeOption = {
      format: "pascal",
      declared: "type",
      prefix: "",
      suffix: "",
      replacements: [],
    };
    if (isAddType === false) return { ...base, declared: "none" };
    if (isTypeUpperCamel === true) return { ...base, format: "pascal" };
    if (isCamel === true) return { ...base, format: "camel" };
    return base;
  }
  return typeOption;
};

type ReplaceOldSchemaOptionParams = {
  isCamel: boolean | undefined;
  schemaOption: SchemaOption | undefined;
};
export const replaceOldSchemaOption = ({
  isCamel,
  schemaOption,
}: ReplaceOldSchemaOptionParams): SchemaOption => {
  if (isNil(schemaOption)) {
    const base: SchemaOption = {
      nullType: "nullable",
      format: "camel",
      prefix: "",
      suffix: "Schema",
      replacements: [],
      inline: true,
    };
    if (!isCamel) return { ...base, format: "original" };
    return base;
  }
  return schemaOption;
};
