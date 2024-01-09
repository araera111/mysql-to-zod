import { R } from "@mobily/ts-belt";
import { getTableDefinition } from "./getTableDefinition";

describe("getTableDefinition", () => {
	it("case1 this test is local test...", async () => {
		const tableName = "todo";
		const dbConnection = "mysql://root:root@localhost:3306/my_todo";
		const res = await getTableDefinition(tableName, dbConnection);
		const result = R.Ok([
			"todo",
			"CREATE TABLE `todo` (\n  `id` int NOT NULL AUTO_INCREMENT,\n  `task` varchar(255) NOT NULL,\n  `completed` tinyint(1) NOT NULL DEFAULT '0',\n  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,\n  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,\n  PRIMARY KEY (`id`)\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci",
		]);
		expect(res).toEqual(result);
	});

	it("case2 can not connect", async () => {
		const tableName = "todo";
		const dbConnection = "mysql://root:invalidPassword@localhost:3306/my_todo";
		const res = await getTableDefinition(tableName, dbConnection);
		const result = R.Error(
			"getTableDefinitionError: Error: Access denied for user 'root'@'172.18.0.1' (using password: YES)",
		);
		expect(res).toEqual(result);
	});

	it("case3 table not found", async () => {
		const tableName = "todoooo";
		const dbConnection = "mysql://root:root@localhost:3306/my_todo";
		const res = await getTableDefinition(tableName, dbConnection);
		const result = R.Error(
			"getTableDefinitionError: getTableDefinitionError: Error: Table 'my_todo.todoooo' doesn't exist",
		);
		expect(res).toEqual(result);
	});
});
