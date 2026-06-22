#!/usr/bin/env node
// One-off: merge Goodreads RSS feeds (one per shelf) into a Bookshelf JSON.
// NOT the real importer — just bootstraps realistic, multi-shelf sample data.
// Usage: node scripts/rss-to-json.mjs <out.json> <shelfId>=<feed.xml> [...]
import { readFileSync, writeFileSync } from "node:fs";

const [, , outPath, ...pairs] = process.argv;
if (!outPath || pairs.length === 0) {
	console.error("usage: rss-to-json.mjs <out.json> <shelfId>=<feed.xml> [...]");
	process.exit(1);
}

const readTag = (src, tag) => {
	const m = src.match(
		new RegExp(`<${tag}>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([\\s\\S]*?))<\\/${tag}>`),
	);
	return m ? (m[1] ?? m[2] ?? "").trim() : "";
};

const LABELS = {
	read: "Read",
	"currently-reading": "Currently reading",
	"to-read": "To read",
	favorites: "Favorites",
};
const humanize = (id) =>
	LABELS[id] ?? id.replace(/(^|[-_])(.)/g, (_, _s, c) => ` ${c.toUpperCase()}`).trim();
const iso = (rfc) => {
	const d = new Date(rfc);
	return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
};

let owner = "Reader";
const books = [];
const seen = new Set();

for (const pair of pairs) {
	const [shelfId, path] = pair.split("=");
	if (!path) continue;
	const xml = readFileSync(path, "utf8");
	if (owner === "Reader") {
		const channel = xml.slice(0, xml.indexOf("<item>"));
		owner = (readTag(channel, "title") || "").replace(/'s bookshelf.*$/i, "").trim() || "Reader";
	}
	for (const chunk of xml.split(/<item>/).slice(1)) {
		const id = readTag(chunk, "book_id");
		if (!id || seen.has(id)) continue;
		seen.add(id);

		const cover =
			readTag(chunk, "book_large_image_url") ||
			readTag(chunk, "book_medium_image_url") ||
			readTag(chunk, "book_image_url");
		const niceCover = cover ? cover.replace(/\._[A-Z]{2,3}\d+_/, "._SY475_") || cover : undefined;
		const rating = Number(readTag(chunk, "user_rating"));
		const avg = Number(readTag(chunk, "average_rating"));
		const year = Number(readTag(chunk, "book_published"));

		books.push({
			id,
			title: readTag(chunk, "title").replace(/\s+/g, " "),
			author: readTag(chunk, "author_name").replace(/\s+/g, " "),
			coverUrl: niceCover,
			isbn: readTag(chunk, "isbn") || undefined,
			rating: rating > 0 ? rating : undefined,
			averageRating: avg > 0 ? avg : undefined,
			year: year > 0 ? year : undefined,
			readAt: iso(readTag(chunk, "user_read_at")),
			shelf: shelfId,
		});
	}
}

const shelves = pairs.map((pair) => {
	const id = pair.split("=")[0];
	return { id, label: humanize(id), enabled: id !== "to-read" };
});

const shelf = { owner, sourceId: "goodreads", books, shelves };
writeFileSync(outPath, `${JSON.stringify(shelf, null, 2)}\n`, "utf8");
console.log(
	`Wrote ${books.length} books across ${shelves.length} shelves for "${owner}" -> ${outPath}`,
);
