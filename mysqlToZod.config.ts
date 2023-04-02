import { MysqlToZodOption } from "./src/options";

const options: MysqlToZodOption = {
  isAddType: true,
  isCamel: true,
  isTypeUpperCamel: true,
  outFilePath: "mysqlToZod",
  fileName: "schema.ts",
  dbConnection: "mysql://root:root@localhost:3306/mydb",
  tableNames: [],
};
module.exports = options;
