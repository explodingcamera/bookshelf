import { Tabs } from "@base-ui/react/tabs";
import type {
	Bookshelf,
	BookshelfConfig,
	BookshelfDataSource,
	BookshelfTheme,
	BookLinkSource,
	BookSort,
	CoverSource,
	DateFormat,
	RenderMode,
	ReviewDisplay,
	SectionRenderConfig,
	SpineBehavior,
	SpineStyle,
} from "@explodingcamera/bookshelf";
import {
	createBookshelfConfig,
	DEFAULT_RENDER_OPTIONS,
	resolveSource,
} from "@explodingcamera/bookshelf";
import { useCallback, useEffect, useState } from "react";
import styles from "./App.module.css";
import { BookshelfPreview } from "./components/Bookshelf";
import { ExportPanel } from "./components/ExportPanel";
import { Shelves } from "./components/Shelves";
import { UrlInput } from "./components/UrlInput";

const DEFAULT_URL = "https://www.goodreads.com/review/list_rss/129153443?shelf=read";
const SETTINGS_KEY = "bookshelf:settings";
const THEME_KEY = "bookshelf:theme";

type Status = { text: string; kind: "info" | "error" } | null;
type Theme = "light" | "dark";

const COVER_OPTIONS: { id: CoverSource; label: string }[] = [
	{ id: "openlibrary", label: "OpenLibrary covers" },
	{ id: "metadata", label: "Source covers" },
];

const LINK_OPTIONS: { id: BookLinkSource; label: string }[] = [
	{ id: "none", label: "No links" },
	{ id: "provider", label: "Current provider" },
	{ id: "openlibrary", label: "OpenLibrary" },
];

const DATE_FORMATS: { id: DateFormat; label: string }[] = [
	{ id: "yyyy-mm-dd", label: "2026-06-18" },
	{ id: "dd.mm.yyyy", label: "18.06.2026" },
	{ id: "mm/dd/yyyy", label: "06/18/2026" },
];

