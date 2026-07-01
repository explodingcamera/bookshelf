import type { BookSource, BookshelfData, BookshelfDataSource, ImportOptions } from "../types";

export interface ImportBookshelfOptions extends ImportOptions {
	sources: readonly BookSource[];
}

/** Resolve a URL or data source type to a registered book source. */
export function resolveSource(
	input: string,
	sources: readonly BookSource[],
	sourceId?: string,
): { source: BookSource; url: string } {
	if (sourceId) {
		const source = sources.find((candidate) => candidate.id === sourceId);
		if (!source) throw new Error(`No book source registered for type: ${sourceId}`);
		const url = source.sourceUrl(input) ?? input;
		return { source, url };
	}
	for (const source of sources) {
		const url = source.sourceUrl(input);
		if (url) return { source, url };
	}
	throw new Error(`No book source registered can handle the URL: ${input}`);
}

/** Import bookshelf data using one of the provided sources. */
export async function importBookshelf(
	input: string | BookshelfDataSource,
	options: ImportBookshelfOptions,
): Promise<BookshelfData> {
	if (typeof input === "string") {
		const { source, url } = resolveSource(input, options.sources);
		return source.importShelf(url, options);
	}
	if (input.type === "static")
		throw new Error("Static bookshelf data must be loaded before import.");
	if (!input.url) throw new Error(`Missing url for data source: ${input.type}`);
	const { source, url } = resolveSource(input.url, options.sources, input.type);
	return source.importShelf(url, options);
}
