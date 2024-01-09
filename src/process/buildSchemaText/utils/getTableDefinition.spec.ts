import { getTableDefinition } from "./getTableDefinition";

describe('getTableDefinition', () => {
	it('case1', async() => {
		const tableName = "todo";
		const dbConnection = "mysql://root:root@localhost:3306/my_todo";
		const res = await getTableDefinition(tableName, dbConnection);
		const result = [
  "todo",
  "CREATE TABLE `todo` (\n  `id` int NOT NULL AUTO_INCREMENT,\n  `task` varchar(255) NOT NULL,\n  `completed` tinyint(1) NOT NULL DEFAULT '0',\n  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,\n  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,\n  PRIMARY KEY (`id`)\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci"
]
		expect(res).toEqual(result)
	});
});
