import type {
	BookLinkSource,
	BookSort,
	BookshelfConfig,
	BookshelfData,
	BookshelfDataSource,
	BookshelfStylesheet,
	BookshelfTheme,
	CoverSource,
	DateFormat,
	RenderMode,
	ReviewDisplay,
	SectionRenderConfig,
	SpineBehavior,
} from "@dawdle.space/bookshelf";
import { DEFAULT_RENDER_OPTIONS, DEFAULT_SHELVES } from "@dawdle.space/bookshelf";

export const DEFAULT_SOURCE_URL = "https://www.goodreads.com/review/list_rss/129153443?shelf=read";
export const SETTINGS_KEY = "bookshelf:settings";
export const THEME_KEY = "bookshelf:theme";

export type Status = { text: string; kind: "info" | "error" } | null;
export type UiTheme = "light" | "dark";
export type MainTab = "preview" | "settings" | "export";

type CompleteSection = SectionRenderConfig & typeof DEFAULT_RENDER_OPTIONS;

export function createGeneratorConfig(
	shelf: BookshelfData,
	dataSource: BookshelfDataSource = { type: "static" },
): BookshelfConfig {
	const sourceShelves = shelf.shelves?.length ? shelf.shelves : DEFAULT_SHELVES;
	const hasShelf = (id: string) => sourceShelves.some((sourceShelf) => sourceShelf.id === id);
	const defaultSections = sourceShelves.map((sourceShelf) => ({
		...DEFAULT_RENDER_OPTIONS,
		label: sourceShelf.label,
		filter: { shelf: sourceShelf.id },
	}));
	const sections: SectionRenderConfig[] = [
		...(hasShelf("favorites")
			? [
					{
						...DEFAULT_RENDER_OPTIONS,
						label: "Favorites",
						scale: 1.2,
						filter: { shelf: "favorites" },
					},
				]
			: []),
		...(hasShelf("reading")
			? [
					{
						...DEFAULT_RENDER_OPTIONS,
						label: "Currently Reading",
						filter: { shelf: "reading" },
					},
				]
			: []),
		...(hasShelf("read")
			? [
					{
						...DEFAULT_RENDER_OPTIONS,
						label: "Read",
						mode: "list" as const,
						filter: { shelf: "read", hasRating: true },
					},
				]
			: []),
	];
	return {
		dataSource,
		coverSource: "metadata",
		bookLinkSource: "provider",
		theme: "auto",
		dateFormat: "yyyy-mm-dd",
		stylesheet: "cdn",
		showAttribution: true,
		sections: sections.length ? sections : defaultSections,
	};
}

export const COVER_OPTIONS: { id: CoverSource; label: string }[] = [
	{ id: "openlibrary", label: "OpenLibrary covers" },
	{ id: "metadata", label: "Source covers" },
	{ id: "none", label: "No covers" },
];

export const LINK_OPTIONS: { id: BookLinkSource; label: string }[] = [
	{ id: "none", label: "No links" },
	{ id: "provider", label: "Current provider" },
	{ id: "openlibrary", label: "OpenLibrary" },
];

export const DATE_FORMATS: { id: DateFormat; label: string }[] = [
	{ id: "yyyy-mm-dd", label: "2026-06-18" },
	{ id: "dd.mm.yyyy", label: "18.06.2026" },
	{ id: "mm/dd/yyyy", label: "06/18/2026" },
];

const RENDER_MODES: RenderMode[] = ["covers", "spines", "3d", "list"];
const SORT_OPTIONS: { id: BookSort; label: string }[] = [
	{ id: "readAt", label: "Date read" },
	{ id: "readAtAsc", label: "Date read (reversed)" },
	{ id: "addedAt", label: "Date added" },
	{ id: "addedAtAsc", label: "Date added (reversed)" },
	{ id: "rating", label: "My rating" },
	{ id: "ratingAsc", label: "My rating (reversed)" },
];
const REVIEW_DISPLAYS: ReviewDisplay[] = ["none", "inline", "accordion"];
const STYLESHEETS: BookshelfStylesheet[] = ["cdn", "inline", "none"];

export function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

