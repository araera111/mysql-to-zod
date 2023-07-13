/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import { Command } from "commander";
import { isLeft } from "fp-ts/lib/Either";
import { mkdirp, writeFile } from "fs-extra";
import { EOL } from "os";
import { join } from "path";
import prettier from "prettier";
import { isNil } from "ramda";
import { createSchemaFile } from "./createSchemaFile";
import { getTableDefinition, getTables } from "./dbManipulateFunctions";
import { init } from "./init";

const program = new Command();

const main = async () => {
  const initEither = await init(program);
  if (isLeft(initEither)) throw new Error(initEither.left);

  const { outFilePath, fileName, dbConnection, tableNames } = initEither.right;
  if (isNil(dbConnection)) throw new Error("dbConnection is required");

  // table一覧を取得
  const tables = await getTables(tableNames, dbConnection);

  // import文を追加する
  const importStr = `import { z } from "zod";
  ${EOL}
  `;

  let str = importStr;
  for (const table of tables) {
    const tableDefinition = await getTableDefinition(table, dbConnection);
    const s = createSchemaFile(tableDefinition, initEither.right);
    str += `${s}
${EOL}`;
  }

  const result = await prettier.format(str, { parser: "babel-ts" });

  await mkdirp(outFilePath);

  const savePath = join(process.cwd(), outFilePath, fileName);
  writeFile(savePath, result, (err) => {
    if (err) throw err;
  });
  return 1;
};

main();
