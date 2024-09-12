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
	return `${
		existReference ? existReference[1] : `mysql${type}`
	}: ${convertToZodType({
		type,
		option: produce(option, (draft) => {
			if (draft.schema) {
				draft.schema.inline = true;
			}
		}),
	})},\n`;
};

type ComposeGlobalSchemaParams = {
	typeList: readonly string[];
	option: MysqlToZodOption;
};

let maxLengthFunction = `
maxLength: (arg: any, limit: number, ctx?: RefinementCtx) : boolean => {
  if (arg?.toString()?.length > limit) {
    if (ctx)
      ctx.addIssue({
        code: z.ZodIssueCode.too_big,
        maximum: limit,
        type: typeof arg === "number" ? "number" : "string",
        inclusive: true,
		_MSG_
     });
    return false;
  }
  return true;
},`;

export const composeGlobalSchema = ({
	typeList,
	option,
}: ComposeGlobalSchemaParams): string | undefined => {
	if (option.schema?.inline === true) return undefined;
	const rows = typeList
		.map((type) => composeGlobalSchemaRow({ type, option }))
		.join("")
		.split("\n")
		.filter((x) => x !== "");
	if (option.schema?.zod?.maxLength?.active) {
		let message = "";
		if (option.schema?.zod?.maxLength?.global) {
			message = `message: \`${option.schema.zod.maxLength.global}\``;
		}
		maxLengthFunction = maxLengthFunction.replace("_MSG_", message);
	} else {
		maxLengthFunction = "";
	}

	const importStatement =
		option?.schema?.inline === false &&
		option?.schema?.zod?.maxLength?.active === true
			? 'import { z, RefinementCtx } from "zod";'
			: 'import { z } from "zod";';

	const result = [
		importStatement,
		"export const globalSchema = {",
		...rows,
		`${maxLengthFunction}`,
		"};",
	]
		.filter((x) => x !== "")
		.join("\n");

	return result;
};
