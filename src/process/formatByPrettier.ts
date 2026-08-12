import { Effect } from "effect";
import prettier from "prettier";
import SqlPlugin from "prettier-plugin-sql";
import { match } from "ts-pattern";

export type SupportedFormatters = "babel-ts" | "sql";

export const formatByPrettier = (
	str: string,
	type: SupportedFormatters = "babel-ts",
): Effect.Effect<string, string> =>
	match(type)
		.with("babel-ts", () =>
			Effect.tryPromise({
				try: () =>
					prettier.format(str, {
						parser: "babel-ts",
						// Tabs are used instead of spaces to handle indentation when merging globalSchema
						useTabs: true,
					}),
				catch: (x) => `formatByPrettierError: ${String(x)}`,
			}),
		)
		.with("sql", () =>
			Effect.tryPromise({
				try: () =>
					prettier.format(str, {
						parser: "sql",
						plugins: [SqlPlugin],
						sql: {
							keywordCase: "upper",
						},
					}),
				catch: (x) => `formatByPrettierError: ${String(x)}`,
			}),
		)
		.exhaustive();
