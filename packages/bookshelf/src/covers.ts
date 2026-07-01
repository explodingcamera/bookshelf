import { mkdir, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";

import { openLibraryCoverUrl } from "./render/covers";
import type { Book, BookshelfData, CoverSource } from "./types";

export interface ExportCoversOptions {
	outDir: string;
	coverSource?: CoverSource;
	fetch?: typeof fetch;
	signal?: AbortSignal;
}

export interface ExportedCover {
	bookId: string;
	title: string;
	path: string;
	url: string;
}

function coverUrl(book: Book, source: CoverSource): string | undefined {
	if (source === "none") return undefined;
	return source === "openlibrary" ? openLibraryCoverUrl(book) : book.coverUrl;
}

function safeFilePart(value: string): string {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "_")
		.replace(/^_+|_+$/g, "")
		.slice(0, 80);
}

function filenameBase(book: Book, sourceId: string): string {
	const isbn = book.isbn?.replace(/[^0-9Xx]/g, "");
	if (isbn) return `isbn_${isbn}`;
	return safeFilePart(`${sourceId}_${book.id || book.title}`) || "cover";
}

function extensionFor(url: string, contentType: string | null): string {
	const ext = extname(new URL(url).pathname).toLowerCase();
	if (ext === ".jpg" || ext === ".jpeg" || ext === ".png" || ext === ".webp") return ext;
	if (contentType?.includes("png")) return ".png";
	if (contentType?.includes("webp")) return ".webp";
	return ".jpg";
}

/** Download cover images for the books in a shelf. */
export async function exportCover(
	shelf: BookshelfData,
	options: ExportCoversOptions,
): Promise<ExportedCover[]> {
	const fetchImpl = options.fetch ?? globalThis.fetch;
	if (!fetchImpl) throw new Error("No fetch implementation available to export covers.");
	const coverSource = options.coverSource ?? "openlibrary";
	await mkdir(options.outDir, { recursive: true });

	const exported: ExportedCover[] = [];
	const filenames = new Map<string, number>();
	for (const book of shelf.books) {
		const url = coverUrl(book, coverSource);
		if (!url) continue;
		const response = await fetchImpl(url, { signal: options.signal });
		if (!response.ok) continue;

		const base = filenameBase(book, shelf.sourceId);
		const next = filenames.get(base) ?? 0;
		filenames.set(base, next + 1);
		const suffix = next > 0 ? `_${next + 1}` : "";
		const file = `${base}${suffix}${extensionFor(url, response.headers.get("content-type"))}`;
		const path = join(options.outDir, file);
		await writeFile(path, new Uint8Array(await response.arrayBuffer()));
		exported.push({ bookId: book.id, title: book.title, path, url });
	}
	return exported;
}
