import type { Command } from "commander";
import { Array as A, Effect, pipe } from "effect";
import { parseZodSchemaFile } from "../features/sync/utils/syncUtil";
import { buildSchemaText } from "./buildSchemaText";
import { composeGlobalSchema } from "./composeGlobalSchema";
import { getTables } from "./getTables/getTables";
import { init } from "./init";
import { outputSchemaToFile } from "./outputToFile/outputToFile";

export const runCommand = (
	command: Command,
	configFilePath: string,
): Effect.Effect<number, string> =>
	pipe(
		init(command, configFilePath),

		/* get Tables */
		Effect.flatMap(getTables),

		/* fetchSchemaInformationList */
		Effect.flatMap(({ option, tableNames }) =>
			parseZodSchemaFile({ option, tableNames }),
		),

		/* buildSchemaText */
		Effect.flatMap(({ tableNames, option, schemaInformationList }) =>
			buildSchemaText({
				tables: tableNames,
				option,
				schemaInformationList,
			}),
		),

		/* outputFile */
		Effect.flatMap(({ columns, option, text }) =>
			Effect.gen(function* () {
				const globalSchema = composeGlobalSchema({
					typeList: pipe(
						columns,
						A.map((x) => x.type),
						A.dedupe,
					),
					option,
				});
				yield* outputSchemaToFile({
					schemaRawText: text,
					output: option.output,
					globalSchema,
				});
				return 0; // success
			}),
		),
	);
