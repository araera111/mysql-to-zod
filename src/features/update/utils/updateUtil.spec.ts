import * as O from "fp-ts/Option";
import { updateSchemaText } from "../../../process/buildSchemaText/utils/createSchema";
import { SchemaInformation, SchemaProperty } from "../types/updateType";
import {
  getSchemaProperty,
  getTableName,
  getTableTextFromSchemaText,
  schemaInformationToText,
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
    expect(ex).toStrictEqual(result);
  });
});

describe("schemaInformationToText", () => {
  it("case1", () => {
    const schemaInformation: SchemaInformation = {
      tableName: "aaaSchema",
      properties: [{ name: "DB_ID", schema: "z.number()" }],
    };
    const result = [
      "export const aaaSchema = z.object({\n",
      "DB_ID: z.number(),\n",
      "});\n",
    ];

    expect(schemaInformationToText(schemaInformation)).toStrictEqual(result);
  });
});

describe("updateSchemaText", () => {
  it("case1", async () => {
    const schemaName = "aaaSchema";
    const schemaInformation: SchemaInformation = {
      tableName: "aaaSchema",
      properties: [{ name: "DB_ID", schema: "z.number().optional()" }],
    };
    const schemaText = `export const aaaSchema = z.object({
  DB_ID: z.number(),
});`;

    const result = `export const aaaSchema = z.object({
  DB_ID: z.number().optional(),
});`;
    const ex = await updateSchemaText({
      schemaInformation,
      schemaName,
      schemaText,
    });

    expect(ex).toBe(result);
  });
});
