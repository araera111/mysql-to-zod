import { Column } from "../types/buildSchemaTextType";

describe("createSchema", () => {
	it("case 1 separate = false", () => {
		const tableName = "todo";
		const columns: Column[] = [
			{
				column: "id",
				comment: undefined,
				nullable: false,
				type: "int",
			},
		];
		const result = expect().toBe();
	});
});
