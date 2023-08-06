import { Either, isLeft, right } from "fp-ts/lib/Either";
import { fromArray, head, tail } from "fp-ts/lib/NonEmptyArray";
import { isNone } from "fp-ts/lib/Option";
import { produce } from "immer";
import { EOL } from "node:os";
import { MysqlToZodOption } from "../../options/options";
import { Column, SchemaResult } from "./types/buildSchemaTextType";
import { createSchemaFile } from "./utils/createSchemaFile";
import { getTableDefinition } from "./utils/getTableDefinition";

type BuildSchemaTextParams = {
  tables: string[];
  option: MysqlToZodOption;
};

type BuildSchemaTextResult = {
  text: string;
  columns: Column[];
};

export const buildSchemaText = async ({
  tables,
  option,
}: BuildSchemaTextParams): Promise<Either<string, BuildSchemaTextResult>> => {
  const importDeclaration = produce(['import { z } from "zod";'], (draft) => {
    if (!option.schema?.inline)
      draft.push("import { globalSchema } from './globalSchema';");
  }).join("\n");

  const loop = async (
    restTables: string[],
    result: SchemaResult
  ): Promise<Either<string, SchemaResult>> => {
    const nonEmptyTables = fromArray(restTables);
    if (isNone(nonEmptyTables)) return right(result);

    const headTable = head(nonEmptyTables.value);
    const tailTables = tail(nonEmptyTables.value);

    const tableDefinition = await getTableDefinition(
      headTable,
      option.dbConnection
    );
    const schemaTextEither = createSchemaFile(tableDefinition, option);
    if (isLeft(schemaTextEither)) return schemaTextEither;

    const newResult = [result.schema, schemaTextEither.right.schema, EOL].join(
      "\n"
    );

    return loop(tailTables, {
      schema: newResult,
      columns: [...result.columns, ...schemaTextEither.right.columns],
    });
  };
  const schemaTexts = await loop(tables, {
    schema: "",
    columns: [],
  });
  if (isLeft(schemaTexts)) return schemaTexts;

  return right({
    text: `${importDeclaration}\n${schemaTexts.right.schema}`,
    columns: schemaTexts.right.columns,
  });
};
