import { Create } from "node-sql-parser";
import { isNil } from "ramda";
import {
  OptionCommentsTable,
  optionCommentsTableSchema,
} from "../../../options";
import { commentKeywordSchema } from "../types/buildSchemaTextType";

type ConvertTableCommentParams = {
  tableName: string;
  comment: string;
  format: string;
};
export const convertTableComment = ({
  tableName,
  comment,
  format,
}: ConvertTableCommentParams) => {
  if (format === "") return `// [table:${tableName}] : ${comment}`;
  return format.replace("!name", tableName).replace("!text", comment);
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

  /* 
      {
          keyword: "comment",
          symbol: "=",
          value: "'International Commercial Airports'",
        },
   delete single quote -> slice(1, -1)
  */
  return convertTableComment({
    tableName,
    comment: comment.value.slice(1, -1),
    format: parsedOptionCommentsTable.format,
  });
};

type ComposeTableSchemaTextParams = {
  schemaString: string;
  convertedTableName: string;
  isAddType: boolean;
  addTypeString: string;
  tableComment: string | undefined;
};
export const composeTableSchemaTextList = ({
  schemaString,
  convertedTableName,
  isAddType,
  addTypeString,
  tableComment,
}: ComposeTableSchemaTextParams): string[] => {
  const tableCommentString = isNil(tableComment) ? "" : `\n${tableComment}`;
  const strList = [
    tableCommentString,
    `export const ${convertedTableName}Schema = z.object({${schemaString}});`,
    isAddType ? addTypeString : "",
  ].filter((x) => x !== "");
  return strList;
};
