import styles from "../../App.module.css";

import { Tabs } from "@base-ui/react/tabs";
import type { BookshelfConfig, BookshelfData } from "@dawdle.space/bookshelf";

import type { MainTab, UiTheme } from "../../generator/settings";
import { BookshelfPreview } from "../Bookshelf";
import { ExportPanel } from "../ExportPanel";
import { SettingsTab } from "./SettingsTab";

interface Props {
	activeTab: MainTab;
	apiBaseUrl: string;
	config: BookshelfConfig | null;
	loading: boolean;
	shelf: BookshelfData | null;
	theme: UiTheme;
	onTabChange: (tab: MainTab) => void;
	onConfigChange: (updater: (config: BookshelfConfig) => BookshelfConfig) => void;
}

export function GeneratorTabs({
	activeTab,
	apiBaseUrl,
	config,
	loading,
	shelf,
	theme,
	onTabChange,
	onConfigChange,
}: Props) {
	return (
		<section className={styles.card}>
			<Tabs.Root
				value={activeTab}
				onValueChange={(value) => onTabChange(value as MainTab)}
				className={styles.tabs}
			>
				<Tabs.List className={styles.tabList}>
					<Tabs.Tab className={styles.tab} value="settings">
						Settings
					</Tabs.Tab>
					<Tabs.Tab className={styles.tab} value="preview">
						Preview
					</Tabs.Tab>
					<Tabs.Tab className={styles.tab} value="export">
						Export
					</Tabs.Tab>
					<Tabs.Indicator className={styles.indicator} />
				</Tabs.List>
				<Tabs.Panel className={styles.panel} value="settings">
					<SettingsTab config={config} shelf={shelf} onChange={onConfigChange} />
				</Tabs.Panel>
				<Tabs.Panel className={styles.panel} value="preview">
					<BookshelfPreview shelf={shelf} loading={loading} config={config} theme={theme} />
				</Tabs.Panel>
				<Tabs.Panel className={styles.panel} value="export">
					<ExportPanel shelf={shelf} config={config} loading={loading} apiBaseUrl={apiBaseUrl} />
				</Tabs.Panel>
			</Tabs.Root>
		</section>
	);
}
