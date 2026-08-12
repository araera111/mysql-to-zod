import { Effect, Predicate } from "effect";
import { type AST, type Create, Parser } from "node-sql-parser";
import { objectToCamel } from "ts-case-convert";
import { z } from "zod";
import type { SchemaInformation } from "../../../features/sync/types/syncType";
import type { MysqlToZodOption } from "../../../options/options";
import { writeLocalFile } from "../../outputToFile/outputToFile";
import { type SchemaResult, columnsSchema } from "../types/buildSchemaTextType";
import { getTableComment } from "./buildSchemaTextUtil";
import { createSchema } from "./createSchema";

type CreateDefinition = NonNullable<Create["create_definitions"]>[number];

// node-sql-parserの型定義では comment.value は string だが、実際のASTでは { value: string } の場合もある
const commentValueSchema = z.union([
	z.string(),
	z.object({ value: z.string() }),
]);

const commentToText = (comment: unknown): string | undefined => {
	const parsed = commentValueSchema.safeParse(comment).data;
	return typeof parsed === "string" ? parsed : parsed?.value;
};

const convertToColumn = (definition: CreateDefinition) => {
	if (definition.resource !== "column") return undefined;

	const columnRef = definition.column;
	if (columnRef.type !== "column_ref") return undefined;
	const column = typeof columnRef.column === "string" ? columnRef.column : undefined;
	if (Predicate.isNullable(column)) return undefined;

	const type = definition.definition?.dataType;
	const nullable = definition.nullable?.type !== "not null";
	const comment = commentToText(definition.comment?.value);
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
		if (
			Predicate.isNullable(tableName) ||
			Predicate.isNullable(tableDefinitionString)
		) {
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

		const columns = columnsSchema
			.array()
			.parse(
				(ast.create_definitions ?? [])
					.map(convertToColumn)
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