const RENDER_MODES: RenderMode[] = ["covers", "spines", "list"];
const SORT_OPTIONS: { id: BookSort; label: string }[] = [
	{ id: "readAt", label: "Date read" },
	{ id: "readAtAsc", label: "Date read (reversed)" },
	{ id: "addedAt", label: "Date added" },
	{ id: "addedAtAsc", label: "Date added (reversed)" },
	{ id: "rating", label: "My rating" },
	{ id: "ratingAsc", label: "My rating (reversed)" },
];
const REVIEW_DISPLAYS: ReviewDisplay[] = ["none", "inline", "accordion"];

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function initialTheme(): Theme {
	try {
		const saved = localStorage.getItem(THEME_KEY);
		if (saved === "light" || saved === "dark") return saved;
	} catch {
		/* ignore */
	}
	return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function savedSettings(): unknown {
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

function validRenderMode(value: unknown, fallback: RenderMode): RenderMode {
	return RENDER_MODES.includes(value as RenderMode) ? (value as RenderMode) : fallback;
}

function validBookSort(value: unknown, fallback: BookSort): BookSort {
	return SORT_OPTIONS.some((option) => option.id === value) ? (value as BookSort) : fallback;
}

function validReviewDisplay(value: unknown, fallback: ReviewDisplay): ReviewDisplay {
	return REVIEW_DISPLAYS.includes(value as ReviewDisplay) ? (value as ReviewDisplay) : fallback;
}

function validSpineStyle(value: unknown, fallback: SpineStyle): SpineStyle {
	return value === "flat" || value === "3d" ? value : fallback;
}

function validSpineBehavior(value: unknown, fallback: SpineBehavior): SpineBehavior {
	return value === "hover" || value === "open" ? value : fallback;
}

function bool(value: unknown, fallback: boolean): boolean {
	return typeof value === "boolean" ? value : fallback;
}

function normalizeDataSource(value: unknown, fallback: BookshelfDataSource): BookshelfDataSource {
	if (!isRecord(value) || typeof value.type !== "string") return fallback;
	return {
		type: value.type,
		url: typeof value.url === "string" ? value.url : undefined,
	};
}

function normalizeSection(value: unknown, fallback: SectionRenderConfig): SectionRenderConfig {
	if (!isRecord(value)) return fallback;
	const rawFilter = isRecord(value.filter) ? value.filter : undefined;
	const filter = rawFilter
		? {
				shelf: typeof rawFilter.shelf === "string" ? rawFilter.shelf : undefined,
				hasReview: bool(rawFilter.hasReview, false),
				hasRating: bool(rawFilter.hasRating, false),
			}
		: undefined;
	return {
		...fallback,
		id: typeof value.id === "string" ? value.id : fallback.id,
		label: typeof value.label === "string" ? value.label : fallback.label,
		enabled: bool(value.enabled, fallback.enabled),
		mode: validRenderMode(value.mode, fallback.mode),
		sortBy: validBookSort(value.sortBy, fallback.sortBy),
		spineStyle: validSpineStyle(value.spineStyle, fallback.spineStyle),
		spineBehavior: validSpineBehavior(value.spineBehavior, fallback.spineBehavior),
		roundedCorners: bool(value.roundedCorners, fallback.roundedCorners),
		showRatings: bool(value.showRatings, fallback.showRatings),
		showReadDate: bool(value.showReadDate, fallback.showReadDate),
		reviewDisplay: validReviewDisplay(value.reviewDisplay, fallback.reviewDisplay),
		filter,
	};
}

function normalizeSettings(
	base: BookshelfConfig,
	saved: unknown,
	preserveDataSource = false,
): BookshelfConfig {
	if (!isRecord(saved)) return base;
	const rawSections = Array.isArray(saved.sections) ? saved.sections : null;
	const sections = rawSections
		? rawSections.map((section, index) =>
				normalizeSection(section, {
					...(base.sections[index] ?? {
						...DEFAULT_RENDER_OPTIONS,
						id: `section-${index + 1}`,
						label: "",
						enabled: true,
					}),
				}),
			)
		: base.sections;
	return {
		...base,
		dataSource: preserveDataSource
			? normalizeDataSource(saved.dataSource, base.dataSource)
			: base.dataSource,
		coverSource: validCoverSource(saved.coverSource, base.coverSource),
		bookLinkSource: validBookLinkSource(saved.bookLinkSource, base.bookLinkSource),
		theme: validBookshelfTheme(saved.theme, base.theme),
		dateFormat: validDateFormat(saved.dateFormat, base.dateFormat),
		sections,
	};
}

export function App() {
	const [sourceInput, setSourceInput] = useState(DEFAULT_URL);
	const [status, setStatus] = useState<Status>(null);
	const [loading, setLoading] = useState(false);
	const [shelf, setShelf] = useState<Bookshelf | null>(null);
	const [config, setConfig] = useState<BookshelfConfig | null>(null);
	const [theme, setTheme] = useState<Theme>(initialTheme);

	const loadJson = useCallback((target: string): boolean => {
		const trimmed = target.trim();
		if (!trimmed.startsWith("{")) return false;

		const data = JSON.parse(trimmed) as unknown;
		const record = isRecord(data) ? data : null;
		const maybeBookshelf = record?.bookshelf ?? data;

		if (isRecord(maybeBookshelf) && Array.isArray(maybeBookshelf.books)) {
			const nextShelf = maybeBookshelf as unknown as Bookshelf;
			const exportConfig = isRecord(record?.config) ? record.config : null;
			setShelf(nextShelf);
			setConfig(
				exportConfig
					? normalizeSettings(createBookshelfConfig(nextShelf), exportConfig, true)
					: createBookshelfConfig(nextShelf),
			);
			setStatus({
				text: `Loaded ${nextShelf.books.length} book${nextShelf.books.length === 1 ? "" : "s"} from JSON.`,
				kind: "info",
			});
			return true;
		}

		setStatus({ text: "JSON must be a bookshelf export or bookshelf JSON.", kind: "error" });
		return true;
	}, []);

	const generate = useCallback(
		(target: string) => {
			void Promise.resolve()
				.then(() => {
					if (loadJson(target)) return null;

					const { source, url } = resolveSource(target);
					setLoading(true);
					setStatus({ text: "Generating…", kind: "info" });

					return source
						.importShelf(url)
						.then((data) => {
							const baseConfig: BookshelfConfig = {
								...createBookshelfConfig(data),
								dataSource: { type: source.id, url },
							};
							setShelf(data);
							setConfig(normalizeSettings(baseConfig, savedSettings()));
							const n = data.books.length;
							setStatus({
								text: `Loaded ${n} book${n === 1 ? "" : "s"} from ${source.label}.`,
								kind: "info",
							});
						})
						.catch((e: unknown) => {
							setShelf(null);
							setConfig(null);
							setStatus({
								text: e instanceof Error ? e.message : "Something went wrong.",
								kind: "error",
							});
						})
						.finally(() => setLoading(false));
				})
				.catch((e: unknown) => {
					setStatus({
						text: target.trim().startsWith("{")
							? e instanceof Error
								? e.message
								: "Could not parse JSON."
							: "Paste a supported source URL or bookshelf JSON.",
						kind: "error",
					});
				});
		},
		[loadJson],
	);

	useEffect(() => {
		if (!status) return;
		const timeout = window.setTimeout(() => setStatus(null), status.kind === "error" ? 7000 : 4000);
		return () => window.clearTimeout(timeout);
	}, [status]);

	useEffect(() => {
		void generate(DEFAULT_URL);
	}, [generate]);

	useEffect(() => {
		if (!config) return;
		try {
			localStorage.setItem(SETTINGS_KEY, JSON.stringify(config));
		} catch {
			/* storage may be disabled */
		}
	}, [config]);

	useEffect(() => {
		document.documentElement.dataset.theme = theme;
		try {
			localStorage.setItem(THEME_KEY, theme);
		} catch {
			/* storage may be disabled */
		}
	}, [theme]);

	return (
		<>
			<header className={styles.header}>
				<div className={styles.wrap}>
					<div className={styles.headerTop}>
						<h1 className={styles.title}>
							bookshelf<span>.dawdle.space</span>
						</h1>
						<button
							type="button"
							className={`${styles.themeToggle} ${theme === "dark" ? styles.themeToggleDark : ""}`}
							onClick={() => setTheme((cur) => (cur === "dark" ? "light" : "dark"))}
							aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
							title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								aria-hidden="true"
								width="1em"
								height="1em"
								className={styles.themeIcon}
								fill="currentColor"
								viewBox="0 0 32 32"
							>
								<clipPath id="theme-toggle-cutout">
									<path d="M0-5h55v37h-55zm32 12a1 1 0 0025 0 1 1 0 00-25 0" />
								</clipPath>
								<g clipPath="url(#theme-toggle-cutout)">
									<circle cx="16" cy="16" r="15" />
								</g>
							</svg>
						</button>
					</div>
					<p className={styles.subtitle}>
						Turn your reading history into a small, portable shelf for your site.
					</p>
				</div>
			</header>

			<main className={styles.main}>
				<section className={styles.card}>
					<h2 className={styles.sectionTitle}>Source</h2>
					<UrlInput
						value={sourceInput}
						onValueChange={setSourceInput}
						onGenerate={generate}
						loading={loading}
					/>
				</section>

				<section className={styles.card}>
					<Tabs.Root defaultValue="preview" className={styles.tabs}>
						<Tabs.List className={styles.tabList}>
							<Tabs.Tab className={styles.tab} value="preview">
								Preview
							</Tabs.Tab>
							<Tabs.Tab className={styles.tab} value="settings">
								Settings
							</Tabs.Tab>
							<Tabs.Tab className={styles.tab} value="export">
								Export
							</Tabs.Tab>
							<Tabs.Indicator className={styles.indicator} />
						</Tabs.List>
						<Tabs.Panel className={styles.panel} value="settings">
							{config ? (
								<>
									<div className={styles.settingBar}>
										<label>
											<span>Covers</span>
											<select
												className={styles.select}
												value={config.coverSource}
												onChange={(e) => {
													const coverSource = e.currentTarget.value as CoverSource;
													setConfig((cur) => (cur ? { ...cur, coverSource } : cur));
												}}
											>
												{COVER_OPTIONS.map((c) => (
													<option key={c.id} value={c.id}>
														{c.label}
													</option>
												))}
											</select>
										</label>
										<label>
											<span>Links</span>
											<select
												className={styles.select}
												value={config.bookLinkSource}
												onChange={(e) => {
													const bookLinkSource = e.currentTarget.value as BookLinkSource;
													setConfig((cur) => (cur ? { ...cur, bookLinkSource } : cur));
												}}
											>
												{LINK_OPTIONS.map((option) => (
													<option key={option.id} value={option.id}>
														{option.label}
													</option>
												))}
											</select>
										</label>
										<label>
											<span>Date format</span>
											<select
												className={styles.select}
												value={config.dateFormat}
												onChange={(e) => {
													const dateFormat = e.currentTarget.value as DateFormat;
													setConfig((cur) => (cur ? { ...cur, dateFormat } : cur));
												}}
											>
												{DATE_FORMATS.map((format) => (
													<option key={format.id} value={format.id}>
														{format.label}
													</option>
												))}
											</select>
										</label>
									</div>
									<Shelves
										sections={config.sections}
										sourceShelves={shelf?.shelves ?? []}
										onChange={(sections) => setConfig((cur) => (cur ? { ...cur, sections } : cur))}
									/>
								</>
							) : (
								<p className={styles.empty}>Generate a bookshelf to edit sections.</p>
							)}
						</Tabs.Panel>
						<Tabs.Panel className={styles.panel} value="preview">
							<BookshelfPreview shelf={shelf} loading={loading} config={config} theme={theme} />
						</Tabs.Panel>
						<Tabs.Panel className={styles.panel} value="export">
							<ExportPanel shelf={shelf} config={config} />
						</Tabs.Panel>
					</Tabs.Root>
				</section>
			</main>

			<footer className={styles.footer}>
				<div className={styles.wrap}>
					<p className={styles.muted}>
						Demo — Goodreads fetching is stubbed. Generated with @explodingcamera/bookshelf.
					</p>
				</div>
			</footer>

			{status && (
				<div
					className={`${styles.toast} ${status.kind === "error" ? styles.toastError : ""}`}
					role={status.kind === "error" ? "alert" : "status"}
				>
					{status.text}
				</div>
			)}
		</>
	);
}
