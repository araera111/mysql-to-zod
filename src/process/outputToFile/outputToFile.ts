import { join, resolve } from "node:path";
import { Effect, Predicate, pipe } from "effect";
import { mkdirpSync, readFileSync, writeFileSync } from "fs-extra";
import { match, P } from "ts-pattern";
import { type OptionOutput, outputDefaults } from "../../options";
import {
	formatByPrettier,
	type SupportedFormatters,
} from "../formatByPrettier";
import { mergeGlobalSchemaWrapper } from "./mergeGlobalConfig";

type SchemaOutputParams = {
	schemaRawText: string;
	globalSchema?: string;
	output?: OptionOutput;
};

type SqlOutputParams = {
	sql: string[];
	output?: OptionOutput;
};

const getOutputDir = (output: OptionOutput | undefined | string) => {
	if (typeof output === "string" && output !== "") return resolve(output);
	if (typeof output === "string" && output === "")
		return resolve(outputDefaults.outDir);

	if (
		Predicate.isNullable(output) ||
		Predicate.isNullable(output.outDir) ||
		output.outDir === ""
	)
		return resolve(outputDefaults.outDir);

	// to absolute path
	return resolve(output.outDir);
};

/**
 * General purpose output: Creates a folder if not exists, writes content to a file, and logs the result.
 * @param outputTo - Directory to save the file or config data that has that detail.
 * @param fileName - File name for the output file.
 * @param content - Content (usually formatted code) to be written to the file.
 * @param formatType - Type of the file being written (for logging purposes).
 */
export const writeLocalFile = (
	outputTo: OptionOutput | undefined | string,
	fileName: string,
	content: string,
	formatType?: SupportedFormatters,
): void => {
	const outDir = getOutputDir(outputTo);
	mkdirpSync(outDir);
	const savePath = join(outDir, fileName);
	writeFileSync(savePath, content, "utf-8");

	const fileType = match(formatType)
		.with("babel-ts", () => "TS code file")
		.with("sql", () => "SQL file")
		.with(P.nullish, () => "File")
		.exhaustive();

	console.info(`${fileType} created!`);
	console.info("path: ", savePath);
};

/**
 * Formats content (TS or SQL) and calls writeLocalFile to save the file.
 * @param rawText - The raw text content to be formatted.
 * @param formatType - Format type for prettier (e.g., "babel-ts", "sql").
 * @param fileName - File name for the output file.
 * @param output - Output options containing directory and file name.
 */
const writeFormattedFile = (
	rawText: string,
	formatType: SupportedFormatters,
	fileName: string,
	output?: OptionOutput,
): Effect.Effect<void, string> =>
	Effect.gen(function* () {
		const formatted = yield* formatByPrettier(rawText, formatType);

		// Temporary
		if (
			formatType === "sql" &&
			output?.saveSql &&
			output?.sqlFileName !== "tablename"
		) {
			// append, don't replace
			const existing = yield* pipe(
				Effect.try(() =>
					readFileSync(join(getOutputDir(output), fileName), "utf-8"),
				),
				Effect.catchAll(() => Effect.succeed(undefined)),
			);
			if (existing !== undefined) {
				writeLocalFile(
					output,
					fileName,
					`${existing}\n${formatted}`,
					formatType,
				);
				return;
			}
		}

		writeLocalFile(output, fileName, formatted, formatType);
	});

/**
 * Handles the SQL output to a file.
 * @param params - SQL text and output specs
 */
export const outputSqlToFile = ({
	sql,
	output,
}: SqlOutputParams): Effect.Effect<void, string> => {
	// first line is the table name
	const tableName = sql.slice(0, 1)[0] ?? "";
	const sqlQuery = sql.slice(1).join("\n"); // remove first line = tablename

	// if "tablename" is hardcoded in config file, use current table, otherwise use filename from config, or default
	const fileName =
		output?.sqlFileName === "tablename"
			? `${tableName}.sql`
			: output?.sqlFileName || outputDefaults.sqlFileName;

	return writeFormattedFile(sqlQuery, "sql", fileName, output);
};

/**
 * Handles the schema output, including the global schema if provided.
 * @param params - TS/Zod code, output specs, maybe globalSchema
 */
export const outputSchemaToFile = ({
	schemaRawText,
	globalSchema,
	output,
}: SchemaOutputParams): Effect.Effect<void, string> =>
	Effect.gen(function* () {
		// if "tablename" is hardcoded in config file, use current table, otherwise use filename from config, or default
		const fileName =
			output?.fileName === "tablename"
				? "tablename.ts"
				: output?.fileName || outputDefaults.fileName;

		yield* writeFormattedFile(schemaRawText, "babel-ts", fileName, output);

		/* Handle global schema if provided */
		if (Predicate.isNotNullable(globalSchema)) {
			const merged = yield* mergeGlobalSchemaWrapper({
				newGlobalSchema: globalSchema,
				outputDir: output?.outDir || outputDefaults.outDir,
			});
			yield* writeFormattedFile(
				merged,
				"babel-ts",
				output?.globalSchemaFileName || outputDefaults.globalSchemaFileName,
				output,
			);
		}
	});
