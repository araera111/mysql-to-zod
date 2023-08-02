import { fromArray, head, tail } from "fp-ts/lib/NonEmptyArray";
import { isNone } from "fp-ts/lib/Option";
import { Create } from "node-sql-parser";
import { isEmpty, isNil } from "ramda";
import { toCamel, toPascal, toSnake } from "ts-case-convert";
import { match } from "ts-pattern";
import {
  CaseUnion,
  MysqlToZodOption,
  NullTypeUnion,
  OptionTableComments,
  SchemaOption,
  TypeOption,
  defaultColumnCommentFormat,
  defaultTableCommentFormat,
  optionTableCommentsSchema,
} from "../../../options";
import { Column, commentKeywordSchema } from "../types/buildSchemaTextType";
import { convertToZodType } from "./toZod";

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
  /* use match? invalid regexp -> return original tablename */
  if (!before.startsWith("/") && !after.endsWith("/"))
    return tableName.replace(before, after);

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
      /* TODO */
      customSchemaOptionList: [],
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
    };
    if (!isCamel) return { ...base, format: "original" };
    return base;
  }
  return schemaOption;
};
