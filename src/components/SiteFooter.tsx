import styles from "../App.module.css";

export function SiteFooter() {
	return (
		<footer className={styles.footer}>
			<p className={styles.muted}>
				<a href="https://github.com/explodingcamera/bookshelf">source code</a>
				<a href="https://dawdle.space">hosted on dawdle.space</a>
			</p>
		</footer>
	);
}
