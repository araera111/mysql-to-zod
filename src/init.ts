import { Command } from "commander";
import { cosmiconfig } from "cosmiconfig";
import { TypeScriptLoader } from "cosmiconfig-typescript-loader";
import { Either, isLeft, isRight, left, right } from "fp-ts/Either";
import { assoc, isNil } from "ramda";
import { MysqlToZodOption, mysqlToZodOptionSchema } from "./options";

const basicConfig: MysqlToZodOption = {
  isAddType: true,
  isCamel: true,
  isTypeUpperCamel: true,
  outFilePath: "./mysqlToZod/",
  fileName: "schema.ts",
  dbConnection: "mysql://root:root@localhost:3306/db",
  tableNames: [],
};

export const configLoad = async (): Promise<Either<string, MysqlToZodOption>> => {
  const explorer = cosmiconfig("mysqlToZod", {
    searchPlaces: ["mysqlToZod.config.ts"],
    loaders: {
      ".ts": TypeScriptLoader(),
    },
  });

  const cfg = await explorer.search();
  return isNil(cfg)
    ? left("config file is not Found")
    : right(mysqlToZodOptionSchema.parse(cfg.config));
};

/*
  この関数は、configファイルを読み込む
  エラーになるケース
  dbConnectionが存在しない場合
  argv[0]が存在する場合は、argv[0]を優先する
  configを読み込む。
  そのconfigがrightだがdbConnectionがなくて、かつargv[0]がない場合はエラーを出す
  configがleftで、かつargv[0]がない場合はエラーを出す
  configがrightで、argv[0]がないときは、configのdbConnectionを使う
  configがleftで、argv[0]があるときは、argv[0]を使う
*/
export const init = async (program: Command): Promise<Either<string, MysqlToZodOption>> => {
  const config = await configLoad();
  program.parse(process.argv);
  const dbConnection = program.args[0];

  if (isLeft(config) && isNil(dbConnection)) return left("init error. dbConnection is required");
  if (isRight(config) && isNil(config.right.dbConnection) && isNil(dbConnection))
    return left("init error. dbConnection is required");

  const validConfig = isRight(config) ? config.right : basicConfig;
  return right(assoc("dbConnection", dbConnection ?? validConfig.dbConnection, validConfig));
};
