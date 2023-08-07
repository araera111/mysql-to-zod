import { produce } from "immer";
import { AST } from "node-sql-parser";
import { OptionTableComments } from "../../../options/comments";
import {
  MysqlToZodOption,
  basicMySQLToZodOption,
} from "../../../options/options";
import {
  SchemaOption,
  SchemaZodImplementation,
  SchemaZodReferences,
} from "../../../options/schema";
import { Column } from "../types/buildSchemaTextType";
import {
  combineSchemaNameAndSchemaString,
  composeColumnStringList,
  composeSchemaName,
  convertComment,
  convertToZodType,
  getTableComment,
  replaceTableName,
  toImplementation,
} from "./buildSchemaTextUtil";

describe("convertComment", () => {
  it("case1 if format is empty, default", () => {
    const tableName = "airport";
    const comment = "International Commercial Airports";
    const format = "";
    const isTable = true;
    const result = "// [table:airport] : International Commercial Airports";
    expect(convertComment({ name: tableName, comment, format, isTable })).toBe(
      result,
    );
  });
  it("case2 replace !name !text", () => {
    const tableName = "airport";
    const comment = "International Commercial Airports";
    const format = "// !name : !text";
    const isTable = true;
    const result = "// airport : International Commercial Airports";
    expect(convertComment({ name: tableName, comment, format, isTable })).toBe(
      result,
    );
  });
  it("case3 comment out", () => {
    const tableName = "airport";
    const comment = "International Commercial Airports";
    const format = `/* !name : !text */`;
    const isTable = true;
    const result = "/* airport : International Commercial Airports */";
    expect(convertComment({ name: tableName, comment, format, isTable })).toBe(
      result,
    );
  });
  it("case4 multiple line comment out", () => {
    const tableName = "airport";
    const comment = "International Commercial Airports";
    const format = `/*
  table: !name
  comment : !text
*/`;
    const isTable = true;
    const result = `/*
  table: airport
  comment : International Commercial Airports
*/`;
    expect(convertComment({ name: tableName, comment, format, isTable })).toBe(
      result,
    );
  });

  it("case5 column comment", () => {
    const name = "title";
    const comment = "BlogTitle";
    const format = "";
    const isTable = false;
    const result = "// title : BlogTitle";
    expect(convertComment({ name, comment, format, isTable })).toBe(result);
  });
});

