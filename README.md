# mysql-to-zod

> Convert MySQL schemas into Zod schemas

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

run:

```bash
npx mysql-to-zod mysql://user@pass:3306/dbname
```

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

rootdir

```sh
touch mysqlToZod.config.js
```

```js:mysqlToZod.config.js
const options = {
  isAddType: true, //isAdd export type A = z.infer<schema>
  isCamel: true, //is table name camel?
  isTypeUpperCamel: true, //is table name upperCamel?
  outFilePath: "mysqlToZod", //dirpath
  fileName: "schema.ts", //fileName
  dbConnection: "mysql://root:root@localhost:3306/mydb", //argv0 is priority 1. thisConfig is priority 2.
  tableNames: [], //if empty, all tables.
  nullType: "nullable" // "nullable" | "nullish" default is "nullable"
};
module.exports = options;
```

If dbConnection contains "@" or other special characters, pass it as Config for Knex.

```js:mysqlToZod.config.js
const options = {
  dbConnection: {
    host : '127.0.0.1',
    port : 3306,
    user : 'your_database_user',
    password : 'your_database_password',
    database : 'myapp_test'
    }
}
```

## License

MIT
