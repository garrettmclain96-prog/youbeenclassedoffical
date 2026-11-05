import { CARD_THEMES } from './game-rules.mjs';
export async function shareRoast(post, notify, themeId = 'acid') {
  const theme = CARD_THEMES.find(t => t.id === themeId) || CARD_THEMES[0];
  const accent = theme.id === 'paper' ? theme.ink : theme.bg;
  const canvas = document.createElement('canvas');
  canvas.width = 1080; canvas.height = 1350;
  const ctx = canvas.getContext('2d');
  if (!ctx) { notify('Sharing is unavailable in this browser.'); return; }
  ctx.fillStyle = theme.bg; ctx.fillRect(0, 0, 1080, 1350);
  ctx.fillStyle = theme.paper; ctx.fillRect(50, 50, 980, 1250);
  ctx.fillStyle = accent; ctx.font = 'bold 32px Arial'; ctx.fillText('THE CLASS BOARD', 104, 136);
  ctx.fillStyle = theme.id === 'paper' ? '#646057' : '#aeb4a3'; ctx.font = '20px monospace'; ctx.fillText('YOU BEEN CLASSED.', 104, 174);
  ctx.fillStyle = accent; ctx.font = 'bold 160px Georgia'; ctx.fillText('“', 95, 385);
  ctx.fillStyle = theme.text;
  function wrap() {
    const lines = []; let line = '';
    for (const character of post.text) {
      if (ctx.measureText(line + character).width > 850) {
        const split = line.lastIndexOf(' ');
        if (split > line.length / 2) { lines.push(line.slice(0, split)); line = line.slice(split + 1); }
        else { lines.push(line); line = ''; }
      }
      line += character;
    }
    if (line.trim()) lines.push(line.trim());
    return lines;
  }
  let size = 57; let lines;
  do { ctx.font = `bold ${size}px Arial`; lines = wrap(); if (lines.length * size * 1.3 <= 620) break; size -= 2; } while (size >= 29);
  lines.forEach((text, i) => ctx.fillText(text, 110, 440 + i * size * 1.3));
  ctx.fillStyle = accent; ctx.font = 'bold 29px monospace'; ctx.fillText(`@${post.author}`, 110, 1120);
  ctx.fillStyle = theme.id === 'paper' ? '#646057' : '#aeb4a3'; ctx.font = '23px monospace'; ctx.fillText('GOT A BETTER ONE?', 110, 1200);
  ctx.fillText('youbeenclassed.org', 110, 1237);
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  if (!blob) { notify('Could not create the share card. Try again.'); return; }
  const file = new File([blob], 'you-been-classed.png', { type: 'image/png' });
  try {
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: 'You Been Classed', text: `“${post.text}” — @${post.author}` });
      notify('A comeback worth sharing.');
    } else {
      const url = URL.createObjectURL(blob); const a = document.createElement('a');
      a.href = url; a.download = file.name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      notify('Your share card is downloaded. Send it anywhere.');
    }
  } catch (error) { if (error.name !== 'AbortError') notify('Could not open sharing. Try downloading in another browser.'); }
}
