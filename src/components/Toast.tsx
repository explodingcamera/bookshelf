import styles from "../App.module.css";

import type { Status } from "../generator/settings";

export function Toast({ status }: { status: Status }) {
	if (!status) return null;
	return (
		<div
			className={`${styles.toast} ${status.kind === "error" ? styles.toastError : ""}`}
			role={status.kind === "error" ? "alert" : "status"}
		>
			{status.text}
		</div>
	);
}
