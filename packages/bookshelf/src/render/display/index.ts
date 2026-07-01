import type { JSXNode } from "microjsx";

import type { RenderBook } from "../data";

export type JsxElement = JSXNode;

export interface RendererOptions {
	unsafeReviews?: boolean;
	parseReview?: (review: string, book: RenderBook) => string;
}

export { Books3D } from "./books-3d";
export { Covers } from "./covers";
export { List } from "./list";
export { SpineFace, Spines } from "./spines";
