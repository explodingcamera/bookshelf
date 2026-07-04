import { render, unsafeHTML } from "microjsx";

import type { BookshelfConfig, BookshelfData, RenderMode, SpineBehavior } from "../types";
import type { RenderBook } from "./data";
import { computeGroups, resolveRenderConfig } from "./data";
import type { RendererOptions } from "./display";
import { Books3D, Covers, List, Spines } from "./display";

const DEFAULT_STYLESHEET_HREF = "https://bookshelf.dawdle.space/styles/v1/default.css";

export type { RendererOptions } from "./display";

const Mode = ({
	mode,
	books,
	showRatings,
	showAuthor,
	showReadDate,
	showReviews,
	spineBehavior,
	scale,
	rendererOptions,
}: {
	mode: RenderMode;
	books: RenderBook[];
	showRatings: boolean;
	showAuthor: boolean;
	showReadDate: boolean;
	showReviews: boolean;
	spineBehavior: SpineBehavior;
	scale: number;
	rendererOptions: RendererOptions;
}) => {
	if (mode === "spines") {
		return <Spines books={books} showRatings={showRatings} showAuthor={showAuthor} scale={scale} />;
	}
	if (mode === "3d") {
		return (
			<Books3D
				books={books}
				showRatings={showRatings}
				showAuthor={showAuthor}
				spineBehavior={spineBehavior}
				scale={scale}
			/>
		);
	}
	if (mode === "list") {
		return (
			<List
				books={books}
				showRatings={showRatings}
				showReadDate={showReadDate}
				showReviews={showReviews}
				rendererOptions={rendererOptions}
			/>
		);
	}
	return <Covers books={books} showRatings={showRatings} showReadDate={showReadDate} />;
};

const Shelf = ({
	shelf,
	config,
	rendererOptions,
}: {
	shelf: BookshelfData;
	config: BookshelfConfig;
	rendererOptions: RendererOptions;
}) => {
	const resolvedConfig = resolveRenderConfig(shelf, config);
	const { showHeadings, groups } = computeGroups(shelf, resolvedConfig);
	return (
		<div
			class="bs-embed"
			data-source={shelf.sourceId}
			data-bookshelf-light={resolvedConfig.theme === "light" ? true : undefined}
			data-bookshelf-dark={resolvedConfig.theme === "dark" ? true : undefined}
		>
			{groups.map((group) => (
				<div
					class="bs-shelf-section"
					data-mode={group.options.mode}
					style={{ "--bookshelf--scale": group.options.scale }}
				>
					{showHeadings && group.label.trim() ? (
						<h3 class="bs-shelf-heading">{group.label}</h3>
					) : null}
					<Mode
						mode={group.options.mode}
						books={group.books}
						showRatings={group.options.showRatings}
						showAuthor={group.options.showAuthor}
						showReadDate={group.options.showReadDate}
						showReviews={group.options.showReviews}
						spineBehavior={group.options.spineBehavior}
						scale={group.options.scale}
						rendererOptions={rendererOptions}
					/>
				</div>
			))}
			{resolvedConfig.showAttribution ? (
				<p class="bs-attribution">
					<a href="https://bookshelf.dawdle.space" target="_blank" rel="noreferrer">
						bookshelf.dawdle.space
					</a>
				</p>
			) : null}
		</div>
	);
};

export const renderShelf = (
	shelf: BookshelfData,
	config: BookshelfConfig,
	rendererOptions: RendererOptions = {},
): string => render(<Shelf shelf={shelf} config={config} rendererOptions={rendererOptions} />);

export interface DocumentOptions {
	css?: string;
	cssHrefs?: readonly string[];
	headCss?: string;
	stylesheetHref?: string;
	baseHref?: string;
}

export const renderDocument = (
	shelf: BookshelfData,
	config: BookshelfConfig,
	docOpts: DocumentOptions = {},
	rendererOptions: RendererOptions = {},
): string => {
	const resolvedConfig = resolveRenderConfig(shelf, config);
	const stylesheet = resolvedConfig.stylesheet;
	const cssHrefs = [
		...(stylesheet === "cdn" ? [docOpts.stylesheetHref ?? DEFAULT_STYLESHEET_HREF] : []),
		...(docOpts.cssHrefs ?? []),
	];
	return `<!doctype html>${render(
		<html lang="en">
			<head>
				<meta charset="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<title>{shelf.owner}'s bookshelf</title>
				{docOpts.baseHref ? <base href={docOpts.baseHref} /> : null}
				{cssHrefs.map((href) => (
					<link rel="stylesheet" href={href} />
				))}
				{stylesheet === "inline" && docOpts.css ? <style>{unsafeHTML(docOpts.css)}</style> : null}
				{docOpts.headCss ? <style>{unsafeHTML(docOpts.headCss)}</style> : null}
				<style>{unsafeHTML("html,body{margin:0;padding:6px;background:transparent}")}</style>
			</head>
			<body>
				<Shelf shelf={shelf} config={resolvedConfig} rendererOptions={rendererOptions} />
			</body>
		</html>,
	)}`;
};
