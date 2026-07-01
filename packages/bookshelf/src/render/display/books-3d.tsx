import type { SpineBehavior } from "../../types";
import type { RenderBook } from "../data";
import type { JsxElement } from ".";
import { SpineFace } from "./spines";

const Book3DCover = ({ book }: { book: RenderBook }) => (
	<>
		<span class="bs-book3d-cover bs-book3d-cover-ph" aria-hidden="true">
			<span>{book.title}</span>
		</span>
		{book.coverUrl ? (
			<img
				class="bs-book3d-cover bs-book3d-cover-img"
				src={book.coverUrl}
				data-fallback-src={book.fallbackCoverUrl}
				onerror={
					book.fallbackCoverUrl
						? "this.onerror=null;this.src=this.dataset.fallbackSrc"
						: "this.style.display='none'"
				}
				alt=""
				aria-hidden="true"
				loading="lazy"
			/>
		) : null}
	</>
);

export const Books3D = ({
	books,
	showRatings,
	showAuthor,
	spineBehavior,
	scale,
}: {
	books: RenderBook[];
	showRatings: boolean;
	showAuthor: boolean;
	spineBehavior: SpineBehavior;
	scale: number;
}): JsxElement => (
	<ul class="bs-shelf-row" data-mode="3d" data-spine-behavior={spineBehavior}>
		{books.map((book, index) => {
			const isAlwaysOpen = spineBehavior === "open";
			const baseSpineWidth = showAuthor ? book.spineWidth : Math.max(24, book.spineWidth - 12);
			const spineWidth = Math.round(
				(isAlwaysOpen ? (showAuthor ? 40 : 30) : baseSpineWidth) * scale,
			);
			const spineHeight = Math.round((isAlwaysOpen ? 176 : book.spineHeight) * scale);
			const coverWidth = Math.round(Math.min((spineHeight * 2) / 3, 120 * scale));
			const visibleCoverWidth = Math.round(coverWidth * 0.68);
			const contents = (
				<>
					<span class="bs-book3d-spine">
						<SpineFace book={book} showRatings={showRatings} showAuthor={showAuthor} />
					</span>
					<Book3DCover book={book} />
				</>
			);
			return (
				<li
					class="bs-book3d"
					data-spine-behavior={isAlwaysOpen ? "open" : undefined}
					style={{
						"--bs-spine-z": books.length - index,
						width: isAlwaysOpen ? spineWidth + visibleCoverWidth - 8 : spineWidth,
						height: spineHeight,
						"--bs-spine-bg": book.gradient,
						"--bs-spine-text-width": `${Math.max(30, spineHeight - 30)}px`,
						"--bs-spine-width": `${spineWidth}px`,
						"--bs-spine-cover-width": `${coverWidth}px`,
					}}
					title={book.fullTitle}
				>
					{book.linkUrl ? (
						<a class="bs-book3d-link" href={book.linkUrl} target="_blank" rel="noreferrer">
							{contents}
						</a>
					) : (
						<span class="bs-book3d-link">{contents}</span>
					)}
				</li>
			);
		})}
	</ul>
);
