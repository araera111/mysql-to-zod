# mysql-to-zod

> Convert MySQL schemas into Zod schemas

## Notice

If you have any questions about usage or suggestions for improvement, please visit disucussions.
<https://github.com/araera111/mysql-to-zod/discussions>

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

## Advanced Options

### comment

CREATE TABLE statements can contain comments.

```sql
CREATE TABLE `todo` (
  `id` int NOT NULL AUTO_INCREMENT,
  `task` varchar(255) NOT NULL,
  `due_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `comment` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='MY_TODO_LIST'
```

By default, comments are inserted as follows

```ts
// [table:todo] : MY_TODO_LIST
export const TodoSchema = z.object({
  id: z.number(),
  task: z.string(),
  due_date: z.date().nullish(),
  created_at: z.date().nullish(),
  updated_at: z.date().nullish(),
  comment: z.string().nullish(),
});
export type Todo = z.infer<typeof TodoSchema>;
```

In the CREATE TABLE statement, you can also add comments to each of the columns.

```sql
CREATE TABLE `blog` (
  `title` varchar(30) DEFAULT NULL COMMENT 'BlogTitle',
  `d` date DEFAULT NULL COMMENT 'CreationDate'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
```

By default, comments are inserted as follows

```ts
export const BlogSchema = z.object({
  // title : BlogTitle
  title: z.string().nullish(),
  // d : CreationDate
  d: z.date().nullish(),
});
export type Blog = z.infer<typeof BlogSchema>;
```

Optionally, comments can be set to not be output. You can also set the output format.

```ts
const options = {
  // other options ...
  comments: {
    table: {
      active: true, // if false, table comment is not add;
      format: "// [table:!name] : !text",
    },
    column: {
      active: true, // if false, column comment is not add;
      format: "// !name : !text",
    },
  },
};
module.exports = options;
```

`!name` is converted to tableName. `!text` is converted to comment.
if format is Empty, table comment format is `'// [table:!name] : !text'`, column comment format is `'// !name : !text'`.

### schema

schemaOption can determine the format of schemaName and null.
schemaName is converted from tableName.
example: tableName `todo_list`, schemaName `TodoList`
`export const ThisIsSchemaName = z.object({});`

For schemaName, format is executed after replacements is processed. Next, prefix and suffix are added.

example: tableName `todo_list`, format `camel`, prefix `My`, suffix `Schema`, replacements `[["todo", "bodo"]]`

`todo_list` -> replacement -> `bodo_list` -> format -> `bodoList` -> prefix -> `MyBodoList` -> suffix -> `MyBodoListSchema`

result: `export const MyBodoListSchema = z.object({});`

replacement[0] is before replacement[1] is after.
replacement[0] is RegExp or string. replacement[1] is string.

```ts
const options = {
  // other options ...
  schema: {
    format: "camel", // camel | pascal | snake | original
    prefix: "",
    suffix: "Schema",
    replacements: [],
    nullType: "nullable",
  },
};
module.exports = options;
```

#### format

format value can be `camel` | `pascal` | `snake` | `original`

#### prefix

tableName `todo_list`
prefix `My`

```ts
export const MyTodoList = z.object({});
```

#### suffix

tableName `todo_list`
suffix `Schema`

```ts
export const todo_listSchema = z.object({});
```

#### replacements

example1：string
tableName: `foo_bar_baz`
replacement[0] → `_bar_`
replacement[1] → `_blah_`
result → `foo_blah_baz`

exmaple2: regexp
tableName: `wp_users`
replacement[0] → `/^wp_/`
replacement[1] → `""`
result → `users`

replacement is looped and all are applied.

#### nullType

You can choose between `nullable` and `nullish`.
For example, String Type and null.
`nullable` is `z.string().nullable()`
`nullish` is `z.string().nullish()`

```ts
const options = {
  // other options ...
  schema: {
    nullType: "nullable", // "nullable" | "nullish" default is "nullable"
  },
};
module.exports = options;
```

### type

The type option is almost the same as the schema option, as shown below.
But null type cannot be selected.

default typeOption

```ts
  type: {
    declared: "type",
    format: "pascal",
    prefix: "",
    suffix: "",
    replacements: [],
  },

```

## License

MIT
