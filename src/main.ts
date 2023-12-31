import { A, AR, pipe } from "@mobily/ts-belt";
import { Command } from "commander";
import { isLeft } from "fp-ts/lib/Either";
import {
	getOutputFilePath,
	parseZodSchemaFile,
} from "./features/sync/utils/syncUtil";
import { dbConnectionOptionSchema } from "./options/dbConnection";
import {
	buildSchemaText,
	composeGlobalSchema,
	getTables,
	init,
	outputToFile,
} from "./process";

const throwError = (message: string) => {
	throw new Error(message);
};

const program = new Command();
const main = async (command: Command) => {
	const option = await pipe(
		command,
		init,
		AR.match((x) => x, throwError),
	);
	const { tableNames, sync } = option;

	const tables = await getTables(
		tableNames,
		dbConnectionOptionSchema.parse(option.dbConnection),
	);

	const schemaInformationList = sync?.active
		? parseZodSchemaFile({
				filePath: getOutputFilePath(option),
		  })
		: undefined;

	const schemaRawText = await buildSchemaText({
		tables,
		option: option,
		schemaInformationList,
	});
	if (isLeft(schemaRawText)) throw new Error(schemaRawText.left);

	const globalSchema = composeGlobalSchema({
		typeList: pipe(
			schemaRawText.right.columns,
			A.map((x) => x.type),
			A.uniq,
		),
		option,
	});

	await outputToFile({
		schemaRawText: schemaRawText.right.text,
		output: option.output,
		globalSchema,
	});

	return 0;
};

const VERSION = process.env.VERSION || "0.0.0";

program
	.option("-u, --update", "update schema file")
	.name("mysql-to-zod")
	/* NODE_ENV VERSION */
	.version(VERSION || "0.0.0")
	.description("mysql-to-zod is a tool to generate zod schema from mysql table")
	.parse(process.argv);

main(program);
