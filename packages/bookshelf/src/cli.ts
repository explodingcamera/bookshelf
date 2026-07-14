#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";

import { Bookshelf } from "./api";
import { exportCover } from "./covers";
import { goodreadsRssSource } from "./importer/goodreads-rss";
import { parseBookshelfConfig } from "./validate";

const { values, positionals } = parseArgs({
	options: {
		"export-cover": { type: "string" },
		template: { type: "string" },
		"template-string": { type: "string" },
		doc: { type: "boolean", default: false },
		css: { type: "string" },
		out: { type: "string" },
		help: { type: "boolean", short: "h", default: false },
	},
	allowPositionals: true,
});

if (values.help || positionals.length === 0) {
	console.log(`bookshelf <config.json> [options]

  --export-cover <d>  download covers into this directory
  --template <path>   replace {{ bookshelf }} in an HTML template
  --template-string <s>
                    customize the template placeholder
  --doc               emit a full standalone HTML document instead of a fragment
  --css <path>        inline this theme CSS into the document (use with --doc)
  --out <path>        write to file instead of stdout
  -h, --help          show this help`);
	process.exit(values.help ? 0 : 1);
}

if (positionals.length > 1) throw new Error("expected exactly one config file");
if (values.template && values.doc) throw new Error("--template and --doc cannot be used together");
if (values["template-string"] && !values.template)
	throw new Error("--template-string can only be used with --template");
if (values.css && !values.doc) throw new Error("--css can only be used with --doc");

const DEFAULT_TEMPLATE_STRING = "{{ bookshelf }}";

function renderIntoTemplate(template: string, markup: string, templateString: string): string {
	if (!templateString) throw new Error("--template-string cannot be empty");
	const first = template.indexOf(templateString);
	if (first === -1) throw new Error(`template must contain ${templateString}`);
	const next = template.indexOf(templateString, first + templateString.length);
	if (next !== -1) throw new Error(`template must contain exactly one ${templateString}`);
	return template.replace(templateString, markup);
}

const file = positionals[0];
if (!file) throw new Error("missing input file");

const config = parseBookshelfConfig(JSON.parse(readFileSync(file, "utf8")));
const bookshelf = new Bookshelf({ ...config, sources: [goodreadsRssSource] });
const shelf = await bookshelf.load();
if (values["export-cover"]) {
	const exported = await exportCover(shelf, {
		outDir: values["export-cover"],
		coverSource: config.coverSource,
	});
	process.stderr.write(`Exported ${exported.length} cover${exported.length === 1 ? "" : "s"}.\n`);
}
const css = values.css
	? readFileSync(values.css, "utf8")
	: values.doc && config.stylesheet === "inline"
		? readFileSync(new URL("./styles/default.css", import.meta.url), "utf8")
		: undefined;

const markup = values.doc ? bookshelf.renderDocument(shelf, { css }) : bookshelf.render(shelf);
const output = values.template
	? renderIntoTemplate(
			readFileSync(values.template, "utf8"),
			markup,
			values["template-string"] ?? DEFAULT_TEMPLATE_STRING,
		)
	: markup;

if (values.out) writeFileSync(values.out, output);
else process.stdout.write(output);
