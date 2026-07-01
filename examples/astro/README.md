# Astro Example

- `src/pages/static-bookshelf.astro` loads books during build/prerender. Use this for personal sites where book data only needs to update on deploy.
- `src/pages/dynamic-bookshelf.astro` loads books at request time with the package `memoryCache()` helper. Use this when you want fresher data without rebuilding.

Both use `new Bookshelf({ ...config, sources: [goodreadsRssSource] })` for local importing/rendering.
