import * as O from "fp-ts/Option";
import { pipe } from "fp-ts/function";
import { isNil } from "ramda";
import { SchemaInformation } from "../../../features/update/types/updateType";
import {
  getSchemaInformation,
  schemaInformationToText,
} from "../../../features/update/utils/updateUtil";
import { MysqlToZodOption } from "../../../options/options";
import { schemaOptionSchema } from "../../../options/schema";
import { typeOptionSchema } from "../../../options/type";
import { formatByPrettier } from "../../outputToFile";
import { Column, SchemaResult } from "../types/buildSchemaTextType";
import {
  combineSchemaNameAndSchemaString,
  composeColumnStringList,
  composeSchemaName,
  composeTableSchemaTextList,
  composeTypeString,
} from "./buildSchemaTextUtil";

type UpdateSchemaTextProps = {
  schemaName: string;
  schemaText: string;
  schemaInformation: SchemaInformation;
};

export const mergeSchemaTextWithOldInformation = async ({
  schemaName,
  schemaInformation,
  schemaText,
}: UpdateSchemaTextProps) => {
  /* 完成したテキストからschemaInformationをつくる */
  const t = getSchemaInformation(schemaText);
  if (O.isNone(t)) return schemaText;

  const nextSchemaInformation = pipe(schemaText, getSchemaInformation);

  /* 完成したテキストとnameが一致していないときは、そのまま返す */
  if (
    O.isNone(nextSchemaInformation) ||
    nextSchemaInformation.value.tableName !== schemaName
  )
    return schemaText;

  /* 一致しているときは、propertiesからfindして、あったら入れ替える */
  const nextProperties = nextSchemaInformation.value.properties.map(
    (property) => {
      const replaceElement = schemaInformation.properties.find(
        (y) => y.name === property.name,
      );
      if (isNil(replaceElement)) return property;
      return replaceElement;
    },
  );

  const replacedSchemaInformation = {
    ...nextSchemaInformation.value,
    properties: nextProperties,
  };
  const rawNextSchemaText = schemaInformationToText(
    replacedSchemaInformation,
  ).join("\n");
  const formattedSchemaText = await formatByPrettier(rawNextSchemaText);
  return formattedSchemaText.trim();
};

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

  /* schemaTextをmapで交換する */
  console.log({ schemaText, schemaName });

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
