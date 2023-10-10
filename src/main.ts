import { Command } from "commander";
import { isLeft } from "fp-ts/lib/Either";

import { isNil, uniq } from "ramda";
import {
  getOutputFilePath,
  parseZodSchemaFile,
} from "./features/update/utils/updateUtil";
import {
  buildSchemaText,
  composeGlobalSchema,
  getTables,
  init,
  outputToFile,
} from "./process";

const program = new Command();

const main = async (command: Command) => {
  const initEither = await init(command);
  if (isLeft(initEither)) throw new Error(initEither.left);

  const { option } = initEither.right;
  const { dbConnection, tableNames } = option;
  if (isNil(dbConnection)) throw new Error("dbConnection is required");

  const tables = await getTables(tableNames, dbConnection);

  const schemaInformationList = parseZodSchemaFile({
    filePath: getOutputFilePath(option),
  });

  const schemaRawText = await buildSchemaText({
    tables,
    option,
    schemaInformationList,
  });
  if (isLeft(schemaRawText)) throw new Error(schemaRawText.left);

  const globalSchema = composeGlobalSchema({
    typeList: uniq(schemaRawText.right.columns.map((x) => x.type)),
    option,
  });

  await outputToFile({
    schemaRawText: schemaRawText.right.text,
    output: option.output,
    globalSchema,
  });

  return 0;
};

const VERSION = process.env.VERSION || "0.0.0";

program
  .option("-u, --update", "update schema file")
  .name("mysql-to-zod")
  /* NODE_ENV VERSION */
  .version(VERSION || "0.0.0")
  .description("mysql-to-zod is a tool to generate zod schema from mysql table")
  .parse(process.argv);

main(program);
