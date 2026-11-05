export function roastLink(post, base) {
  const url = new URL('/', base);
  url.searchParams.set('roast', JSON.stringify({ v: 1, text: post.text, author: post.author }));
  return url.href;
}
export function parseRoastLink(search) {
  try {
    const raw = new URLSearchParams(search).get('roast');
    if (!raw || raw.length > 1500) return null;
    const p = JSON.parse(raw);
    if (p.v !== 1 || typeof p.text !== 'string' || p.text.trim().length < 8 || p.text.length > 240 || typeof p.author !== 'string' || !/^[a-zA-Z0-9_]{3,20}$/.test(p.author)) return null;
    return { text: p.text, author: p.author, category: 'Shared preview', color: 'yellow', bid: 10, id: 'shared-preview' };
  } catch { return null; }
}
