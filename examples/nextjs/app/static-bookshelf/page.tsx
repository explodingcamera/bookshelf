import { Bookshelf } from "@dawdle.space/bookshelf";
import { goodreadsRssSource } from "@dawdle.space/bookshelf/importer/goodreads-rss";

import { config } from "../bookshelf";

export const dynamic = "force-static";

export default async function StaticBookshelfPage() {
	const bookshelf = new Bookshelf({ ...config, sources: [goodreadsRssSource] });
	const data = await bookshelf.load();
	return (
		<main>
			<h1>Static Bookshelf</h1>
			{/* biome-ignore lint/security/noDangerouslySetInnerHtml: Example renders trusted Bookshelf output. */}
			<div dangerouslySetInnerHTML={{ __html: bookshelf.render(data) }} />
		</main>
	);
}
