const options = {
  outFilePath: "mysqlToZod",
  fileName: "schema.ts",
  schema: {
    zod: ["DATETIME", "z.string()"],
  },
};
module.exports = options;
