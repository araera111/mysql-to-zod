const options = {
  outFilePath: "mysqlToZod",
  fileName: "schema.ts",
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
  schema: {
    format: "camel",
    prefix: "",
    suffix: "Schema",
    replacements: [],
    nullType: "nullish",
    zod: [["DATETIME", "z.string()"]],
  },
};
module.exports = options;
