import { Command } from "commander";
import { isLeft } from "fp-ts/lib/Either";

import { isNil, uniq } from "ramda";
import { update } from "./features/update/update";
import {
  buildSchemaText,
  composeGlobalSchema,
  getTables,
  init,
  outputToFile,
} from "./process";

const program = new Command();

const main = async () => {
  const argvs = program.parse(process.argv);
  const argv0 = argvs.args[0];
  if (argv0 === "update") {
    update(program);
    return 0;
  }

  const initEither = await init(program);
  if (isLeft(initEither)) throw new Error(initEither.left);

  const { dbConnection, tableNames } = initEither.right;
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

  await outputToFile({
    schemaRawText: schemaRawText.right.text,
    output: initEither.right.output,
    globalSchema,
  });

  return 0;
};

const VERSION = process.env.VERSION || "0.0.0";

program
  .name("mysql-to-zod")
  /* NODE_ENV VERSION */
  .version(VERSION || "0.0.0")
  .description(
    "mysql-to-zod is a tool to generate zod schema from mysql table",
  );

program.command("update");

main();
