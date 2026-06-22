import { Tabs } from "@base-ui/react/tabs";
import type { Bookshelf, BookshelfConfig } from "@explodingcamera/bookshelf";
import { renderShelf } from "@explodingcamera/bookshelf";
import { useEffect, useState } from "react";
import styles from "./ExportPanel.module.css";

const CDN_CSS = "https://bookshelf.dawdle.space/styles/default.css";

function base64Url(bytes: Uint8Array): string {
	let binary = "";
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function compactConfig(value: string): Promise<string> {
	const bytes = new TextEncoder().encode(value);
	if (!("CompressionStream" in globalThis)) return Promise.resolve(`json.${base64Url(bytes)}`);

	return Promise.resolve()
		.then(() => {
			const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream("gzip"));
			return new Response(stream).arrayBuffer();
		})
		.then((buffer) => {
			const compressed = new Uint8Array(buffer);
			return `gzip.${base64Url(compressed)}`;
		})
		.catch(() => `json.${base64Url(bytes)}`);
}

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
}: {
	shelf: Bookshelf | null;
	config: BookshelfConfig | null;
}) {
	const configJson = config ? JSON.stringify(config) : "";
	const [encodedConfig, setEncodedConfig] = useState("");

	useEffect(() => {
		let cancelled = false;
		if (!configJson) {
			setEncodedConfig("");
			return;
		}
		void compactConfig(configJson).then((value) => {
			if (!cancelled) setEncodedConfig(value);
		});
		return () => {
			cancelled = true;
		};
	}, [configJson]);

	if (!shelf || !config)
		return <p className={styles.empty}>Generate a bookshelf to see export options.</p>;

	const markup = renderShelf(shelf, config);
	const apiConfig = encodedConfig || "GENERATING_COMPACT_CONFIG";
	const snippets = {
		api: `<!-- Keeps the book list up to date via bookshelf.dawdle.space when dataSource points at a live source. -->
<iframe src="https://bookshelf.dawdle.space/embed?config=${apiConfig}" width="100%" height="480" style="border:0" loading="lazy" title="${shelf.owner}'s bookshelf"></iframe>`,
		static: `<!-- theme CSS: link via CDN, self-host, or inline -->\n<link rel="stylesheet" href="${CDN_CSS}">\n${markup}`,
		library: JSON.stringify(config, null, 2),
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
						settings are stored in the compressed config parameter.
					</p>
					<CodeBlock value={snippets.api} />
				</Tabs.Panel>
				<Tabs.Panel className={styles.panel} value="static">
					<p className={styles.hint}>
						Static markup for when you do not need automatic updates. This contains the books loaded
						right now.
					</p>
					<CodeBlock value={snippets.static} />
				</Tabs.Panel>
				<Tabs.Panel className={styles.panel} value="library">
					<p className={styles.hint}>
						Renderer config for the @explodingcamera/bookshelf npm package. Use it alongside your
						bookshelf data in a static site generator, build script, or server render step.
					</p>
					<CodeBlock value={snippets.library} />
				</Tabs.Panel>
			</div>
		</Tabs.Root>
	);
}
