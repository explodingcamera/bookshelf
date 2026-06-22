import { render, unsafeHTML } from "microjsx";
import { sanitizeReviewHtml } from "./sanitize";
import type { Bookshelf, BookshelfConfig, RenderMode, ReviewDisplay } from "./types";
import { computeGroups, type RenderBook } from "./viewModel";

export interface RendererOptions {
	unsafeReviews?: boolean;
	parseReview?: (review: string, book: RenderBook) => string;
}

function CoverBook({
	book,
	showRatings,
	showReadDate,
}: {
	book: RenderBook;
	showRatings: boolean;
	showReadDate: boolean;
}) {
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
				alt={`Cover of ${book.title}`}
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
				{showRatings && book.rating ? <span class="bs-rating">{book.rating}</span> : null}
			</div>
		</li>
	);
}

function Covers({
	books,
	showRatings,
	showReadDate,
}: {
	books: RenderBook[];
	showRatings: boolean;
	showReadDate: boolean;
}) {
	return (
		<ul class="bs-grid">
			{books.map((book) => (
				<CoverBook book={book} showRatings={showRatings} showReadDate={showReadDate} />
			))}
		</ul>
	);
}

function SpineContents({ book, showRatings }: { book: RenderBook; showRatings: boolean }) {
	return (
		<>
			<span class="bs-spine-face">
				{book.coverUrl ? (
					<img
						class="bs-spine-cover"
						src={book.coverUrl}
						data-fallback-src={book.fallbackCoverUrl}
						onerror={
							book.fallbackCoverUrl
								? "this.onerror=null;this.src=this.dataset.fallbackSrc"
								: undefined
						}
						alt={`Cover of ${book.title}`}
						loading="lazy"
					/>
				) : null}
				<span
					class="bs-spine-band"
					style={{ top: book.bandTop, height: book.bandHeight, background: book.bandTint }}
				/>
				<span class="bs-spine-text">{book.title}</span>
				{showRatings && book.rating ? <span class="bs-spine-rating">{book.rating}</span> : null}
			</span>
		</>
	);
}

function Spines({
	books,
	showRatings,
	spineStyle,
	spineBehavior,
}: {
	books: RenderBook[];
	showRatings: boolean;
	spineStyle: "flat" | "3d";
	spineBehavior: "hover" | "open";
}) {
	return (
		<ul
			class="bs-shelf-row"
			data-spine-style={spineStyle === "3d" ? "3d" : undefined}
			data-spine-behavior={spineStyle === "3d" ? spineBehavior : undefined}
		>
			{books.map((book, index) => {
				const isAlwaysOpen = spineStyle === "3d" && spineBehavior === "open";
				const spineWidth = isAlwaysOpen ? 30 : book.spineWidth;
				const spineHeight = isAlwaysOpen ? 176 : book.spineHeight;
				const coverWidth = Math.round(Math.min((spineHeight * 2) / 3, 120));
				const visibleCoverWidth = Math.round(coverWidth * 0.68);
				return (
					<li
						class="bs-spine"
						data-spine-style={spineStyle === "3d" ? "3d" : undefined}
						data-spine-behavior={isAlwaysOpen ? "open" : undefined}
						style={{
							"--bs-spine-z": books.length - index,
							width: isAlwaysOpen ? spineWidth + visibleCoverWidth - 8 : spineWidth,
							height: spineHeight,
							"--bs-spine-bg": book.gradient,
							"--bs-spine-text-width": `${Math.max(30, spineHeight - 30)}px`,
							"--bs-spine-height": `${spineHeight}px`,
							"--bs-spine-width": `${spineWidth}px`,
							"--bs-spine-cover-width": `${coverWidth}px`,
						}}
						title={book.fullTitle}
					>
						{book.linkUrl ? (
							<a class="bs-spine-link" href={book.linkUrl} target="_blank" rel="noreferrer">
								<SpineContents book={book} showRatings={showRatings} />
							</a>
						) : (
							<span class="bs-spine-link">
								<SpineContents book={book} showRatings={showRatings} />
							</span>
						)}
					</li>
				);
			})}
		</ul>
	);
}

