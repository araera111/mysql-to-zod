import { MysqlToZodOption } from "../../options/options";
import { convertToZodType } from "../buildSchemaText/utils/buildSchemaTextUtil";

type ComposeGlobalSchemaRowParams = {
  type: string;
  option: MysqlToZodOption;
};
export const composeGlobalSchemaRow = ({
  type,
  option,
}: ComposeGlobalSchemaRowParams): string =>
  `mysql${type}: ${convertToZodType({
    type,
    schemaZodImplementationList: option.schema?.zod?.implementation ?? [],
  })},\n`;

type ComposeGlobalSchemaParams = {
  typeList: string[];
  option: MysqlToZodOption;
};
export const composeGlobalSchema = ({
  typeList,
  option,
}: ComposeGlobalSchemaParams): string => {
  const rows = typeList
    .map((type) => composeGlobalSchemaRow({ type, option }))
    .join("");
  const result = `import { z } from "zod";
export const globalSchema = {
${rows}};`;
  return result;
};
