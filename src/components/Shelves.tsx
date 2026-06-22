import type {
	RenderMode,
	ReviewDisplay,
	SectionRenderConfig,
	ShelfConfig,
	BookSort,
} from "@explodingcamera/bookshelf";
import { DEFAULT_RENDER_OPTIONS, RENDER_MODES } from "@explodingcamera/bookshelf";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import styles from "./Shelves.module.css";

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

function nextId(sections: SectionRenderConfig[]): string {
	let i = sections.length + 1;
	while (sections.some((s) => s.id === `section-${i}`)) i++;
	return `section-${i}`;
}

export function Shelves({ sections, sourceShelves, onChange }: Props) {
	const move = (index: number, dir: -1 | 1) => {
		const j = index + dir;
		if (j < 0 || j >= sections.length) return;
		const next = [...sections];
		[next[index], next[j]] = [next[j], next[index]];
		onChange(next);
	};

	const update = (id: string, patch: Partial<SectionRenderConfig>) =>
		onChange(sections.map((s) => (s.id === id ? { ...s, ...patch } : s)));

	const remove = (id: string) => onChange(sections.filter((s) => s.id !== id));

	const addSection = () =>
		onChange([
			...sections,
			{
				...DEFAULT_RENDER_OPTIONS,
				id: nextId(sections),
				label: "",
				enabled: true,
			},
		]);

	return (
		<div className={styles.root}>
			<ul className={styles.list}>
				{sections.map((s, i) => {
					const canShowReadDate = s.mode !== "spines";
					const canShowReviews = s.mode === "list";
					const canRoundCorners = s.mode === "covers";
					const canChangeSpineStyle = s.mode === "spines";
					const canChangeSpineBehavior = canChangeSpineStyle && s.spineStyle === "3d";
					return (
						<li key={s.id} className={styles.row}>
							<div className={styles.header}>
								<input
									className={styles.labelInput}
									value={s.label}
									placeholder="Section title"
									onChange={(e) => update(s.id, { label: e.currentTarget.value })}
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
										onClick={() => remove(s.id)}
										aria-label={`Remove ${s.label || "section"}`}
									>
										<Trash2 aria-hidden="true" size={15} strokeWidth={2} />
									</button>
								</div>
							</div>

							<div className={styles.sentence}>
								<span>Show</span>
								<label>
									<span className={styles.srOnly}>Source shelf</span>
									<select
										className={styles.select}
										value={s.filter?.shelf ?? ""}
										onChange={(e) => {
											const shelf = e.currentTarget.value || undefined;
											update(s.id, { filter: { ...s.filter, shelf } });
										}}
									>
										<option value="">All shelves</option>
										{sourceShelves.map((shelf) => (
											<option key={shelf.id} value={shelf.id}>
												{shelf.label}
											</option>
										))}
									</select>
								</label>
								<span>books</span>
								<label className={styles.check}>
									<input
										type="checkbox"
										checked={Boolean(s.filter?.hasReview)}
										onChange={(e) =>
											update(s.id, { filter: { ...s.filter, hasReview: e.currentTarget.checked } })
										}
									/>
									with reviews only
								</label>
								<label className={styles.check}>
									<input
										type="checkbox"
										checked={Boolean(s.filter?.hasRating)}
										onChange={(e) =>
											update(s.id, { filter: { ...s.filter, hasRating: e.currentTarget.checked } })
										}
									/>
									with ratings only
								</label>
							</div>

							<div className={styles.sentence}>
								<span>Display as</span>
								<label>
									<span className={styles.srOnly}>Display format</span>
									<select
										className={styles.select}
										value={s.mode}
										onChange={(e) => update(s.id, { mode: e.currentTarget.value as RenderMode })}
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
										onChange={(e) => update(s.id, { sortBy: e.currentTarget.value as BookSort })}
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
												update(s.id, { reviewDisplay: e.currentTarget.value as ReviewDisplay })
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
								{canChangeSpineStyle ? (
									<label className={styles.check}>
										<input
											type="checkbox"
											checked={s.spineStyle === "3d"}
											onChange={(e) =>
												update(s.id, { spineStyle: e.currentTarget.checked ? "3d" : "flat" })
											}
										/>
										3D spines
									</label>
								) : null}
								{canChangeSpineBehavior ? (
									<label className={styles.check}>
										<input
											type="checkbox"
											checked={s.spineBehavior === "hover"}
											onChange={(e) =>
												update(s.id, { spineBehavior: e.currentTarget.checked ? "hover" : "open" })
											}
										/>
										open on hover
									</label>
								) : null}
								<label className={styles.check}>
									<input
										type="checkbox"
										checked={s.showRatings}
										onChange={(e) => update(s.id, { showRatings: e.currentTarget.checked })}
									/>
									show ratings
								</label>
								{canShowReadDate ? (
									<label className={styles.check}>
										<input
											type="checkbox"
											checked={s.showReadDate}
											onChange={(e) => update(s.id, { showReadDate: e.currentTarget.checked })}
										/>
										show read date
									</label>
								) : null}
								{canRoundCorners ? (
									<label className={styles.check}>
										<input
											type="checkbox"
											checked={s.roundedCorners}
											onChange={(e) => update(s.id, { roundedCorners: e.currentTarget.checked })}
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
