import { convertToZodType } from "./toZod";

/*
case "TINYINT":
    case "SMALLINT":
    case "MEDIUMINT":
    case "INT":
    case "BIGINT":
    case "FLOAT":
    case "DOUBLE":
    case "YEAR":
      return "z.number()";
    case "BIT":
      return "z.boolean()";
    case "DATE":
    case "DATETIME":
    case "TIMESTAMP":
      return "z.date()";
    case "CHAR":
    case "VARCHAR":
    case "DECIMAL":
    case "NUMERIC":
    case "TINYTEXT":
    case "TEXT":
    case "MEDIUMTEXT":
    case "LONGTEXT":
    case "ENUM":
    case "SET":
    case "TIME":
      return "z.string()";
    case "BINARY":
    case "VARBINARY":
    case "TINYBLOB":
    case "BLOB":
    case "MEDIUMBLOB":
    case "LONGBLOB":
      return "z.buffer()";
    default:
      return "z.unknown()";
*/

/* this test is created by github copilot */
describe("convertToZodType", () => {
  it("TINYINT", () => {
    const type = "TINYINT";
    const result = "z.number()";
    expect(convertToZodType(type)).toBe(result);
  });
  it("SMALLINT", () => {
    const type = "SMALLINT";
    const result = "z.number()";
    expect(convertToZodType(type)).toBe(result);
  });
  it("MEDIUMINT", () => {
    const type = "MEDIUMINT";
    const result = "z.number()";
    expect(convertToZodType(type)).toBe(result);
  });
  it("INT", () => {
    const type = "INT";
    const result = "z.number()";
    expect(convertToZodType(type)).toBe(result);
  });
  it("BIGINT", () => {
    const type = "BIGINT";
    const result = "z.number()";
    expect(convertToZodType(type)).toBe(result);
  });
  it("FLOAT", () => {
    const type = "FLOAT";
    const result = "z.number()";
    expect(convertToZodType(type)).toBe(result);
  });
  it("DOUBLE", () => {
    const type = "DOUBLE";
    const result = "z.number()";
    expect(convertToZodType(type)).toBe(result);
  });
  it("YEAR", () => {
    const type = "YEAR";
    const result = "z.number()";
    expect(convertToZodType(type)).toBe(result);
  });
  it("BIT", () => {
    const type = "BIT";
    const result = "z.boolean()";
    expect(convertToZodType(type)).toBe(result);
  });
  it("DATE", () => {
    const type = "DATE";
    const result = "z.date()";
    expect(convertToZodType(type)).toBe(result);
  });
  it("DATETIME", () => {
    const type = "DATETIME";
    const result = "z.date()";
    expect(convertToZodType(type)).toBe(result);
  });
  it("TIMESTAMP", () => {
    const type = "TIMESTAMP";
    const result = "z.date()";
    expect(convertToZodType(type)).toBe(result);
  });
  it("CHAR", () => {
    const type = "CHAR";
    const result = "z.string()";
    expect(convertToZodType(type)).toBe(result);
  });
  it("VARCHAR", () => {
    const type = "VARCHAR";
    const result = "z.string()";
    expect(convertToZodType(type)).toBe(result);
  });
  it("DECIMAL", () => {
    const type = "DECIMAL";
    const result = "z.string()";
    expect(convertToZodType(type)).toBe(result);
  });
  it("NUMERIC", () => {
    const type = "NUMERIC";
    const result = "z.string()";
    expect(convertToZodType(type)).toBe(result);
  });
  it("TINYTEXT", () => {
    const type = "TINYTEXT";
    const result = "z.string()";
    expect(convertToZodType(type)).toBe(result);
  });
  it("TEXT", () => {
    const type = "TEXT";
    const result = "z.string()";
    expect(convertToZodType(type)).toBe(result);
  });
  it("MEDIUMTEXT", () => {
    const type = "MEDIUMTEXT";
    const result = "z.string()";
    expect(convertToZodType(type)).toBe(result);
  });
  it("LONGTEXT", () => {
    const type = "LONGTEXT";
    const result = "z.string()";
    expect(convertToZodType(type)).toBe(result);
  });
  it("ENUM", () => {
    const type = "ENUM";
    const result = "z.string()";
    expect(convertToZodType(type)).toBe(result);
  });
  it("SET", () => {
    const type = "SET";
    const result = "z.string()";
    expect(convertToZodType(type)).toBe(result);
  });
  it("TIME", () => {
    const type = "TIME";
    const result = "z.string()";
    expect(convertToZodType(type)).toBe(result);
  });
  it("BINARY", () => {
    const type = "BINARY";
    const result = "z.buffer()";
    expect(convertToZodType(type)).toBe(result);
  });
  it("VARBINARY", () => {
    const type = "VARBINARY";
    const result = "z.buffer()";
    expect(convertToZodType(type)).toBe(result);
  });
  it("TINYBLOB", () => {
    const type = "TINYBLOB";
    const result = "z.buffer()";
    expect(convertToZodType(type)).toBe(result);
  });
  it("BLOB", () => {
    const type = "BLOB";
    const result = "z.buffer()";
    expect(convertToZodType(type)).toBe(result);
  });
  it("MEDIUMBLOB", () => {
    const type = "MEDIUMBLOB";
    const result = "z.buffer()";
    expect(convertToZodType(type)).toBe(result);
  });
  it("LONGBLOB", () => {
    const type = "LONGBLOB";
    const result = "z.buffer()";
    expect(convertToZodType(type)).toBe(result);
  });
  it("JSON", () => {
    const type = "JSON";
    const result = "z.unknown()";
    expect(convertToZodType(type)).toBe(result);
  });
  it("JSONB", () => {
    const type = "JSONB";
    const result = "z.unknown()";
    expect(convertToZodType(type)).toBe(result);
  });
  it("GEOMETRY", () => {
    const type = "GEOMETRY";
    const result = "z.unknown()";
    expect(convertToZodType(type)).toBe(result);
  });
});
