import * as esbuild from "esbuild";
import fs from "fs-extra";

const packageJson = await fs.readFileSync("./package.json");
const { version } = JSON.parse(packageJson);

// build
await esbuild.build({
  entryPoints: ["./src/main.ts"],
  platform: "node",
  outfile: "./dist/main.js",
  tsconfig: "tsconfig.build.json",
  packages: "external",
  bundle: true,
  minify: true,
  sourcemap: true,
  define: {
    "process.env.VERSION": `"${version}"`,
  },
});
