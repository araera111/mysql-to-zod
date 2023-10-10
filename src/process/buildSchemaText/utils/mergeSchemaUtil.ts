import prettier from "@prettier/sync";
import { readFileSync } from "fs-extra";
import { pipe } from "fp-ts/function";
import * as A from "fp-ts/Array";
import { isNil } from "ramda";

type ParsedZodSchemaProperty = {
  key: string;
  value: string;
};

type ParsedZodSchema = {
  title: string;
  properties: ParsedZodSchemaProperty[];
};

export const prettierWrapper = (str: string) =>
  prettier.format(str, { parser: "babel-ts" });

export const splitSchemaText = (str: string): string[] => {
  const result: string[] = [];
  let isReading = false;
  let nowLine: string[] = [];
  const line = str.split("\n");
  line.forEach((x) => {
    if (x.includes("z.object({")) {
      isReading = true;
      nowLine.push(x);
      return;
    }

    if (isReading) {
      nowLine.push(x);
    }

    if (x.includes("});")) {
      isReading = false;
      result.push(nowLine.join(""));
      nowLine = [];
    }
  });
  const r = nowLine.length === 0 ? result : [...result, nowLine.join("")];
  return r.map((x) => prettierWrapper(x));
};

const getSchemaTitle = (schema: string) => {
  const split = schema.split(" ");
  let title = "";
  split.forEach((x, i) => {
    if (x.includes("const")) {
      const nextWord = split[i + 1] ?? "";
      title = nextWord;
    }
  });
  return title;
};

const getSchemaProperties = (schema: string): ParsedZodSchemaProperty[] => {
  const formatted = prettier.format(schema, { parser: "babel-ts" });
  const result = formatted
    .split("\n")
    .map((x) => x.split(":"))
    .filter((x) => x.length === 2)
    .flatMap(([left, right]) => {
      if (isNil(left) || isNil(right)) return [];
      /*
when 1line
ex: export const todoSchema = z.object({DB_ID: z.number()})
split by "({" and right side(DB_ID) is valid
*/
      const validLeft = left.includes("export const")
        ? left?.split("({")[1]
        : left;

      /*
when 1line
ex: export const todoSchema = z.object({DB_ID: z.number()})
split by "})" and left side (z.number()) is valid
*/
      const validRight = right.includes("})") ? right?.split("})")[0] : right;
      if (isNil(validLeft) || isNil(validRight)) return [];

      return {
        key: validLeft.trim(),
        value: validRight.trim().replaceAll(",", ""),
      };
    });
  return result;
};

export const parseZodSchema = (schema: string) => ({
  title: getSchemaTitle(schema),
  properties: getSchemaProperties(schema),
});

type ParseZodSchemaFileProps = {
  filePath: string;
};

export const parseZodSchemaFile = ({
  filePath,
}: ParseZodSchemaFileProps): ParsedZodSchema[] => {
  const result = pipe(
    filePath,
    (x) => readFileSync(x, { encoding: "utf-8" }),
    splitSchemaText,
    A.map(parseZodSchema),
  );
  return result;
};
