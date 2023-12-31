import { A, D, G, O, R, pipe } from "@mobily/ts-belt";
import { Result } from "@mobily/ts-belt/dist/types/Result";
import { Command } from "commander";
import { cosmiconfig } from "cosmiconfig";
import { DbConnectionOption } from "../options/dbConnection";
import { MysqlToZodOption, basicMySQLToZodOption } from "../options/options";
export const configLoad = async (): Promise<
	Result<MysqlToZodOption, string>
> => {
	const explorer = cosmiconfig("mysqlToZod", {
		searchPlaces: ["mysqlToZod.config.js"],
	});

	const cfg = await explorer.search();
	return G.isNotNullable(cfg)
		? R.Ok(cfg.config)
		: R.Error("config file is not Found");
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

type GetDBConnectionProps = {
	dbConnection: O.Option<string>;
	config: R.Result<MysqlToZodOption, string>;
};
const getDBConnection = ({
	dbConnection,
	config,
}: GetDBConnectionProps): Result<string | DbConnectionOption, string> => {
	if (O.isSome(dbConnection)) return R.Ok(dbConnection);
	return pipe(
		config,
		R.toOption,
		O.flatMap((x) => O.getWithDefault(x.dbConnection, O.None)),
		O.toResult("dbConnection is required"),
	);
};

export const init = async (
	program: Command,
): Promise<Result<MysqlToZodOption, string>> => {
	const config = await configLoad();
	const argsDBConnection = A.get(program.args, 0);
	const dbConnection = getDBConnection({
		dbConnection: argsDBConnection,
		config,
	});

	return R.flatMap(dbConnection, (x) =>
		R.Ok(
			pipe(
				config,
				R.getWithDefault(basicMySQLToZodOption),
				D.set("dbConnection", x),
			),
		),
	);
};
