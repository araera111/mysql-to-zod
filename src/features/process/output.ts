import { mkdirp, writeFileSync } from "fs-extra";
import { join } from "path";
import prettier from "prettier";

const formatByPrettier = async (str: string): Promise<string> =>
  prettier.format(str, { parser: "babel-ts" });

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
};
