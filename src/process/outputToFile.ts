import * as O from "fp-ts/Option";
import { pipe } from "fp-ts/lib/function";
import { mkdirpSync, writeFileSync } from "fs-extra";
import { join } from "path";
import { isNil } from "ramda";
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
    O.getOrElse(() => ({
      fileName: "schema.ts",
      outDir: "./mysqlToZod",
    })),
  );
  mkdirpSync(outDir);
  const savePath = join(process.cwd(), outDir, fileName);
  writeFileSync(savePath, formatted);
  // eslint-disable-next-line no-console
  console.log("schema file created!");
  // eslint-disable-next-line no-console
  console.log("path: ", savePath);

  /* globalSchema */
  if (isNil(globalSchema)) return;
  const globalSchemaFormatted = formatByPrettier(globalSchema);
  const globalSchemaSavePath = join(process.cwd(), outDir, "globalSchema.ts");
  writeFileSync(globalSchemaSavePath, globalSchemaFormatted);
  // eslint-disable-next-line no-console
  console.log("\nglobalSchema file created!");
  // eslint-disable-next-line no-console
  console.log("path: ", globalSchemaSavePath);
};
