import { toCamel } from "ts-case-convert";
import { match } from "ts-pattern";

/* 
  knex result
      {
      tinyint_column: -128,
      smallint_column: -32768,
      mediumint_column: -8388608,
      int_column: -2147483648,
      bigint_column: -9223372036854776000,
      float_column: -3.40282e+38,
      double_column: -1.7976931348623155e+308,
      decimal_column: '1234.56',
      date_column: 2023-07-12T15:00:00.000Z,
      time_column: '23:59:59',
      datetime_column: 2023-07-13T14:59:59.000Z,
      timestamp_column: 2023-07-13T14:59:59.000Z,
      year_column: 2023,
      char_column: 'char_value',
      varchar_column: 'varchar_value',
      binary_column: <Buffer 31 31 31 00 00 00 00 00 00 00>,
      varbinary_column: <Buffer 76 61 72 62 69 6e 61 72 79 5f 76 61 6c 75 65>,
      tinyblob_column: <Buffer 74 69 6e 79 62 6c 6f 62 5f 76 61 6c 75 65>,
      blob_column: <Buffer 62 6c 6f 62 5f 76 61 6c 75 65>,
      mediumblob_column: <Buffer 6d 65 64 69 75 6d 62 6c 6f 62 5f 76 61 6c 75 65>,
      longblob_column: <Buffer 6c 6f 6e 67 62 6c 6f 62 5f 76 61 6c 75 65>,
      tinytext_column: 'tinytext_value',
      text_column: 'text_value',
      mediumtext_column: 'mediumtext_value',
      longtext_column: 'longtext_value',
      enum_column: 'value1',
      set_column: 'value2'
    }
*/

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

/* convert invalidDate to 1000-01-01 00:00:00 */
export const toValidDateSchemaText = `const toValidDatetimeSchema = z.preprocess((val) => {
  const date = format(new Date(String(val)), "yyyy-MM-dd HH:mm:ss");
  return date !== "Invalid Date" ? date : "1000-01-01 00:00:00";
}, z.date());`;

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
    .with("BINARY", () => "z.unknown()")
    .with("VARBINARY", () => "z.unknown()")
    .with("TINYBLOB", () => "z.unknown()")
    .with("BLOB", () => "z.unknown()")
    .with("MEDIUMBLOB", () => "z.unknown()")
    .with("LONGBLOB", () => "z.unknown()")
    .otherwise(() => "z.unknown()");

export const toPascalCase = (str: string) => {
  const camel = toCamel(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
};

// tocamelwrapper
export const toCamelWrapper = (
  str: string,
  isCamel: boolean,
  isUpperCamel: boolean
) => {
  if (isUpperCamel) return toPascalCase(str);
  if (isCamel) return toCamel(str);
  return str;
};
