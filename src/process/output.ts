import { mkdirp, writeFileSync } from "fs-extra";
import { join } from "path";
import prettier from "prettier";

const formatByPrettier = async (str: string): Promise<string> =>
  prettier.format(str, {
    parser: "babel-ts",
    plugins: ["prettier-plugin-organize-imports"],
  });

type OutputParams = {
  schemaRawText: string;
  outFilePath: string;
  fileName: string;
};

export const output = async ({
  schemaRawText,
  outFilePath,
  fileName,
}: OutputParams) => {
  const formatted = await formatByPrettier(schemaRawText);
  await mkdirp(outFilePath);
  const savePath = join(process.cwd(), outFilePath, fileName);
  await writeFileSync(savePath, formatted);
  // eslint-disable-next-line no-console
  console.log("schema file created!");
  // eslint-disable-next-line no-console
  console.log("path: ", savePath);
};
