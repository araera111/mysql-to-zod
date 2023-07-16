# mysql-to-zod

> Convert MySQL schemas into Zod schemas

## Usage

### no-option(default)

```bash
npx mysql-to-zod mysql://user:pass@localhost:3306/dbname
```

## default gif

![default](https://github.com/araera111/mysql-to-zod/assets/63596736/650265b4-414c-49f3-b88c-cf437921960c)

## option gif

![option](https://github.com/araera111/mysql-to-zod/assets/63596736/b00af2ab-1a3c-4516-8e90-67a6e29f4a9b)

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

## example

![image](https://github.com/araera111/mysql-to-zod/assets/63596736/c5495868-bbb7-4f15-910a-2719bc8b7ea4)


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

## example
![image](https://github.com/araera111/mysql-to-zod/assets/63596736/1cf874c7-bee9-49fd-8519-533b5c2744cf)

## options

rootdir

```sh
touch mysqlToZod.config.js
```

![image](https://github.com/araera111/mysql-to-zod/assets/63596736/d3cdc363-1d1f-422f-9ee6-c2ad2c7136d0)


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
  zeroToValidDate: true // if contains new Date(0000-00-00 00:00:00), convert to new Date (1000-01-01 00:00:00)
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
## has option

Do NOT PASS MYSQL parameters

```sh
npx mysql-to-zod
```

## License

MIT
