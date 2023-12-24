import { mkdirSync, readFileSync, writeFileSync } from "fs";

const f = await fetch(
	"https://api.github.com/repos/biomejs/biome/releases/latest",
);

const fetchedJson = await f.json();

/* 
cli/v1.4.1 -> 1.4.1
*/
const getVersion = (str) => {
	const arr = str.split("/");
	const version = arr[arr.length - 1];
	/* vを取る */
	if (version[0] === "v") {
		return version.slice(1);
	}
	return version;
};

const tag_name = getVersion(fetchedJson.tag_name);

/* biome.jsの中身も書き換える */

const biomejs = JSON.parse(readFileSync("./biome.json", "utf-8"));
const result = {
	...biomejs,
	$schema: `https://biomejs.dev/schemas/${tag_name}/schema.json`,
};

writeFileSync("./biome.json", JSON.stringify(result, null, 2));

/* install */
await $`pnpm update --save-exact @biomejs/biome@${tag_name}`;

/* .vscode/settings.jsonの中身を取得 */
const vscode = await fetch(
	"https://gist.githubusercontent.com/araera111/2fe559026372294240f19eba0f569bea/raw/5afded00c9b8d2157ff6b3e759ee7cdc98f3ca75/biome_settings.json",
);
const vscodeJson = await vscode.json();

/* dirをつくっておく */
await mkdirSync("./.vscode", { recursive: true });

await writeFileSync(
	"./.vscode/settings.json",
	JSON.stringify(vscodeJson, null, 2),
);