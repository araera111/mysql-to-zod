import { produce } from "immer";
import {
	type MysqlToZodOption,
	basicMySQLToZodOption,
} from "../../options/options";
import {
	composeGlobalSchema,
	composeGlobalSchemaRow,
} from "./composeGlobalSchema";

describe("composeGlobalSchema", () => {
	const basicOption: MysqlToZodOption = produce(
		basicMySQLToZodOption,
		(draft) => {
			if (draft.schema) {
				draft.schema.inline = false;
			}
		},
	);
	it("case1 DATE -> z.date();", () => {
		const typeList = ["DATE"];
		const option: MysqlToZodOption = basicOption;
		const result = `import { z } from "zod";
export const globalSchema = {
mysqlDATE: z.date(),
};`;
		expect(composeGlobalSchema({ typeList, option })).toBe(result);
	});

	it("case2 TINYINT -> z.number();", () => {
		const typeList = ["TINYINT"];
		const option: MysqlToZodOption = basicOption;
		const result = `import { z } from "zod";
export const globalSchema = {
mysqlTINYINT: z.number(),
};`;
		expect(composeGlobalSchema({ typeList, option })).toBe(result);
	});

	it("case3 TINYINT, DATE", () => {
		const typeList = ["TINYINT", "DATE"];
		const option: MysqlToZodOption = basicOption;
		const result = `import { z } from "zod";
export const globalSchema = {
mysqlTINYINT: z.number(),
mysqlDATE: z.date(),
};`;
		expect(composeGlobalSchema({ typeList, option })).toBe(result);
	});

	it("case4 inline: true", () => {
		const typeList = ["TINYINT", "DATE"];
		const option: MysqlToZodOption = produce(basicMySQLToZodOption, (draft) => {
			if (draft.schema) {
				draft.schema.inline = true;
			}
		});
		const result = undefined;
		expect(composeGlobalSchema({ typeList, option })).toBe(result);
	});

	it("case5 zod.implementation", () => {
		const typeList = ["DATE"];
		const option: MysqlToZodOption = produce(basicMySQLToZodOption, (draft) => {
			if (draft.schema?.zod) {
				draft.schema.inline = false;
				draft.schema.zod.implementation = [["DATE", "z.string()"]];
			}
		});
		const result = `import { z } from "zod";
export const globalSchema = {
mysqlDATE: z.string(),
};`;
		expect(composeGlobalSchema({ typeList, option })).toBe(result);
	});
});

describe("composeGlobalSchema maxLength", () => {
	const optionWithMaxLength = (global?: string): MysqlToZodOption =>
		produce(basicMySQLToZodOption, (draft) => {
			if (draft.schema?.zod) {
				draft.schema.inline = false;
				draft.schema.zod.maxLength = {
					active: true,
					inline: null,
					global: global ?? null,
				};
			}
		});

	const optionWithoutMaxLength = (): MysqlToZodOption =>
		produce(basicMySQLToZodOption, (draft) => {
			if (draft.schema) {
				draft.schema.inline = false;
			}
		});

	it("case1 maxLength active + global message", () => {
		const option = optionWithMaxLength("Too many characters. Maximum ${limit}.");
		const result = `import { z, RefinementCtx } from "zod";
export const globalSchema = {
mysqlVARCHAR: z.string(),
maxLength: (arg: any, limit: number, ctx?: RefinementCtx): boolean => {
	if (arg?.toString()?.length > limit) {
		if (ctx)
			ctx.addIssue({
				code: z.ZodIssueCode.too_big,
				maximum: limit,
				type: typeof arg === "number" ? "number" : "string",
				inclusive: true,
				message: ` + "`Too many characters. Maximum ${limit}.`" + `,
			});
		return false;
	}
	return true;
},
};`;
		expect(composeGlobalSchema({ typeList: ["VARCHAR"], option })).toBe(result);
	});

	it("case2 maxLength active, global なし", () => {
		const option = optionWithMaxLength();
		const result = `import { z, RefinementCtx } from "zod";
export const globalSchema = {
mysqlVARCHAR: z.string(),
maxLength: (arg: any, limit: number, ctx?: RefinementCtx): boolean => {
	if (arg?.toString()?.length > limit) {
		if (ctx)
			ctx.addIssue({
				code: z.ZodIssueCode.too_big,
				maximum: limit,
				type: typeof arg === "number" ? "number" : "string",
				inclusive: true,
			});
		return false;
	}
	return true;
},
};`;
		expect(composeGlobalSchema({ typeList: ["VARCHAR"], option })).toBe(result);
	});

	it("case3 maxLength 非active", () => {
		const option = optionWithoutMaxLength();
		const result = `import { z } from "zod";
export const globalSchema = {
mysqlVARCHAR: z.string(),
};`;
		expect(composeGlobalSchema({ typeList: ["VARCHAR"], option })).toBe(result);
	});

	it("case4 非activeの呼び出し後にactiveで呼んでも正しく出力される", () => {
		composeGlobalSchema({ typeList: ["VARCHAR"], option: optionWithoutMaxLength() });
		const option = optionWithMaxLength("Too many characters. Maximum ${limit}.");
		const result = `import { z, RefinementCtx } from "zod";
export const globalSchema = {
mysqlVARCHAR: z.string(),
maxLength: (arg: any, limit: number, ctx?: RefinementCtx): boolean => {
	if (arg?.toString()?.length > limit) {
		if (ctx)
			ctx.addIssue({
				code: z.ZodIssueCode.too_big,
				maximum: limit,
				type: typeof arg === "number" ? "number" : "string",
				inclusive: true,
				message: ` + "`Too many characters. Maximum ${limit}.`" + `,
			});
		return false;
	}
	return true;
},
};`;
		expect(composeGlobalSchema({ typeList: ["VARCHAR"], option })).toBe(result);
	});
});

describe("composeGlobalSchemaRow", () => {
	it("case 1", () => {
		const type = "TINYINT";
		const option: MysqlToZodOption = { ...basicMySQLToZodOption };
		const result = "mysqlTINYINT: z.number(),\n";
		expect(composeGlobalSchemaRow({ type, option })).toBe(result);
	});
	it("case 2", () => {
		const type = "DATE";
		const option: MysqlToZodOption = produce(basicMySQLToZodOption, (draft) => {
			if (draft.schema?.zod) {
				draft.schema.zod.implementation = [["DATE", "z.string().datetime()"]];
				draft.schema.zod.references = [["DATE", "ourDateTime"]];
			}
		});
		const result = "ourDateTime: z.string().datetime(),\n";
		expect(composeGlobalSchemaRow({ type, option })).toBe(result);
	});
});
