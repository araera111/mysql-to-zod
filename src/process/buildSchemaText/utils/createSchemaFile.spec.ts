import { R } from "@mobily/ts-belt";
import { AST } from "node-sql-parser";
import rfdc from "rfdc";
import { MysqlToZodOption } from "../../../options";
import { CaseUnion } from "../../../options/common";
import { TypeOption } from "../../../options/type";
import {
	composeTypeString,
	convertTableName,
	toPascalWrapper,
} from "./buildSchemaTextUtil";
import { createSchemaFile, isCreate } from "./createSchemaFile";

describe("isCreate", () => {
	it("case1 true", () => {
		const obj: AST = {
			create_definitions: [],
			type: "create",
			keyword: "table",
		};
		const result = true;
		expect(isCreate(obj)).toBe(result);
	});
});

describe("convertTableName", () => {
	it("case1 pascal", () => {
		const tableName = "todo";
		const format: CaseUnion = "pascal";
		const replacements: string[][] = [];
		const result = "Todo";
		expect(convertTableName({ tableName, format, replacements })).toBe(result);
	});
	it("case2 camel", () => {
		const tableName = "todo";
		const format: CaseUnion = "camel";
		const replacements: string[][] = [];
		const result = "todo";
		expect(convertTableName({ tableName, format, replacements })).toBe(result);
	});
});

describe("toPascalWrapper", () => {
	it("case 1", () => {
		const str = "todo";
		const result = "Todo";
		expect(toPascalWrapper(str)).toBe(result);
	});
});

describe("composeTypeString", () => {
	it("case1 default", () => {
		const typeOption: TypeOption = {
			declared: "none",
			format: "camel",
			prefix: "",
			suffix: "",
			replacements: [],
		};
		const tableName = "todo";
		const schemaName = "todoSchema";
		const result = "";
		expect(
			composeTypeString({
				typeOption,
				tableName,
				schemaName,
				mode: "select",
				separateOption: {},
			}),
		).toStrictEqual(result);
	});

	it("case2 pascal", () => {
		const typeOption: TypeOption = {
			declared: "type",
			format: "pascal",
			prefix: "",
			suffix: "",
			replacements: [],
		};
		const tableName = "todo";
		const schemaName = "todoSchema";
		const result = "export type Todo = z.infer<typeof todoSchema>;";
		expect(
			composeTypeString({
				typeOption,
				tableName,
				schemaName,
				mode: "select",
				separateOption: {},
			}),
		).toStrictEqual(result);
	});

	it("case3", () => {
		const typeOption: TypeOption = {
			declared: "type",
			format: "snake",
			prefix: "aaa",
			suffix: "bbb",
			replacements: [
				["to", "task"],
				["do", "Name"],
			],
		};
		const tableName = "todo";
		const schemaName = "todoSchema";
		const result = "export type aaatask_namebbb = z.infer<typeof todoSchema>;";
		expect(
			composeTypeString({
				typeOption,
				tableName,
				schemaName,
				mode: "select",
				separateOption: {},
			}),
		).toStrictEqual(result);
	});
});

describe("createSchemaFile", () => {
	const option: MysqlToZodOption = {
		tableNames: [],
		output: {
			outDir: "./mysqlToZod",
			fileName: "schema.ts",
		},
		comments: {
			table: {
				active: true,
				format: "// [table:!name] : !text",
			},
			column: {
				active: true,
				format: "// !name : !text",
			},
		},
		type: {
			declared: "type",
			format: "pascal",
			prefix: "",
			suffix: "",
			replacements: [],
		},
		schema: {
			format: "camel",
			prefix: "",
			suffix: "Schema",
			replacements: [],
			nullType: "nullish",
			inline: true,
			zod: {
				implementation: [],
				references: [],
			},
		},
		sync: {
			active: false,
		},
		separate: {
			isSeparate: true,
			insertPrefix: "insert",
			insertSuffix: "",
		},
		dbConnection: {
			database: "my_todo",
			host: "localhost",
			password: "root",
			port: 3306,
			user: "root",
		},
	};
	it("case1", () => {
		const props = {
			tableDefinition: [
				"todo_list",
				"CREATE TABLE `todo_list` (\n  `id` int NOT NULL AUTO_INCREMENT COMMENT '必ず一意になります',\n  `task` varchar(255) NOT NULL,\n  `description` text,\n  `due_date` date DEFAULT NULL,\n  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,\n  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,\n  PRIMARY KEY (`id`)\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='タスクの一覧を管理するテーブル'",
			],
			option: rfdc()(option),
			schemaInformationList: [],
		};

		const result = R.Ok({
			schema:
				"\n// [table:todo_list] : タスクの一覧を管理するテーブル\nexport const todoListSchema = z.object({// id : 必ず一意になります\nid: z.number(),\ntask: z.string(),\ndescription: z.string().nullish(),\ndue_date: z.date().nullish(),\ncreated_at: z.date().nullish(),\nupdated_at: z.date().nullish(),\n});\nexport type TodoList = z.infer<typeof todoListSchema>;\n\n// [table:todo_list] : タスクの一覧を管理するテーブル\nexport const insertTodoListSchema = z.object({// id : 必ず一意になります\nid: z.number().nullish(),\ntask: z.string(),\ndescription: z.string().nullish(),\ndue_date: z.date().nullish(),\ncreated_at: z.date().nullish(),\nupdated_at: z.date().nullish(),\n});\nexport type InsertTodoList = z.infer<typeof insertTodoListSchema>;",
			columns: [
				{
					column: "id",
					type: "INT",
					nullable: false,
					comment: "必ず一意になります",
					autoIncrement: true,
				},
				{
					column: "task",
					type: "VARCHAR",
					nullable: false,
					autoIncrement: false,
					comment: undefined,
				},
				{
					column: "description",
					type: "TEXT",
					nullable: true,
					autoIncrement: false,
					comment: undefined,
				},
				{
					column: "due_date",
					type: "DATE",
					nullable: true,
					autoIncrement: false,
					comment: undefined,
				},
				{
					column: "created_at",
					type: "TIMESTAMP",
					nullable: true,
					autoIncrement: false,
					comment: undefined,
				},
				{
					column: "updated_at",
					type: "TIMESTAMP",
					nullable: true,
					autoIncrement: false,
					comment: undefined,
				},
			],
		});
		expect(createSchemaFile(props)).toStrictEqual(result);
	});
});
