import { parseDocument } from "htmlparser2";

import { DEFAULT_SHELVES } from "../config";
import type {
	Book,
	BookSource,
	BookshelfData,
	DefaultShelf,
	ImportOptions,
	ShelfId,
} from "../types";

interface XmlNode {
	type?: string;
	name?: string;
	data?: string;
	children?: XmlNode[];
}

const GOODREADS_SHELVES = {
	reading: "currently-reading",
	read: "read",
	"to-read": "to-read",
	favorites: "favorites",
} satisfies Record<DefaultShelf, string>;

const GOODREADS_TO_CANONICAL: Record<string, ShelfId> = {
	"currently-reading": "reading",
	read: "read",
	"to-read": "to-read",
	favorites: "favorites",
};

const MAX_PAGES_PER_SHELF = 100;

function nodes(parent: XmlNode | undefined, tag: string): XmlNode[] {
	return (parent?.children ?? []).filter(
		(child) => child.type === "tag" && child.name?.split(":").at(-1) === tag,
	);
}

function text(node: XmlNode | undefined): string | undefined {
	if (!node) return undefined;
	if (node.type === "text") return node.data?.trim() || undefined;
	const value = (node.children ?? []).map(text).filter(Boolean).join("").trim();
	return value || undefined;
}

function shelvesFor(shelves: readonly ShelfId[]) {
	const defaultIds = new Set(DEFAULT_SHELVES.map((shelf) => shelf.id));
	const customShelves = [...new Set(shelves)]
		.filter((shelf) => !defaultIds.has(shelf))
		.map((shelf) => ({
			id: shelf,
			label: shelf
				.split("-")
				.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
				.join(" "),
		}));
	return [...customShelves, ...DEFAULT_SHELVES];
}

function openLibraryCoverId(isbn: string | undefined): string | undefined {
	const normalized = isbn?.replace(/[^0-9Xx]/g, "");
	return normalized ? `isbn:${normalized}` : undefined;
}

/** Convert a Goodreads profile, shelf, or RSS URL to a Goodreads RSS URL. */
export function goodreadsRssSourceUrl(url: string): string | undefined {
	try {
		const parsed = new URL(url);
		if (parsed.hostname !== "goodreads.com" && !parsed.hostname.endsWith(".goodreads.com")) {
			return undefined;
		}
		const [, section, page, rawId] = parsed.pathname.split("/");
		const id =
			section === "review" && (page === "list_rss" || page === "list")
				? rawId?.match(/^\d+/)?.[0]
				: section === "user" && page === "show"
					? rawId?.match(/^\d+/)?.[0]
					: undefined;
		if (!id) return undefined;
		const shelf = parsed.searchParams.get("shelf") || GOODREADS_SHELVES.read;
		return `https://www.goodreads.com/review/list_rss/${id}?shelf=${encodeURIComponent(shelf)}`;
	} catch {
		return undefined;
	}
}

