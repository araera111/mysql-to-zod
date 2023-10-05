import * as O from "fp-ts/Option";
import { pipe } from "fp-ts/lib/function";
import { mkdirp, readFileSync, writeFileSync } from "fs-extra";
import { join } from "path";
import prettier from "prettier";
import { isNil } from "ramda";
import {
  getSchemaInformation,
  getTableNameListFromSchemaText,
  getTableTextFromSchemaText,
} from "../features/update/utils/updateUtil";
import { OptionOutput } from "../options/output";

export const formatByPrettier = async (str: string): Promise<string> =>
  prettier.format(str, {
    parser: "babel-ts",
  });

type OutputParams = {
  schemaRawText: string;
  globalSchema: string | undefined;
  output: OptionOutput | undefined;
  isUpdate: boolean;
};

export const outputToFile = async ({
  schemaRawText,
  output,
  globalSchema,
  isUpdate,
}: OutputParams) => {
  const formatted = await formatByPrettier(schemaRawText);
  const f = readFileSync("mysqlToZod/schema.ts", "utf-8");
  const tables = getTableNameListFromSchemaText(f);
  const a = await getTableTextFromSchemaText(f);
  const b = await getTableTextFromSchemaText(formatted);
  const c = a
    .map((x) => getSchemaInformation(x))
    .flatMap((x) => (O.isNone(x) ? [] : x.value));
  const d = b
    .map((x) => getSchemaInformation(x))
    .flatMap((x) => (O.isNone(x) ? [] : x.value));

  const { fileName, outDir } = pipe(
    output,
    O.fromNullable,
    O.getOrElse(() => ({
      fileName: "schema.ts",
      outDir: "./mysqlToZod",
    })),
  );
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
