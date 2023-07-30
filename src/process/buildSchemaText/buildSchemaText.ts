import { fromArray, head, tail } from "fp-ts/lib/NonEmptyArray";
import { isNone } from "fp-ts/lib/Option";
import { EOL } from "node:os";
import { getTableDefinition } from "./utils/getTableDefinition";
import { MysqlToZodOption } from "../../options";
import { createSchemaFile } from "./utils/createSchemaFile";

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
  ${EOL}
  `;

  const loop = async (
    restTables: string[],
    result: string
  ): Promise<string> => {
    const nonEmptyTables = fromArray(restTables);
    if (isNone(nonEmptyTables)) return result;

    const headTable = head(nonEmptyTables.value);
    const tailTables = tail(nonEmptyTables.value);

    const tableDefinition = await getTableDefinition(
      headTable,
      config.dbConnection
    );
    const schemaText = createSchemaFile(tableDefinition, config);

    const newResult = `${result}
${schemaText}
${EOL}`;
    return loop(tailTables, newResult);
  };
  const schemaTexts = await loop(tables, "");
  return `${importStatement}${schemaTexts}`;
};
