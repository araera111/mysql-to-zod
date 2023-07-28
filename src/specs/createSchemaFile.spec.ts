import { AST } from "node-sql-parser";
import { isCreate } from "../process/buildSchemaText/utils/createSchemaFile";

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
