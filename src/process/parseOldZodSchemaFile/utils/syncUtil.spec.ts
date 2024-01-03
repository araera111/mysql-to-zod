import { R } from "@mobily/ts-belt";
import { MysqlToZodOption } from "../../../options";
import { mergeSchemaTextWithOldInformation } from "../../../process/buildSchemaText/utils/createSchema";
import { formatByPrettier } from "../../../process/formatByPrettier";
import { SchemaInformation } from "../types/syncType";
import {
	getOutputFilePath,
	getSchemaInformation,
	schemaInformationToText,
} from "./syncUtil";

describe("schemaInformationToText", () => {
	it("case1", () => {
		const schemaInformation: SchemaInformation = {
			tableName: "aaaSchema",
			properties: [{ name: "DB_ID", schema: "z.number()" }],
		};
		const result = [
			"export const aaaSchema = z.object({\n",
			"DB_ID: z.number(),\n",
			"});\n",
		];

		expect(schemaInformationToText(schemaInformation)).toStrictEqual(result);
	});
});

describe("mergeSchemaTextWithOldInformation 完成したschemaTextと以前のschemaInformationを合体する関数", () => {
	it("case1", () => {
		const schemaName = "aaaSchema";
		const schemaInformation: SchemaInformation = {
			tableName: "aaaSchema",
			properties: [{ name: "DB_ID", schema: "z.number().optional()" }],
		};
		const schemaText =
			"export const aaaSchema = z.object({ DB_ID: z.number() });";

		const result = `export const aaaSchema = z.object({
  DB_ID: z.number().optional(),
});`;
		const ex = mergeSchemaTextWithOldInformation({
			schemaInformation,
			schemaName,
			schemaText,
		});
		expect(ex).toBe(result);
	});
});

describe("getSchemaInformation", () => {
	it("case1", () => {
		const text =
			"export const telBlacklistSchema = z.object({ tel_no_blacklist: z.string() });";
		const result: R.Result<SchemaInformation[], string> = R.Ok([
			{
				tableName: "telBlacklistSchema",
				properties: [{ name: "tel_no_blacklist", schema: "z.string()" }],
			},
		]);
		expect(getSchemaInformation(text)).toStrictEqual(result);
	});
	it("case2", () => {
		const text = `export const configCancelSchema = z.object({
  DB_ID: z.number(),
  GROUP_ID: z.number(),
  sort_key: z.number(),
  disp_cancel: z.number(),
  cancel_text: z.string(),
});`;
		const result: R.Result<SchemaInformation[], string> = R.Ok([
			{
				tableName: "configCancelSchema",
				properties: [
					{ name: "DB_ID", schema: "z.number()" },
					{ name: "GROUP_ID", schema: "z.number()" },
					{ name: "sort_key", schema: "z.number()" },
					{ name: "disp_cancel", schema: "z.number()" },
					{ name: "cancel_text", schema: "z.string()" },
				],
			},
		]);
		expect(getSchemaInformation(text)).toStrictEqual(result);
	});
	it("case3", () => {
		const text =
			"export const telBlacklistSchema = z.object({ tel_no_blacklist: z.string() });";
		const result: R.Result<SchemaInformation[], string> = R.Ok([
			{
				tableName: "telBlacklistSchema",
				properties: [{ name: "tel_no_blacklist", schema: "z.string()" }],
			},
		]);
		expect(getSchemaInformation(text)).toStrictEqual(result);
	});
});

describe("formatByPrettier", () => {
	it("case1", () => {
		const str =
			"export const myTodoListSchema = z.object({  id: z.number(),  status: z.string(),  task: z.string(),  description: z.string().nullish(),  due_date: z.date().nullish(),  created_at: z.date().nullish(),  updated_at: z.date().nullish(),});";
		const result = `export const myTodoListSchema = z.object({
  id: z.number(),
  status: z.string(),
  task: z.string(),
  description: z.string().nullish(),
  due_date: z.date().nullish(),
  created_at: z.date().nullish(),
  updated_at: z.date().nullish(),
});
`;
		expect(formatByPrettier(str)).toBe(result);
	});
});

describe("getOutputFilePath", () => {
	it("case1 no config", () => {
		const option: MysqlToZodOption = {
			tableNames: [],
		};
		const result = "mysqlToZod/schema.ts";
		expect(getOutputFilePath(option)).toBe(result);
	});

	it("case2 exist config", () => {
		const option: MysqlToZodOption = {
			tableNames: [],
			output: {
				outDir: "./output",
				fileName: "dbSchema.ts",
			},
		};
		const result = "output/dbSchema.ts";
		expect(getOutputFilePath(option)).toBe(result);
	});
});
