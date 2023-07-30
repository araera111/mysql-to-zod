import { Create } from "node-sql-parser";
import { isNil } from "ramda";
import {
  MysqlToZodOption,
  OptionTableComments,
  defaultColumnCommentFormat,
  defaultTableCommentFormat,
  optionTableCommentsSchema,
} from "../../../options";
import { Column, commentKeywordSchema } from "../types/buildSchemaTextType";
import { convertToZodType } from "./toZod";

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
  schemaString: string;
  convertedTableName: string;
  addTypeString: string;
  tableComment: string | undefined;
};
export const composeTableSchemaTextList = ({
  schemaString,
  convertedTableName,
  addTypeString,
  tableComment,
}: ComposeTableSchemaTextParams): string[] => {
  const tableCommentString = isNil(tableComment) ? "" : `\n${tableComment}`;
  const strList = [
    tableCommentString,
    `export const ${convertedTableName}Schema = z.object({${schemaString}});`,
    addTypeString,
  ].filter((x) => x !== "");
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
  const { nullType, comments } = option;

  const result: string[] = [
    !isNil(comment) && comments?.column?.active
      ? convertComment({
          name: column.column,
          comment,
          format: comments?.column?.format,
          isTable: false,
        })
      : undefined,
    `${addSingleQuotation(column.column)}: ${convertToZodType(type)}${
      nullable ? `.${nullType}()` : ""
    },\n`,
  ].flatMap((x) => (isNil(x) ? [] : [x]));

  return result;
};

/* export const z.unknown() = z.custom<Buffer>(
  (value) => Buffer.isBuffer(value),
  { message: `Invalid type. Expected Buffer` }
);
 */
