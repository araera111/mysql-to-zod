import { MysqlToZodOption } from "../../options/options";

type ComposeGlobalSchemaParams = {
  typeList: string[];
  option: MysqlToZodOption;
};
export const composeGlobalSchema = ({
  typeList,
  option,
}: ComposeGlobalSchemaParams): string => {
  const result = `import { z } from "zod";
export const globalSchema = {
  mysqlDate: z.date(),
};`;
  return result;
};
