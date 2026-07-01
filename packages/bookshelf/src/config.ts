import type { BookshelfConfig, RenderMode, RenderOptions, ShelfConfig } from "./types";

export const DEFAULT_SHELVES: readonly ShelfConfig[] = [
	{ id: "reading", label: "Reading" },
	{ id: "read", label: "Read" },
	{ id: "to-read", label: "To read" },
	{ id: "favorites", label: "Favorites" },
];

export const RENDER_MODES: ReadonlyArray<{ id: RenderMode; label: string }> = [
	{ id: "covers", label: "Covers" },
	{ id: "spines", label: "Spines" },
	{ id: "3d", label: "3D books" },
	{ id: "list", label: "List" },
];

export const DEFAULT_RENDER_OPTIONS: RenderOptions = {
	mode: "covers",
	sortBy: "readAt",
	spineBehavior: "hover",
	roundedCorners: false,
	showRatings: true,
	showAuthor: true,
	showReadDate: true,
	reviewDisplay: "none",
	scale: 1,
};

function bytesFromBase64Url(value: string): Uint8Array {
	return Uint8Array.fromBase64(value, { alphabet: "base64url", lastChunkHandling: "loose" });
}

async function gzip(bytes: Uint8Array): Promise<Uint8Array> {
	if (!("CompressionStream" in globalThis)) return bytes;
	const buffer = bytes.buffer.slice(
		bytes.byteOffset,
		bytes.byteOffset + bytes.byteLength,
	) as ArrayBuffer;
	const stream = new Blob([buffer]).stream().pipeThrough(new CompressionStream("gzip"));
	return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function gunzip(bytes: Uint8Array): Promise<Uint8Array> {
	if (!("DecompressionStream" in globalThis)) throw new Error("gzip config is not supported here");
	const buffer = bytes.buffer.slice(
		bytes.byteOffset,
		bytes.byteOffset + bytes.byteLength,
	) as ArrayBuffer;
	const stream = new Blob([buffer]).stream().pipeThrough(new DecompressionStream("gzip"));
	return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Encode a bookshelf config for use in hosted API URLs. */
export async function encodeBookshelfConfig(config: BookshelfConfig): Promise<string> {
	const json = new TextEncoder().encode(JSON.stringify(config));
	const compressed = await gzip(json);
	const encoding = compressed === json ? "json" : "gzip";
	return `${encoding}.${compressed.toBase64({ alphabet: "base64url", omitPadding: true })}`;
}

/** Decode a bookshelf config from a hosted API URL parameter. */
export async function decodeBookshelfConfig(value: string): Promise<BookshelfConfig> {
	const [encoding, payload] = value.split(".", 2);
	if (!payload) throw new Error("Invalid config parameter");
	const bytes = bytesFromBase64Url(payload);
	if (encoding !== "json" && encoding !== "gzip")
		throw new Error(`Unsupported config encoding: ${encoding}`);
	const json = new TextDecoder().decode(encoding === "gzip" ? await gunzip(bytes) : bytes);
	return JSON.parse(json) as BookshelfConfig;
}
