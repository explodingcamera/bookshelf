import { DEFAULT_SHELVES, encodeBookshelfConfig } from "./config";
import { importBookshelf } from "./importer";
import type { DocumentOptions, RendererOptions } from "./render";
import { renderDocument as renderBookshelfDocument, renderShelf } from "./render";
import type { BookSource, BookshelfConfig, BookshelfData, Shelf } from "./types";

export interface BookshelfApiOptions {
	baseUrl?: string | URL;
	fetch?: typeof fetch;
	signal?: AbortSignal;
}

export interface BookshelfCache<T = BookshelfData> {
	get(key: string): T | undefined | Promise<T | undefined>;
	set(key: string, value: T): unknown | Promise<unknown>;
}

const MEMORY_CACHE_KEY = Symbol.for("@dawdle.space/bookshelf/memory-cache");

type BookshelfCacheGlobal = typeof globalThis & {
	[MEMORY_CACHE_KEY]?: Map<string, unknown>;
};

/** Return a process-local cache backed by `globalThis`. */
export function memoryCache<T = BookshelfData>(): BookshelfCache<T> {
	const root = globalThis as BookshelfCacheGlobal;
	root[MEMORY_CACHE_KEY] ??= new Map<string, unknown>();
	const store = root[MEMORY_CACHE_KEY];
	return {
		get: (key) => store.get(key) as T | undefined,
		set: (key, value) => store.set(key, value),
	};
}

export interface BookshelfRuntimeConfig extends BookshelfApiOptions {
	cache?: BookshelfCache;
	sources?: readonly BookSource[];
}

export type BookshelfOptions = BookshelfRuntimeConfig;

const DEFAULT_API_BASE_URL = "https://bookshelf.dawdle.space";
const DEFAULT_SHELF_IDS = new Set(DEFAULT_SHELVES.map((shelf) => shelf.id));

function shelvesForConfig(config: BookshelfConfig): readonly Shelf[] {
	const sections =
		config.sections ??
		DEFAULT_SHELVES.map((shelf) => ({
			id: shelf.id,
			label: shelf.label,
			filter: { shelf: shelf.id },
		}));
	const ids = new Set<string>();
	const shelves: Shelf[] = [];
	for (const section of sections) {
		const id = section.filter?.shelf;
		if (!id || ids.has(id)) continue;
		ids.add(id);
		shelves.push(DEFAULT_SHELF_IDS.has(id) ? (id as Shelf) : { custom: id });
	}
	return shelves;
}

async function bookshelfApiUrl(
	path: "bookshelf" | "embed",
	config: BookshelfConfig,
	baseUrl: string | URL = DEFAULT_API_BASE_URL,
): Promise<string> {
	const url = new URL(path, baseUrl);
	url.searchParams.set("config", await encodeBookshelfConfig(config));
	return url.toString();
}

async function fetchBookshelfFromApi(
	config: BookshelfConfig,
	options: BookshelfApiOptions = {},
): Promise<BookshelfData> {
	const fetchImpl = options.fetch ?? globalThis.fetch;
	if (!fetchImpl) throw new Error("No fetch implementation available for bookshelf API.");
	const response = await fetchImpl(await bookshelfApiUrl("bookshelf", config, options.baseUrl), {
		signal: options.signal,
		headers: { accept: "application/json" },
	});
	if (!response.ok)
		throw new Error(`Bookshelf API request failed: ${response.status} ${response.statusText}`);
	return response.json() as Promise<BookshelfData>;
}

export class Bookshelf {
	readonly config: BookshelfConfig;
	#runtime: BookshelfRuntimeConfig;

	/** Create a bookshelf instance from config plus optional runtime-only settings. */
	constructor(init: BookshelfConfig & BookshelfRuntimeConfig) {
		const { baseUrl, fetch, signal, cache, sources, ...config } = init;
		this.config = config;
		this.#runtime = { baseUrl, fetch, signal, cache, sources };
	}

	/** Return the encoded config key used for API URLs and cache entries. */
	async key(): Promise<string> {
		return encodeBookshelfConfig(this.config);
	}

	/** Import bookshelf data locally, using the configured cache when present. */
	async load(): Promise<BookshelfData> {
		const key = `local:${await this.key()}`;
		const cached = await this.#runtime.cache?.get(key);
		if (cached) return cached;
		const shelf = await this.import();
		await this.#runtime.cache?.set(key, shelf);
		return shelf;
	}

	/** Import bookshelf data locally through the configured source importer. */
	async import(): Promise<BookshelfData> {
		if (this.config.dataSource.type === "static")
			throw new Error("Static dataSource cannot be imported.");
		if (!this.#runtime.sources?.length)
			throw new Error("At least one bookshelf importer source is required.");
		return importBookshelf(this.config.dataSource, {
			fetch: this.#runtime.fetch,
			signal: this.#runtime.signal,
			shelves: shelvesForConfig(this.config),
			sources: this.#runtime.sources,
		});
	}

	/** Fetch normalized bookshelf data from the hosted bookshelf API. */
	fetch(): Promise<BookshelfData> {
		return fetchBookshelfFromApi(this.config, this.#runtime);
	}

	/** Return a hosted iframe/document embed URL for this config. */
	embedUrl(): Promise<string> {
		return bookshelfApiUrl("embed", this.config, this.#runtime.baseUrl);
	}

	/** Return the hosted JSON API URL for this config. */
	bookshelfUrl(): Promise<string> {
		return bookshelfApiUrl("bookshelf", this.config, this.#runtime.baseUrl);
	}

	/** Render bookshelf data to a `.bs-embed` HTML fragment. */
	render(data: BookshelfData, options?: RendererOptions): string {
		return renderShelf(data, this.config, options);
	}

	/** Render bookshelf data to a standalone HTML document. */
	renderDocument(
		data: BookshelfData,
		documentOptions?: DocumentOptions,
		rendererOptions?: RendererOptions,
	): string {
		return renderBookshelfDocument(data, this.config, documentOptions, rendererOptions);
	}
}
