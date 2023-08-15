import { mkdirp, writeFileSync } from "fs-extra";
import { join } from "path";
import prettier from "prettier";
import { isNil } from "ramda";
import { OptionOutput } from "../options/output";

const formatByPrettier = async (str: string): Promise<string> =>
  prettier.format(str, {
    parser: "babel-ts",
    //    plugins: ["prettier-plugin-organize-imports"],
  });

type OutputParams = {
  schemaRawText: string;
  globalSchema: string | undefined;
  output: OptionOutput;
};

export const outputToFile = async ({
  schemaRawText,
  output,
  globalSchema,
}: OutputParams) => {
  const formatted = await formatByPrettier(schemaRawText);
  const { fileName, outDir } = output;
  await mkdirp(outDir);
  const savePath = join(process.cwd(), outDir, fileName);
  await writeFileSync(savePath, formatted);
  // eslint-disable-next-line no-console
  console.log("schema file created!");
  // eslint-disable-next-line no-console
  console.log("path: ", savePath);

  /* globalSchema */
  if (isNil(globalSchema)) return;
  const globalSchemaFormatted = await formatByPrettier(globalSchema);
  const globalSchemaSavePath = join(process.cwd(), outDir, "globalSchema.ts");
  await writeFileSync(globalSchemaSavePath, globalSchemaFormatted);
  // eslint-disable-next-line no-console
  console.log("\nglobalSchema file created!");
  // eslint-disable-next-line no-console
  console.log("path: ", globalSchemaSavePath);
};
