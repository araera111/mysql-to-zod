const options = {
  isAddType: true,
  isCamel: true,
  isTypeUpperCamel: true,
  outFilePath: "mysqlToZod",
  fileName: "schema.ts",
  dbConnection: "mysql://root:root@localhost:3306/noc",
  tableNames: [],
  nullType: "nullish",
};
module.exports = options;
