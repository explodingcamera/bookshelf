import type { BookSource, Bookshelf } from "../types";
import { sampleShelf } from "./sampleData";

function goodreadsSourceUrl(url: string): string | undefined {
	try {
		const parsed = new URL(url);
		if (!parsed.hostname.endsWith("goodreads.com")) return undefined;
		const [, section, page, rawId] = parsed.pathname.split("/");
		const shelf = parsed.searchParams.get("shelf") || "read";
		let id: string | undefined;
		if (section === "review" && (page === "list_rss" || page === "list")) {
			id = rawId?.match(/^\d+/)?.[0];
		}
		if (section === "user" && page === "show") {
			id = rawId?.match(/^\d+/)?.[0];
		}
		if (id)
			return `https://www.goodreads.com/review/list_rss/${id}?shelf=${encodeURIComponent(shelf)}`;
	} catch {
		return undefined;
	}
	return undefined;
}

/** Mock import: validate the URL, then return the sample shelf after a delay.
 *  Real fetching will go through a backend proxy (CORS / auth) but still emit
 *  the same Bookshelf JSON. */
export async function importGoodreads(url: string): Promise<Bookshelf> {
	const sourceUrl = goodreadsSourceUrl(url);
	if (!sourceUrl) throw new Error(`Not a Goodreads user or RSS URL: ${url}`);
	await new Promise((r) => setTimeout(r, 600));
	const shelf = structuredClone(sampleShelf);
	const reviews = [
		"<p>A beautiful, strange book. <strong>Still thinking about it.</strong></p>",
		"Dense but worth it. The worldbuilding is doing real work here.",
		"<p>Sharp, funny, and mean in exactly the right way.</p>",
	];
	for (const [i, review] of reviews.entries()) {
		const book = shelf.books[i];
		if (book) book.review = review;
	}
	return shelf;
}

export const goodreadsSource: BookSource = {
	id: "goodreads",
	label: "Goodreads",
	sourceUrl: goodreadsSourceUrl,
	importShelf: importGoodreads,
};
