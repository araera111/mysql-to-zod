import { Command } from "commander";
import { isLeft } from "fp-ts/lib/Either";

import { isNil, uniq } from "ramda";
import { buildSchemaText } from "./process/buildSchemaText/buildSchemaText";
import { composeGlobalSchema } from "./process/composeGlobalSchema/composeGlobalSchema";
import { getTables } from "./process/getTables";
import { init } from "./process/init";
import { output } from "./process/output";

const program = new Command();

const main = async () => {
  const initEither = await init(program);
  if (isLeft(initEither)) throw new Error(initEither.left);

  const { outFilePath, fileName, dbConnection, tableNames } = initEither.right;
  if (isNil(dbConnection)) throw new Error("dbConnection is required");

  const tables = await getTables(tableNames, dbConnection);

  const schemaRawText = await buildSchemaText({
    tables,
    option: initEither.right,
  });
  if (isLeft(schemaRawText)) throw new Error(schemaRawText.left);

  const globalSchema = composeGlobalSchema({
    typeList: uniq(schemaRawText.right.columns.map((x) => x.type)),
    option: initEither.right,
  });

  await output({
    schemaRawText: schemaRawText.right.text,
    outFilePath,
    fileName,
    globalSchema,
  });

  return 0;
};

main();
