import type { Bookshelf } from "../types";
import data from "./sample-shelf.json";

/** Typed view of the sample shelf JSON (the Bookshelf interchange format). */
export const sampleShelf = data as Bookshelf;
