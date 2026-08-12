import { Array as A, Effect, Option, Predicate, pipe } from "effect";
import {
	type SchemaInformation,
	schemaInformationSchema,
} from "../../../features/sync/types/syncType";
import { schemaInformationToText } from "../../../features/sync/utils/syncUtil";
import { parse } from "../../../features/sync/utils/zodParse";
import type { MysqlToZodOption } from "../../../options/options";
import { schemaOptionSchema } from "../../../options/schema";
import { separateOptionSchema } from "../../../options/separate";
import { typeOptionSchema } from "../../../options/type";
import { formatByPrettier } from "../../formatByPrettier";
import type { Column, SchemaResult } from "../types/buildSchemaTextType";
import {
	type CreateSchemaModeUnion,
	combineSchemaNameAndSchemaString,
	composeColumnStringList,
	composeSchemaName,
	composeTableSchemaTextList,
	composeTypeString,
} from "./buildSchemaTextUtil";

type MergeSchemaTextWithOldInformationProps = {
	schemaName: string;
	schemaInformation: SchemaInformation;
	schemaText: string;
};

export const mergeSchemaTextWithOldInformation = ({
	schemaName,
	schemaInformation,
	schemaText,
}: MergeSchemaTextWithOldInformationProps): Effect.Effect<string, string> =>
	Effect.gen(function* () {
		/* 完成したテキストからschemaInformationをつくる */
		const formatted = yield* formatByPrettier(schemaText);
		const nextSchemaInformation = pipe(
			formatted,
			(x) => parse(x),
			A.head,
			Option.flatMap((x) =>
				Option.fromNullable(schemaInformationSchema.safeParse(x).data),
			),
		);

		/* パースできない場合や、nameが一致しないときは、そのまま返す */
		if (Option.isNone(nextSchemaInformation)) return schemaText;
		const { tableName, properties } = Option.getOrThrow(nextSchemaInformation);
		if (tableName !== schemaName) return schemaText;

		/* 一致しているときは、propertiesからfindして、あったら入れ替える */
		const nextProperties = properties.map((property) => {
			const replaceElement = schemaInformation.properties.find(
				(y) => y.name === property.name,
			);
			if (Predicate.isNullable(replaceElement)) return property;
			return replaceElement;
		});

		const rawNextSchemaText = schemaInformationToText({
			tableName,
			properties: nextProperties,
		}).join("");
		return yield* formatByPrettier(rawNextSchemaText).pipe(
			Effect.map((x) => x.trim()),
		);
	});

type CreateSchemaProps = {
	tableName: string;
	columns: Column[];
	options: MysqlToZodOption;
	tableComment: string | undefined;
	schemaInformationList: readonly SchemaInformation[];
	mode: CreateSchemaModeUnion;
};
export const createSchema = ({
	tableName,
	columns,
	options,
	tableComment,
	schemaInformationList,
	mode,
}: CreateSchemaProps): Effect.Effect<SchemaResult, string> =>
	Effect.gen(function* () {
		const schemaString = columns
			.map((x) =>
				composeColumnStringList({ column: x, option: options, mode }).join(
					"\n",
				),
			)
			.join("");

		const schemaOption = schemaOptionSchema.parse(options.schema);
		const separateOption = separateOptionSchema.parse(options.separate);
		const typeOption = typeOptionSchema.parse(options.type);

		const schemaName = composeSchemaName({
			schemaOption,
			tableName,
			mode,
			separateOption,
		});

		const schemaText = combineSchemaNameAndSchemaString({
			schemaName,
			schemaString,
		});

		/* schemaTextを古いschemaInformationとmergeする */
		const thisSchemaInformation = schemaInformationList.find(
			(x) => x.tableName === schemaName,
		);

		const merged = Predicate.isNullable(thisSchemaInformation)
			? schemaText
			: yield* pipe(
					mergeSchemaTextWithOldInformation({
						schemaName,
						schemaText,
						schemaInformation: thisSchemaInformation,
					}),
					Effect.catchAll(() => Effect.succeed(schemaText)),
				);

		const typeString = composeTypeString({
			typeOption,
			tableName,
			schemaName,
			mode,
			separateOption,
		});

		const schema = composeTableSchemaTextList({
			schemaText: merged,
			typeString,
			tableComment,
		});

		/* isSeparateのとき、insert modeで再実行して追記する */
		const schemaList = [schema.join("\n")];
		if (separateOption.isSeparate && mode === "select") {
			const insertSchema = yield* createSchema({
				tableName,
				columns,
				options,
				tableComment,
				schemaInformationList,
				mode: "insert",
			});
			schemaList.push(insertSchema.schema);
		}

		return {
			schema: schemaList.join("\n"),
			columns,
		};
	});
