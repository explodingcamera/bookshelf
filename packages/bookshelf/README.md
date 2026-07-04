# @dawdle.space/bookshelf

Small, portable bookshelf rendering and import utilities.

`@dawdle.space/bookshelf` turns normalized book data into static HTML, full documents, or hosted API embed URLs.
It is designed for personal sites, static site generators, build scripts, and tiny server-rendered embeds. The core
package stays source-agnostic; concrete importers are loaded from subpath exports.

Generator: [bookshelf.dawdle.space](https://bookshelf.dawdle.space)  
Examples: [`examples`](../../examples)

## Install

```bash
npm install @dawdle.space/bookshelf
```

## Example

```ts
import { Bookshelf } from "@dawdle.space/bookshelf";
import { goodreadsRssSource } from "@dawdle.space/bookshelf/importer/goodreads-rss";

const bookshelf = new Bookshelf({
	dataSource: {
		type: "goodreadsrss",
		url: "https://www.goodreads.com/review/list_rss/129153443?shelf=read",
	},
	sections: [{ label: "Read", filter: { shelf: "read" }, mode: "covers" }],
	sources: [goodreadsRssSource],
});
const data = await bookshelf.load();
const html = bookshelf.renderDocument(data);
```

## Config

The `Bookshelf` class is config-bound. Pass one object containing serialized config plus runtime-only options like `sources`, `fetch`, `signal`, `cache`, or `baseUrl`.

```ts
const bookshelf = new Bookshelf({
	dataSource: {
		type: "goodreadsrss",
		url: "https://www.goodreads.com/review/list_rss/129153443?shelf=read",
	},
	sections: [{ label: "Read", filter: { shelf: "read" } }],
	sources: [goodreadsRssSource],
});
```

For request-time rendering, `memoryCache()` provides a small process-local cache backed by `globalThis`:

```ts
import { Bookshelf, memoryCache } from "@dawdle.space/bookshelf";

const bookshelf = new Bookshelf({ ...config, cache: memoryCache(), sources });
const data = await bookshelf.load();
```

## Rendering

```ts
import { renderDocument, renderShelf } from "@dawdle.space/bookshelf";

const fragment = renderShelf(data, config);
const document = renderDocument(data, { ...config, stylesheet: "inline" }, { css });
```

`stylesheet` controls the generated document CSS:

- `cdn` links to `https://bookshelf.dawdle.space/styles/v1/default.css`.
- `inline` inlines `documentOptions.css`.
- `none` emits no package stylesheet.

`coverSource` controls cover image URLs:

- `openlibrary` uses OpenLibrary cover URLs.
- `metadata` uses cover URLs from the imported source, such as Goodreads RSS.
- `none` renders the generated placeholder cover.

## Importers

Goodreads RSS is available as a subpath export:

```ts
import { importGoodreadsRss, goodreadsRssSource } from "@dawdle.space/bookshelf/importer/goodreads-rss";

const data = await importGoodreadsRss("https://www.goodreads.com/user/show/129153443");
```

The root package does not register importers automatically. Pass sources explicitly when using `Bookshelf` for local importing, or call a concrete importer directly.

## Hosted API

Use the hosted API when you want an embed that refreshes from the source at request time:

```ts
import { Bookshelf } from "@dawdle.space/bookshelf";

const src = await new Bookshelf(config).embedUrl();
```

The generated URL points at `https://bookshelf.dawdle.space` by default. Pass a custom base URL for self-hosting.

## Self-Hosted Covers

Use `exportCover` when you want to download remote cover images and render HTML that points at your own files:

```ts
import { basename } from "node:path";
import { Bookshelf } from "@dawdle.space/bookshelf";
import { exportCover } from "@dawdle.space/bookshelf/covers";
import { goodreadsRssSource } from "@dawdle.space/bookshelf/importer/goodreads-rss";

const bookshelf = new Bookshelf({ ...config, sources: [goodreadsRssSource] });
const data = await bookshelf.load();
const exported = await exportCover(data, {
	outDir: "public/covers",
	coverSource: "metadata",
});
const covers = new Map(exported.map((cover) => [cover.bookId, `/covers/${basename(cover.path)}`]));
const localData = {
	...data,
	books: data.books.map((book) => ({ ...book, coverUrl: covers.get(book.id) ?? book.coverUrl })),
};

const html = new Bookshelf({ ...config, coverSource: "metadata" }).render(localData);
```

The CLI includes the same cover downloader via `--export-cover`.

## CLI

```bash
bookshelf bookshelf.config.json --doc --out bookshelf.html
bookshelf bookshelf.config.json --template page.html --out public/bookshelf.html
bookshelf bookshelf.config.json --template page.html --template-string '<main id="bookshelf"></main>' --out public/bookshelf.html
bookshelf bookshelf.config.json --export-cover public/covers --template page.html --out public/bookshelf.html
```

Render settings belong in `bookshelf.config.json`; CLI flags only control output files, templates, documents, CSS inlining, and cover downloads.

Templates must contain the template string once. The default is `{{ bookshelf }}`; customize it with `--template-string`.
