import { AST } from "node-sql-parser";
import { CaseUnion, TypeOption } from "../../../options";
import {
  composeTypeString,
  convertTableName,
  toPascalWrapper,
} from "./buildSchemaTextUtil";
import { isCreate } from "./createSchemaFile";

describe("isCreate", () => {
  it("case1 true", () => {
    const obj: AST = {
      create_definitions: [],
      type: "create",
      keyword: "table",
    };
    const result = true;
    expect(isCreate(obj)).toBe(result);
  });
});

describe("convertTableName", () => {
  it("case1 pascal", () => {
    const tableName = "todo";
    const format: CaseUnion = "pascal";
    const replacements: string[] = [];
    const result = "Todo";
    expect(convertTableName({ tableName, format, replacements })).toBe(result);
  });
  it("case2 camel", () => {
    const tableName = "todo";
    const format: CaseUnion = "camel";
    const replacements: string[] = [];
    const result = "todo";
    expect(convertTableName({ tableName, format, replacements })).toBe(result);
  });
});

describe("toPascalWrapper", () => {
  it("case 1", () => {
    const str = "todo";
    const result = "Todo";
    expect(toPascalWrapper(str)).toBe(result);
  });
});

describe("composeTypeString", () => {
  it("case1 default", () => {
    const typeOption: TypeOption = {
      declared: "none",
      format: "camel",
      prefix: "",
      suffix: "",
      replacements: [],
    };
    const tableName = "todo";
    const schemaName = "todoSchema";
    const result = "";
    expect(
      composeTypeString({ typeOption, tableName, schemaName })
    ).toStrictEqual(result);
  });

  it("case2 pascal", () => {
    const typeOption: TypeOption = {
      declared: "type",
      format: "pascal",
      prefix: "",
      suffix: "",
      replacements: [],
    };
    const tableName = "todo";
    const schemaName = "todoSchema";
    const result = "export type Todo = z.infer<typeof todoSchema>;";
    expect(
      composeTypeString({ typeOption, tableName, schemaName })
    ).toStrictEqual(result);
  });
});
