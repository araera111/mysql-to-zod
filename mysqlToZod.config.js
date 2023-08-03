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
    ["TIMESTAMP", "timestampSchema", "./globalSchema.ts"],
  ],
};
module.exports = options;
