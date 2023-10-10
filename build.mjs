// date-fnsをimport
import { format } from "date-fns";
import * as esbuild from "esbuild";
import fs from "fs-extra";

const packageJson = await fs.readFileSync("./package.json");
const { version } = JSON.parse(packageJson);

// date-fnsでDATE型をYYYY-MM-DD HH:mm:ssに変換する関数
const toYYYYMMDDHHmmss = (date) => format(date, "yyyy_MM_dd_HH_mm_ss");

// build
await esbuild.build({
  entryPoints: ["./src/main.js"],
  platform: "node",
  outfile: "./dist/main.js",
  tsconfig: "tsconfig.build.json",
  packages: "external",
  bundle: true,
  minify: true,
  define: {
    "process.env.VERSION": `"${version}"`,
  },
});