function parseGoodreadsRss(xml: string, shelf: ShelfId): BookshelfData {
	const document = parseDocument(xml, { xmlMode: true, decodeEntities: true }) as XmlNode;
	const channel =
		nodes(nodes(document, "rss")[0], "channel")[0] ?? nodes(document, "channel")[0] ?? {};
	const read = (item: XmlNode, ...tags: string[]) => {
		for (const tag of tags) {
			const value = text(nodes(item, tag)[0]);
			if (value) return value;
		}
		return undefined;
	};
	const numberField = (item: XmlNode, ...tags: string[]) => {
		const value = read(item, ...tags);
		if (!value) return undefined;
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : undefined;
	};
	const dateField = (item: XmlNode, ...tags: string[]) => {
		const value = read(item, ...tags);
		if (!value || value === "not set") return undefined;
		const date = new Date(value);
		return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
	};

	const books = nodes(channel, "item")
		.map((item): Book | undefined => {
			const id =
				read(item, "book_id", "id") ??
				read(item, "book_link", "link")?.match(/(?:book\/show\/|show\/)(\d+)/)?.[1];
			const title = read(item, "book_title", "title");
			const author = read(item, "book_author", "author_name", "author");
			if (!id || !title || !author) return undefined;
			const isbn = read(item, "isbn13") || read(item, "isbn");
			return {
				id,
				title,
				author,
				coverUrl: read(item, "book_large_image_url", "book_medium_image_url", "book_image_url"),
				openLibraryCoverId: openLibraryCoverId(isbn),
				isbn,
				review: read(item, "user_review", "review"),
				reviewUrl: read(item, "user_review_url", "review_url"),
				rating: numberField(item, "user_rating"),
				averageRating: numberField(item, "average_rating"),
				year: numberField(item, "book_published", "book_publication_year", "publication_year"),
				readAt: dateField(item, "user_read_at", "read_at"),
				addedAt: dateField(item, "user_date_added", "date_added", "pubDate"),
				shelf,
			};
		})
		.filter((book): book is Book => Boolean(book));

	const title = read(channel, "title");
	return {
		owner:
			read(channel, "user_name") ??
			title
				?.replace(/'s bookshelf.*$/i, "")
				.replace(/\s+bookshelf.*$/i, "")
				.trim() ??
			"Goodreads",
		sourceId: "goodreadsrss",
		books,
		shelves: shelvesFor([shelf]),
	};
}

/** Import one or more Goodreads shelves from Goodreads RSS. */
export async function importGoodreadsRss(
	url: string,
	options: ImportOptions = {},
): Promise<BookshelfData> {
	const sourceUrl = goodreadsRssSourceUrl(url);
	if (!sourceUrl) throw new Error(`Not a Goodreads user or RSS URL: ${url}`);

	const fetchImpl = options.fetch ?? globalThis.fetch;
	if (!fetchImpl) throw new Error("No fetch implementation available for Goodreads RSS import.");

	const requestedShelves = options.shelves?.length
		? options.shelves.map((shelf) => {
				if (typeof shelf === "string") return { id: shelf, providerId: GOODREADS_SHELVES[shelf] };
				return {
					id: GOODREADS_TO_CANONICAL[shelf.custom] ?? shelf.custom,
					providerId: shelf.custom,
				};
			})
		: DEFAULT_SHELVES.map((shelf) => ({
				id: shelf.id,
				providerId: GOODREADS_SHELVES[shelf.id as DefaultShelf],
			}));
	const uniqueRequestedShelves = requestedShelves.filter(
		(shelf, index) => requestedShelves.findIndex((item) => item.id === shelf.id) === index,
	);
	const shelves = uniqueRequestedShelves.map((shelf) => shelf.id);
	const shelfData = await Promise.all(
		uniqueRequestedShelves.map(async (shelf) => {
			const pages: BookshelfData[] = [];
			const seenPages = new Set<string>();
			let owner = "Goodreads";

			for (let page = 1; page <= MAX_PAGES_PER_SHELF; page++) {
				const shelfUrl = new URL(sourceUrl);
				shelfUrl.searchParams.set("shelf", shelf.providerId);
				shelfUrl.searchParams.set("page", String(page));
				const response = await fetchImpl(shelfUrl, {
					signal: options.signal,
					headers: { accept: "application/rss+xml, application/xml;q=0.9, text/xml;q=0.8" },
				});
				if (!response.ok) {
					throw new Error(
						`Goodreads RSS request failed: ${response.status} ${response.statusText}`,
					);
				}

				const data = parseGoodreadsRss(await response.text(), shelf.id);
				owner = data.owner;
				if (data.books.length === 0) break;

				const signature = data.books.map((book) => book.id).join("\0");
				if (seenPages.has(signature)) break;
				seenPages.add(signature);
				pages.push(data);
			}

			return {
				owner,
				sourceId: "goodreadsrss",
				books: pages.flatMap((page) => page.books),
				shelves: shelvesFor([shelf.id]),
			};
		}),
	);

	return {
		owner:
			shelfData.find((data) => data.owner !== "Goodreads")?.owner ??
			shelfData[0]?.owner ??
			"Goodreads",
		sourceId: "goodreadsrss",
		books: shelfData.flatMap((data) => data.books),
		shelves: shelvesFor(shelves),
	};
}

export const goodreadsRssSource: BookSource = {
	id: "goodreadsrss",
	label: "Goodreads RSS",
	sourceUrl: goodreadsRssSourceUrl,
	importShelf: importGoodreadsRss,
};
