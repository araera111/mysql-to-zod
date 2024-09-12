import prettier from "prettier";
import "prettier-plugin-sql"; // Ensure the plugin is imported
import SqlPlugin from "prettier-plugin-sql";

export type SupportedFormatters = "babel-ts" | "sql" ;

export const formatByPrettier = async (str: string, type: SupportedFormatters = "babel-ts"): Promise<string> => {
	switch (type) {
		case "babel-ts":
			return prettier.format(str, {
				parser: "babel-ts",
        // Tabs are used instead of spaces to handle indentation when merging globalSchema
        useTabs: true,
			});
		case "sql":
			return prettier.format(str, {
				parser: "sql",
				plugins: [SqlPlugin],
				sql: {
					keywordCase: "upper"
				}
			});
		default:
			return "";
	}
}
