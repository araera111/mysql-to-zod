/** @type {import("./src/options/options").MysqlToZodOption} */
const options = {
	output: {
		outDir: "./mysqlToZod",
		fileName: "schema.ts",
	},
	comments: {
		table: {
			active: true,
			format: "// [table:!name] : !text",
		},
		column: {
			active: true,
			format: "// !name : !text",
		},
	},
	type: {
		declared: "type",
		format: "pascal",
		prefix: "",
		suffix: "",
		replacements: [],
	},
	schema: {
		format: "camel",
		prefix: "",
		suffix: "Schema",
		replacements: [],
		nullType: "nullish",
		inline: true,
		zod: {
			implementation: [],
			references: [],
		},
	},
	sync: {
		active: true,
	},
	separate: {
		isSeparate: true,
		insertPrefix: "insert",
		insertSuffix: "",
	},
	dbConnection: {
		database: "my_todo",
		host: "localhost",
		password: "root",
		port: 3306,
		user: "root",
	},
};
module.exports = options;
