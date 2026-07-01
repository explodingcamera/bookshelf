import type { RenderBook } from "../data";
import type { JsxElement } from ".";

const CoverBook = ({
	book,
	showRatings,
	showReadDate,
}: {
	book: RenderBook;
	showRatings: boolean;
	showReadDate: boolean;
}) => {
	const coverFallback = (
		<div class="bs-cover bs-cover-ph" style={{ background: book.gradient }} aria-hidden="true">
			<span class="bs-cover-title">{book.title}</span>
		</div>
	);
	const cover = book.coverUrl ? (
		<span class="bs-cover-frame">
			{coverFallback}
			<img
				class="bs-cover bs-cover-img"
				src={book.coverUrl}
				data-fallback-src={book.fallbackCoverUrl}
				onerror={
					"if(this.dataset.fallbackSrc&&this.src!==this.dataset.fallbackSrc){this.src=this.dataset.fallbackSrc}else{this.style.display='none'}"
				}
				alt=""
				aria-hidden="true"
				loading="lazy"
			/>
		</span>
	) : (
		coverFallback
	);
	return (
		<li class="bs-book">
			{book.linkUrl ? (
				<a class="bs-cover-link" href={book.linkUrl} target="_blank" rel="noreferrer">
					{cover}
				</a>
			) : (
				cover
			)}
			<div class="bs-meta">
				<span class="bs-title">
					{book.linkUrl ? (
						<a class="bs-book-link" href={book.linkUrl} target="_blank" rel="noreferrer">
							{book.title}
						</a>
					) : (
						book.title
					)}
				</span>
				<span class="bs-author">{book.author}</span>
				{showReadDate && book.date ? <span class="bs-date">{book.date}</span> : null}
				{book.reviewUrl || (showRatings && book.rating) ? (
					<span class="bs-book-actions">
						{book.reviewUrl ? (
							<a
								class="bs-review-link"
								href={book.reviewUrl}
								target="_blank"
								rel="noreferrer"
								aria-label={`Read review for ${book.title}`}
							>
								<span class="bs-sr-only">Read review for {book.title}</span>
								<svg viewBox="0 0 24 24" aria-hidden="true" class="bs-review-icon">
									<path d="M8 3h8l4 4v14H8z" />
									<path d="M16 3v5h5M11 12h6M11 16h6" />
								</svg>
							</a>
						) : null}
						{showRatings && book.rating ? <span class="bs-rating">{book.rating}</span> : null}
					</span>
				) : null}
			</div>
		</li>
	);
};

export const Covers = ({
	books,
	showRatings,
	showReadDate,
}: {
	books: RenderBook[];
	showRatings: boolean;
	showReadDate: boolean;
}): JsxElement => (
	<ul class="bs-grid">
		{books.map((book) => (
			<CoverBook book={book} showRatings={showRatings} showReadDate={showReadDate} />
		))}
	</ul>
);
