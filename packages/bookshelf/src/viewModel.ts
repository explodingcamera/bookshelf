import { bookColors, bookGradient, spineSpec, stars } from "./style";
import { createBookshelfConfig } from "./types";
import type {
	Book,
	BookLinkSource,
	BookSort,
	Bookshelf,
	BookshelfConfig,
	CoverSource,
	DateFormat,
	RenderOptions,
	SectionFilter,
} from "./types";

function pad(n: number): string {
	return n.toString().padStart(2, "0");
}

function timeValue(iso?: string): number {
	if (!iso) return 0;
	const time = new Date(iso).getTime();
	return Number.isNaN(time) ? 0 : time;
}

/** Full read date from an ISO date, or "" if missing/invalid. */
export function formatDate(iso?: string, format: DateFormat = "yyyy-mm-dd"): string {
	if (!iso) return "";
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return "";
	const day = d.getUTCDate();
	const year = d.getUTCFullYear();
	const month = d.getUTCMonth() + 1;
	if (format === "dd.mm.yyyy") return `${pad(day)}.${pad(month)}.${year}`;
	if (format === "mm/dd/yyyy") return `${pad(month)}/${pad(day)}/${year}`;
	return `${year}-${pad(month)}-${pad(day)}`;
}

export interface RenderBook {
	title: string;
	author: string;
	/** Full read-date label, e.g. "Jun 18, 2026". */
	date: string;
	coverUrl?: string;
	fallbackCoverUrl?: string;
	linkUrl?: string;
	review: string;
	rating: string;
	gradient: string;
	bandTint: string;
	spineWidth: number;
	spineHeight: number;
	bandTop: number;
	bandHeight: number;
	fullTitle: string;
}

export function openLibraryCoverUrl(book: Book): string | undefined {
	if (book.openLibraryCoverId)
		return `https://covers.openlibrary.org/b/id/${book.openLibraryCoverId}-M.jpg?default=false`;
	const isbn = book.isbn?.replace(/[^0-9Xx]/g, "");
	if (!isbn) return undefined;
	return `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg?default=false`;
}

function normalizedIsbn(book: Book): string {
	return book.isbn?.replace(/[^0-9Xx]/g, "") ?? "";
}

function openLibraryBookUrl(book: Book): string {
	const isbn = normalizedIsbn(book);
	if (isbn) return `https://openlibrary.org/isbn/${isbn}`;
	const query = new URLSearchParams({ q: book.title });
	return `https://openlibrary.org/search?${query.toString()}`;
}

function providerBookUrl(book: Book, sourceId: string): string | undefined {
	if (sourceId === "goodreads" && book.id) return `https://www.goodreads.com/book/show/${book.id}`;
	return undefined;
}

function bookLinkUrl(book: Book, source: BookLinkSource, sourceId: string): string | undefined {
	if (source === "none") return undefined;
	if (source === "openlibrary") return openLibraryBookUrl(book);
	return providerBookUrl(book, sourceId);
}

function coverUrls(
	book: Book,
	source: CoverSource,
): { coverUrl?: string; fallbackCoverUrl?: string } {
	const openLibrary = openLibraryCoverUrl(book);
	const primary =
		source === "openlibrary" ? (openLibrary ?? book.coverUrl) : (book.coverUrl ?? openLibrary);
	const fallback = primary === openLibrary ? book.coverUrl : openLibrary;
	return { coverUrl: primary, fallbackCoverUrl: fallback };
}

export function toRenderBook(
	book: Book,
	coverSource: CoverSource = "openlibrary",
	dateFormat: DateFormat = "yyyy-mm-dd",
	linkSource: BookLinkSource = "none",
	sourceId = "",
): RenderBook {
	const spec = spineSpec(book);
	const { band } = bookColors(book);
	const date = formatDate(book.readAt, dateFormat);
	const covers = coverUrls(book, coverSource);
	return {
		title: book.title,
		author: book.author,
		date,
		coverUrl: covers.coverUrl,
		fallbackCoverUrl: covers.fallbackCoverUrl,
		linkUrl: bookLinkUrl(book, linkSource, sourceId),
		review: book.review?.trim() ?? "",
		rating: stars(book.rating),
		gradient: bookGradient(book),
		bandTint: band,
		spineWidth: spec.width,
		spineHeight: spec.height,
		bandTop: spec.bandTop,
		bandHeight: spec.bandHeight,
		fullTitle: `${book.title} — ${book.author}`,
	};
}

export interface RenderedGroups {
	showHeadings: boolean;
	groups: { label: string; books: RenderBook[]; options: RenderOptions }[];
}

function matchesFilter(book: Book, filter?: SectionFilter): boolean {
	if (!filter) return true;
	if (filter.shelf && book.shelf !== filter.shelf) return false;
	if (filter.hasReview && !book.review?.trim()) return false;
	if (filter.hasRating && book.rating == null) return false;
	return true;
}

function compareFallback(a: Book, b: Book): number {
	const readDiff = timeValue(b.readAt) - timeValue(a.readAt);
	if (readDiff !== 0) return readDiff;
	const addedDiff = timeValue(b.addedAt) - timeValue(a.addedAt);
	if (addedDiff !== 0) return addedDiff;
	return a.title.localeCompare(b.title);
}

function sortBooks(books: Book[], sortBy: BookSort): Book[] {
	return [...books].sort((a, b) => {
		if (sortBy === "rating" || sortBy === "ratingAsc") {
			const ratingDiff =
				sortBy === "rating" ? (b.rating ?? 0) - (a.rating ?? 0) : (a.rating ?? 0) - (b.rating ?? 0);
			if (ratingDiff !== 0) return ratingDiff;
		}
		if (sortBy === "readAtAsc") {
			const readDiff = timeValue(a.readAt) - timeValue(b.readAt);
			if (readDiff !== 0) return readDiff;
		}
		if (sortBy === "addedAt" || sortBy === "addedAtAsc") {
			const addedDiff =
				sortBy === "addedAt"
					? timeValue(b.addedAt) - timeValue(a.addedAt)
					: timeValue(a.addedAt) - timeValue(b.addedAt);
			if (addedDiff !== 0) return addedDiff;
		}
		return compareFallback(a, b);
	});
}

/** Group books into the ordered, enabled shelves to render. */
export function computeGroups(
	shelf: Bookshelf,
	config: BookshelfConfig = createBookshelfConfig(shelf),
): RenderedGroups {
	const enabled = config.sections.filter((s) => s.enabled);
	const groups = enabled.map((section) => ({
		label: section.label,
		books: sortBooks(shelf.books, section.sortBy)
			.filter((book) => matchesFilter(book, section.filter))
			.map((book) =>
				toRenderBook(
					book,
					config.coverSource,
					config.dateFormat,
					config.bookLinkSource,
					shelf.sourceId,
				),
			),
		options: section,
	}));
	return { showHeadings: groups.length > 1, groups };
}
