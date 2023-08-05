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
    inline: false,
    zod: {
      implementation: [["DATETIME", "z.string()"]],
      references: [["DATETIME", "ourDateTime"]],
    },
  },
};
module.exports = options;
