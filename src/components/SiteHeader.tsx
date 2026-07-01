import styles from "../App.module.css";

import type { UiTheme } from "../generator/settings";

interface Props {
	theme: UiTheme;
	onToggleTheme: () => void;
}

export function SiteHeader({ theme, onToggleTheme }: Props) {
	const nextTheme = theme === "dark" ? "light" : "dark";
	return (
		<header className={styles.header}>
			<div className={styles.wrap}>
				<div className={styles.headerTop}>
					<h1 className={styles.title}>
						bookshelf<span>.dawdle.space</span>
					</h1>
					<button
						type="button"
						className={`${styles.themeToggle} ${theme === "dark" ? styles.themeToggleDark : ""}`}
						onClick={onToggleTheme}
						aria-label={`Switch to ${nextTheme} mode`}
						title={`Switch to ${nextTheme} mode`}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							aria-hidden="true"
							width="1em"
							height="1em"
							className={styles.themeIcon}
							fill="currentColor"
							viewBox="0 0 32 32"
						>
							<clipPath id="theme-toggle-cutout">
								<path d="M0-5h55v37h-55zm32 12a1 1 0 0025 0 1 1 0 00-25 0" />
							</clipPath>
							<g clipPath="url(#theme-toggle-cutout)">
								<circle cx="16" cy="16" r="15" />
							</g>
						</svg>
					</button>
				</div>
				<p className={styles.subtitle}>
					Turn your reading history into a small, portable bookshelf for your website.
				</p>
			</div>
		</header>
	);
}
