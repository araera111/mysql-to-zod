export const convertTableComment = (tableName: string, comment: string) =>
  `// [table:${tableName}] : ${comment}`;
