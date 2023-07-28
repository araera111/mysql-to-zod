import { Create } from "node-sql-parser";
import { isNil } from "ramda";

export const convertTableComment = (tableName: string, comment: string) =>
  `// [table:${tableName}] : ${comment}`;

export const getTableComment = (ast: Create): string | undefined => {
  const tableOptions = ast?.table_options;
  if (isNil(tableOptions)) return undefined;
  const comment = tableOptions.find((x: any) => x.keyword === "comment");
  /* 
      {
          keyword: "comment",
          symbol: "=",
          value: "'International Commercial Airports'",
        },
   delete single quote -> slice(1, -1)
  */
  return comment?.value.slice(1, -1);
};
