import { left } from "fp-ts/Either";
import { AST, Create, Parser } from "node-sql-parser";
import { isNil } from "ramda";
import { objectToCamel, toCamel, toPascal, toSnake } from "ts-case-convert";
import { match } from "ts-pattern";
import { CaseUnion, MysqlToZodOption, TypeOption } from "../../../options";
import { columnsSchema } from "../types/buildSchemaTextType";
import { getTableComment, replaceTableName } from "./buildSchemaTextUtil";
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

  const tableComment = getTableComment({
    ast,
    optionCommentsTable: options?.comments?.table,
    tableName,
  });
  const schema = createSchema(tableName, columns, options, tableComment);
  return schema;
};

export const toPascalWrapper = (str: string) => toPascal(str);

type ConvertTableNameParams = {
  tableName: string;
  format: CaseUnion;
  replacements: string[];
};
export const convertTableName = ({
  tableName,
  format,
  replacements,
}: ConvertTableNameParams) => {
  if (format === "replace")
    return replaceTableName({ tableName, replacements });
  return match(format)
    .with("camel", () => toCamel(tableName))
    .with("pascal", () => toPascal(tableName))
    .with("snake", () => toSnake(tableName))
    .exhaustive();
};

type ComposeTypeStringListParams = {
  typeOption: TypeOption;
  tableName: string;
  schemaName: string;
};
export const composeTypeString = ({
  typeOption,
  tableName,
  schemaName,
}: ComposeTypeStringListParams): string => {
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
