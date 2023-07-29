import { Create } from "node-sql-parser";
import { isNil } from "ramda";
import {
  MysqlToZodOption,
  OptionCommentsTable,
  optionCommentsTableSchema,
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

type ConvertComment = {
  name: string;
  comment: string;
  format: string;
};
export const convertComment = ({ name, comment, format }: ConvertComment) => {
  if (format === "") return `// [table:${name}] : ${comment}`;
  return format.replace("!name", name).replace("!text", comment);
};

type GetTableCommentParams = {
  tableName: string;
  ast: Create;
  optionCommentsTable: OptionCommentsTable | undefined;
};
export const getTableComment = ({
  tableName,
  ast,
  optionCommentsTable,
}: GetTableCommentParams): string | undefined => {
  const parsedOptionCommentsTable = optionCommentsTableSchema.parse(
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
  const { nullType } = option;
  const result: string[] = [
    !isNil(comment) ? `// ${comment}` : undefined,
    `${addSingleQuotation(column.column)}: ${convertToZodType(type)}${
      nullable ? `.${nullType}()` : ""
    },\n`,
  ].flatMap((x) => (isNil(x) ? [] : [x]));

  return result;
};
