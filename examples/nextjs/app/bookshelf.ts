import type { BookshelfConfig } from "@dawdle.space/bookshelf";

export const config: BookshelfConfig = {
	dataSource: {
		type: "goodreadsrss",
		url: "https://www.goodreads.com/review/list_rss/129153443?shelf=read",
	},
	coverSource: "openlibrary",
	bookLinkSource: "provider",
	theme: "auto",
	dateFormat: "yyyy-mm-dd",
	stylesheet: "cdn",
	sections: [
		{ label: "Reading", filter: { shelf: "reading" } },
		{ label: "Read", filter: { shelf: "read" } },
		{ label: "To read", filter: { shelf: "to-read" } },
	],
};
