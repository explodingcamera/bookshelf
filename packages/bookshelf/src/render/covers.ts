import type { Book } from "../types";

export function openLibraryCoverUrl(book: Book): string | undefined {
	if (book.openLibraryCoverId) {
		const id = String(book.openLibraryCoverId);
		if (id.startsWith("isbn:")) {
			return `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(id.slice(5))}-M.jpg?default=false`;
		}
		return `https://covers.openlibrary.org/b/id/${encodeURIComponent(id)}-M.jpg?default=false`;
	}
	const isbn = book.isbn?.replace(/[^0-9Xx]/g, "");
	if (!isbn) return undefined;
	return `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg?default=false`;
}
