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
  customSchema: [
    ["DATETIME", "z.stringg()"],
    [
      "TIMESTAMP",
      "timestampSchema",
      'import { timestampSchema } from "./globalSchema.ts"',
    ],
    [
      "",
      "creationDateSchema",
      'import { creationDateSchema } from "./globalSchema.ts"',
      "CreationDa",
    ],
  ],
};
module.exports = options;
