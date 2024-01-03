import { A, G, R, pipe } from "@mobily/ts-belt";
import { AST, Create, Parser } from "node-sql-parser";
import { objectToCamel } from "ts-case-convert";
import { z } from "zod";
import { MysqlToZodOption } from "../../../options";
import { SchemaInformation } from "../../parseOldZodSchemaFile/types/syncType";
import { columnsSchema } from "../types/buildSchemaTextType";
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

type MakeColumnListProps = {
	create_definitions: unknown;
};
export const makeColumnList = ({ create_definitions }: MakeColumnListProps) =>
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	A.flatMap(create_definitions as any[], (x) =>
		pipe(x, convertToColumn, (x) => (x === undefined ? [] : x)),
	);

type CreateSchemaFileProps = {
	tableDefinition: string[];
	option: MysqlToZodOption;
	schemaInformationList: readonly SchemaInformation[];
};

export const schemaResultSchema = z.object({
	schema: z.string(),
	columnList: columnsSchema.array().readonly(),
});

export type SchemaResult = z.infer<typeof schemaResultSchema>;
export const createSchemaFile = ({
	tableDefinition,
	option,
	schemaInformationList,
}: CreateSchemaFileProps): R.Result<SchemaResult, string> => {
	const parser = new Parser();
	const [tableName, tableDefinitionString] = tableDefinition;
	if (G.isNullable(tableName) || G.isNullable(tableDefinitionString)) {
		return R.Error(
			"createSchemaFileError. tableName or tableDefinitionString is nil",
		);
	}

	const ast = parser.astify(tableDefinitionString);
	if (Array.isArray(ast) || !isCreate(ast)) {
		return R.Error("createSchemaFileError ast parser error");
	}

	const columnList = makeColumnList({
		create_definitions: ast.create_definitions,
	});

	const tableComment = getTableComment({
		ast,
		optionCommentsTable: option?.comments?.table,
		tableName,
	});

	const { schema } = createSchema({
		tableName,
		columns: columnList,
		options: option,
		tableComment,
		schemaInformationList,
		mode: "select",
	});
	return R.Ok({ schema, columnList });
};
