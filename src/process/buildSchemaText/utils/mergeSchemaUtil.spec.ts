import {
  parseZodSchema,
  prettierWrapper,
  splitSchemaText,
} from "./mergeSchemaUtil";

describe("parseZodSchema", () => {
  it("case 1", () => {
    const schema = `export const memoSchema = z.object({
DB_ID: z.number(),
title: z.string(),
name: z.string(),
});`;
    const result = {
      title: "memoSchema",
      properties: [
        {
          key: "DB_ID",
          value: "z.number()",
        },
        {
          key: "title",
          value: "z.string()",
        },
        {
          key: "name",
          value: "z.string()",
        },
      ],
    };
    expect(parseZodSchema(schema)).toStrictEqual(result);
  });

  it("case 2", () => {
    const schema = `export const todoSchema = z.object({DB_ID: z.number()})`;
    const result = {
      title: "todoSchema",
      properties: [
        {
          key: "DB_ID",
          value: "z.number()",
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
      prettierWrapper(`export const todoSchema = z.object({ DB_ID: z.number(), title: z.string(), name: z.string(), });
`),
      `export const CCCSchema = z.object({ DB_ID: z.number() });
`,
    ];
    console.log({ result, splitSchemaText: splitSchemaText(str) });

    expect(splitSchemaText(str)).toStrictEqual(result);
  });
});
