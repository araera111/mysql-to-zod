import { Command } from "commander";
import { isLeft } from "fp-ts/lib/Either";

import { isNil } from "ramda";
import { buildSchemaText } from "./process/buildSchemaText";
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
    config: initEither.right,
  });

  await output({
    schemaRawText,
    outFilePath,
    fileName,
  });

  return 0;
};

main();
