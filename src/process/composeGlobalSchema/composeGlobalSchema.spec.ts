import { MysqlToZodOption, basicMySQLToZodOption } from "../../options/options";
import { composeGlobalSchema } from "./composeGlobalSchema";

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
  mysqlDate: z.date(),
};`;
    expect(composeGlobalSchema({ typeList, option })).toBe(result);
  });
});
