import styles from "./ExportPanel.module.css";

import { Tabs } from "@base-ui/react/tabs";
import type { BookshelfConfig, BookshelfData } from "@dawdle.space/bookshelf";
import { Bookshelf, renderShelf } from "@dawdle.space/bookshelf";
import bookshelfCss from "@dawdle.space/bookshelf/styles/default.css?raw";
import type { ReactNode } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

const EXAMPLE_BASE = "https://github.com/explodingcamera/bookshelf/tree/main/examples";

function CodeBlock({
	title,
	description,
	value,
}: {
	title: string;
	description?: ReactNode;
	value: string;
}) {
	const [copied, setCopied] = useState(false);
	const codeRef = useRef<HTMLTextAreaElement>(null);

	useLayoutEffect(() => {
		const code = codeRef.current;
		if (!code) return;
		code.style.height = "auto";
		code.style.height = `${code.scrollHeight}px`;
	});

	return (
		<section className={styles.snippet}>
			<div className={styles.snippetHeader}>
				<div>
					<h4 className={styles.snippetTitle}>{title}</h4>
					{description ? <p className={styles.snippetText}>{description}</p> : null}
				</div>
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
			<textarea
				ref={codeRef}
				className={styles.code}
				value={value}
				readOnly
				rows={1}
				spellCheck={false}
			/>
		</section>
	);
}

