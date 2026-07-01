import { DEFAULT_RENDER_OPTIONS, DEFAULT_SHELVES } from "../config";
import type {
	Book,
	BookLinkSource,
	BookSort,
	BookshelfConfig,
	BookshelfData,
	CoverSource,
	DateFormat,
	RenderOptions,
	SectionFilter,
	SectionRenderConfig,
} from "../types";
import { openLibraryCoverUrl } from "./covers";
import { bookColors, bookGradient, spineSpec, stars } from "./style";

export type ResolvedBookshelfConfig = BookshelfConfig & {
	coverSource: CoverSource;
	bookLinkSource: BookLinkSource;
	dateFormat: DateFormat;
	theme: NonNullable<BookshelfConfig["theme"]>;
	stylesheet: NonNullable<BookshelfConfig["stylesheet"]>;
	showAttribution: boolean;
	sections: SectionRenderConfig[];
};

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
	reviewUrl?: string;
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
	if (sourceId === "goodreadsrss" && book.id)
		return `https://www.goodreads.com/book/show/${book.id}`;
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
	if (source === "none") return {};
	return { coverUrl: source === "openlibrary" ? openLibraryCoverUrl(book) : book.coverUrl };
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
		reviewUrl: book.reviewUrl,
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
	groups: { label: string; books: RenderBook[]; options: SectionRenderConfig & RenderOptions }[];
}

function matchesFilter(book: Book, filter?: SectionFilter): boolean {
	if (!filter) return true;
	if (filter.shelf && book.shelf !== filter.shelf) return false;
	if (filter.hasReview && !book.review?.trim()) return false;
	if (filter.hasRating && (!book.rating || book.rating <= 0)) return false;
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

export function resolveRenderConfig(
	shelf: BookshelfData,
	config: BookshelfConfig,
): ResolvedBookshelfConfig {
	const sourceShelves = shelf.shelves?.length ? shelf.shelves : DEFAULT_SHELVES;
	return {
		...config,
		coverSource: config.coverSource ?? "openlibrary",
		bookLinkSource: config.bookLinkSource ?? "none",
		theme: config.theme ?? "auto",
		dateFormat: config.dateFormat ?? "yyyy-mm-dd",
		stylesheet: config.stylesheet ?? "cdn",
		showAttribution: config.showAttribution ?? true,
		sections:
			config.sections ??
			sourceShelves.map((s) => ({
				...DEFAULT_RENDER_OPTIONS,
				label: s.label,
				filter: { shelf: s.id },
			})),
	};
}

export function computeGroups(shelf: BookshelfData, config: BookshelfConfig): RenderedGroups {
	const resolvedConfig = resolveRenderConfig(shelf, config);
	const groups = resolvedConfig.sections
		.map((section) => {
			const options = { ...DEFAULT_RENDER_OPTIONS, ...section };
			return {
				label: section.label,
				books: sortBooks(shelf.books, options.sortBy)
					.filter((book) => matchesFilter(book, section.filter))
					.map((book) =>
						toRenderBook(
							book,
							resolvedConfig.coverSource,
							resolvedConfig.dateFormat,
							resolvedConfig.bookLinkSource,
							shelf.sourceId,
						),
					),
				options,
			};
		})
		.filter((group) => group.books.length > 0);
	return { showHeadings: groups.length > 1, groups };
}
