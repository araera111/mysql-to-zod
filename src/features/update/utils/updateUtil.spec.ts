import * as O from "fp-ts/Option";
import { SchemaProperty } from "../types/updateType";
import {
  getSchemaProperty,
  getTableName,
  getTableTextFromSchemaText,
} from "./updateUtil";

describe("getSchemaProperty", () => {
  it("case1 some", () => {
    const text = "DB_ID: z.number(),";
    const result: O.Option<SchemaProperty> = O.some({
      name: "DB_ID",
      schema: "z.number()",
    });
    expect(getSchemaProperty(text)).toStrictEqual(result);
  });

  it("case2 none", () => {
    const text = "export const configDisplaySchema = z.object({";
    const result: O.Option<SchemaProperty> = O.none;
    expect(getSchemaProperty(text)).toStrictEqual(result);
  });

  it("case3 none", () => {
    const text = "export type Config = z.infer<typeof configSchema>;";
    const result: O.Option<SchemaProperty> = O.none;
    expect(getSchemaProperty(text)).toStrictEqual(result);
  });
});

describe("getTableName", () => {
  it("case1 some", () => {
    const text = "export const configDisplaySchema = z.object({";
    const result: O.Option<string> = O.some("configDisplaySchema");
    expect(getTableName(text)).toStrictEqual(result);
  });

  it("case2 none", () => {
    const text = "export type Config = z.infer<typeof configSchema>;";
    const result: O.Option<string> = O.none;
    expect(getTableName(text)).toStrictEqual(result);
  });

  it("case3 none", () => {
    const text = "({";
    const result: O.Option<string> = O.none;
    expect(getTableName(text)).toStrictEqual(result);
  });
});

describe("getTableTextFromSchemaText", () => {
  it("case 1", async () => {
    const text = `export type Config = z.infer<typeof configSchema>;
export const configCancelSchema = z.object({
  DB_ID: z.number(),
  GROUP_ID: z.number(),
  sort_key: z.number(),
  disp_cancel: z.number(),
  cancel_text: z.string(),
});


export type ConfigCancel = z.infer<typeof configCancelSchema>;`;

    const result = [
      `export const configCancelSchema = z.object({
  DB_ID: z.number(),
  GROUP_ID: z.number(),
  sort_key: z.number(),
  disp_cancel: z.number(),
  cancel_text: z.string(),
});`,
    ];
    const ex = await getTableTextFromSchemaText(text);
    console.log({ ex, result });
    expect(ex).toBe(result);
  });
});