function DocList({ children }: { children: ReactNode }) {
	return <ul className={styles.docList}>{children}</ul>;
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
	const [inlineCss, setInlineCss] = useState(false);
	const [localSnippet, setLocalSnippet] = useState("server");

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
				{loading ? "Loading books..." : "Load a bookshelf to see export options."}
			</p>
		);

	const configJson = JSON.stringify(config, null, 2);
	const snippets = {
		iframe: `<iframe src="${embedUrl || "GENERATING_EMBED_URL"}" style="width:100%;min-height:480px;border:0" loading="lazy" title="${shelf.owner}'s bookshelf"></iframe>`,
		static: `${inlineCss ? `<style>${bookshelfCss}</style>\n` : ""}${renderShelf(shelf, config)}`,
		stylesheet: `<link rel="stylesheet" href="https://bookshelf.dawdle.space/styles/default.css" />`,
		server: `import { Bookshelf } from "@dawdle.space/bookshelf";
import { goodreadsRssSource } from "@dawdle.space/bookshelf/importer/goodreads-rss";
import "@dawdle.space/bookshelf/styles/default.css";

const config = ${configJson};

const bookshelf = new Bookshelf({ ...config, sources: [goodreadsRssSource] });
const data = await bookshelf.load();
const html = bookshelf.render(data);`,
		client: `<link rel="stylesheet" href="https://bookshelf.dawdle.space/styles/default.css" />
<div id="bookshelf">Loading...</div>

<script type="module">
  import { Bookshelf } from "https://esm.sh/@dawdle.space/bookshelf";

  const config = ${configJson};
  const bookshelf = new Bookshelf(config);
  const data = await bookshelf.fetch();
  document.querySelector("#bookshelf").innerHTML = bookshelf.render(data);
</script>`,
		config: configJson,
	};
	const localSnippets = [
		{
			id: "server",
			label: "Server/build JS",
			title: "Server-side or build-time JS",
			description:
				"Use the npm package when your site can run JavaScript during a framework build, SSG step, or server request. Pass importers explicitly when loading data locally.",
			value: snippets.server,
		},
		{
			id: "client",
			label: "Client JS",
			title: "Client-side JS",
			description:
				"Use this when the browser should fetch fresh bookshelf data and render it into the current page. This keeps the page dynamic, but adds client-side work.",
			value: snippets.client,
		},
		{
			id: "config",
			label: "Config",
			title: "Config JSON",
			description:
				"Save this as bookshelf.config.json for the CLI, or move it into your app code for framework usage.",
			value: snippets.config,
		},
	];
	const selectedLocalSnippet =
		localSnippets.find((snippet) => snippet.id === localSnippet) ?? localSnippets[0];

	return (
		<Tabs.Root defaultValue="iframe" className={styles.root}>
			<Tabs.List className={styles.list}>
				<Tabs.Tab className={styles.tab} value="iframe">
					Live iframe
				</Tabs.Tab>
				<Tabs.Tab className={styles.tab} value="static">
					Static snippet
				</Tabs.Tab>
				<Tabs.Tab className={styles.tab} value="local">
					Local render
				</Tabs.Tab>
				<Tabs.Indicator className={styles.indicator} />
			</Tabs.List>

			<div className={styles.panels}>
				<Tabs.Panel className={styles.panel} value="iframe">
					<div className={styles.docs}>
						<h3 className={styles.heading}>Live iframe embed</h3>
						<p className={styles.lede}>
							Use this when you want the simplest copy-paste embed. The iframe points at the hosted
							bookshelf service, which imports your source and renders a complete document for the
							frame.
						</p>
						<DocList>
							<li>
								Best for plain websites, docs pages, and places where you cannot run build code.
							</li>
							<li>
								The encoded URL contains your renderer settings, changing settings creates a new
								URL.
							</li>
							<li>
								You can still override <code>theme=auto|light|dark</code> or pass a custom{" "}
								<code>stylesheet=https://...</code> query parameter.
							</li>
							<li>
								You can also set CSS <code>color-scheme</code> on the iframe or its container so
								browser-managed colors match your page.
							</li>
						</DocList>
					</div>
					<CodeBlock title="Iframe markup" value={snippets.iframe} />
				</Tabs.Panel>

				<Tabs.Panel className={styles.panel} value="static">
					<div className={styles.docs}>
						<h3 className={styles.heading}>Static HTML snippet</h3>
						<p className={styles.lede}>
							Use this when you want to paste generated bookshelf markup into an existing page. It
							is the lightest runtime option: no iframe, no hosted API request, and no client-side
							rendering.
						</p>
						<DocList>
							<li>
								Good for static site generators, CMS fields, or any page where you can paste HTML.
							</li>
							<li>
								Use inline CSS for a self-contained paste, or load the default stylesheet once.
							</li>
							<li>Regenerate this export when you want the book list to update.</li>
						</DocList>
						<label className={styles.option}>
							<input
								type="checkbox"
								checked={inlineCss}
								onChange={(event) => setInlineCss(event.currentTarget.checked)}
							/>
							inline CSS
						</label>
					</div>
					{inlineCss ? null : (
						<CodeBlock
							title="Stylesheet link"
							description="Add this to your page head unless your site already bundles the bookshelf CSS."
							value={snippets.stylesheet}
						/>
					)}
					<CodeBlock title="Bookshelf markup" value={snippets.static} />
				</Tabs.Panel>

				<Tabs.Panel className={styles.panel} value="local">
					<div className={styles.docs}>
						<h3 className={styles.heading}>Server-side, build-time, or client-side rendering</h3>
						<p className={styles.lede}>
							Use these options when you want bookshelf to fit into an existing site workflow
							instead of copying a hosted iframe. Server/build-time JS gives you static HTML from
							your framework or SSG; client JS fetches and renders in the browser.
						</p>
						<DocList>
							<li>
								For framework examples, see the <a href={`${EXAMPLE_BASE}/nextjs`}>Next.js</a> and{" "}
								<a href={`${EXAMPLE_BASE}/astro`}>Astro</a> examples.
							</li>
							<li>
								For non-JS sites and generators like Hugo, see the{" "}
								<a href={`${EXAMPLE_BASE}/cli`}>CLI example</a>.
							</li>
							<li>
								For browser-only dynamic rendering, use the{" "}
								<a href={`${EXAMPLE_BASE}/spa`}>SPA example</a>.
							</li>
						</DocList>
					</div>

					<div className={styles.snippetTabs}>
						<div className={styles.snippetTabList} role="tablist" aria-label="Local render snippet">
							{localSnippets.map((snippet) => (
								<button
									key={snippet.id}
									type="button"
									role="tab"
									className={styles.snippetTab}
									aria-selected={snippet.id === selectedLocalSnippet.id}
									data-active={snippet.id === selectedLocalSnippet.id ? true : undefined}
									onClick={() => setLocalSnippet(snippet.id)}
								>
									{snippet.label}
								</button>
							))}
						</div>
						<CodeBlock
							title={selectedLocalSnippet.title}
							description={selectedLocalSnippet.description}
							value={selectedLocalSnippet.value}
						/>
					</div>
				</Tabs.Panel>
			</div>
		</Tabs.Root>
	);
}
