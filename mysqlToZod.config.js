const options = {
  outFilePath: "mysqlToZod",
  fileName: "schema.ts",
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
    [
      "",
      "blogTitleSchema",
      'import { blogTitleSchema } from "./globalSchema.ts"',
      "/^B.*e$/",
    ],
  ],
};
module.exports = options;
