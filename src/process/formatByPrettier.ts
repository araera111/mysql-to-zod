import prettier from "@prettier/sync";

export const formatByPrettier = (str: string): string =>
	prettier.format(str, {
		parser: "babel-ts",
	});
