import { writeFileSync } from "fs-extra";

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export const debugWriteFileSync = (data: any) => {
	writeFileSync("./test.json", JSON.stringify(data, null, 2));
};