function reviewHtml(book: RenderBook, opts: RendererOptions): ReturnType<typeof unsafeHTML> {
	const parsed = opts.parseReview ? opts.parseReview(book.review, book) : book.review;
	const hasHtml = /<\/?[a-z][\s\S]*>/i.test(parsed);
	const html = opts.unsafeReviews ? parsed : sanitizeReviewHtml(parsed);
	return unsafeHTML(hasHtml ? html : `<p>${html}</p>`);
}

function Review({
	book,
	reviewDisplay,
	rendererOptions,
}: {
	book: RenderBook;
	reviewDisplay: ReviewDisplay;
	rendererOptions: RendererOptions;
}) {
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
}

function List({
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
}) {
	return (
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
}

function Mode({
	mode,
	books,
	showRatings,
	showReadDate,
	reviewDisplay,
	spineStyle,
	spineBehavior,
	rendererOptions,
}: {
	mode: RenderMode;
	books: RenderBook[];
	showRatings: boolean;
	showReadDate: boolean;
	reviewDisplay: ReviewDisplay;
	spineStyle: "flat" | "3d";
	spineBehavior: "hover" | "open";
	rendererOptions: RendererOptions;
}) {
	if (mode === "spines") {
		return (
			<Spines
				books={books}
				showRatings={showRatings}
				spineStyle={spineStyle}
				spineBehavior={spineBehavior}
			/>
		);
	}
	if (mode === "list") {
		return (
			<List
				books={books}
				showRatings={showRatings}
				showReadDate={showReadDate}
				reviewDisplay={reviewDisplay}
				rendererOptions={rendererOptions}
			/>
		);
	}
	return <Covers books={books} showRatings={showRatings} showReadDate={showReadDate} />;
}

function Shelf({
	shelf,
	config,
	rendererOptions,
}: {
	shelf: Bookshelf;
	config: BookshelfConfig;
	rendererOptions: RendererOptions;
}) {
	const { showHeadings, groups } = computeGroups(shelf, config);
	return (
		<div
			class="bs-embed"
			data-source={shelf.sourceId}
			data-bookshelf-light={config.theme === "light" ? true : undefined}
			data-bookshelf-dark={config.theme === "dark" ? true : undefined}
		>
			{groups.map((group) => (
				<div
					class="bs-shelf-section"
					data-mode={group.options.mode}
					data-rounded-corners={
						group.options.mode === "covers" && group.options.roundedCorners ? true : undefined
					}
				>
					{showHeadings && group.label.trim() ? (
						<h3 class="bs-shelf-heading">{group.label}</h3>
					) : null}
					<Mode
						mode={group.options.mode}
						books={group.books}
						showRatings={group.options.showRatings}
						showReadDate={group.options.showReadDate}
						reviewDisplay={group.options.reviewDisplay}
						spineStyle={group.options.spineStyle}
						spineBehavior={group.options.spineBehavior}
						rendererOptions={rendererOptions}
					/>
				</div>
			))}
		</div>
	);
}

/** `.bs-embed` markup fragment (no CSS). */
export function renderShelf(
	shelf: Bookshelf,
	config: BookshelfConfig,
	rendererOptions: RendererOptions = {},
): string {
	return render(<Shelf shelf={shelf} config={config} rendererOptions={rendererOptions} />);
}

export interface DocumentOptions {
	css?: string;
	baseHref?: string;
}

/** A full standalone HTML document (iframe srcdoc / hosted page body). */
export function renderDocument(
	shelf: Bookshelf,
	config: BookshelfConfig,
	docOpts: DocumentOptions = {},
	rendererOptions: RendererOptions = {},
): string {
	return `<!doctype html>${render(
		<html lang="en">
			<head>
				<meta charset="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<title>{shelf.owner}'s bookshelf</title>
				{docOpts.baseHref ? <base href={docOpts.baseHref} /> : null}
				{docOpts.css ? <style>{unsafeHTML(docOpts.css)}</style> : null}
				<style>{unsafeHTML("html,body{margin:0;padding:6px;background:transparent}")}</style>
			</head>
			<body>
				<Shelf shelf={shelf} config={config} rendererOptions={rendererOptions} />
			</body>
		</html>,
	)}`;
}
