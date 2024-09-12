import { readFileSync } from "node:fs";
import {
	mergeGlobalConfig,
	mergeImportStatement,
	toKeyValuePair,
} from "./mergeGlobalConfig";

describe("mergeGlobalConfig", () => {
	it("case1", async () => {
		const old = `import { z } from "zod";

export const globalSchema = {

mysqlINT: z.number(),

mysqlVARCHAR: z.string(),

mysqlTINYINT: z.number(),

Timestamp: z.date(),

};
`;
		const newFile = `import { z } from "zod";

	export const globalSchema = {

	NNN: z.number(),

	mysqlVARCHAR: z.string(),

	mysqlTINYINT: z.number(),

	mysqlTIMESTAMP: z.date(),

};
`;

		const result = `import { z } from "zod";
export const globalSchema = {
  mysqlINT: z.number(),
  mysqlVARCHAR: z.string(),
  mysqlTINYINT: z.number(),
  Timestamp: z.date(),
  NNN: z.number(),
  mysqlTIMESTAMP: z.date(),
};
`;
		expect(
			await mergeGlobalConfig({
				oldGlobalSchema: old,
				newGlobalSchema: newFile,
			}),
		).toBe(result);
	});

	it("case2", async () => {
		const old = `import { z } from "zod";

export const globalSchema = {

Timestamp: z.date(),

};

`;
		const newSchema = readFileSync("test/files/testGlobalSchema.ts", "utf-8");
		expect(
			await mergeGlobalConfig({
				oldGlobalSchema: old,
				newGlobalSchema: newSchema,
			}),
		).toBe(readFileSync("test/files/resultSchema.ts", "utf-8"));
	});
});

describe("toKeyValuePair", () => {
	it("case1", () => {
		const schemaText = readFileSync("test/files/testGlobalSchema.ts", "utf-8");
		expect(toKeyValuePair(schemaText)).toStrictEqual([
			{
				key: "maxLength",
				value: readFileSync(
					"test/files/maxLengthValue.txt",
					"utf-8",
				).replaceAll("\t", ""),
			},
		]);
	});
	it("case2", () => {
		const schemaText = `import { z } from "zod";

export const globalSchema = {

  Timestamp: z.date(),

	};
`;
		expect(toKeyValuePair(schemaText)).toStrictEqual([
			{
				key: "Timestamp",
				value: "z.date(),",
			},
		]);
	});
});

describe("mergeImportStatement", () => {
	it("case1", () => {
		const oldImport = `import { z } from "zod";`;
		const newImport = `import { z } from "zod";`;
		const result = `import { z } from "zod";`;
		expect(
			mergeImportStatement({
				oldImportStatement: oldImport,
				newImportStatement: newImport,
			}),
		).toBe(result);
	});

	it("case2", () => {
		const oldImport = `import { z } from "zod";`;
		const newImport = `import { type RefinementCtx, z } from "zod";`;
		const result = `import { type RefinementCtx, z } from "zod";`;
		expect(
			mergeImportStatement({
				oldImportStatement: oldImport,
				newImportStatement: newImport,
			}),
		).toBe(result);
	});
});
