import { produce } from "immer";
import { MysqlToZodOption } from "../../options/options";
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
	typeList: string[];
	option: MysqlToZodOption;
};
export const composeGlobalSchema = ({
	typeList,
	option,
}: ComposeGlobalSchemaParams): string | undefined => {
	if (option.schema?.inline === true) return undefined;
	const rows = typeList
		.map((type) => composeGlobalSchemaRow({ type, option }))
		.join("");

	const result = [
		'import { z } from "zod";',
		"export const globalSchema = {",
		`${rows}};`,
	].join("\n");

	return result;
};
