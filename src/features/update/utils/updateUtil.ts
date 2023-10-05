import * as A from "fp-ts/Array";
import * as NPA from "fp-ts/NonEmptyArray";
import * as O from "fp-ts/Option";
import { pipe } from "fp-ts/function";
import { includes, isEmpty, isNil } from "ramda";
import { formatByPrettier } from "../../../process/outputToFile";
import { SchemaInformation, SchemaProperty } from "../types/updateType";

export const getSchemaProperty = (text: string): O.Option<SchemaProperty> =>
  pipe(text.split(":"), ([name, schema]) => {
    if (isNil(name) || isNil(schema)) return O.none;
    return O.some({ name, schema: schema.trim().replace(",", "") });
  });

export const getTableName = (text: string): O.Option<string> =>
  pipe(
    text.split("="),
    A.lookup(0),
    O.filter(includes("export const")),
    O.map((x) => x.split(" ")[2]),
    O.chain(O.fromNullable),
  );

export const getTableNameListFromSchemaText = (text: string): string[] => {
  const t = text
    .split("\n")
    .map((x) => getTableName(x))
    .filter(O.isSome)
    .map((x) => x.value);
  return t;
};

export const getTableTextFromSchemaText = async (
  text: string,
): Promise<string[]> => {
  const tt = text.split("export ");

  const secondFun = async (te: string) => {
    console.log({ te });
    /* WIP,TODO: splitのときに消えてしまうものがあるよ */
    const t = te.split("\n");

    const loop = (
      rest: string[],
      result: string[],
      nowLine: string,
      mode: "skip" | "read",
    ): string[] => {
      const nonEmptyRows = NPA.fromArray(rest);
      if (O.isNone(nonEmptyRows))
        return [...result, nowLine].flatMap((x) => (isEmpty(x) ? [] : x));
      const head = NPA.head(nonEmptyRows.value);
      const tail = NPA.tail(nonEmptyRows.value);

      /* mode === readだが、exportという文字が現れたら処理を中断する */
      if (mode === "read" && head.includes("export")) {
        return loop(tail, [...result, nowLine], "", "skip");
      }

      /* mode === read かつheadheadにexport constが出てきたら、モードをreadに変更する */
      if (mode === "skip" && head.includes("export const")) {
        return loop(tail, result, head, "read");
      }

      if (mode === "skip") {
        return loop(tail, result, "", "skip");
      }

      /* mode === "read" */
      return loop(tail, result, nowLine + head, "read");
    };
    const r = loop(t, [], "", "skip").join("");
    const formatted = await formatByPrettier(r);
    return formatted.trimEnd();
  };

  const result = await Promise.all(tt.map((x) => secondFun(x)));
  console.log({ result });
  return result.flatMap((x) => (isEmpty(x) ? [] : x));
};

export const getSchemaInformation = (
  text: string,
): O.Option<SchemaInformation> => {
  const tableName = getTableName(text);
  const schemaProperties = text
    .split("\n")
    .map((x) => getSchemaProperty(x))
    .flatMap((x) => (O.isNone(x) ? [] : x.value));

  if (O.isNone(tableName)) return O.none;
  return O.some({
    tableName: tableName.value,
    properties: schemaProperties,
  });
};
