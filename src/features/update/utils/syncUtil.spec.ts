import * as O from "fp-ts/Option";
import { mergeSchemaTextWithOldInformation } from "../../../process/buildSchemaText/utils/createSchema";
import { SchemaInformation, SchemaProperty } from "../types/syncType";
import {
  getSchemaInformation,
  getSchemaProperty,
  getTableName,
  parseZodSchema,
  schemaInformationToText,
  splitSchemaText,
} from "./syncUtil";

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

describe("mergeSchemaTextWithOldInformation 完成したschemaTextと以前のschemaInformationを合体する関数", () => {
  it("case1", () => {
    const schemaName = "aaaSchema";
    const schemaInformation: SchemaInformation = {
      tableName: "aaaSchema",
      properties: [{ name: "DB_ID", schema: "z.number().optional()" }],
    };
    const schemaText = `export const aaaSchema = z.object({ DB_ID: z.number() });`;

    const result = `export const aaaSchema = z.object({
  DB_ID: z.number().optional(),
});`;
    const ex = mergeSchemaTextWithOldInformation({
      schemaInformation,
      schemaName,
      schemaText,
    });
    expect(ex).toBe(result);
  });
});

describe("getSchemaInformation", () => {
  it("case1", () => {
    const text = `export const telBlacklistSchema = z.object({ tel_no_blacklist: z.string() });`;
    const result: O.Option<SchemaInformation> = O.some({
      tableName: "telBlacklistSchema",
      properties: [{ name: "tel_no_blacklist", schema: "z.string()" }],
    });
    expect(getSchemaInformation(text)).toStrictEqual(result);
  });
  it("case2", () => {
    const text = `export const configCancelSchema = z.object({
  DB_ID: z.number(),
  GROUP_ID: z.number(),
  sort_key: z.number(),
  disp_cancel: z.number(),
  cancel_text: z.string(),
});`;
    const result: O.Option<SchemaInformation> = O.some({
      tableName: "configCancelSchema",
      properties: [
        { name: "DB_ID", schema: "z.number()" },
        { name: "GROUP_ID", schema: "z.number()" },
        { name: "sort_key", schema: "z.number()" },
        { name: "disp_cancel", schema: "z.number()" },
        { name: "cancel_text", schema: "z.string()" },
      ],
    });
    expect(getSchemaInformation(text)).toStrictEqual(result);
  });
  it("case3", () => {
    const text =
      "export const telBlacklistSchema = z.object({ tel_no_blacklist: z.string() });";
    const result: O.Option<SchemaInformation> = O.some({
      tableName: "telBlacklistSchema",
      properties: [{ name: "tel_no_blacklist", schema: "z.string()" }],
    });
    expect(getSchemaInformation(text)).toStrictEqual(result);
  });
});

describe("parseZodSchema", () => {
  it("case 1", () => {
    const schema = `export const memoSchema = z.object({
DB_ID: z.number(),
title: z.string(),
name: z.string(),
});`;
    const result = {
      tableName: "memoSchema",
      properties: [
        {
          name: "DB_ID",
          schema: "z.number()",
        },
        {
          name: "title",
          schema: "z.string()",
        },
        {
          name: "name",
          schema: "z.string()",
        },
      ],
    };
    expect(parseZodSchema(schema)).toStrictEqual(result);
  });

  it("case 2", () => {
    const schema = `export const todoSchema = z.object({DB_ID: z.number()})`;
    const result = {
      tableName: "todoSchema",
      properties: [
        {
          name: "DB_ID",
          schema: "z.number()",
        },
      ],
    };
    expect(parseZodSchema(schema)).toStrictEqual(result);
  });
});

describe("splitSchemaText", () => {
  it("case1", () => {
    const str = `
export type AAA = z.infer<typeof AAASchema>;
export const todoSchema = z.object({
  DB_ID: z.number(),
  title: z.string(),
  name: z.string(),
});
export type BBB = z.infer<typeof BBBSchema>;
`;
    const result = [
      `export const todoSchema = z.object({
  DB_ID: z.number(),
  title: z.string(),
  name: z.string(),
});
`,
    ];
    expect(splitSchemaText(str)).toStrictEqual(result);
  });

  it("case2", () => {
    const str = `
export type AAA = z.infer<typeof AAASchema>;
export const todoSchema = z.object({
  DB_ID: z.number(),
  title: z.string(),
  name: z.string(),
});
export type BBB = z.infer<typeof BBBSchema>;
export const CCCSchema = z.object({ DB_ID: z.number()});
`;

    const result = [
      `export const todoSchema = z.object({
  DB_ID: z.number(),
  title: z.string(),
  name: z.string(),
});
`,
      `export const CCCSchema = z.object({ DB_ID: z.number() });
`,
    ];

    expect(splitSchemaText(str)).toStrictEqual(result);
  });
});
