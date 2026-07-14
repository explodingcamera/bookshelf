import { writeFileSync } from "node:fs";

import { bookshelfConfigJsonSchema } from "./validate";

const schema = {
	...bookshelfConfigJsonSchema(),
	$id: "https://bookshelf.dawdle.space/schema/v0.1.0/schema.json",
	title: "Bookshelf Config",
};

writeFileSync(
	new URL("../schema.json", import.meta.url),
	`${JSON.stringify(schema, null, "\t")}\n`,
);