describe("getTableComment", () => {
  const basicAST: AST = {
    type: "create",
    keyword: "table",
    temporary: null,
    if_not_exists: null,
    table: [
      {
        db: "null",
        table: "todo",
      },
    ],
    ignore_replace: null,
    as: null,
    query_expr: null,
    create_definitions: [
      {
        column: {
          type: "column_ref",
          table: null,
          column: "id",
        },
        definition: {
          dataType: "INT",
          suffix: [],
        },
        resource: "column",
        nullable: {
          type: "not null",
          value: "not null",
        },
        auto_increment: "auto_increment",
      },
      {
        column: {
          type: "column_ref",
          table: null,
          column: "task",
        },
        definition: {
          dataType: "VARCHAR",
          length: 255,
        },
        resource: "column",
        nullable: {
          type: "not null",
          value: "not null",
        },
      },
      {
        column: {
          type: "column_ref",
          table: null,
          column: "due_date",
        },
        definition: {
          dataType: "DATE",
        },
        resource: "column",
        default_val: {
          type: "default",
          value: {
            type: "null",
            value: null,
          },
        },
      },
      {
        column: {
          type: "column_ref",
          table: null,
          column: "created_at",
        },
        definition: {
          dataType: "TIMESTAMP",
        },
        resource: "column",
        nullable: {
          type: "null",
          value: "null",
        },
        default_val: {
          type: "default",
          value: {
            type: "function",
            name: "CURRENT_TIMESTAMP",
            over: null,
          },
        },
      },
      {
        column: {
          type: "column_ref",
          table: null,
          column: "updated_at",
        },
        definition: {
          dataType: "TIMESTAMP",
        },
        resource: "column",
        nullable: {
          type: "null",
          value: "null",
        },
        default_val: {
          type: "default",
          value: {
            type: "function",
            name: "CURRENT_TIMESTAMP",
            over: {
              type: "on update",
              keyword: "CURRENT_TIMESTAMP",
            },
          },
        },
      },
      {
        column: {
          type: "column_ref",
          table: null,
          column: "comment",
        },
        definition: {
          dataType: "VARCHAR",
          length: 255,
        },
        resource: "column",
        default_val: {
          type: "default",
          value: {
            type: "null",
            value: null,
          },
        },
      },
      {
        constraint: null,
        definition: [
          {
            type: "column_ref",
            table: null,
            column: "id",
          },
        ],
        constraint_type: "primary key",
        keyword: null,
        index_type: null,
        resource: "constraint",
        index_options: null,
      },
    ],
    table_options: [
      {
        keyword: "engine",
        symbol: "=",
        value: "INNODB",
      },
      {
        keyword: "default charset",
        symbol: "=",
        value: "utf8mb4",
      },
      {
        keyword: "collate",
        symbol: "=",
        value: "utf8mb4_0900_ai_ci",
      },
      {
        keyword: "comment",
        symbol: "=",
        value: "'International Commercial Airports'",
      },
    ],
  };
  const basicTableName = "airport";
  it("case1 active:true, format:empty", () => {
    const ast: AST = { ...basicAST };
    const optionCommentsTable: OptionTableComments = {
      active: true,
      format: "",
    };
    const result = "// [table:airport] : International Commercial Airports";
    expect(
      getTableComment({
        ast,
        optionCommentsTable,
        tableName: basicTableName,
      }),
    ).toBe(result);
  });

  it("case2 active:false -> undefined", () => {
    const ast: AST = { ...basicAST };
    const optionCommentsTable: OptionTableComments = {
      active: false,
      format: "",
    };
    const result = undefined;
    expect(
      getTableComment({
        ast,
        optionCommentsTable,
        tableName: basicTableName,
      }),
    ).toBe(result);
  });

  it("case3 active:true format", () => {
    const ast: AST = { ...basicAST };
    const optionCommentsTable: OptionTableComments = {
      active: true,
      format: "// [tableName:!name] : comment:!text",
    };
    const result =
      "// [tableName:airport] : comment:International Commercial Airports";
    expect(
      getTableComment({
        ast,
        optionCommentsTable,
        tableName: basicTableName,
      }),
    ).toBe(result);
  });
});

describe("composeColumnStringList", () => {
  it("case1", () => {
    const column: Column = {
      type: "VARCHAR",
      column: "title",
      nullable: true,
      comment: "BlogTitle",
    };
    const option: MysqlToZodOption = {
      ...basicMySQLToZodOption,
    };
    const result: string[] = [
      "// title : BlogTitle",
      "title: z.string().nullable(),\n",
    ];
    expect(composeColumnStringList({ column, option })).toStrictEqual(result);
  });

  it("case2", () => {
    const column: Column = {
      type: "VARCHAR",
      column: "title",
      nullable: true,
      comment: "BlogTitle2",
    };
    const option: MysqlToZodOption = {
      ...basicMySQLToZodOption,
      nullType: "nullish",
    };
    const result: string[] = [
      "// title : BlogTitle2",
      "title: z.string().nullable(),\n",
    ];
    expect(composeColumnStringList({ column, option })).toStrictEqual(result);
  });
});

