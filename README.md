# mysql-to-zod

> Convert MySQL schemas into Zod schemas

![default](https://github.com/araera111/mysql-to-zod/assets/63596736/650265b4-414c-49f3-b88c-cf437921960c)

## Notice

If you have any questions about usage or suggestions for improvement, please visit disucussions.
<https://github.com/araera111/mysql-to-zod/discussions>

## Overview

Connect to MySQL using mysql2 and retrieve the CREATE TABLE statement.
It is then parsed by node-sql-parser and output as zodSchema.

## Usage

```bash
npx mysql-to-zod mysql://user:pass@localhost:3306/dbname
```

## Demo

For the following SQL schema

```sql
CREATE TABLE todo (
  id INT NOT NULL AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);
```

## example

![image](https://github.com/araera111/mysql-to-zod/assets/63596736/c6d4bf03-8109-4ccd-804f-59249a733696)

run:

```bash
npx mysql-to-zod mysql://user@pass:3306/dbname
```

## output

```typescript
import { z } from "zod";

export const TodoSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  created_at: z.date().nullable(),
  updated_at: z.date().nullable(),
});
export type Todo = z.infer<typeof TodoSchema>;
```

## options

WIP...

rootdir

```sh
touch mysqlToZod.config.js
```

![image](https://github.com/araera111/mysql-to-zod/assets/63596736/d3cdc363-1d1f-422f-9ee6-c2ad2c7136d0)

```js:mysqlToZod.config.js
const options = {
  /*
    output
    If you set the following
    The output schemas will be in "./mysqlToZod/schema.ts"
  */
  output: {
    outDir: "./mysqlToZod",
    fileName: "schema.ts",    
  },
  dbConnection: "mysql://root:root@localhost:3306/mydb", //argv0 is priority 1. thisConfig is priority 2.
  tableNames: [], //if empty, all tables.
};
module.exports = options;
```

If dbConnection contains "@" or other special characters, pass it as Config for Knex.

```js:mysqlToZod.config.js
/** @type {import("./src/options/options").MysqlToZodOption} */
const options = {
  /* You can specify the destination directory and file name. */
  output: {
    outDir: "./mysqlToZod",
    fileName: "schema.ts",
  },
  /* 
    You can specify the URL to connect to MySQL(mysql://user:pass@host:port:dbName)
    or
    You can specify the connection information for MySQL.
  */
  dbConnection: {
    host: "127.0.0.1",
    port: 3306,
    user: "root",
    password: "root",
    database: "test",
  },
  /* if empty, all tables */
  tableNames: [],

  /* Below are the ADVANCED OPTIONS.  A detailed explanation will be written at a later date. */
  comments: {
    table: {
      active: true,
      format: "// [table:!name] : !text",
    },
    column: {
      active: true,
      format: "// !name : !text",
    },
  },
  type: {
    declared: "type",
    format: "pascal",
    prefix: "",
    suffix: "",
    replacements: [],
  },
  schema: {
    format: "camel",
    prefix: "",
    suffix: "Schema",
    replacements: [],
    nullType: "nullish",
    inline: false,
    zod: {
      implementation: [],
      references: [],
    },
  },
};
module.exports = options;
```

## License

MIT
