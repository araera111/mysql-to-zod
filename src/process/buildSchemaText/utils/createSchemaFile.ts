import { left } from "fp-ts/Either";
import { AST, Create, Parser } from "node-sql-parser";
import { isNil } from "ramda";
import { objectToCamel } from "ts-case-convert";
import { MysqlToZodOption } from "../../../options";
import { columnsSchema, createSchema } from "./toZod";

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
  return objectToCamel({ column, type, nullable });
};

// astのCREATEかどうかを判定する関数
export const isCreate = (ast: AST): ast is Create =>
  "create_definitions" in ast;

export const createSchemaFile = (
  tableDefinition: string[], // 0がテーブルネーム、1がテーブル定義
  options: MysqlToZodOption
) => {
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

  const schema = createSchema(tableName, columns, options);
  return schema;
};
