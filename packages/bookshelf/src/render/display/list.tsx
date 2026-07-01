import { unsafeHTML } from "microjsx";

import type { ReviewDisplay } from "../../types";
import type { RenderBook } from "../data";
import { sanitizeReviewHtml } from "../sanitize";
import type { JsxElement, RendererOptions } from ".";

const reviewHtml = (book: RenderBook, opts: RendererOptions): ReturnType<typeof unsafeHTML> => {
	const parsed = opts.parseReview ? opts.parseReview(book.review, book) : book.review;
	const hasHtml = /<\/?[a-z][\s\S]*>/i.test(parsed);
	const html = opts.unsafeReviews ? parsed : sanitizeReviewHtml(parsed);
	return unsafeHTML(hasHtml ? html : `<p>${html}</p>`);
};

const Review = ({
	book,
	reviewDisplay,
	rendererOptions,
}: {
	book: RenderBook;
	reviewDisplay: ReviewDisplay;
	rendererOptions: RendererOptions;
}) => {
	if (!book.review || reviewDisplay === "none") return null;
	const review = reviewHtml(book, rendererOptions);
	if (reviewDisplay === "accordion") {
		return (
			<details class="bs-review-details">
				<summary>Review</summary>
				<div class="bs-review">{review}</div>
			</details>
		);
	}
	return <div class="bs-review">{review}</div>;
};

export const List = ({
	books,
	showRatings,
	showReadDate,
	reviewDisplay,
	rendererOptions,
}: {
	books: RenderBook[];
	showRatings: boolean;
	showReadDate: boolean;
	reviewDisplay: ReviewDisplay;
	rendererOptions: RendererOptions;
}): JsxElement => (
	<ul class="bs-list">
		{books.map((book) => {
			const hasDate = showReadDate && Boolean(book.date);
			return (
				<li class="bs-list-item">
					<div class={`bs-list-line${hasDate ? " bs-has-date" : ""}`}>
						{hasDate ? <span class="bs-list-date">{book.date}</span> : null}
						<span class="bs-list-main">
							<span class="bs-list-title">
								{book.linkUrl ? (
									<a class="bs-book-link" href={book.linkUrl} target="_blank" rel="noreferrer">
										{book.title}
									</a>
								) : (
									book.title
								)}
							</span>
							<span class="bs-list-author">{book.author}</span>
						</span>
						{showRatings && book.rating ? <span class="bs-rating">{book.rating}</span> : null}
					</div>
					<Review book={book} reviewDisplay={reviewDisplay} rendererOptions={rendererOptions} />
				</li>
			);
		})}
	</ul>
);
