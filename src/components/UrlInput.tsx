import styles from "./UrlInput.module.css";

interface Props {
	value: string;
	onValueChange: (value: string) => void;
	onGenerate: (value: string) => void;
	loading: boolean;
}

export function UrlInput({ value, onValueChange, onGenerate, loading }: Props) {
	return (
		<form
			className={styles.form}
			onSubmit={(e) => {
				e.preventDefault();
				onGenerate(value);
			}}
		>
			<input
				className={styles.input}
				value={value}
				onChange={(e) => onValueChange(e.target.value)}
				placeholder="https://www.goodreads.com/review/list_rss/…"
				type="text"
				aria-label="Source URL or bookshelf JSON"
			/>
			<button className={styles.button} type="submit" disabled={loading}>
				{loading ? "Loading…" : "Load"}
			</button>
			<p className={styles.help}>Paste a Goodreads profile URL</p>
		</form>
	);
}
