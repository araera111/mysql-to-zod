import { produce } from "immer";
import { MysqlToZodOption, basicMySQLToZodOption } from "../../options/options";
import {
  composeGlobalSchema,
  composeGlobalSchemaRow,
} from "./composeGlobalSchema";

describe("composeGlobalSchema", () => {
  const basicOption: MysqlToZodOption = produce(
    basicMySQLToZodOption,
    (draft) => {
      if (draft.schema) {
        draft.schema.inline = false;
      }
    },
  );
  it("case1 DATE -> z.date();", () => {
    const typeList = ["DATE"];
    const option: MysqlToZodOption = basicOption;
    const result = `import { z } from "zod";
export const globalSchema = {
mysqlDATE: z.date(),
};`;
    expect(composeGlobalSchema({ typeList, option })).toBe(result);
  });

  it("case2 TINYINT -> z.number();", () => {
    const typeList = ["TINYINT"];
    const option: MysqlToZodOption = basicOption;
    const result = `import { z } from "zod";
export const globalSchema = {
mysqlTINYINT: z.number(),
};`;
    expect(composeGlobalSchema({ typeList, option })).toBe(result);
  });

  it("case3 TINYINT, DATE", () => {
    const typeList = ["TINYINT", "DATE"];
    const option: MysqlToZodOption = basicOption;
    const result = `import { z } from "zod";
export const globalSchema = {
mysqlTINYINT: z.number(),
mysqlDATE: z.date(),
};`;
    expect(composeGlobalSchema({ typeList, option })).toBe(result);
  });

  it("case4 inline: true", () => {
    const typeList = ["TINYINT", "DATE"];
    const option: MysqlToZodOption = produce(basicMySQLToZodOption, (draft) => {
      if (draft.schema) {
        draft.schema.inline = true;
      }
    });
    const result = undefined;
    expect(composeGlobalSchema({ typeList, option })).toBe(result);
  });

  it("case5 zod.implementation", () => {
    const typeList = ["DATE"];
    const option: MysqlToZodOption = produce(basicMySQLToZodOption, (draft) => {
      if (draft.schema && draft.schema.zod) {
        draft.schema.inline = false;
        draft.schema.zod.implementation = [["DATE", "z.string()"]];
      }
    });
    const result = `import { z } from "zod";
export const globalSchema = {
mysqlDATE: z.string(),
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
  it("case 2", () => {
    const type = "DATE";
    const option: MysqlToZodOption = produce(basicMySQLToZodOption, (draft) => {
      if (draft.schema && draft.schema.zod) {
        draft.schema.zod.implementation = [["DATE", "z.string().datetime()"]];
        draft.schema.zod.references = [["DATE", "ourDateTime"]];
      }
    });
    const result = "ourDateTime: z.string().datetime(),\n";
    expect(composeGlobalSchemaRow({ type, option })).toBe(result);
  });
});
