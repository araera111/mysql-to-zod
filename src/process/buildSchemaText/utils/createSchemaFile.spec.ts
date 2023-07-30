import { AST } from "node-sql-parser";
import { TypeOption } from "../../../options";
import { composeTypeStringList, isCreate } from "./createSchemaFile";

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

describe("composeTypeStringList", () => {
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
      composeTypeStringList({ typeOption, tableName, schemaName })
    ).toStrictEqual(result);
  });

  it("case2 pascal", () => {
    const typeOption: TypeOption = {
      declared: "type",
      format: "pascal",
      prefix: "export",
      suffix: "",
      replacements: [],
    };
    const tableName = "todo";
    const schemaName = "todoSchema";
    const result = "export type Todo = z.infer<typeof todoSchema>;";
    expect(
      composeTypeStringList({ typeOption, tableName, schemaName })
    ).toStrictEqual(result);
  });
});
