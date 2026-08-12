import { readFileSync, writeFileSync } from "node:fs";
import { MySqlContainer } from "@testcontainers/mysql";
import { Command } from "commander";
import { Effect } from "effect";
import { createConnection } from "mysql2/promise";
import { runCommand } from "./runCommand";
// use docker. if you don't use docker, this test will fail. skip this test.
describe("runCommand", async () => {
	const container = await new MySqlContainer("mysql:8.4").start();
	const client = await createConnection({
		host: container.getHost(),
		port: container.getMappedPort(3306),
		user: container.getUsername(),
		password: container.getUserPassword(),
		database: container.getDatabase(),
	});

	it("case1", async () => {
		const options = {
			dbConnection: {
				database: container.getDatabase(),
				host: container.getHost(),
				password: container.getUserPassword(),
				port: container.getMappedPort(3306),
				user: container.getUsername(),
			},
			schema: { inline: false },
		};
		const todo = `CREATE TABLE todo (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);`;
		const configJs = `const options = ${JSON.stringify(options, null, 2)};
    module.exports = options;`;
		writeFileSync("test/config/testmainFunctionConfig.js", configJs);
		await client.query(todo);

		const program = new Command();

		const configFilePath = "test/config/testmainFunctionConfig.js";
		expect(await Effect.runPromise(runCommand(program, configFilePath))).toBe(
			0,
		);

		const result = `import { z } from "zod";
import { globalSchema } from "./globalSchema";
export const todoSchema = z.object({
	id: globalSchema.mysqlBIGINT,
	title: globalSchema.mysqlVARCHAR,
	description: globalSchema.mysqlTEXT.nullable(),
	is_completed: globalSchema.mysqlTINYINT.nullable(),
	created_at: globalSchema.mysqlTIMESTAMP.nullable(),
	updated_at: globalSchema.mysqlTIMESTAMP.nullable(),
});
export type Todo = z.infer<typeof todoSchema>;
`;
		expect(readFileSync("mysqlToZod/schema.ts", "utf-8")).toBe(result);
	});

	it("case2", async () => {
		const options = {
			dbConnection: {
				database: container.getDatabase(),
				host: container.getHost(),
				password: container.getUserPassword(),
				port: container.getMappedPort(3306),
				user: container.getUsername(),
			},
			tableNames: ["posts"],
			schema: { inline: false },
		};
		const todo2 = `CREATE TABLE todo2 (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);`;
		const posts = `CREATE TABLE posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);`;
		const configJs = `const options = ${JSON.stringify(options, null, 2)};
    module.exports = options;`;
		writeFileSync("test/config/rawTest2Config.js", configJs);
		await client.query(todo2);
		await client.query(posts);

		const program = new Command();

		const configFilePath = "test/config/rawTest2Config.js";
		expect(await Effect.runPromise(runCommand(program, configFilePath))).toBe(
			0,
		);

		const result = `import { z } from "zod";
import { globalSchema } from "./globalSchema";
export const postsSchema = z.object({
	id: globalSchema.mysqlINT,
	title: globalSchema.mysqlVARCHAR,
	content: globalSchema.mysqlTEXT,
	author_id: globalSchema.mysqlINT,
	created_at: globalSchema.mysqlTIMESTAMP.nullable(),
	updated_at: globalSchema.mysqlTIMESTAMP.nullable(),
});
export type Posts = z.infer<typeof postsSchema>;
`;
		expect(readFileSync("mysqlToZod/schema.ts", "utf-8")).toBe(result);
	});
});
