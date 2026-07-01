import styles from "./ExportPanel.module.css";

import { Tabs } from "@base-ui/react/tabs";
import type { BookshelfConfig, BookshelfData } from "@dawdle.space/bookshelf";
import { Bookshelf, renderDocument } from "@dawdle.space/bookshelf";
import bookshelfCss from "@dawdle.space/bookshelf/styles/default.css?raw";
import { useEffect, useState } from "react";

function CodeBlock({ value }: { value: string }) {
	const [copied, setCopied] = useState(false);
	return (
		<div className={styles.codeWrap}>
			<textarea className={styles.code} value={value} readOnly spellCheck={false} />
			<button
				type="button"
				className={styles.copy}
				onClick={() => {
					void navigator.clipboard
						.writeText(value)
						.then(() => {
							setCopied(true);
							setTimeout(() => setCopied(false), 1500);
						})
						.catch(() => undefined);
				}}
			>
				{copied ? "Copied" : "Copy"}
			</button>
		</div>
	);
}

export function ExportPanel({
	shelf,
	config,
	loading,
	apiBaseUrl,
}: {
	shelf: BookshelfData | null;
	config: BookshelfConfig | null;
	loading: boolean;
	apiBaseUrl?: string;
}) {
	const [embedUrl, setEmbedUrl] = useState("");
	const [inlineCss, setInlineCss] = useState(true);

	useEffect(() => {
		let cancelled = false;
		if (!config) {
			setEmbedUrl("");
			return;
		}
		const bookshelf = new Bookshelf({ ...config, baseUrl: apiBaseUrl });
		void bookshelf.embedUrl().then((value) => {
			if (!cancelled) setEmbedUrl(value);
		});
		return () => {
			cancelled = true;
		};
	}, [apiBaseUrl, config]);

	if (!shelf || !config)
		return (
			<p className={styles.empty}>
				{loading ? "Loading books…" : "Load a bookshelf to see export options."}
			</p>
		);

	const configJson = JSON.stringify(config, null, 2);
	const staticDocument = renderDocument(
		shelf,
		{ ...config, stylesheet: inlineCss ? "inline" : "cdn" },
		inlineCss ? { css: bookshelfCss } : {},
	);
	const snippets = {
		api: `<!-- Keeps the book list up to date via bookshelf.dawdle.space when dataSource points at a live source. -->
<iframe src="${embedUrl || "GENERATING_EMBED_URL"}" width="100%" height="480" style="border:0" loading="lazy" title="${shelf.owner}'s bookshelf"></iframe>`,
		static: staticDocument,
		config: configJson,
		library: `import { Bookshelf, memoryCache } from "@dawdle.space/bookshelf";
import { goodreadsRssSource } from "@dawdle.space/bookshelf/importer/goodreads-rss";
import "@dawdle.space/bookshelf/styles/default.css";

const config = ${configJson};

const bookshelf = new Bookshelf({
	...config,
	cache: memoryCache(),
	sources: [goodreadsRssSource],
});

const data = await bookshelf.load();
const html = bookshelf.render(data);`,
		cli: `bookshelf bookshelf.config.json --doc --out bookshelf.html
bookshelf bookshelf.config.json --template page.html --out public/bookshelf.html
bookshelf bookshelf.config.json --export-cover public/covers --out public/bookshelf.html`,
		apiUrl: `import { Bookshelf } from "@dawdle.space/bookshelf";

const config = ${configJson};
const src = await new Bookshelf(config).embedUrl();`,
	};

	return (
		<Tabs.Root defaultValue="api" className={styles.root}>
			<Tabs.List className={styles.list}>
				<Tabs.Tab className={styles.tab} value="api">
					iframe
				</Tabs.Tab>
				<Tabs.Tab className={styles.tab} value="static">
					Static HTML
				</Tabs.Tab>
				<Tabs.Tab className={styles.tab} value="library">
					NPM Library
				</Tabs.Tab>
				<Tabs.Indicator className={styles.indicator} />
			</Tabs.List>
			<div className={styles.panels}>
				<Tabs.Panel className={styles.panel} value="api">
					<p className={styles.hint}>
						Use the bookshelf.dawdle.space API when you want a live embed. Source and renderer
						settings are stored in the compressed config parameter. Optional URL params:
						<code>theme=auto|light|dark</code> and <code>stylesheet=https://...</code>.
					</p>
					<CodeBlock value={snippets.api} />
				</Tabs.Panel>
				<Tabs.Panel className={styles.panel} value="static">
					<label className={styles.option}>
						<input
							type="checkbox"
							checked={inlineCss}
							onChange={(event) => setInlineCss(event.currentTarget.checked)}
						/>
						inline CSS
					</label>
					<p className={styles.hint}>
						Static markup for when you do not need automatic updates. This contains the books loaded
						right now. Turn off inline CSS to link the hosted stylesheet instead.
					</p>
					<CodeBlock value={snippets.static} />
				</Tabs.Panel>
				<Tabs.Panel className={styles.panel} value="library">
					<p className={styles.hint}>
						Use the <a href="https://www.npmjs.com/package/@dawdle.space/bookshelf">npm package</a>
						for local importing/rendering, the included CLI, or generated bookshelf API URLs.
					</p>
					<Tabs.Root defaultValue="render" className={styles.innerRoot}>
						<Tabs.List className={styles.innerList}>
							<Tabs.Tab className={styles.innerTab} value="render">
								render
							</Tabs.Tab>
							<Tabs.Tab className={styles.innerTab} value="config">
								json
							</Tabs.Tab>
							<Tabs.Tab className={styles.innerTab} value="cli">
								cli
							</Tabs.Tab>
							<Tabs.Tab className={styles.innerTab} value="api">
								api url
							</Tabs.Tab>
						</Tabs.List>
						<Tabs.Panel className={styles.panel} value="render">
							<CodeBlock value={snippets.library} />
						</Tabs.Panel>
						<Tabs.Panel className={styles.panel} value="config">
							<CodeBlock value={snippets.config} />
						</Tabs.Panel>
						<Tabs.Panel className={styles.panel} value="cli">
							<CodeBlock value={snippets.cli} />
						</Tabs.Panel>
						<Tabs.Panel className={styles.panel} value="api">
							<CodeBlock value={snippets.apiUrl} />
						</Tabs.Panel>
					</Tabs.Root>
				</Tabs.Panel>
			</div>
		</Tabs.Root>
	);
}
