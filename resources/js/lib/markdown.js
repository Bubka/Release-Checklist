const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

function emphasis(text) {
    return text
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/__(.+?)__/g, '<strong>$1</strong>')
        .replace(/~~(.+?)~~/g, '<del>$1</del>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/(^|[^\w])_(.+?)_(?!\w)/g, '$1<em>$2</em>');
}

// Inline-only markdown (bold, italic, strike, code, http(s) links) rendered to safe HTML.
export function renderInline(source) {
    const stash = [];
    const hold = (html) => `\u0000${stash.push(html) - 1}\u0000`;

    let text = String(source ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c]);

    text = text.replace(/`([^`]+)`/g, (_, code) => hold(`<code>${code}</code>`));
    text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_, label, url) =>
        hold(`<a href="${url}" target="_blank" rel="noopener noreferrer">${emphasis(label)}</a>`),
    );
    text = emphasis(text);

    while (/\u0000\d+\u0000/.test(text)) {
        text = text.replace(/\u0000(\d+)\u0000/g, (_, i) => stash[i]);
    }

    return text;
}
