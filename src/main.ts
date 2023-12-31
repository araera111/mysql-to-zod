import { A, AR, pipe } from "@mobily/ts-belt";
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
const main = (command: Command) =>
	pipe(
		command,
		init,
		AR.flatMap(async (option) => {
			const { tableNames, sync, dbConnection } = option;
			const tables = await getTables(
				tableNames,
				dbConnectionOptionSchema.parse(dbConnection),
			);

			const schemaInformationList = sync?.active
				? parseZodSchemaFile({
						filePath: getOutputFilePath(option),
				  })
				: undefined;

			return buildSchemaText({
				tables,
				option,
				schemaInformationList,
			});
		}),
		AR.match(async ({ columns, option, text }) => {
			const globalSchema = composeGlobalSchema({
				typeList: pipe(
					columns,
					A.map((x) => x.type),
					A.uniq,
				),
				option,
			});
			await outputToFile({
				schemaRawText: text,
				output: option.output,
				globalSchema,
			});
			return 0; // success
		}, throwError),
	);

const VERSION = process.env.VERSION || "0.0.0";

program
	.option("-u, --update", "update schema file")
	.name("mysql-to-zod")
	/* NODE_ENV VERSION */
	.version(VERSION || "0.0.0")
	.description("mysql-to-zod is a tool to generate zod schema from mysql table")
	.parse(process.argv);

main(program);
