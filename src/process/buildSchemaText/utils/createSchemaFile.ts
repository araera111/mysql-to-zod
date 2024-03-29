import { G, R } from "@mobily/ts-belt";
import { AST, Create, Parser } from "node-sql-parser";
import { objectToCamel } from "ts-case-convert";
import { SchemaInformation } from "../../../features/sync/types/syncType";
import { MysqlToZodOption } from "../../../options/options";
import { SchemaResult, columnsSchema } from "../types/buildSchemaTextType";
import { getTableComment } from "./buildSchemaTextUtil";
import { createSchema } from "./createSchema";
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export const convertToColumn = (ast: any) => {
	if (G.isNullable(ast.column)) return undefined;
	const { column } = ast.column;
	const type = ast?.definition?.dataType;

	const nullable = ast?.nullable?.type !== "not null";
	const comment = ast?.comment?.value?.value;
	const auto_increment = G.isNullable(ast.auto_increment) ? false : true;
	return objectToCamel({
		column,
		type,
		nullable,
		comment,
		auto_increment,
	});
};

// astのCREATEかどうかを判定する関数
export const isCreate = (ast: AST): ast is Create =>
	"create_definitions" in ast;

export const createSchemaFile = (
	tableDefinition: string[], // 0がテーブルネーム、1がテーブル定義
	options: MysqlToZodOption,
	schemaInformationList: readonly SchemaInformation[],
): R.Result<SchemaResult, string> => {
	const parser = new Parser();
	const [tableName, tableDefinitionString] = tableDefinition;
	if (G.isNullable(tableName) || G.isNullable(tableDefinitionString))
		return R.Error(
			"createSchemaFileError. tableName or tableDefinitionString is nil",
		);
	const ast = parser.astify(tableDefinitionString);
	if (Array.isArray(ast) || !isCreate(ast))
		return R.Error("createSchemaFileError ast parser error");

	const columns = columnsSchema.array().parse(
		ast.create_definitions
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			?.map((x: any) => convertToColumn(x))
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			.flatMap((x: any) => (G.isNullable(x) ? [] : x)),
	);

	const tableComment = getTableComment({
		ast,
		optionCommentsTable: options?.comments?.table,
		tableName,
	});
	const { schema } = createSchema({
		tableName,
		columns,
		options,
		tableComment,
		schemaInformationList,
		mode: "select",
	});
	return R.Ok({ schema, columns });
};
