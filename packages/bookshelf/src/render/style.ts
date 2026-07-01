import type { Book } from "../types";

function hashSeed(value: string): number {
	let hash = 0;
	for (let i = 0; i < value.length; i++) hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
	return hash;
}

/** Deterministic int in [min, max] from a seed — drives all "organic" variation. */
export function hashInt(seed: string, min: number, max: number): number {
	return min + (hashSeed(seed) % (max - min + 1));
}

const PALETTES: ReadonlyArray<[string, string, string]> = [
	["#aa8be2", "#54387f", "#dfcff8"],
	["#e58b6e", "#7f3f31", "#f3c6b6"],
	["#78c78b", "#3d7b4d", "#c4edcd"],
	["#e4ae40", "#86611e", "#f4d994"],
	["#78a7df", "#3d6594", "#c5ddf6"],
	["#df7894", "#7f4057", "#f2bfcd"],
	["#9b7fdd", "#543b82", "#d9c9f5"],
	["#70c7c1", "#3b7b77", "#c0eeeb"],
	["#df80b1", "#7f4668", "#f2c3da"],
	["#9fbd62", "#607b32", "#dceca9"],
];

export function bookColors(book: Book): { from: string; to: string; band: string } {
	const idx = hashSeed(book.id || `${book.title}:${book.author}`) % PALETTES.length;
	const palette = PALETTES[idx] as [string, string, string];
	return { from: palette[0], to: palette[1], band: palette[2] };
}

export function bookGradient(book: Book): string {
	const { from, to } = bookColors(book);
	return `linear-gradient(165deg, ${from}, ${to})`;
}

export interface SpineSpec {
	width: number;
	height: number;
	bandTop: number;
	bandHeight: number;
}

export function spineSpec(book: Book): SpineSpec {
	const seed = book.id || `${book.title}:${book.author}`;
	return {
		width: hashInt(`${seed}:w`, 34, 50),
		height: hashInt(`${seed}:h`, 150, 196),
		bandTop: hashInt(`${seed}:bt`, 18, 46),
		bandHeight: hashInt(`${seed}:bh`, 26, 44),
	};
}

/** Star characters for a rating, e.g. "★★★★½". */
export function stars(rating?: number): string {
	if (rating == null || Number.isNaN(rating)) return "";
	const clamped = Math.max(0, Math.min(5, rating));
	return "★".repeat(Math.floor(clamped)) + (clamped - Math.floor(clamped) >= 0.5 ? "½" : "");
}
