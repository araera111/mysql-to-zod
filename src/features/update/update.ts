import { Command } from "commander";
import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import { readFileSync } from "fs-extra";
import { basicMySQLToZodOption } from "../../options";
import { createSchemaFile } from "../../process/buildSchemaText/utils/createSchemaFile";
import { getTableDefinition } from "../../process/buildSchemaText/utils/getTableDefinition";
import {
  getSchemaInformation,
  getTableNameListFromSchemaText,
} from "./utils/updateUtil";

export const update = async (program: Command) => {
  const r = await getTableDefinition(
    "config_cancel",
    "mysql://root@localhost:3306/demo0051",
  );

  const schemaTextEither = createSchemaFile(r, basicMySQLToZodOption);
  if (E.isLeft(schemaTextEither)) throw new Error(schemaTextEither.left);
  const rr = getSchemaInformation(schemaTextEither.right.schema);
  if (O.isNone(rr)) throw new Error("none");
  console.log(rr.value);

  const f = readFileSync("mysqlToZod/schema.ts", "utf-8");
  const tables = getTableNameListFromSchemaText(f);
  console.log(tables);
};
