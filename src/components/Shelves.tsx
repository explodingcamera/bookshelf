import styles from "./Shelves.module.css";

import type {
	BookSort,
	RenderMode,
	ReviewDisplay,
	SectionRenderConfig,
	ShelfConfig,
} from "@dawdle.space/bookshelf";
import { DEFAULT_RENDER_OPTIONS, RENDER_MODES } from "@dawdle.space/bookshelf";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";

interface Props {
	sections: SectionRenderConfig[];
	sourceShelves: ShelfConfig[];
	onChange: (sections: SectionRenderConfig[]) => void;
}

const REVIEW_OPTIONS: { id: ReviewDisplay; label: string }[] = [
	{ id: "none", label: "Hide reviews" },
	{ id: "inline", label: "Show reviews" },
	{ id: "accordion", label: "Accordion reviews" },
];

const SORT_OPTIONS: { id: BookSort; label: string }[] = [
	{ id: "readAt", label: "Date read" },
	{ id: "readAtAsc", label: "Date read (reversed)" },
	{ id: "addedAt", label: "Date added" },
	{ id: "addedAtAsc", label: "Date added (reversed)" },
	{ id: "rating", label: "My rating" },
	{ id: "ratingAsc", label: "My rating (reversed)" },
];

const CUSTOM_SHELF = "__custom__";

function labelForShelf(id: string): string {
	return id
		.split("-")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
}

