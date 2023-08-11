import { MysqlToZodOption } from "../../../options/options";
import { schemaOptionSchema } from "../../../options/schema";
import { typeOptionSchema } from "../../../options/type";
import { Column, SchemaResult } from "../types/buildSchemaTextType";
import {
  combineSchemaNameAndSchemaString,
  composeColumnStringList,
  composeSchemaName,
  composeTableSchemaTextList,
  composeTypeString,
} from "./buildSchemaTextUtil";

export const createSchema = (
  tableName: string,
  columns: Column[],
  options: MysqlToZodOption,
  tableComment: string | undefined,
): SchemaResult => {
  const schemaString = columns
    .map((x) =>
      composeColumnStringList({ column: x, option: options }).join("\n"),
    )
    .join("");

  const schemaOption = schemaOptionSchema.parse(options.schema);

  const schemaName = composeSchemaName({ schemaOption, tableName });

  const schemaText = combineSchemaNameAndSchemaString({
    schemaName,
    schemaString,
  });

  const typeOption = typeOptionSchema.parse(options.type);

  const typeString = composeTypeString({
    typeOption,
    tableName,
    schemaName,
  });

  return {
    schema: composeTableSchemaTextList({
      schemaText,
      typeString,
      tableComment,
    }).join("\n"),
    columns,
  };
};