describe("replaceTableName", () => {
  it("case1 match", () => {
    const tableName = "foo_bar_baz";
    const replacement: string[] = ["_bar_", "_blah_"];
    const result = "foo_blah_baz";
    expect(replaceTableName({ tableName, replacements: replacement })).toBe(
      result,
    );
  });

  it("case2 not match", () => {
    const tableName = "foo_bar";
    const replacement: string[] = ["_bar_", "_blah_"];
    const result = "foo_bar";
    expect(replaceTableName({ tableName, replacements: replacement })).toBe(
      result,
    );
  });

  it("case3 regexp", () => {
    const tableName = "xcustomers";
    const replacement: string[] = ["/^x(.*)/", "$1_xref"];
    const result = "customers_xref";
    expect(replaceTableName({ tableName, replacements: replacement })).toBe(
      result,
    );
  });

  it("case4 regexp2 ^wp_", () => {
    const tableName = "wp_users";
    const replacement = ["/^wp_/", ""];
    const result = "users";
    expect(replaceTableName({ tableName, replacements: replacement })).toBe(
      result,
    );
  });

  it("case5 regexp3 log", () => {
    const tableName = "auditlog";
    const replacement = ["log", "_log"];
    const result = "audit_log";
    expect(replaceTableName({ tableName, replacements: replacement })).toBe(
      result,
    );
  });

  it("case6 regexp4 log", () => {
    const tableName = "foo_bar_baz";
    const replacement = ["/^(.*)_(.*)_(.*)$/", "$3_$2_$1"];
    const result = "baz_bar_foo";
    expect(replaceTableName({ tableName, replacements: replacement })).toBe(
      result,
    );
  });
});

describe("composeSchemaNameString", () => {
  const schemaOption: SchemaOption = {
    replacements: [],
    format: "camel",
    prefix: "",
    suffix: "Schema",
    nullType: "nullable",
    inline: true,
  };
  it("case1 basicOption", () => {
    const option = { ...schemaOption };
    const tableName = "todo";
    const result = "todoSchema";
    expect(
      composeSchemaName({ schemaOption: option, tableName }),
    ).toStrictEqual(result);
  });

  it("case2 not suffix", () => {
    const option: SchemaOption = { ...schemaOption, suffix: "" };
    const tableName = "todo";
    const result = "todo";
    expect(
      composeSchemaName({ schemaOption: option, tableName }),
    ).toStrictEqual(result);
  });
});

describe("combineSchemaNameAndSchemaString", () => {
  it("case1", () => {
    const schemaName = "todoSchema";
    const schemaString = "id: z.number().nullable(),";
    const result = `export const todoSchema = z.object({id: z.number().nullable(),});`;
    expect(combineSchemaNameAndSchemaString({ schemaName, schemaString })).toBe(
      result,
    );
  });
});

/*
case "TINYINT":
    case "SMALLINT":
    case "MEDIUMINT":
    case "INT":
    case "BIGINT":
    case "FLOAT":
    case "DOUBLE":
    case "YEAR":
      return "z.number()";
    case "BIT":
      return "z.boolean()";
    case "DATE":
    case "DATETIME":
    case "TIMESTAMP":
      return "z.date()";
    case "CHAR":
    case "VARCHAR":
    case "DECIMAL":
    case "NUMERIC":
    case "TINYTEXT":
    case "TEXT":
    case "MEDIUMTEXT":
    case "LONGTEXT":
    case "ENUM":
    case "SET":
    case "TIME":
      return "z.string()";
    case "BINARY":
    case "VARBINARY":
    case "TINYBLOB":
    case "BLOB":
    case "MEDIUMBLOB":
    case "LONGBLOB":
      return "z.unknown()";
    default:
      return "z.unknown()";
*/

