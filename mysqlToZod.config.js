/** @type {import("./src/options/options").MysqlToZodOption} */
const options = {
  output: {
    outDir: "./mysqlToZod",
    fileName: "schema.ts",
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
    inline: true,
    zod: {
      implementation: [],
      references: [],
    },
  },
};
module.exports = options;
