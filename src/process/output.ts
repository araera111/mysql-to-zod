import { mkdirp, writeFileSync } from "fs-extra";
import { join } from "path";
import prettier from "prettier";
import { isNil } from "ramda";

const formatByPrettier = async (str: string): Promise<string> =>
  prettier.format(str, {
    parser: "babel-ts",
    plugins: ["prettier-plugin-organize-imports"],
  });

type OutputParams = {
  schemaRawText: string;
  outFilePath: string;
  fileName: string;
  globalSchema: string | undefined;
};

export const output = async ({
  schemaRawText,
  outFilePath,
  fileName,
  globalSchema,
}: OutputParams) => {
  const formatted = await formatByPrettier(schemaRawText);
  await mkdirp(outFilePath);
  const savePath = join(process.cwd(), outFilePath, fileName);
  await writeFileSync(savePath, formatted);
  // eslint-disable-next-line no-console
  console.log("schema file created!");
  // eslint-disable-next-line no-console
  console.log("path: ", savePath);

  /* globalSchema */
  if (isNil(globalSchema)) return;
  const globalSchemaFormatted = await formatByPrettier(globalSchema);
  const globalSchemaSavePath = join(
    process.cwd(),
    outFilePath,
    "globalSchema.ts"
  );
  await writeFileSync(globalSchemaSavePath, globalSchemaFormatted);
  // eslint-disable-next-line no-console
  console.log("\nglobalSchema file created!");
  // eslint-disable-next-line no-console
  console.log("path: ", globalSchemaSavePath);
};