/* this test is created by github copilot */
describe("convertToZodType", () => {
  const basicOption: MysqlToZodOption = produce(
    basicMySQLToZodOption,
    (draft) => {
      if (draft.schema) {
        draft.schema.inline = true;
      }
    },
  );

  it("TINYINT", () => {
    const type = "TINYINT";
    const result = "z.number()";
    expect(
      convertToZodType({
        type,
        option: basicOption,
      }),
    ).toBe(result);
  });
  it("SMALLINT", () => {
    const type = "SMALLINT";
    const result = "z.number()";
    expect(
      convertToZodType({
        type,
        option: basicOption,
      }),
    ).toBe(result);
  });
  it("MEDIUMINT", () => {
    const type = "MEDIUMINT";
    const result = "z.number()";
    expect(
      convertToZodType({
        type,
        option: basicOption,
      }),
    ).toBe(result);
  });

  it("INT", () => {
    const type = "INT";
    const result = "z.number()";
    expect(
      convertToZodType({
        type,
        option: basicOption,
      }),
    ).toBe(result);
  });
  it("BIGINT", () => {
    const type = "BIGINT";
    const result = "z.number()";
    expect(
      convertToZodType({
        type,
        option: basicOption,
      }),
    ).toBe(result);
  });
  it("FLOAT", () => {
    const type = "FLOAT";
    const result = "z.number()";
    expect(
      convertToZodType({
        type,
        option: basicOption,
      }),
    ).toBe(result);
  });
  it("DOUBLE", () => {
    const type = "DOUBLE";
    const result = "z.number()";
    expect(
      convertToZodType({
        type,
        option: basicOption,
      }),
    ).toBe(result);
  });
  it("YEAR", () => {
    const type = "YEAR";
    const result = "z.number()";
    expect(
      convertToZodType({
        type,
        option: basicOption,
      }),
    ).toBe(result);
  });
  it("BIT", () => {
    const type = "BIT";
    const result = "z.boolean()";
    expect(
      convertToZodType({
        type,
        option: basicOption,
      }),
    ).toBe(result);
  });
  it("DATE", () => {
    const type = "DATE";
    const result = "z.date()";
    expect(
      convertToZodType({
        type,
        option: basicOption,
      }),
    ).toBe(result);
  });
  it("DATETIME", () => {
    const type = "DATETIME";
    const result = "z.date()";
    expect(
      convertToZodType({
        type,
        option: basicOption,
      }),
    ).toBe(result);
  });
  it("TIMESTAMP", () => {
    const type = "TIMESTAMP";
    const result = "z.date()";
    expect(
      convertToZodType({
        type,
        option: basicOption,
      }),
    ).toBe(result);
  });
  it("CHAR", () => {
    const type = "CHAR";
    const result = "z.string()";
    expect(
      convertToZodType({
        type,
        option: basicOption,
      }),
    ).toBe(result);
  });
  it("VARCHAR", () => {
    const type = "VARCHAR";
    const result = "z.string()";
    expect(
      convertToZodType({
        type,
        option: basicOption,
      }),
    ).toBe(result);
  });
  it("DECIMAL", () => {
    const type = "DECIMAL";
    const result = "z.string()";
    expect(
      convertToZodType({
        type,
        option: basicOption,
      }),
    ).toBe(result);
  });
  it("NUMERIC", () => {
    const type = "NUMERIC";
    const result = "z.string()";
    expect(
      convertToZodType({
        type,
        option: basicOption,
      }),
    ).toBe(result);
  });
  it("TINYTEXT", () => {
    const type = "TINYTEXT";
    const result = "z.string()";
    expect(
      convertToZodType({
        type,
        option: basicOption,
      }),
    ).toBe(result);
  });
  it("TEXT", () => {
    const type = "TEXT";
    const result = "z.string()";
    expect(
      convertToZodType({
        type,
        option: basicOption,
      }),
    ).toBe(result);
  });
  it("MEDIUMTEXT", () => {
    const type = "MEDIUMTEXT";
    const result = "z.string()";
    expect(
      convertToZodType({
        type,
        option: basicOption,
      }),
    ).toBe(result);
  });
  it("LONGTEXT", () => {
    const type = "LONGTEXT";
    const result = "z.string()";
    expect(
      convertToZodType({
        type,
        option: basicOption,
      }),
    ).toBe(result);
  });
  it("ENUM", () => {
    const type = "ENUM";
    const result = "z.string()";
    expect(
      convertToZodType({
        type,
        option: basicOption,
      }),
    ).toBe(result);
  });
  it("SET", () => {
    const type = "SET";
    const result = "z.string()";
    expect(
      convertToZodType({
        type,
        option: basicOption,
      }),
    ).toBe(result);
  });
  it("TIME", () => {
    const type = "TIME";
    const result = "z.string()";
    expect(
      convertToZodType({
        type,
        option: basicOption,
      }),
    ).toBe(result);
  });
  it("BINARY", () => {
    const type = "BINARY";
    const result = "z.unknown()";
    expect(
      convertToZodType({
        type,
        option: basicOption,
      }),
    ).toBe(result);
  });
  it("VARBINARY", () => {
    const type = "VARBINARY";
    const result = "z.unknown()";
    expect(
      convertToZodType({
        type,
        option: basicOption,
      }),
    ).toBe(result);
  });
  it("TINYBLOB", () => {
    const type = "TINYBLOB";
    const result = "z.unknown()";
    expect(
      convertToZodType({
        type,
        option: basicOption,
      }),
    ).toBe(result);
  });
  it("BLOB", () => {
    const type = "BLOB";
    const result = "z.unknown()";
    expect(
      convertToZodType({
        type,
        option: basicOption,
      }),
    ).toBe(result);
  });
  it("MEDIUMBLOB", () => {
    const type = "MEDIUMBLOB";
    const result = "z.unknown()";
    expect(
      convertToZodType({
        type,
        option: basicOption,
      }),
    ).toBe(result);
  });
  it("LONGBLOB", () => {
    const type = "LONGBLOB";
    const result = "z.unknown()";
    expect(
      convertToZodType({
        type,
        option: basicOption,
      }),
    ).toBe(result);
  });
  it("case not custom inline = true", () => {
    const type = "DATETIME";
    const result = "globalSchema.mysqlDATETIME";
    const option = produce(basicOption, (draft) => {
      if (draft.schema) {
        draft.schema.inline = false;
      }
    });
    expect(
      convertToZodType({
        type,
        option,
      }),
    ).toBe(result);
  });
});

