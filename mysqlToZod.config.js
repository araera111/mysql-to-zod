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
};
module.exports = options;
