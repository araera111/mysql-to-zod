import { A, AR, R, pipe } from "@mobily/ts-belt";
import { Command } from "commander";
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

	const globalSchema = composeGlobalSchema({
		typeList: pipe(
			schemaRawText,
			R.map((x) => x.columns),
			R.map(A.map((x) => x.type)),
			R.map(A.uniq),
			R.getWithDefault([] as readonly string[]),
		),
		option,
	});

	R.match(
		schemaRawText,
		async (okx) => {
			await outputToFile({
				schemaRawText: okx.text,
				output: option.output,
				globalSchema,
			});
		},
		throwError,
	);
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
