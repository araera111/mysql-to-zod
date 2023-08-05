import { MysqlToZodOption, basicMySQLToZodOption } from "../../options/options";
import {
  composeGlobalSchema,
  composeGlobalSchemaRow,
} from "./composeGlobalSchema";

/* 
import z from 'zod'
const globalSchema = {
  mysqlDate : z.date(),
  mysqlBoolean : z.boolean(),
  mysqlBigInt : z.bigint()
}
module.exports = globalSchema
*/
describe("composeGlobalSchema", () => {
  it("case1 DATE -> z.date();", () => {
    const typeList = ["DATE"];
    const option: MysqlToZodOption = { ...basicMySQLToZodOption };
    const result = `import { z } from "zod";
export const globalSchema = {
mysqlDATE: z.date(),
};`;
    expect(composeGlobalSchema({ typeList, option })).toBe(result);
  });

  it("case2 TINYINT -> z.number();", () => {
    const typeList = ["TINYINT"];
    const option: MysqlToZodOption = { ...basicMySQLToZodOption };
    const result = `import { z } from "zod";
export const globalSchema = {
mysqlTINYINT: z.number(),
};`;
    expect(composeGlobalSchema({ typeList, option })).toBe(result);
  });

  it("case3 TINYINT, DATE", () => {
    const typeList = ["TINYINT", "DATE"];
    const option: MysqlToZodOption = { ...basicMySQLToZodOption };
    const result = `import { z } from "zod";
export const globalSchema = {
mysqlTINYINT: z.number(),
mysqlDATE: z.date(),
};`;
    expect(composeGlobalSchema({ typeList, option })).toBe(result);
  });
});

describe("composeGlobalSchemaRow", () => {
  it("case 1", () => {
    const type = "TINYINT";
    const option: MysqlToZodOption = { ...basicMySQLToZodOption };
    const result = "mysqlTINYINT: z.number(),\n";
    expect(composeGlobalSchemaRow({ type, option })).toBe(result);
  });
});
