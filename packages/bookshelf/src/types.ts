export interface Book {
	id: string;
	title: string;
	author: string;
	coverUrl?: string;
	openLibraryCoverId?: number | string;
	isbn?: string;
	review?: string;
	reviewUrl?: string;
	rating?: number;
	averageRating?: number;
	year?: number;
	/** ISO date the book was read/finished. */
	readAt?: string;
	/** ISO date the book was added to the source shelf/library. */
	addedAt?: string;
	shelf?: ShelfId;
}

export type DefaultShelf = "reading" | "read" | "to-read" | "favorites";
export type Shelf = DefaultShelf | { custom: string };
export type ShelfId = DefaultShelf | string;

export interface ShelfConfig {
	id: string;
	label: string;
}

/** The JSON interchange format: what an importer emits, an API serves, the lib renders. */
export interface BookshelfData {
	owner: string;
	sourceId: string;
	books: Book[];
	/** Ordered shelves to display. Books are grouped + ordered by this. */
	shelves?: ShelfConfig[];
}

export type RenderMode = "covers" | "spines" | "3d" | "list";
export type CoverSource = "openlibrary" | "metadata" | "none";
export type BookLinkSource = "none" | "provider" | "openlibrary";
export type BookshelfTheme = "auto" | "light" | "dark";
export type SpineBehavior = "hover" | "open";
export type BookSort = "readAt" | "readAtAsc" | "addedAt" | "addedAtAsc" | "rating" | "ratingAsc";
export type DateFormat = "yyyy-mm-dd" | "dd.mm.yyyy" | "mm/dd/yyyy";
export type BookshelfStylesheet = "cdn" | "inline" | "none";

export interface ImportCredentials {
	apiKey?: string;
	token?: string;
	[key: string]: string | undefined;
}

export interface ImportOptions {
	fetch?: typeof fetch;
	signal?: AbortSignal;
	shelves?: readonly Shelf[];
	credentials?: ImportCredentials;
}

export interface BookshelfDataSource {
	type: "static" | "goodreadsrss" | "hardcover" | string;
	url?: string;
}

export interface RenderOptions {
	mode: RenderMode;
	sortBy: BookSort;
	spineBehavior: SpineBehavior;
	showRatings: boolean;
	showReviews: boolean;
	showAuthor: boolean;
	showReadDate: boolean;
	scale: number;
}

export interface SectionFilter {
	shelf?: ShelfId;
	hasReview?: boolean;
	hasRating?: boolean;
}

export interface SectionRenderConfig extends Partial<RenderOptions> {
	label: string;
	filter?: SectionFilter;
}

export interface BookshelfConfig {
	dataSource: BookshelfDataSource;
	coverSource?: CoverSource;
	bookLinkSource?: BookLinkSource;
	theme?: BookshelfTheme;
	dateFormat?: DateFormat;
	stylesheet?: BookshelfStylesheet;
	showAttribution?: boolean;
	sections?: SectionRenderConfig[];
}

export interface BookSource {
	readonly id: string;
	readonly label: string;
	sourceUrl(url: string): string | undefined;
	importShelf(url: string, options?: ImportOptions): Promise<BookshelfData>;
}
