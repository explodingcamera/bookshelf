import { Bookshelf, memoryCache } from "@dawdle.space/bookshelf";
import { goodreadsRssSource } from "@dawdle.space/bookshelf/importer/goodreads-rss";

import { config } from "../bookshelf";

export const dynamic = "force-dynamic";

export default async function DynamicBookshelfPage() {
	const bookshelf = new Bookshelf({
		...config,
		cache: memoryCache(),
		sources: [goodreadsRssSource],
	});
	const data = await bookshelf.load();
	return (
		<main>
			<h1>Dynamic Bookshelf</h1>
			{/* biome-ignore lint/security/noDangerouslySetInnerHtml: Example renders trusted Bookshelf output. */}
			<div dangerouslySetInnerHTML={{ __html: bookshelf.render(data) }} />
		</main>
	);
}
