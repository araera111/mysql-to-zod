const options = {
  isAddType: true,
  isCamel: true,
  isTypeUpperCamel: true,
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
  schema: {
    format: "replace",
    prefix: "",
    suffix: "",
    replacements: [
      ["blog", "bbblog"],
      ["bbb", "AAAAA"],
    ],
    nullType: "nullable",
  },
};
module.exports = options;
