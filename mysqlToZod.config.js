/** @type {import("./src/options/options").MysqlToZodOption} */
const options = {
  output: {
    outDir: "./mysqlToZod",
    fileName: "schema.ts",
  },
  dbConnection: {
    host: "127.0.0.1",
    port: 3306,
    user: "root",
    password: "root",
    database: "demo0051",
  },
  tableNames: [],
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
    inline: false,
    zod: {
      implementation: [],
      references: [],
    },
  },
};
module.exports = options;
