import styles from "../../App.module.css";

import type {
	BookLinkSource,
	BookshelfConfig,
	BookshelfData,
	CoverSource,
	DateFormat,
} from "@dawdle.space/bookshelf";
import { DEFAULT_SHELVES } from "@dawdle.space/bookshelf";

import { COVER_OPTIONS, DATE_FORMATS, LINK_OPTIONS } from "../../generator/settings";
import { Shelves } from "../Shelves";

interface Props {
	config: BookshelfConfig | null;
	shelf: BookshelfData | null;
	onChange: (updater: (config: BookshelfConfig) => BookshelfConfig) => void;
}

export function SettingsTab({ config, shelf, onChange }: Props) {
	if (!config) return <p className={styles.empty}>Load a bookshelf to edit sections.</p>;

	return (
		<>
			<div className={styles.settingBar}>
				<label>
					<span>Covers</span>
					<select
						className={styles.select}
						value={config.coverSource}
						onChange={(e) => {
							const coverSource = e.currentTarget.value as CoverSource;
							onChange((cur) => ({ ...cur, coverSource }));
						}}
					>
						{COVER_OPTIONS.map((option) => (
							<option key={option.id} value={option.id}>
								{option.label}
							</option>
						))}
					</select>
				</label>
				<label>
					<span>Links</span>
					<select
						className={styles.select}
						value={config.bookLinkSource}
						onChange={(e) => {
							const bookLinkSource = e.currentTarget.value as BookLinkSource;
							onChange((cur) => ({ ...cur, bookLinkSource }));
						}}
					>
						{LINK_OPTIONS.map((option) => (
							<option key={option.id} value={option.id}>
								{option.label}
							</option>
						))}
					</select>
				</label>
				<label>
					<span>Date format</span>
					<select
						className={styles.select}
						value={config.dateFormat}
						onChange={(e) => {
							const dateFormat = e.currentTarget.value as DateFormat;
							onChange((cur) => ({ ...cur, dateFormat }));
						}}
					>
						{DATE_FORMATS.map((format) => (
							<option key={format.id} value={format.id}>
								{format.label}
							</option>
						))}
					</select>
				</label>
			</div>
			<Shelves
				sections={config.sections ?? []}
				sourceShelves={shelf?.shelves ?? [...DEFAULT_SHELVES]}
				onChange={(sections) => onChange((cur) => ({ ...cur, sections }))}
			/>
		</>
	);
}
