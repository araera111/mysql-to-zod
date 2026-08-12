import { produce } from "immer";
import type { MysqlToZodOption } from "../../options/options";
import { convertToZodType } from "../buildSchemaText/utils/buildSchemaTextUtil";

type ComposeGlobalSchemaRowParams = {
	type: string;
	option: MysqlToZodOption;
};

export const composeGlobalSchemaRow = ({
	type,
	option,
}: ComposeGlobalSchemaRowParams): string => {
	const existReference = option.schema?.zod?.references?.find(
		(x) => x[0] === type,
	);
	return `${existReference ? existReference[1] : `mysql${type}`}: ${convertToZodType(
		{
			type,
			option: produce(option, (draft) => {
				if (draft.schema) {
					draft.schema.inline = true;
				}
			}),
		},
	)},\n`;
};

type ComposeGlobalSchemaParams = {
	typeList: readonly string[];
	option: MysqlToZodOption;
};

const buildMaxLengthFunction = (option: MysqlToZodOption): string => {
	const maxLength = option.schema?.zod?.maxLength;
	if (maxLength?.active !== true) return "";

	const messageLine = maxLength.global
		? `\t\t\t\tmessage: \`${maxLength.global}\`,`
		: "";

	return [
		"maxLength: (arg: any, limit: number, ctx?: RefinementCtx): boolean => {",
		"\tif (arg?.toString()?.length > limit) {",
		"\t\tif (ctx)",
		"\t\t\tctx.addIssue({",
		"\t\t\t\tcode: z.ZodIssueCode.too_big,",
		"\t\t\t\tmaximum: limit,",
		'\t\t\t\ttype: typeof arg === "number" ? "number" : "string",',
		"\t\t\t\tinclusive: true,",
		messageLine,
		"\t\t\t});",
		"\t\treturn false;",
		"\t}",
		"\treturn true;",
		"},",
	]
		.filter((x) => x !== "")
		.join("\n");
};

const buildImportStatement = (option: MysqlToZodOption): string =>
	option.schema?.inline === false &&
	option.schema?.zod?.maxLength?.active === true
		? 'import { z, RefinementCtx } from "zod";'
		: 'import { z } from "zod";';

export const composeGlobalSchema = ({
	typeList,
	option,
}: ComposeGlobalSchemaParams): string | undefined => {
	if (option.schema?.inline === true) return undefined;

	const rows = typeList.map((type) =>
		composeGlobalSchemaRow({ type, option }).trim(),
	);

	const result = [
		buildImportStatement(option),
		"export const globalSchema = {",
		...rows,
		buildMaxLengthFunction(option),
		"};",
	]
		.filter((x) => x !== "")
		.join("\n");

	return result;
};
