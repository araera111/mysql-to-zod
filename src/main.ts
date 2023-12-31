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
import { throwError } from "./throwError";

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
		option,
		schemaInformationList,
	});

	R.match(
		schemaRawText,
		async (okx) => {
			const globalSchema = composeGlobalSchema({
				typeList: pipe(
					okx.columns,
					A.map((x) => x.type),
					A.uniq,
				),
				option,
			});
			await outputToFile({
				schemaRawText: okx.text,
				output: option.output,
				globalSchema,
			});
			return 0; // success
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
