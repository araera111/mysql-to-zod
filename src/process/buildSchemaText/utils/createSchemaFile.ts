import { Effect, Predicate } from "effect";
import {
	type AST,
	type Create,
	type CreateColumnDefinition,
	Parser,
} from "node-sql-parser";
import { objectToCamel } from "ts-case-convert";
import type { SchemaInformation } from "../../../features/sync/types/syncType";
import type { MysqlToZodOption } from "../../../options/options";
import { writeLocalFile } from "../../outputToFile/outputToFile";
import { type SchemaResult, columnsSchema } from "../types/buildSchemaTextType";
import { getTableComment } from "./buildSchemaTextUtil";
import { createSchema } from "./createSchema";

export const convertToColumn = (definition: CreateColumnDefinition) => {
	const column = definition.column?.column;
	if (Predicate.isNullable(column)) return undefined;

	const type = definition.definition?.dataType;
	const nullable = definition.nullable?.type !== "not null";
	const commentValue = definition.comment?.value;
	const comment =
		typeof commentValue === "string" ? commentValue : commentValue?.value;
	const length = definition.definition?.length ?? -1; // flag : no max length
	const autoIncrement = !Predicate.isNullable(definition.auto_increment);
	return objectToCamel({
		column,
		type,
		nullable,
		comment,
		auto_increment: autoIncrement,
		length,
	});
};

// astのCREATEかどうかを判定する関数
export const isCreate = (ast: AST): ast is Create =>
	"create_definitions" in ast;

export const createSchemaFile = (
	tableDefinition: string[], // 0がテーブルネーム、1がテーブル定義
	options: MysqlToZodOption,
	schemaInformationList: readonly SchemaInformation[],
): Effect.Effect<SchemaResult, string> =>
	Effect.gen(function* () {
		const [tableName, tableDefinitionString] = tableDefinition;
		if (Predicate.isNullable(tableName) || Predicate.isNullable(tableDefinitionString)) {
			return yield* Effect.fail(
				"createSchemaFileError. tableName or tableDefinitionString is nil",
			);
		}

		const parser = new Parser();
		const ast = parser.astify(tableDefinitionString);
		if (Array.isArray(ast) || !isCreate(ast)) {
			return yield* Effect.fail("createSchemaFileError ast parser error");
		}

		if (options?.output?.saveAst) {
			const astJson = JSON.stringify(ast, null, 2);
			writeLocalFile(options?.output, `${tableName}_ast.json`, astJson);
		}

		const columns = columnsSchema.array().parse(
			ast.create_definitions
				?.map((x) => convertToColumn(x as CreateColumnDefinition))
				.flatMap((x) => (Predicate.isNullable(x) ? [] : x)),
		);

		const tableComment = getTableComment({
			ast,
			optionCommentsTable: options?.comments?.table,
			tableName,
		});
		const { schema } = yield* createSchema({
			tableName,
			columns,
			options,
			tableComment,
			schemaInformationList,
			mode: "select",
		});
		return { schema, columns };
	});
