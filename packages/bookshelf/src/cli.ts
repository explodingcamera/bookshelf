#!/usr/bin/env node
// CLI: bookshelf <shelf.json> [--mode covers|spines|list] [--doc] [--css theme.css]
import { readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { createBookshelfConfig, renderDocument, renderShelf } from "./index";
import type { Bookshelf, CoverSource, RenderMode } from "./types";

const MODES: RenderMode[] = ["covers", "spines", "list"];
const COVER_SOURCES: CoverSource[] = ["openlibrary", "metadata"];

const { values, positionals } = parseArgs({
	options: {
		mode: { type: "string", default: "covers" },
		"cover-source": { type: "string", default: "openlibrary" },
		doc: { type: "boolean", default: false },
		css: { type: "string" },
		out: { type: "string" },
		help: { type: "boolean", short: "h", default: false },
	},
	allowPositionals: true,
});

if (values.help || positionals.length === 0) {
	console.log(`bookshelf <shelf.json> [options]

  --mode <m>          covers | spines | list (default: covers)
  --cover-source <s>  openlibrary | metadata (default: openlibrary)
  --doc               emit a full standalone HTML document instead of a fragment
  --css <path>        inline this theme CSS into the document (use with --doc)
  --out <path>        write to file instead of stdout
  -h, --help          show this help`);
	process.exit(values.help ? 0 : 1);
}

const mode = values.mode as RenderMode;
if (!MODES.includes(mode)) {
	console.error(`invalid --mode: ${mode}`);
	process.exit(1);
}
const coverSource = values["cover-source"] as CoverSource;
if (!COVER_SOURCES.includes(coverSource)) {
	console.error(`invalid --cover-source: ${coverSource}`);
	process.exit(1);
}

const file = positionals[0];
if (!file) {
	console.error("missing input file");
	process.exit(1);
}

const shelf = JSON.parse(readFileSync(file, "utf8")) as Bookshelf;
const css = values.css ? readFileSync(values.css, "utf8") : undefined;
const config = {
	...createBookshelfConfig(shelf, { mode }),
	coverSource,
};

const html = values.doc ? renderDocument(shelf, config, { css }) : renderShelf(shelf, config);

if (values.out) writeFileSync(values.out, html);
else process.stdout.write(html);
