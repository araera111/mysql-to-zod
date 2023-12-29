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
				comment: "必ず一意になります",
				autoIncrement: true,
			},
		];
		const options: MysqlToZodOption = {
			tableNames: [],
			separate: {
				isSeparate: false,
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
				schemaInformationList: undefined,
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
				comment: "必ず一意になります",
				autoIncrement: true,
			},
		];
		const options: MysqlToZodOption = {
			tableNames: [],
			separate: {
				isSeparate: true,
			},
		};

		const resultSchema = `export const todoSchema = z.object({id: z.number(),
});
export type Todo = z.infer<typeof todoSchema>;
export const insertTodoSchema = z.object({id: z.number().optional(),
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
				schemaInformationList: undefined,
			}),
		).toStrictEqual(result);
	});
});