export function readInitialTheme(): UiTheme {
	try {
		const saved = localStorage.getItem(THEME_KEY);
		if (saved === "light" || saved === "dark") return saved;
	} catch {
		/* ignore */
	}
	return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function readSavedSettings(): unknown {
	try {
		const raw = localStorage.getItem(SETTINGS_KEY);
		return raw ? JSON.parse(raw) : null;
	} catch {
		return null;
	}
}

function validCoverSource(value: unknown, fallback: CoverSource): CoverSource {
	return COVER_OPTIONS.some((option) => option.id === value) ? (value as CoverSource) : fallback;
}

function validBookLinkSource(value: unknown, fallback: BookLinkSource): BookLinkSource {
	return LINK_OPTIONS.some((option) => option.id === value) ? (value as BookLinkSource) : fallback;
}

function validBookshelfTheme(value: unknown, fallback: BookshelfTheme): BookshelfTheme {
	return value === "auto" || value === "light" || value === "dark" ? value : fallback;
}

function validDateFormat(value: unknown, fallback: DateFormat): DateFormat {
	return DATE_FORMATS.some((option) => option.id === value) ? (value as DateFormat) : fallback;
}

function validStylesheet(value: unknown, fallback: BookshelfStylesheet): BookshelfStylesheet {
	return STYLESHEETS.includes(value as BookshelfStylesheet)
		? (value as BookshelfStylesheet)
		: fallback;
}

function validRenderMode(value: unknown, fallback: RenderMode): RenderMode {
	return RENDER_MODES.includes(value as RenderMode) ? (value as RenderMode) : fallback;
}

function validBookSort(value: unknown, fallback: BookSort): BookSort {
	return SORT_OPTIONS.some((option) => option.id === value) ? (value as BookSort) : fallback;
}

function validReviewDisplay(value: unknown, fallback: ReviewDisplay): ReviewDisplay {
	return REVIEW_DISPLAYS.includes(value as ReviewDisplay) ? (value as ReviewDisplay) : fallback;
}

function validSpineBehavior(value: unknown, fallback: SpineBehavior): SpineBehavior {
	return value === "hover" || value === "open" ? value : fallback;
}

function bool(value: unknown, fallback: boolean): boolean {
	return typeof value === "boolean" ? value : fallback;
}

function numberInRange(value: unknown, fallback: number, min: number, max: number): number {
	return typeof value === "number" && Number.isFinite(value)
		? Math.min(max, Math.max(min, value))
		: fallback;
}

function normalizeDataSource(value: unknown, fallback: BookshelfDataSource): BookshelfDataSource {
	if (!isRecord(value) || typeof value.type !== "string") return fallback;
	return {
		type: value.type,
		url: typeof value.url === "string" ? value.url : undefined,
	};
}

function normalizeSection(value: unknown, fallback: CompleteSection): SectionRenderConfig {
	if (!isRecord(value)) return fallback;
	const rawFilter = isRecord(value.filter) ? value.filter : undefined;
	const filter = rawFilter
		? {
				shelf: typeof rawFilter.shelf === "string" ? rawFilter.shelf : fallback.filter?.shelf,
				hasReview: bool(rawFilter.hasReview, false),
				hasRating: bool(rawFilter.hasRating, false),
			}
		: fallback.filter;
	return {
		...fallback,
		label: typeof value.label === "string" ? value.label : fallback.label,
		mode: validRenderMode(value.mode, fallback.mode),
		sortBy: validBookSort(value.sortBy, fallback.sortBy),
		spineBehavior: validSpineBehavior(value.spineBehavior, fallback.spineBehavior),
		roundedCorners: bool(value.roundedCorners, fallback.roundedCorners),
		showRatings: bool(value.showRatings, fallback.showRatings),
		showAuthor: bool(value.showAuthor, fallback.showAuthor),
		showReadDate: bool(value.showReadDate, fallback.showReadDate),
		reviewDisplay: validReviewDisplay(value.reviewDisplay, fallback.reviewDisplay),
		scale: numberInRange(value.scale, fallback.scale, 0.65, 1.6),
		filter,
	};
}

export function normalizeSettings(
	base: BookshelfConfig,
	saved: unknown,
	preserveDataSource = false,
): BookshelfConfig {
	if (!isRecord(saved)) return base;
	const rawSections = Array.isArray(saved.sections) ? saved.sections : null;
	const baseSections = base.sections ?? [];
	const sections = rawSections
		? rawSections.map((section, index) => {
				const baseSection = baseSections[index] ?? {
					label: "",
				};
				return normalizeSection(section, { ...DEFAULT_RENDER_OPTIONS, ...baseSection });
			})
		: baseSections;
	return {
		...base,
		dataSource: preserveDataSource
			? normalizeDataSource(saved.dataSource, base.dataSource)
			: base.dataSource,
		coverSource: validCoverSource(saved.coverSource, base.coverSource ?? "metadata"),
		bookLinkSource: validBookLinkSource(saved.bookLinkSource, base.bookLinkSource ?? "provider"),
		theme: validBookshelfTheme(saved.theme, base.theme ?? "auto"),
		dateFormat: validDateFormat(saved.dateFormat, base.dateFormat ?? "yyyy-mm-dd"),
		stylesheet: validStylesheet(saved.stylesheet, base.stylesheet ?? "cdn"),
		showAttribution: bool(saved.showAttribution, base.showAttribution ?? true),
		sections,
	};
}