describe("toImplementation", () => {
  const basicOption: MysqlToZodOption = { ...basicMySQLToZodOption };
  it("case1 inline true, match", () => {
    const type = "DATETIME";
    const schemaZodImplementationList: SchemaZodImplementation[] = [
      ["DATETIME", "z.string()"],
    ];
    const option = produce(basicOption, (draft) => {
      if (draft?.schema?.zod) {
        draft.schema.inline = true;
        draft.schema.zod.implementation = schemaZodImplementationList;
      }
    });
    const result = "z.string()";
    expect(
      toImplementation({
        type,
        option,
      }),
    ).toBe(result);
  });

  it("case2 inline true no match", () => {
    const type = "DATE";
    const schemaZodImplementationList: SchemaZodImplementation[] = [
      ["DATETIME", "z.string()"],
    ];
    const option = produce(basicOption, (draft) => {
      if (draft?.schema?.zod) {
        draft.schema.inline = true;
        draft.schema.zod.implementation = schemaZodImplementationList;
      }
    });
    const result = undefined;
    expect(
      toImplementation({
        type,
        option,
      }),
    ).toBe(result);
  });

  it("case3 inline = false and exist reference", () => {
    const type = "DATETIME";
    const schemaZodImplementationList: SchemaZodImplementation[] = [
      ["DATETIME", "z.string().datetime()"],
    ];
    const schemaZodReferenceList: SchemaZodReferences[] = [
      ["DATETIME", "ourDateTime"],
    ];
    const option = produce(basicOption, (draft) => {
      if (draft?.schema?.zod) {
        draft.schema.inline = false;
        draft.schema.zod.implementation = schemaZodImplementationList;
        draft.schema.zod.references = schemaZodReferenceList;
      }
    });

    const result = "globalSchema.ourDateTime";
    expect(
      toImplementation({
        type,
        option,
      }),
    ).toBe(result);
  });

  it("case4 inline = false, and fromGlobal", () => {
    const type = "DATETIME";
    const schemaZodImplementationList: SchemaZodImplementation[] = [
      ["DATETIME", "z.string().datetime()"],
    ];
    const schemaZodReferenceList: SchemaZodReferences[] = [
      ["DATETIME", "ourDateTime"],
    ];
    const option = produce(basicOption, (draft) => {
      if (draft?.schema?.zod) {
        draft.schema.inline = true;
        draft.schema.zod.implementation = schemaZodImplementationList;
        draft.schema.zod.references = schemaZodReferenceList;
      }
    });

    const result = "z.string().datetime()";
    expect(
      toImplementation({
        type,
        option,
      }),
    ).toBe(result);
  });
});
