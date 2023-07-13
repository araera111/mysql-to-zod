import { toCamel } from "ts-case-convert";
import { match } from "ts-pattern";
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
export const convertToZodType = (type: string) =>
  match(type)
    .with("TINYINT", () => "z.number()")
    .with("SMALLINT", () => "z.number()")
    .with("MEDIUMINT", () => "z.number()")
    .with("INT", () => "z.number()")
    .with("BIGINT", () => "z.number()")
    .with("FLOAT", () => "z.number()")
    .with("DOUBLE", () => "z.number()")
    .with("YEAR", () => "z.number()")
    .with("BIT", () => "z.boolean()")
    .with("DATE", () => "z.date()")
    .with("DATETIME", () => "z.date()")
    .with("TIMESTAMP", () => "z.date()")
    .with("CHAR", () => "z.string()")
    .with("VARCHAR", () => "z.string()")
    .with("DECIMAL", () => "z.string()")
    .with("NUMERIC", () => "z.string()")
    .with("TINYTEXT", () => "z.string()")
    .with("TEXT", () => "z.string()")
    .with("MEDIUMTEXT", () => "z.string()")
    .with("LONGTEXT", () => "z.string()")
    .with("ENUM", () => "z.string()")
    .with("SET", () => "z.string()")
    .with("TIME", () => "z.string()")
    .with("BINARY", () => "z.buffer()")
    .with("VARBINARY", () => "z.buffer()")
    .with("TINYBLOB", () => "z.buffer()")
    .with("BLOB", () => "z.buffer()")
    .with("MEDIUMBLOB", () => "z.buffer()")
    .with("LONGBLOB", () => "z.buffer()")
    .otherwise(() => "z.unknown()");

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
export const toCamelWrapper = (
  str: string,
  isCamel: boolean,
  isUpperCamel: boolean
) => {
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

export const createSchema = (
  tableName: string,
  columns: Column[],
  options: MysqlToZodOption
) => {
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
