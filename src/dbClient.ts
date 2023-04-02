// knexのconfigをつくる
import knex from "knex";

// .envから環境変数を読み込む DATABASE_URL
import dotenv from "dotenv";

dotenv.config();

export const client = (connection: string) =>
  knex({
    client: "mysql2",
    connection,
  });

export const getKnexConfig = (connection: string) => ({ client: "mysql2", connection });
