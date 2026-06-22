/** A source-agnostic book record. Importers normalize every platform down to this. */
export interface Book {
	id: string;
	title: string;
	author: string;
	coverUrl?: string;
	openLibraryCoverId?: number | string;
	isbn?: string;
	review?: string;
	rating?: number;
	averageRating?: number;
	year?: number;
	/** ISO date the book was read/finished, if known. */
	readAt?: string;
	/** ISO date the book was added to the source shelf/library, if known. */
	addedAt?: string;
	shelf?: Shelf;
}

export type Shelf = "read" | "currently-reading" | "to-read" | string;

/** A shelf to render. */
export interface ShelfConfig {
	id: string;
	label: string;
	enabled: boolean;
}

/** The JSON interchange format: what an importer emits, an API serves, the lib renders. */
export interface Bookshelf {
	owner: string;
	sourceId: string;
	books: Book[];
	/** Ordered shelves to display. Books are grouped + ordered by this. */
	shelves?: ShelfConfig[];
}

export type RenderMode = "covers" | "spines" | "list";
export type CoverSource = "openlibrary" | "metadata";
export type BookLinkSource = "none" | "provider" | "openlibrary";
export type BookshelfTheme = "auto" | "light" | "dark";
export type SpineStyle = "flat" | "3d";
export type SpineBehavior = "hover" | "open";
export type BookSort = "readAt" | "readAtAsc" | "addedAt" | "addedAtAsc" | "rating" | "ratingAsc";
export type ReviewDisplay = "none" | "inline" | "accordion";
export type DateFormat = "yyyy-mm-dd" | "dd.mm.yyyy" | "mm/dd/yyyy";

export interface BookshelfDataSource {
	type: "static" | "goodreads" | "hardcover" | string;
	url?: string;
}

export const RENDER_MODES: ReadonlyArray<{ id: RenderMode; label: string }> = [
	{ id: "covers", label: "Covers" },
	{ id: "spines", label: "Spines" },
	{ id: "list", label: "List" },
];

export interface RenderOptions {
	mode: RenderMode;
	sortBy: BookSort;
	spineStyle: SpineStyle;
	spineBehavior: SpineBehavior;
	roundedCorners: boolean;
	showRatings: boolean;
	showReadDate: boolean;
	reviewDisplay: ReviewDisplay;
}

export interface SectionFilter {
	shelf?: Shelf;
	hasReview?: boolean;
	hasRating?: boolean;
}

export interface SectionRenderConfig extends RenderOptions {
	id: string;
	label: string;
	enabled: boolean;
	filter?: SectionFilter;
}

export const DEFAULT_RENDER_OPTIONS: RenderOptions = {
	mode: "covers",
	sortBy: "readAt",
	spineStyle: "flat",
	spineBehavior: "hover",
	roundedCorners: false,
	showRatings: true,
	showReadDate: true,
	reviewDisplay: "none",
};

export interface BookshelfConfig {
	dataSource: BookshelfDataSource;
	coverSource: CoverSource;
	bookLinkSource: BookLinkSource;
	theme: BookshelfTheme;
	dateFormat: DateFormat;
	sections: SectionRenderConfig[];
}

export function createBookshelfConfig(
	shelf: Bookshelf,
	options: Partial<RenderOptions> = {},
): BookshelfConfig {
	const sourceShelves = shelf.shelves ?? [];
	const renderOptions = { ...DEFAULT_RENDER_OPTIONS, ...options };
	return {
		dataSource: { type: "static" },
		coverSource: "openlibrary",
		bookLinkSource: "none",
		theme: "auto",
		dateFormat: "yyyy-mm-dd",
		sections:
			sourceShelves.length > 0
				? sourceShelves.map((s) => ({ ...renderOptions, ...s, filter: { shelf: s.id } }))
				: [{ ...renderOptions, id: "all", label: "All books", enabled: true }],
	};
}

export interface BookSource {
	readonly id: string;
	readonly label: string;
	sourceUrl(url: string): string | undefined;
	importShelf(url: string): Promise<Bookshelf>;
}
