import { MysqlToZodOption } from "../../../options";
import { Column } from "../types/buildSchemaTextType";
import { createSchema } from "./createSchema";

describe("createSchema", () => {
	it("case 1 separate = false", () => {
		const tableName = "todo";
		const columns: Column[] = [
			{
				column: "id",
				type: "INT",
				nullable: false,
				comment: undefined,
				autoIncrement: true,
			},
		];
		const options: MysqlToZodOption = {
			tableNames: [],
			separate: {
				isSeparate: false,
				insertPrefix: "insert",
			},
		};

		const resultSchema = `export const todoSchema = z.object({id: z.number(),
});
export type Todo = z.infer<typeof todoSchema>;`;

		const result = {
			schema: resultSchema,
			columns,
		};

		expect(
			createSchema({
				tableName,
				tableComment: undefined,
				columns,
				options,
				schemaInformationList: [],
				mode: "select",
			}),
		).toStrictEqual(result);
	});

	it("case2 separate = true", () => {
		const tableName = "todo";
		const columns: Column[] = [
			{
				column: "id",
				type: "INT",
				nullable: false,
				comment: undefined,
				autoIncrement: true,
			},
		];
		const options: MysqlToZodOption = {
			tableNames: [],
			separate: {
				isSeparate: true,
				insertPrefix: "insert",
			},
		};

		const resultSchema = `export const todoSchema = z.object({id: z.number(),
});
export type Todo = z.infer<typeof todoSchema>;
export const insertTodoSchema = z.object({id: z.number().nullable(),
});
export type InsertTodo = z.infer<typeof insertTodoSchema>;`;

		const result = {
			schema: resultSchema,
			columns,
		};

		expect(
			createSchema({
				tableName,
				tableComment: undefined,
				columns,
				options,
				schemaInformationList: [],
				mode: "select",
			}),
		).toStrictEqual(result);
	});

	it("case3 separate = true, suffix", () => {
		const tableName = "todo";
		const columns: Column[] = [
			{
				column: "id",
				type: "INT",
				nullable: false,
				comment: undefined,
				autoIncrement: true,
			},
		];
		const options: MysqlToZodOption = {
			tableNames: [],
			separate: {
				isSeparate: true,
				insertPrefix: "",
				insertSuffix: "Insert",
			},
		};

		const resultSchema = `export const todoSchema = z.object({id: z.number(),
});
export type Todo = z.infer<typeof todoSchema>;
export const todoInsertSchema = z.object({id: z.number().nullable(),
});
export type TodoInsert = z.infer<typeof todoInsertSchema>;`;

		const result = {
			schema: resultSchema,
			columns,
		};

		expect(
			createSchema({
				tableName,
				tableComment: undefined,
				columns,
				options,
				schemaInformationList: [],
				mode: "select",
			}),
		).toStrictEqual(result);
	});
});
