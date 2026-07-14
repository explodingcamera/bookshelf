import type {
	BookLinkSource,
	BookshelfConfig,
	BookshelfData,
	BookshelfDataSource,
	CoverSource,
	DateFormat,
	SectionRenderConfig,
} from "@dawdle.space/bookshelf";
import { DEFAULT_RENDER_OPTIONS, DEFAULT_SHELVES } from "@dawdle.space/bookshelf";

export const DEFAULT_SOURCE_URL = "https://www.goodreads.com/review/list_rss/129153443?shelf=read";
export const SETTINGS_KEY = "bookshelf:settings";
export const THEME_KEY = "bookshelf:theme";

export type Status = { text: string; kind: "info" | "error" | "loading" } | null;
export type UiTheme = "light" | "dark";
export type MainTab = "preview" | "settings" | "export";

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
						mode: "list",
						filter: { shelf: "read", hasRating: true },
					} satisfies SectionRenderConfig,
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

export function readInitialTheme(): UiTheme {
	try {
		const saved = localStorage.getItem(THEME_KEY);
		if (saved === "light" || saved === "dark") return saved;
	} catch {
		/* ignore */
	}
	return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export async function readSavedSettings(): Promise<BookshelfConfig | undefined> {
	const raw = localStorage.getItem(SETTINGS_KEY);
	if (!raw) return undefined;
	const { parseBookshelfConfig } = await import("@dawdle.space/bookshelf/validate");
	return parseBookshelfConfig(JSON.parse(raw));
}
