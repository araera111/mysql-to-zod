import { convertTableComment } from "./buildSchemaTextUtil";

describe("convertTableComment", () => {
  it("case1", () => {
    const tableName = "airport";
    const comment = "International Commercial Airports";
    const result = "// [table:airport] : International Commercial Airports";
    expect(convertTableComment(tableName, comment)).toBe(result);
  });
});
