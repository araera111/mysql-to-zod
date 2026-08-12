import { Command } from "commander";
import { Effect } from "effect";
import { commandOptionSchema } from "./process";
import { runCommand } from "./process/runCommand";

const program = new Command();

const VERSION = process.env.VERSION || "0.0.0";

program
	.option("-f, --file [path]", "config file path", "./mysqlToZod.config.js")
	.name("mysql-to-zod")
	.version(VERSION)
	.description("mysql-to-zod is a tool to generate zod schema from mysql table")
	.parse(process.argv);

const commandOption = commandOptionSchema.parse(program.opts());

Effect.runPromise(runCommand(program, commandOption.file)).then(
	() => process.exit(0),
	(error: unknown) => {
		console.error(error);
		process.exit(1);
	},
);
