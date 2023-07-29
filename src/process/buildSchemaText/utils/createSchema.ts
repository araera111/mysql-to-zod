import { MysqlToZodOption } from "../../../options";
import { Column } from "../types/buildSchemaTextType";
import {
  composeColumnStringList,
  composeTableSchemaTextList,
} from "./buildSchemaTextUtil";
import { toCamelWrapper } from "./toZod";

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

  const convertedTableName = toCamelWrapper(
    tableName,
    isCamel,
    isTypeUpperCamel
  );

  const addTypeString = isAddType
    ? `export type ${convertedTableName} = z.infer<typeof ${convertedTableName}Schema>;`
    : "";

  return composeTableSchemaTextList({
    schemaString,
    convertedTableName,
    addTypeString,
    tableComment,
  }).join("\n");
};
