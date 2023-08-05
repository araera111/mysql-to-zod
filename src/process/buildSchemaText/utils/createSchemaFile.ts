import { Either, left, right } from "fp-ts/Either";
import { AST, Create, Parser } from "node-sql-parser";
import { isNil } from "ramda";
import { objectToCamel } from "ts-case-convert";
import { MysqlToZodOption } from "../../../options/options";
import { SchemaResult, columnsSchema } from "../types/buildSchemaTextType";
import { getTableComment } from "./buildSchemaTextUtil";
import { createSchema } from "./createSchema";

export const convertToColumn = (ast: any) => {
  if (isNil(ast.column)) return undefined;
  const { column } = ast.column;

  /*
    dataType SET only Array node-sql-parser 4.8.0
    temp fix
  */
  const type = Array.isArray(ast?.definition?.dataType)
    ? (ast?.definition?.dataType[0] as string).toUpperCase()
    : ast?.definition?.dataType;

  const nullable = ast?.nullable?.type !== "not null";
  const comment = ast?.comment?.value?.value;
  return objectToCamel({ column, type, nullable, comment });
};

// astのCREATEかどうかを判定する関数
export const isCreate = (ast: AST): ast is Create =>
  "create_definitions" in ast;
export const createSchemaFile = (
  tableDefinition: string[], // 0がテーブルネーム、1がテーブル定義
  options: MysqlToZodOption
): Either<string, SchemaResult> => {
  const parser = new Parser();
  const [tableName, tableDefinitionString] = tableDefinition;
  if (isNil(tableName) || isNil(tableDefinitionString))
    return left("createSchemaFileError");
  const ast = parser.astify(tableDefinitionString);
  if (Array.isArray(ast) || !isCreate(ast))
    return left("createSchemaFileError");

  const columns = columnsSchema
    .array()
    .parse(
      ast.create_definitions
        ?.map((x: any) => convertToColumn(x))
        .flatMap((x: any) => (isNil(x) ? [] : x))
    );

  const tableComment = getTableComment({
    ast,
    optionCommentsTable: options?.comments?.table,
    tableName,
  });
  const { schema, importDeclarationList } = createSchema(
    tableName,
    columns,
    options,
    tableComment
  );
  return right({ schema, importDeclarationList, columns });
};
