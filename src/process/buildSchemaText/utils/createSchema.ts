import { pipe } from "fp-ts/lib/function";
import { isNil, uniq } from "ramda";
import { MysqlToZodOption } from "../../../options";
import { Column, SchemaResult } from "../types/buildSchemaTextType";
import {
  columnToImportStatement,
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
): SchemaResult => {
  const { isAddType, isCamel, isTypeUpperCamel } = options;

  const schemaString = columns
    .map((x) =>
      composeColumnStringList({ column: x, option: options }).join("\n")
    )
    .join("");

  const customSchemaImportDeclarationList = pipe(
    columns
      .flatMap((x) =>
        columnToImportStatement({
          column: x,
          customSchemaOptionList: options.schema?.zod ?? [],
        })
      )
      .flatMap((x) => (isNil(x) ? [] : x)),
    uniq
  );

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
    importDeclarationList: customSchemaImportDeclarationList,
  };
};
