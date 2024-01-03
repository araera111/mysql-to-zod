import { A, O, R, pipe } from "@mobily/ts-belt";
import { produce } from "immer";
import { MysqlToZodOption } from "../../options/options";
import { debugWriteFileSync } from "../../utils/debugUtil";
import { SchemaInformation } from "../parseOldZodSchemaFile/types/syncType";
import { Column, SchemaResult } from "./types/buildSchemaTextType";
import {
	makeImportDeclarationList,
	strListToStrLf,
} from "./utils/buildSchemaTextUtil";
import { createSchemaFile } from "./utils/createSchemaFile";
import { getTableDefinition } from "./utils/getTableDefinition";

type BuildSchemaTextProps = {
	tables: readonly string[];
	option: MysqlToZodOption;
	schemaInformationList: readonly SchemaInformation[];
};

type BuildSchemaTextResult = {
	text: string;
	columns: Column[];
	option: MysqlToZodOption;
};

export const buildSchemaText = async ({
	tables,
	option,
	schemaInformationList,
}: BuildSchemaTextProps): Promise<R.Result<BuildSchemaTextResult, string>> => {
	const importDeclarationList = makeImportDeclarationList({ option });

	const loop = async (
		restTables: readonly string[],
		result: SchemaResult,
	): Promise<R.Result<SchemaResult, string>> =>
		pipe(
			restTables,
			A.head,
			O.zipWith(A.tail(restTables), (head, tail) => ({ head, tail })),
			O.match(
				async (x) => {
					const { head, tail } = x;
					const tableDefinition = await getTableDefinition(
						head,
						// biome-ignore lint/suspicious/noExplicitAny: <explanation>
						option.dbConnection as any,
					);
					const schemaTextEither = createSchemaFile(
						tableDefinition,
						option,
						schemaInformationList,
					);

					return R.match(
						schemaTextEither,
						(ok) => {
							debugWriteFileSync(ok);
							const nextResult = produce(result, (draft) => {
								draft.schema += ok.schema;
								draft.columns.push(...ok.columns);
							});
							return loop(tail, nextResult);
						},
						async (err) => R.Error(err),
					);
				},
				async () => R.Ok(result),
			),
		);

	const schemaTexts = await loop(tables, {
		schema: "",
		columns: [],
	});

	return R.flatMap(schemaTexts, (x) => {
		const text = strListToStrLf([...importDeclarationList, x.schema]);
		return R.Ok({ text, columns: x.columns, option });
	});
};
