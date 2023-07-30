import { AST } from "node-sql-parser";
import {
  MysqlToZodOption,
  OptionTableComments,
  basicMySQLToZodOption,
} from "../../../options";
import { Column } from "../types/buildSchemaTextType";
import {
  composeColumnStringList,
  convertComment,
  getTableComment,
  replaceTableName,
} from "./buildSchemaTextUtil";

describe("convertComment", () => {
  it("case1 if format is empty, default", () => {
    const tableName = "airport";
    const comment = "International Commercial Airports";
    const format = "";
    const isTable = true;
    const result = "// [table:airport] : International Commercial Airports";
    expect(convertComment({ name: tableName, comment, format, isTable })).toBe(
      result
    );
  });
  it("case2 replace !name !text", () => {
    const tableName = "airport";
    const comment = "International Commercial Airports";
    const format = "// !name : !text";
    const isTable = true;
    const result = "// airport : International Commercial Airports";
    expect(convertComment({ name: tableName, comment, format, isTable })).toBe(
      result
    );
  });
  it("case3 comment out", () => {
    const tableName = "airport";
    const comment = "International Commercial Airports";
    const format = `/* !name : !text */`;
    const isTable = true;
    const result = "/* airport : International Commercial Airports */";
    expect(convertComment({ name: tableName, comment, format, isTable })).toBe(
      result
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
      result
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
      getTableComment({ ast, optionCommentsTable, tableName: basicTableName })
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
      getTableComment({ ast, optionCommentsTable, tableName: basicTableName })
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
      getTableComment({ ast, optionCommentsTable, tableName: basicTableName })
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
      nullType: "nullish",
    };
    const result: string[] = [
      "// title : BlogTitle",
      "title: z.string().nullish(),\n",
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
      "title: z.string().nullish(),\n",
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
      result
    );
  });

  it("case2 not match", () => {
    const tableName = "foo_bar";
    const replacement: string[] = ["_bar_", "_blah_"];
    const result = "foo_bar";
    expect(replaceTableName({ tableName, replacements: replacement })).toBe(
      result
    );
  });

  it("case3 regexp", () => {
    const tableName = "xcustomers";
    const replacement: string[] = ["/^x(.*)/", "$1_xref"];
    const result = "customers_xref";
    expect(replaceTableName({ tableName, replacements: replacement })).toBe(
      result
    );
  });

  it("case4 regexp2 ^wp_", () => {
    const tableName = "wp_users";
    const replacement = ["/^wp_/", ""];
    const result = "users";
    expect(replaceTableName({ tableName, replacements: replacement })).toBe(
      result
    );
  });

  it("case5 regexp3 log", () => {
    const tableName = "auditlog";
    const replacement = ["log", "_log"];
    const result = "audit_log";
    expect(replaceTableName({ tableName, replacements: replacement })).toBe(
      result
    );
  });

  it("case6 regexp4 log", () => {
    const tableName = "foo_bar_baz";
    const replacement = ["/^(.*)_(.*)_(.*)$/", "$3_$2_$1"];
    const result = "baz_bar_foo";
    expect(replaceTableName({ tableName, replacements: replacement })).toBe(
      result
    );
  });
});
