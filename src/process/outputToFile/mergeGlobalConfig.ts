import { A, G, pipe } from "@mobily/ts-belt";
import { formatByPrettier } from "../formatByPrettier";
type MergeGlobalConfigProps = {
	oldGlobalSchema: string;
	newGlobalSchema: string;
};
type KV = {
	key: string;
	value: string;
};

const ignoreList = ["import", "export", "};"];

const splitWithDelimiter = (str: string, delimiter: string) => {
	const regex = new RegExp(`(?=${delimiter})`);
	return str.split(regex);
};

export const toKeyValuePair = (schemaText: string) => {
	const loop = (
		rest: readonly string[],
		result: string[],
		str: string,
		mode: "array" | "string",
	): string[] => {
		const [head, ...tail] = rest;
		if (head === undefined) return result;
		if (head.startsWith("\t")) {
			return loop(
				tail,
				result,
				`${str}\n${head.replaceAll("\t", "")}`,
				"string",
			);
		}
		if (mode === "string" && !head.startsWith("\t")) {
			return loop(tail, [...result, `${str}\n${head}`], "", "array");
		}
		return loop(tail, [...result, str], head, "array");
	};
	return pipe(
		schemaText.split("\n"),
		A.flatMap((x) => (x === "" ? [] : x.replace("\t", ""))),
		(x) => loop(x, [], "", "array"),
		A.filter((x) => x !== ""),
		A.filter((x) => !ignoreList.some((ignoreWord) => x.includes(ignoreWord))),
		A.flatMap((x) => {
			const [key, ...value] = splitWithDelimiter(x, ":");
			const joinedValue = value.join("").replace(":", ""); // delete first colon.
			if (!joinedValue || !key) return [];
			return {
				key: key.trim(),
				value: joinedValue.trim(),
			};
		}),
	);
};

export const mergeGlobalConfig = async ({
	oldGlobalSchema,
	newGlobalSchema: globalSchema,
}: MergeGlobalConfigProps) => {
	const oldAst = toKeyValuePair(oldGlobalSchema);
	const newAst = toKeyValuePair(globalSchema);
	const res = [...oldAst, ...newAst];

	const loop = (rest: KV[], keyList: string[], result: KV[]): KV[] => {
		if (rest.length === 0) return result;
		const [x, ...xs] = rest;
		if (G.isNullable(x)) return result;
		const isExist = keyList.includes(x.key);
		if (isExist) return loop(xs, keyList, result);
		return loop(xs, [...keyList, x.key], [...result, x]);
	};

	const oldImportStatement = oldGlobalSchema
		.split("\n")
		.filter((x) => x.includes("import") && x.includes("zod"));
	const newImportStatement = globalSchema
		.split("\n")
		.filter((x) => x.includes("import") && x.includes("zod"));

	const importStateMents = [...oldImportStatement, ...newImportStatement];
	// loopでmergeImportStatementを処理する
	const importLoop = (rest: string[], result: string): string => {
		if (rest.length === 0) return result;
		const [x, ...xs] = rest;
		if (G.isNullable(x)) return result;
		return importLoop(
			xs,
			mergeImportStatement({
				oldImportStatement: result,
				newImportStatement: x,
			}),
		);
	};

	const result = loop(res, [], []);
	const importZod = importLoop(importStateMents, "");
	const exportGlobal = "export const globalSchema = {\n";
	const body = result.map((x) => `  ${x.key}: ${x.value}`).join("\n");
	const end = "};\n";
	const resultText = `${importZod}${exportGlobal}${body}${end}`;
	const final = await formatByPrettier(resultText);
	return final;
};

type MergeImportStatementProps = {
	oldImportStatement: string;
	newImportStatement: string;
};
export const mergeImportStatement = ({
	oldImportStatement,
	newImportStatement,
}: MergeImportStatementProps) => {
	const olds =
		oldImportStatement
			.split("{")[1]
			?.split("}")[0]
			?.split(",")
			.map((x) => x.trim()) ?? [];
	const news =
		newImportStatement
			.split("{")[1]
			?.split("}")[0]
			?.split(",")
			.map((x) => x.trim()) ?? [];
	const merged = [...A.uniq([...olds, ...news])].sort();
	const result = `import { ${merged.join(", ")} } from "zod";`;
	return result;
};
