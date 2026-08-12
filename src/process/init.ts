import { Array, Effect, Option, Predicate, pipe } from "effect";
import type { Command } from "commander";
import { cosmiconfig } from "cosmiconfig";
import { z } from "zod";
import type { DbConnectionOption } from "../options/dbConnection";
import {
	type MysqlToZodOption,
	basicMySQLToZodOption,
} from "../options/options";

export const configLoad = (
	configFilePath: string,
): Effect.Effect<MysqlToZodOption, string> =>
	pipe(
		Effect.tryPromise({
			try: () =>
				cosmiconfig("mysqlToZod", {
					searchPlaces: [configFilePath],
				}).search(),
			catch: () => "config file is not Found",
		}),
		Effect.flatMap((cfg) =>
			Predicate.isNullable(cfg)
				? Effect.fail("config file is not Found")
				: Effect.succeed(cfg.config),
		),
	);

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
	dbConnection: Option.Option<string>;
	config: Effect.Effect<MysqlToZodOption, string>;
};
const getDBConnection = ({
	dbConnection,
	config,
}: GetDBConnectionProps): Effect.Effect<string | DbConnectionOption, string> => {
	if (Option.isSome(dbConnection)) return Effect.succeed(dbConnection.value);
	return pipe(
		config,
		Effect.flatMap((x) =>
			Option.match(Option.fromNullable(x.dbConnection), {
				onNone: () => Effect.fail("dbConnection is required"),
				onSome: Effect.succeed,
			}),
		),
	);
};

export const commandOptionSchema = z.object({
	file: z.string(),
});
export type CommandOption = z.infer<typeof commandOptionSchema>;

export const init = (
	program: Command,
	configFilePath: string,
): Effect.Effect<MysqlToZodOption, string> =>
	Effect.gen(function* () {
		const config = yield* configLoad(configFilePath);
		const dbConnection = yield* getDBConnection({
			dbConnection: Array.get(program.args, 0),
			config,
		});
		const option = yield* pipe(
			config,
			Effect.getOrElse(() => Effect.succeed(basicMySQLToZodOption)),
		);
		return { ...option, dbConnection };
	});
