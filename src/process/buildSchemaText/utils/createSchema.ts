import { MysqlToZodOption } from "../../../options";
import { Column } from "../types/buildSchemaTextType";
import {
  combineSchemaNameAndSchemaString,
  composeColumnStringList,
  composeSchemaName,
  composeTableSchemaTextList,
  composeTypeString,
  replaceOldSchemaOption,
  replaceOldTypeOption,
} from "./buildSchemaTextUtil";

export const createSchema = (
  tableName: string,
  columns: Column[],
  options: MysqlToZodOption,
  tableComment: string | undefined
): string => {
  const { isAddType, isCamel, isTypeUpperCamel } = options;

  const schemaString = columns
    .map((x) =>
      composeColumnStringList({ column: x, option: options }).join("\n")
    )
    .join("");

  const schemaOption = replaceOldSchemaOption({
    isCamel,
    schemaOption: options.schema,
  });

  const schemaName = composeSchemaName({ schemaOption, tableName });

  const schemaText = combineSchemaNameAndSchemaString({
    schemaName,
    schemaString,
  });

  const typeOption = replaceOldTypeOption({
    isAddType,
    isCamel,
    isTypeUpperCamel,
    typeOption: options.type,
  });
  console.log({ typeOption });

  const typeString = composeTypeString({
    typeOption,
    tableName,
    schemaName,
  });

  return composeTableSchemaTextList({
    schemaText,
    typeString,
    tableComment,
  }).join("\n");
};
