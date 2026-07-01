import styles from "./UrlInput.module.css";

interface Props {
	value: string;
	onValueChange: (value: string) => void;
	onLoad: (value: string) => void;
	loading: boolean;
}

export function UrlInput({ value, onValueChange, onLoad, loading }: Props) {
	return (
		<form
			className={styles.form}
			onSubmit={(e) => {
				e.preventDefault();
				onLoad(value);
			}}
		>
			<input
				className={styles.input}
				value={value}
				onChange={(e) => onValueChange(e.target.value)}
				placeholder="Paste or type a Goodreads URL"
				type="text"
				aria-label="Source URL or bookshelf JSON"
			/>
			<button className={styles.button} type="submit" disabled={loading}>
				{loading ? <span className={styles.spinner} aria-hidden="true" /> : null}
				{loading ? "Loading…" : "Load"}
			</button>
		</form>
	);
}
