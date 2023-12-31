import { G, O, pipe } from "@mobily/ts-belt";
import { mkdirpSync, writeFileSync } from "fs-extra";
import { join } from "path";
import { OptionOutput } from "../options/output";
import { formatByPrettier } from "./formatByPrettier";

type OutputParams = {
	schemaRawText: string;
	globalSchema: string | undefined;
	output: OptionOutput | undefined;
};

export const outputToFile = async ({
	schemaRawText,
	output,
	globalSchema,
}: OutputParams) => {
	const formatted = formatByPrettier(schemaRawText);

	const { fileName, outDir } = pipe(
		output,
		O.fromNullable,
		O.getWithDefault({
			fileName: "schema.ts",
			outDir: "./mysqlToZod",
		}),
	);
	mkdirpSync(outDir);
	const savePath = join(process.cwd(), outDir, fileName);
	writeFileSync(savePath, formatted);
	console.info("schema file created!");
	console.info("path: ", savePath);

	/* globalSchema */
	if (G.isNullable(globalSchema)) return;
	const globalSchemaFormatted = formatByPrettier(globalSchema);
	const globalSchemaSavePath = join(process.cwd(), outDir, "globalSchema.ts");
	writeFileSync(globalSchemaSavePath, globalSchemaFormatted);
	console.info("\nglobalSchema file created!");
	console.info("path: ", globalSchemaSavePath);
};