export function Shelves({ sections, sourceShelves, onChange }: Props) {
	const move = (index: number, dir: -1 | 1) => {
		const j = index + dir;
		if (j < 0 || j >= sections.length) return;
		const next = [...sections];
		[next[index], next[j]] = [next[j], next[index]];
		onChange(next);
	};

	const update = (index: number, patch: Partial<SectionRenderConfig>) =>
		onChange(sections.map((s, i) => (i === index ? { ...s, ...patch } : s)));

	const remove = (index: number) => onChange(sections.filter((_, i) => i !== index));

	const addSection = () =>
		onChange([
			...sections,
			{
				...DEFAULT_RENDER_OPTIONS,
				label: sourceShelves[0]?.label ?? "",
				filter: sourceShelves[0] ? { shelf: sourceShelves[0].id } : undefined,
			},
		]);

	return (
		<div className={styles.root}>
			<ul className={styles.list}>
				{sections.map((s, i) => {
					const canShowReadDate = s.mode === "covers" || s.mode === "list";
					const canShowReviews = s.mode === "list";
					const canRoundCorners = s.mode === "covers";
					const canShowAuthor = s.mode === "spines" || s.mode === "3d";
					const canChangeSpineBehavior = s.mode === "3d";
					const shelfValue = sourceShelves.some((shelf) => shelf.id === s.filter?.shelf)
						? s.filter?.shelf
						: s.filter?.shelf || "";
					return (
						<li key={`${s.filter?.shelf ?? "section"}-${i}`} className={styles.row}>
							<div className={styles.header}>
								<input
									className={styles.labelInput}
									value={s.label}
									placeholder="Section title"
									onChange={(e) => update(i, { label: e.currentTarget.value })}
									aria-label="Section label"
								/>
								<div className={styles.actions}>
									<div className={styles.moveButtons}>
										<button
											type="button"
											className={styles.iconBtn}
											onClick={() => move(i, -1)}
											disabled={i === 0}
											aria-label={`Move ${s.label || "section"} up`}
										>
											<ChevronUp aria-hidden="true" size={14} strokeWidth={2.2} />
										</button>
										<button
											type="button"
											className={styles.iconBtn}
											onClick={() => move(i, 1)}
											disabled={i === sections.length - 1}
											aria-label={`Move ${s.label || "section"} down`}
										>
											<ChevronDown aria-hidden="true" size={14} strokeWidth={2.2} />
										</button>
									</div>
									<button
										type="button"
										className={styles.remove}
										onClick={() => remove(i)}
										aria-label={`Remove ${s.label || "section"}`}
									>
										<Trash2 aria-hidden="true" size={15} strokeWidth={2} />
									</button>
								</div>
							</div>

							<div className={styles.sentence}>
								<span>Shelf:</span>
								<label>
									<span className={styles.srOnly}>Source shelf</span>
									<select
										className={styles.select}
										value={shelfValue}
										onChange={(e) => {
											const value = e.currentTarget.value;
											if (value === CUSTOM_SHELF) {
												const shelf = window
													.prompt("Goodreads shelf slug, for example favorites or sci-fi")
													?.trim()
													.replace(/^shelf=/, "");
												if (!shelf) return;
												update(i, {
													label: labelForShelf(shelf),
													filter: { ...s.filter, shelf },
												});
												return;
											}
											const shelf = value || undefined;
											update(i, { filter: { ...s.filter, shelf } });
										}}
									>
										{sourceShelves.map((shelf) => (
											<option key={shelf.id} value={shelf.id}>
												{shelf.label}
											</option>
										))}
										{s.filter?.shelf &&
										!sourceShelves.some((shelf) => shelf.id === s.filter?.shelf) ? (
											<option value={s.filter.shelf}>{labelForShelf(s.filter.shelf)}</option>
										) : null}
										<option value={CUSTOM_SHELF}>Custom shelf...</option>
									</select>
								</label>
								<label className={styles.check}>
									<input
										type="checkbox"
										checked={Boolean(s.filter?.hasReview)}
										onChange={(e) =>
											update(i, { filter: { ...s.filter, hasReview: e.currentTarget.checked } })
										}
									/>
									with reviews only
								</label>
								<label className={styles.check}>
									<input
										type="checkbox"
										checked={Boolean(s.filter?.hasRating)}
										onChange={(e) =>
											update(i, { filter: { ...s.filter, hasRating: e.currentTarget.checked } })
										}
									/>
									with ratings only
								</label>
							</div>

							<div className={styles.sentence}>
								<span>Display:</span>
								<label>
									<span className={styles.srOnly}>Display format</span>
									<select
										className={styles.select}
										value={s.mode}
										onChange={(e) => update(i, { mode: e.currentTarget.value as RenderMode })}
									>
										{RENDER_MODES.map((m) => (
											<option key={m.id} value={m.id}>
												{m.label}
											</option>
										))}
									</select>
								</label>
								<label>
									<span className={styles.srOnly}>Sort books</span>
									<select
										className={styles.select}
										value={s.sortBy}
										onChange={(e) => update(i, { sortBy: e.currentTarget.value as BookSort })}
									>
										{SORT_OPTIONS.map((option) => (
											<option key={option.id} value={option.id}>
												Sort: {option.label}
											</option>
										))}
									</select>
								</label>
								{canShowReviews ? (
									<label>
										<span className={styles.srOnly}>Review display</span>
										<select
											className={styles.select}
											value={s.reviewDisplay}
											onChange={(e) =>
												update(i, { reviewDisplay: e.currentTarget.value as ReviewDisplay })
											}
										>
											{REVIEW_OPTIONS.map((r) => (
												<option key={r.id} value={r.id}>
													{r.label}
												</option>
											))}
										</select>
									</label>
								) : null}
								<label>
									<span className={styles.srOnly}>Scale</span>
									<select
										className={styles.select}
										value={String(s.scale ?? DEFAULT_RENDER_OPTIONS.scale)}
										onChange={(e) => update(i, { scale: Number(e.currentTarget.value) })}
									>
										<option value="0.8">Scale: small</option>
										<option value="1">Scale: normal</option>
										<option value="1.2">Scale: large</option>
										<option value="1.4">Scale: huge</option>
									</select>
								</label>
								{canChangeSpineBehavior ? (
									<label className={styles.check}>
										<input
											type="checkbox"
											checked={s.spineBehavior === "hover"}
											onChange={(e) =>
												update(i, { spineBehavior: e.currentTarget.checked ? "hover" : "open" })
											}
										/>
										open on hover
									</label>
								) : null}
								<label className={styles.check}>
									<input
										type="checkbox"
										checked={s.showRatings}
										onChange={(e) => update(i, { showRatings: e.currentTarget.checked })}
									/>
									show ratings
								</label>
								{canShowAuthor ? (
									<label className={styles.check}>
										<input
											type="checkbox"
											checked={s.showAuthor}
											onChange={(e) => update(i, { showAuthor: e.currentTarget.checked })}
										/>
										show author
									</label>
								) : null}
								{canShowReadDate ? (
									<label className={styles.check}>
										<input
											type="checkbox"
											checked={s.showReadDate}
											onChange={(e) => update(i, { showReadDate: e.currentTarget.checked })}
										/>
										show read date
									</label>
								) : null}
								{canRoundCorners ? (
									<label className={styles.check}>
										<input
											type="checkbox"
											checked={s.roundedCorners}
											onChange={(e) => update(i, { roundedCorners: e.currentTarget.checked })}
										/>
										rounded corners
									</label>
								) : null}
							</div>
						</li>
					);
				})}
			</ul>
			<button type="button" className={styles.add} onClick={addSection}>
				Add section
			</button>
		</div>
	);
}
