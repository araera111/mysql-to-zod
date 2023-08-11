/** @type {import("./src/options/options").MysqlToZodOption} */
const options = {
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
    declared: "interface",
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
      implementation: [["DATETIME", "z.string()"]],
      references: [["DATETIME", "ourDateTime"]],
    },
  },
};
module.exports = options;
