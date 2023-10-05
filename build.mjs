// date-fnsをimport
import { format } from "date-fns";
import * as esbuild from "esbuild";
import fs from "fs-extra";

const packageJson = await fs.readFileSync("./package.json");
const { version } = JSON.parse(packageJson);

// date-fnsでDATE型をYYYY-MM-DD HH:mm:ssに変換する関数
const toYYYYMMDDHHmmss = (date) => format(date, "yyyy_MM_dd_HH_mm_ss");

// 現行の./distにあるファイルをoldに移動
const move = async () => {
  const exists = await fs.existsSync("./dist");
  if (!exists) return;

  const now = toYYYYMMDDHHmmss(new Date());
  await fs.mkdirSync(`./old/${now}`, { recursive: true });
  await fs.copySync(`./dist`, `./old/${now}`);
};
await move();

// ./distを削除
await fs.removeSync("./dist");

// build
await esbuild.build({
  entryPoints: ["./src/main.js"],
  platform: "node",
  outfile: "./dist/main.js",
  tsconfig: "tsconfig.build.json",
  packages: "external",
  bundle: true,
  minify: true,
  inject: ["./node_modules/prettier-plugin-organize-imports"],
  define: {
    "process.env.VERSION": `"${version}"`,
  },
});
