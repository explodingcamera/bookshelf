# Next.js Example

- `app/static-bookshelf/page.tsx` uses `force-static`, so books are fetched during build/static generation. Use this for fast pages that update on deploy.
- `app/dynamic-bookshelf/page.tsx` uses `force-dynamic`, so books are fetched at request time and cached with `memoryCache()`. Use this when the shelf should refresh without a rebuild.

Both pages render server-side with `@dawdle.space/bookshelf`.
