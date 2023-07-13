import { toCamel } from "ts-case-convert";
import { z } from "zod";
import { MysqlToZodOption } from "./options";

/*
  const typeMap = {
    tinyint: "number",
    smallint: "number",
    mediumint: "number",
    int: "number",
    bigint: "number",
    float: "number",
    double: "number",
    decimal: "string",
    date: "date",
    time: "string",
    datetime: "date",
    timestamp: "date",
    year: "number",
    char: "string",
    varchar: "string",
    binary: "Buffer",
    varbinary: "Buffer",
    tinyblob: "Buffer",
    blob: "Buffer",
    mediumblob: "Buffer",
    longblob: "Buffer",
    tinytext: "string",
    text: "string",
    mediumtext: "string",
    longtext: "string",
    enum: "string",
    set: "string",
  };
*/
export const convertToZodType = (type: string) => {
  switch (type) {
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
  }
};

export const columnsSchema = z.object({
  column: z.string(),
  type: z.string(),
  nullable: z.boolean(),
});
// type
export type Column = z.infer<typeof columnsSchema>;

// stringをupperCamelに変換する関数
export const toUpperCamel = (str: string) => {
  const camel = toCamel(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
};

// tocamelwrapper
export const toCamelWrapper = (str: string, isCamel: boolean, isUpperCamel: boolean) => {
  if (isUpperCamel) return toUpperCamel(str);
  if (isCamel) return toCamel(str);
  return str;
};

// 1文字目が数字の場合は、先頭と末尾に''をつける関数
export const addSingleQuotation = (str: string) => {
  if (str.match(/^[0-9]/)) {
    return `'${str}'`;
  }
  return str;
};

export const createSchema = (tableName: string, columns: Column[], options: MysqlToZodOption) => {
  const { isAddType, isCamel, isTypeUpperCamel, nullType } = options;
  const schema = columns
    .map((x) => {
      const { column, type, nullable } = x;
      const zodType = convertToZodType(type);
      const zodNullable = nullable ? `.${nullType}()` : "";

      return `${addSingleQuotation(column)}: ${zodType}${zodNullable},`;
    })
    .join("");

  const validTableName = toCamelWrapper(tableName, isCamel, isTypeUpperCamel);

  const addTypeString = `export type ${validTableName} = z.infer<typeof ${validTableName}Schema>;`;

  return `export const ${validTableName}Schema = z.object({${schema}}); ${
    isAddType ? addTypeString : ""
  } `.replaceAll("\t", "");
};
