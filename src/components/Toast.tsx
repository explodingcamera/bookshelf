import styles from "../App.module.css";

import { Toast as BaseToast } from "@base-ui/react/toast";
import { useEffect } from "react";

import type { Status } from "../generator/settings";

function ToastList({ status }: { status: Status }) {
	const manager = BaseToast.useToastManager<{ kind: "info" | "error" | "loading" }>();
	const { add, close, toasts } = manager;

	useEffect(() => {
		if (!status) {
			close("status");
			return;
		}

		add({
			id: "status",
			description: status.text,
			type: status.kind,
			priority: status.kind === "error" ? "high" : "low",
			timeout: status.kind === "loading" ? 0 : status.kind === "error" ? 7000 : 4000,
			data: { kind: status.kind },
		});
	}, [add, close, status]);

	return (
		<BaseToast.Viewport className={styles.toastViewport}>
			{toasts.map((toast) => (
				<BaseToast.Root
					key={toast.id}
					toast={toast}
					className={styles.toast}
					swipeDirection="right"
				>
					<BaseToast.Content className={styles.toastContent}>
						{toast.type === "loading" ? (
							<span className={styles.toastSpinner} aria-hidden="true" />
						) : null}
						<BaseToast.Description className={styles.toastDescription} />
					</BaseToast.Content>
				</BaseToast.Root>
			))}
		</BaseToast.Viewport>
	);
}

export function Toast({ status }: { status: Status }) {
	return (
		<BaseToast.Provider limit={1}>
			<ToastList status={status} />
		</BaseToast.Provider>
	);
}
