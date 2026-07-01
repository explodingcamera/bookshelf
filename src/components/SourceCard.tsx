import { UrlInput } from "./UrlInput";

interface Props {
	value: string;
	loading: boolean;
	onValueChange: (value: string) => void;
	onLoad: (value: string) => void;
}

export function SourceCard({ value, loading, onValueChange, onLoad }: Props) {
	return <UrlInput value={value} onValueChange={onValueChange} onLoad={onLoad} loading={loading} />;
}
