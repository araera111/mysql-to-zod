import { join } from "node:path";
import { Array as A, Effect, Predicate, pipe } from "effect";
import { existsSync, readFileSync } from "fs-extra";
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

const splitWithDelimiter = (str: string, delimiter: string): string[] => {
	const regex = new RegExp(`(?=${delimiter})`);
	return str.split(regex);
};

export const toKeyValuePair = (schemaText: string): KV[] => {
	// タブで始まる行は直前のブロックに連結する
	const loop = (
		rest: readonly string[],
		result: readonly string[],
		str: string,
		mode: "array" | "string",
	): readonly string[] => {
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
		if (mode === "string") {
			return loop(tail, [...result, `${str}\n${head}`], "", "array");
		}
		return loop(tail, [...result, str], head, "array");
	};
	return pipe(
		schemaText.split("\n"),
		A.map((x) => (x === "" ? undefined : x.replace("\t", ""))),
		A.filter(Predicate.isNotNullable),
		(x) => loop(x, [], "", "array"),
		A.filter((x) => x !== ""),
		A.filter((x) => !ignoreList.some((ignoreWord) => x.includes(ignoreWord))),
		A.map((x) => {
			const [key, ...value] = splitWithDelimiter(x, ":");
			const joinedValue = value.join("").replace(":", ""); // delete first colon.
			if (!joinedValue || !key) return undefined;
			return {
				key: key.trim(),
				value: joinedValue.trim(),
			};
		}),
		A.filter(Predicate.isNotNullable),
	);
};

// 既存のキーを優先しつつ、新しいキーを追加する
const mergeKeyValuePairs = (list: readonly KV[]): KV[] => {
	const loop = (
		rest: readonly KV[],
		keyList: readonly string[],
		result: readonly KV[],
	): readonly KV[] => {
		if (rest.length === 0) return result;
		const [x, ...xs] = rest;
		if (Predicate.isNullable(x)) return result;
		if (keyList.includes(x.key)) return loop(xs, keyList, result);
		return loop(xs, [...keyList, x.key], [...result, x]);
	};
	return [...loop(list, [], [])];
};

export const mergeGlobalConfig = ({
	oldGlobalSchema,
	newGlobalSchema: globalSchema,
}: MergeGlobalConfigProps): Effect.Effect<string, string> =>
	Effect.gen(function* () {
		// forced use tabs format.
		const formattedOld = yield* formatByPrettier(oldGlobalSchema);
		const formattedNew = yield* formatByPrettier(globalSchema);

		const oldAst = toKeyValuePair(formattedOld);
		const newAst = toKeyValuePair(formattedNew);
		const mergedKv = mergeKeyValuePairs([...oldAst, ...newAst]);

		const importStatements = [
			...oldGlobalSchema
				.split("\n")
				.filter((x) => x.includes("import") && x.includes("zod")),
			...globalSchema
				.split("\n")
				.filter((x) => x.includes("import") && x.includes("zod")),
		];
		const importZod = mergeImportStatements(importStatements);

		const exportGlobal = "export const globalSchema = {\n";
		const body = mergedKv.map((x) => `  ${x.key}: ${x.value}`).join("\n");
		const end = "};\n";
		const resultText = `${importZod}${exportGlobal}${body}${end}`;
		return yield* formatByPrettier(resultText);
	});

// import文を順にマージする
const mergeImportStatements = (statements: readonly string[]): string => {
	const loop = (rest: readonly string[], result: string): string => {
		if (rest.length === 0) return result;
		const [x, ...xs] = rest;
		if (Predicate.isNullable(x)) return result;
		return loop(
			xs,
			mergeImportStatement({
				oldImportStatement: result,
				newImportStatement: x,
			}),
		);
	};
	return loop(statements, "");
};

type MergeImportStatementProps = {
	oldImportStatement: string;
	newImportStatement: string;
};
export const mergeImportStatement = ({
	oldImportStatement,
	newImportStatement,
}: MergeImportStatementProps): string => {
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
	const merged = [...A.dedupe([...olds, ...news])].sort();
	return `import { ${merged.join(", ")} } from "zod";`;
};

type MergeGlobalSchemaWrapperProps = {
	newGlobalSchema: string;
	outputDir: string;
};
export const mergeGlobalSchemaWrapper = ({
	newGlobalSchema,
	outputDir,
}: MergeGlobalSchemaWrapperProps): Effect.Effect<string, string> =>
	Effect.gen(function* () {
		const globalSchemaPath = join(outputDir, "globalSchema.ts");
		if (existsSync(globalSchemaPath)) {
			return yield* mergeGlobalConfig({
				oldGlobalSchema: readFileSync(globalSchemaPath, "utf-8"),
				newGlobalSchema,
			});
		}
		return newGlobalSchema;
	});
