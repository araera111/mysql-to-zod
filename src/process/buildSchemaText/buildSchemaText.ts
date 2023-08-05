import { Either, isLeft, right } from "fp-ts/lib/Either";
import { fromArray, head, tail } from "fp-ts/lib/NonEmptyArray";
import { isNone } from "fp-ts/lib/Option";
import { EOL } from "node:os";
import { uniq } from "ramda";
import { MysqlToZodOption } from "../../options/options";
import { SchemaResult } from "./types/buildSchemaTextType";
import { createSchemaFile } from "./utils/createSchemaFile";
import { getTableDefinition } from "./utils/getTableDefinition";

type BuildSchemaTextParams = {
  tables: string[];
  config: MysqlToZodOption;
};

export const buildSchemaText = async ({
  tables,
  config,
}: BuildSchemaTextParams): Promise<string> => {
  // add import statement
  const importStatement = `import { z } from "zod";
import { isLeft } from 'fp-ts/lib/These';`;

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
      config.dbConnection
    );
    const schemaTextEither = createSchemaFile(tableDefinition, config);
    if (isLeft(schemaTextEither)) return schemaTextEither;

    const newResult = `${result.schema}
${schemaTextEither.right.schema}
${EOL}`;
    return loop(tailTables, {
      schema: newResult,
      importDeclarationList: [
        ...result.importDeclarationList,
        ...schemaTextEither.right.importDeclarationList,
      ],
    });
  };
  const schemaTexts = await loop(tables, {
    schema: "",
    importDeclarationList: [],
  });
  if (isLeft(schemaTexts)) return schemaTexts.left;
  return `${importStatement}${uniq(
    schemaTexts.right.importDeclarationList
  ).join("\n")}\n${schemaTexts.right.schema}`;
};
