const options = {
  outFilePath: "mysqlToZod",
  fileName: "schema.ts",
  tableNames: [],
  nullType: "nullish",
  comments: {
    table: {
      active: true,
    },
    column: {
      active: true,
    },
  },
  /*   schema: {
    format: "camel",
    prefix: "",
    suffix: "Schema",
    replacements: [
      ["blog", "bbblog"],
      ["bbb", "AAAAA"],
    ],
    nullType: "nullable",
  },
  type: {
    declared: "type",
    format: "pascal",
    prefix: "",
    suffix: "",
    replacements: [],
  }, */
};
module.exports = options;
