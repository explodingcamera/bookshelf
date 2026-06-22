const ALLOWED_TAGS = new Set([
	"a",
	"b",
	"blockquote",
	"br",
	"code",
	"em",
	"i",
	"li",
	"ol",
	"p",
	"pre",
	"s",
	"strong",
	"u",
	"ul",
]);

function escapeHtml(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}

function safeHref(raw: string): string {
	const trimmed = raw.trim();
	if (/^(https?:|mailto:)/i.test(trimmed)) return escapeHtml(trimmed);
	return "";
}

function linkHref(attrs: string): string {
	const match = attrs.match(/\shref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
	return safeHref(match?.[1] ?? match?.[2] ?? match?.[3] ?? "");
}

export function sanitizeReviewHtml(input: string): string {
	let html = "";
	let offset = 0;
	const tags = /<\/?([a-zA-Z0-9]+)([^>]*)>/g;

	for (const match of input.matchAll(tags)) {
		const raw = match[0];
		const index = match.index ?? 0;
		const tag = (match[1] ?? "").toLowerCase();
		const attrs = match[2] ?? "";

		html += escapeHtml(input.slice(offset, index));
		offset = index + raw.length;

		if (!ALLOWED_TAGS.has(tag)) continue;
		if (raw.startsWith("</")) {
			if (tag !== "br") html += `</${tag}>`;
			continue;
		}
		if (tag === "br") {
			html += "<br>";
			continue;
		}
		if (tag === "a") {
			const href = linkHref(attrs);
			html += href ? `<a href="${href}" rel="nofollow noopener noreferrer">` : "<a>";
			continue;
		}
		html += `<${tag}>`;
	}

	return html + escapeHtml(input.slice(offset));
}
