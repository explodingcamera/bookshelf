import type { RenderBook } from "../data";
import type { JsxElement } from ".";

export const SpineFace = ({
	book,
	showRatings,
	showAuthor,
}: {
	book: RenderBook;
	showRatings: boolean;
	showAuthor: boolean;
}): JsxElement => (
	<span class="bs-spine-face">
		<span
			class="bs-spine-band"
			style={{ top: book.bandTop, height: book.bandHeight, background: book.bandTint }}
		/>
		<span class="bs-spine-text">
			<span class="bs-spine-title">{book.title}</span>
			{showAuthor ? <span class="bs-spine-author">{book.author}</span> : null}
		</span>
		{showRatings && book.rating ? <span class="bs-spine-rating">{book.rating}</span> : null}
	</span>
);

export const Spines = ({
	books,
	showRatings,
	showAuthor,
	scale,
}: {
	books: RenderBook[];
	showRatings: boolean;
	showAuthor: boolean;
	scale: number;
}): JsxElement => (
	<ul class="bs-shelf-row">
		{books.map((book, index) => (
			<li
				class="bs-spine"
				style={{
					"--bs-spine-z": books.length - index,
					width: Math.round(
						(showAuthor ? book.spineWidth : Math.max(24, book.spineWidth - 12)) * scale,
					),
					height: Math.round(book.spineHeight * scale),
					"--bs-spine-bg": book.gradient,
					"--bs-spine-text-width": `${Math.max(30, Math.round(book.spineHeight * scale) - 30)}px`,
				}}
				title={book.fullTitle}
			>
				{book.linkUrl ? (
					<a class="bs-spine-link" href={book.linkUrl} target="_blank" rel="noreferrer">
						<SpineFace book={book} showRatings={showRatings} showAuthor={showAuthor} />
					</a>
				) : (
					<span class="bs-spine-link">
						<SpineFace book={book} showRatings={showRatings} showAuthor={showAuthor} />
					</span>
				)}
			</li>
		))}
	</ul>
);
