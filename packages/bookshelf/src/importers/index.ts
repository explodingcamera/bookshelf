import type { BookSource } from "../types";
import { goodreadsSource } from "./goodreads";

/** Registry of sources. Add one: build a BookSource object + push it here. */
export const SOURCES: readonly BookSource[] = [goodreadsSource];

export function resolveSource(input: string): { source: BookSource; url: string } {
	for (const source of SOURCES) {
		const url = source.sourceUrl(input);
		if (url) return { source, url };
	}
	throw new Error(`No book source registered can handle the URL: ${input}`);
}

export * from "./goodreads";
