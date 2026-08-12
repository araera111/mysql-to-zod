import { Effect, Either } from "effect";
import { configLoad } from "./init";

describe("configLoad", () => {
	it("case1 default path", async () => {
		const actual = await Effect.runPromise(
			configLoad("./mysqlToZod.config.js"),
		);
		expect(actual).toStrictEqual({
			output: {
				outDir: "./mysqlToZod",
				fileName: "schema.ts",
				globalSchemaFileName: "globalSchema.ts",
				saveSql: true,
				sqlFileName: "tables.sql",
				saveAst: false,
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
				inline: false,
				zod: {
					implementation: [],
					references: [],
				},
			},
			separate: {
				isSeparate: true,
				insertPrefix: "insert",
				insertSuffix: "",
			},
			sync: {
				active: false,
			},
			dbConnection: {
				database: "my_todo",
				host: "localhost",
				password: "root",
				port: 3306,
				user: "root",
			},
		});
	});

	it("case2 file not found", async () => {
		const actual = await Effect.runPromise(
			configLoad("./notFound.config.js").pipe(Effect.either),
		);
		expect(actual).toStrictEqual(Either.left("config file is not Found"));
	});

	it("case3 test/config/testConfig.js", async () => {
		const actual = await Effect.runPromise(
			configLoad("./test/config/testConfig.js"),
		);
		expect(actual).toStrictEqual({
			output: {
				outDir: "./test-out-put",
				fileName: "schema.ts",
				globalSchemaFileName: "globalSchema.ts",
				sqlFileName: "tables.sql",
				saveSql: false,
				saveAst: false,
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
				nullType: "nullable",
				inline: true,
				zod: {
					implementation: [],
					references: [],
					maxLength: {
						active: false,
						inline: null,
						global: null,
					},
				},
			},
			sync: {
				active: false,
			},
			separate: {
				isSeparate: false,
				insertPrefix: "insert",
				insertSuffix: "",
			},
		});
	});
});
