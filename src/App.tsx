import styles from "./App.module.css";

import type { BookshelfConfig, BookshelfData } from "@dawdle.space/bookshelf";
import { Bookshelf, DEFAULT_SHELVES, resolveSource } from "@dawdle.space/bookshelf";
import { goodreadsRssSource } from "@dawdle.space/bookshelf/importer/goodreads-rss";
import { useCallback, useEffect, useState } from "react";

import { SiteFooter } from "./components/SiteFooter";
import { SiteHeader } from "./components/SiteHeader";
import { Toast } from "./components/Toast";
import { GeneratorTabs } from "./components/tabs/GeneratorTabs";
import { UrlInput } from "./components/UrlInput";
import {
	createGeneratorConfig,
	DEFAULT_SOURCE_URL,
	type MainTab,
	readInitialTheme,
	readSavedSettings,
	SETTINGS_KEY,
	type Status,
	THEME_KEY,
	type UiTheme,
} from "./generator/settings";

const API_BASE_URL =
	import.meta.env.VITE_BOOKSHELF_API_URL ||
	(import.meta.env.DEV ? window.location.origin : "https://bookshelf.dawdle.space");
const SOURCES = [goodreadsRssSource];

export function App() {
	const [sourceInput, setSourceInput] = useState(DEFAULT_SOURCE_URL);
	const [status, setStatus] = useState<Status>(null);
	const [loading, setLoading] = useState(false);
	const [shelf, setShelf] = useState<BookshelfData | null>(null);
	const [shelfSourceKey, setShelfSourceKey] = useState<string | null>(null);
	const [config, setConfig] = useState<BookshelfConfig | null>(null);
	const [activeTab, setActiveTab] = useState<MainTab>("settings");
	const [theme, setTheme] = useState<UiTheme>(readInitialTheme);

	const updateConfig = useCallback((updater: (config: BookshelfConfig) => BookshelfConfig) => {
		setConfig((cur) => (cur ? updater(cur) : cur));
	}, []);

	const loadJson = useCallback(async (target: string): Promise<boolean> => {
		const trimmed = target.trim();
		if (!trimmed.startsWith("{")) return false;

		const { parseBookshelfInput } = await import("@dawdle.space/bookshelf/validate");
		const input = parseBookshelfInput(JSON.parse(trimmed));

		if ("bookshelf" in input) {
			const nextShelf = input.bookshelf;
			setShelf(nextShelf);
			setShelfSourceKey("static");
			setConfig(input.config ?? createGeneratorConfig(nextShelf));
			setStatus({
				text: `Loaded ${nextShelf.books.length} book${nextShelf.books.length === 1 ? "" : "s"} from JSON.`,
				kind: "info",
			});
			return true;
		}

		if ("dataSource" in input) {
			setShelf(null);
			setShelfSourceKey(null);
			setConfig(input);
			setStatus({ text: "Loaded bookshelf config.", kind: "info" });
			return true;
		}

		setShelf(input);
		setShelfSourceKey("static");
		setConfig(createGeneratorConfig(input));
		setStatus({
			text: `Loaded ${input.books.length} book${input.books.length === 1 ? "" : "s"} from JSON.`,
			kind: "info",
		});
		return true;
	}, []);

	const loadSource = useCallback(
		(target: string, options: { silentInvalid?: boolean } = {}) => {
			void Promise.resolve()
				.then(async () => {
					if (!target.trim()) return null;
					if (await loadJson(target)) return null;

					const { source, url } = resolveSource(target, SOURCES);
					const emptyShelf: BookshelfData = {
						owner: "Bookshelf",
						sourceId: source.id,
						books: [],
						shelves: [...DEFAULT_SHELVES],
					};
					const saved = await readSavedSettings();
					const nextConfig = saved
						? { ...saved, dataSource: { type: source.id, url } }
						: createGeneratorConfig(emptyShelf, { type: source.id, url });
					setShelf(null);
					setShelfSourceKey(null);
					setConfig(nextConfig);
					setStatus({ text: `Configured ${source.label}.`, kind: "info" });
					return null;
				})
				.catch((error: unknown) => {
					if (options.silentInvalid) return;
					setStatus({
						text: target.trim().startsWith("{")
							? error instanceof Error
								? error.message
								: "Could not parse JSON."
							: "Paste a supported source URL or bookshelf JSON.",
						kind: "error",
					});
				});
		},
		[loadJson],
	);

	useEffect(() => {
		const timeout = window.setTimeout(() => loadSource(sourceInput, { silentInvalid: true }), 600);
		return () => window.clearTimeout(timeout);
	}, [loadSource, sourceInput]);

	useEffect(() => {
		if (!status) return;
		if (status.kind === "loading") return;
		const timeout = window.setTimeout(() => setStatus(null), status.kind === "error" ? 7000 : 4000);
		return () => window.clearTimeout(timeout);
	}, [status]);

	useEffect(() => {
		if (!config || config.dataSource.type === "static") return;
		const sourceKey = JSON.stringify({
			dataSource: config.dataSource,
			shelves: config.sections?.map((section) => section.filter?.shelf).filter(Boolean),
		});
		if (shelf && shelfSourceKey === sourceKey) return;
		const controller = new AbortController();
		const loadingTimeout = window.setTimeout(() => {
			if (controller.signal.aborted) return;
			setLoading(true);
			setStatus({ text: "Loading books...", kind: "loading" });
		}, 180);
		const bookshelf = new Bookshelf({
			...config,
			baseUrl: API_BASE_URL,
			signal: controller.signal,
		});
		void bookshelf
			.fetch()
			.then((data) => {
				setShelf(data);
				setShelfSourceKey(sourceKey);
				const n = data.books.length;
				setStatus({ text: `Loaded ${n} book${n === 1 ? "" : "s"}.`, kind: "info" });
			})
			.catch((error: unknown) => {
				if (controller.signal.aborted) return;
				setShelf(null);
				setShelfSourceKey(null);
				setStatus({
					text: error instanceof Error ? error.message : "Could not load books.",
					kind: "error",
				});
			})
			.finally(() => {
				window.clearTimeout(loadingTimeout);
				if (!controller.signal.aborted) setLoading(false);
			});
		return () => {
			window.clearTimeout(loadingTimeout);
			controller.abort();
		};
	}, [config, shelf, shelfSourceKey]);

	useEffect(() => {
		if (!config) return;
		try {
			localStorage.setItem(SETTINGS_KEY, JSON.stringify(config));
		} catch {
			/* storage may be disabled */
		}
	}, [config]);

	useEffect(() => {
		document.documentElement.style.colorScheme = theme;
		try {
			localStorage.setItem(THEME_KEY, theme);
		} catch {
			/* storage may be disabled */
		}
	}, [theme]);

	return (
		<div className={styles.app}>
			<SiteHeader
				theme={theme}
				onToggleTheme={() => setTheme((cur) => (cur === "dark" ? "light" : "dark"))}
			/>
			<main className={styles.main}>
				<UrlInput
					value={sourceInput}
					onValueChange={setSourceInput}
					onLoad={loadSource}
					loading={loading}
				/>
				<GeneratorTabs
					activeTab={activeTab}
					apiBaseUrl={API_BASE_URL}
					config={config}
					loading={loading}
					shelf={shelf}
					theme={theme}
					onTabChange={setActiveTab}
					onConfigChange={updateConfig}
				/>
			</main>
			<SiteFooter />
			<Toast status={status} />
		</div>
	);
}
