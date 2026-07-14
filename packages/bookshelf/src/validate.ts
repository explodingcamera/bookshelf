import { type as ark } from "arktype";

import type { BookshelfConfig, BookshelfData } from "./types";

const DataSource = ark({
	type: "string",
	"url?": "string",
});

const Section = ark({
	label: "string",
	"mode?": "'covers' | 'spines' | '3d' | 'list'",
	"sortBy?": "'readAt' | 'readAtAsc' | 'addedAt' | 'addedAtAsc' | 'rating' | 'ratingAsc'",
	"spineBehavior?": "'hover' | 'open'",
	"showRatings?": "boolean",
	"showReviews?": "boolean",
	"showAuthor?": "boolean",
	"showReadDate?": "boolean",
	"scale?": "0.65 <= number <= 1.6",
	"filter?": {
		"shelf?": "string",
		"hasReview?": "boolean",
		"hasRating?": "boolean",
	},
});

const Config = ark({
	dataSource: DataSource,
	"coverSource?": "'openlibrary' | 'metadata' | 'none'",
	"bookLinkSource?": "'none' | 'provider' | 'openlibrary'",
	"theme?": "'auto' | 'light' | 'dark'",
	"dateFormat?": "'yyyy-mm-dd' | 'dd.mm.yyyy' | 'mm/dd/yyyy'",
	"stylesheet?": "'cdn' | 'inline' | 'none'",
	"showAttribution?": "boolean",
	"sections?": Section.array(),
});

const Book = ark({
	id: "string",
	title: "string",
	author: "string",
	"coverUrl?": "string",
	"openLibraryCoverId?": "number | string",
	"isbn?": "string",
	"review?": "string",
	"reviewUrl?": "string",
	"rating?": "number",
	"averageRating?": "number",
	"year?": "number",
	"readAt?": "string",
	"addedAt?": "string",
	"shelf?": "string",
});

const Data = ark({
	owner: "string",
	sourceId: "string",
	books: Book.array(),
	"shelves?": ark({ id: "string", label: "string" }).array(),
});

export type BookshelfInput =
	| BookshelfData
	| BookshelfConfig
	| { bookshelf: BookshelfData; config?: BookshelfConfig };

export function parseBookshelfConfig(value: unknown): BookshelfConfig {
	return Config.assert(value);
}

export function bookshelfConfigJsonSchema(): object {
	return Config.toJsonSchema();
}

export function parseBookshelfInput(value: unknown): BookshelfInput {
	return Data.or(Config)
		.or({
			bookshelf: Data,
			"config?": Config,
		})
		.assert(value);
}
