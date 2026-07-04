# CLI Example

Use this when you want a static bookshelf file that updates only when you run a script.

`bookshelf.config.json` describes the source and renderer settings. It references the package JSON schema for editor autocomplete.

`page.html` contains a `{{ bookshelf }}` placeholder. `update_bookshelf.sh` replaces it with generated shelf HTML and writes `public/bookshelf.html`.

This is the lightest option at runtime: no client-side API call and no server-side importer work.
