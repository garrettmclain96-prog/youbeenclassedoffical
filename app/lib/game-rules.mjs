export const CATEGORIES = ['Everyday chaos', 'Startup culture', 'The daily grind', 'Internet behavior'];
export const CARD_THEMES = [
  { id: 'acid', name: 'Acid original', bg: '#e5ff57', ink: '#151710', paper: '#151710', text: '#f6f5eb' },
  { id: 'lilac', name: 'Lilac menace', bg: '#c5b8f2', ink: '#282332', paper: '#282332', text: '#fcf7ff' },
  { id: 'paper', name: 'Paper verdict', bg: '#eee8dc', ink: '#26251f', paper: '#eee8dc', text: '#26251f' },
  { id: 'midnight', name: 'After hours', bg: '#192523', ink: '#b1ecd1', paper: '#101a18', text: '#eaf8ee' },
];
export const FEATURES = [
  ['Draft recovery', 'Close the composer and pick up where you left off.', 'drafts'],
  ['Roast remixes', 'Riff on any roast, with credit to the original.', 'board'],
  ['Topic filters', 'Find the kind of chaos you came for.', 'board'],
  ['Rotating daily targets', 'A new fictional character every day at midnight UTC.', 'target'],
  ['60-second Quickfire', 'Beat the clock with an original comeback.', 'quickfire'],
  ['Daily streak bonuses', 'Check in once a day for practice credits.', 'clubhouse'],
  ['Daily quests', 'Three small missions with claimable rewards.', 'quests'],
  ['Achievement collection', 'Unlock twelve badges through actual play.', 'badges'],
  ['Player levels', 'Build XP and see your next milestone.', 'clubhouse'],
  ['Your clubhouse', 'Your posts, progress, drafts, and settings in one place.', 'clubhouse'],
  ['Activity inbox', 'An honest history of what you did on this device.', 'activity'],
  ['Mute controls', 'Hide a roaster and unmute them whenever you want.', 'settings'],
  ['Post management', 'Edit your own words, archive them, and bring them back.', 'posts'],
  ['Share links', 'Send a self-contained roast preview with attribution.', 'board'],
  ['Share-card themes', 'Four looks for your exported roast images.', 'themes'],
  ['Portable backups', 'Export or restore your local progress and drafts.', 'backup'],
  ['Command palette', 'Press K, N, /, or ? to get around faster.', 'commands'],
];
const TARGETS = [
  { id: 'dave', name: 'DropshipDave', first: 'DROPSHIP', last: 'DAVE', text: 'Fourteen courses. Three ring lights. Still waiting on his first customer.', category: 'Fictional internet guru', tag: 'THE RING LIGHT CAN’T SAVE HIM.', roasts: ['The only thing he successfully dropships is responsibility.', 'His refund policy has more plot twists than his success story.'] },
  { id: 'brenda', name: 'MeetingBrenda', first: 'MEETING', last: 'BRENDA', text: 'Booked a meeting to plan the pre-meeting. Added twelve people “for visibility.”', category: 'Fictional office archetype', tag: 'THIS COULD HAVE BEEN A THOUGHT.', roasts: ['Her calendar has more meetings than her team has accomplishments.', 'She put “quick sync” on a ninety-minute hostage situation.'] },
  { id: 'chad', name: 'CryptoChad', first: 'CRYPTO', last: 'CHAD', text: 'Says “we’re still early” about a project that has been dead for three years.', category: 'Fictional finance bro', tag: 'THE CHART IS NOT THE PERSONALITY.', roasts: ['His investment thesis is a rocket emoji with a Wi-Fi connection.', 'The only asset appreciating is his collection of excuses.'] },
  { id: 'maya', name: 'ManifestMaya', first: 'MANIFEST', last: 'MAYA', text: 'Manifested a six-figure business. Has not yet manifested an invoice.', category: 'Fictional lifestyle guru', tag: 'THE UNIVERSE ASKED FOR A BUSINESS PLAN.', roasts: ['Her revenue stream is a vision board with a payment link.', 'Positive energy is doing a lot of unpaid labor here.'] },
  { id: 'max', name: 'ProductivityMax', first: 'PRODUCTIVITY', last: 'MAX', text: 'Has nine productivity apps, six routines, and one task he has been avoiding since Tuesday.', category: 'Fictional optimization enthusiast', tag: 'HE OPTIMIZED EVERYTHING EXCEPT DOING IT.', roasts: ['He needs a second brain because the first one is configuring Notion.', 'His morning routine ends at three in the afternoon.'] },
  { id: 'tina', name: 'TrendTina', first: 'TREND', last: 'TINA', text: 'Rebranded four times this month. Calls changing her bio a market pivot.', category: 'Fictional social media expert', tag: 'BIG THINGS COMING. AGAIN.', roasts: ['Her niche is announcing that she has found her niche.', 'She has more brand launches than actual customers.'] },
  { id: 'gary', name: 'GymGary', first: 'GYM', last: 'GARY', text: 'Offers unsolicited fitness advice between twenty-minute rests on the only bench.', category: 'Fictional gym regular', tag: 'THREE SETS OF MAKING IT ABOUT HIM.', roasts: ['His strongest muscle is his ability to turn any conversation into leg day.', 'He calls scrolling between sets “active recovery.”'] },
];
export function dayKey(at = Date.now()) { return new Date(at).toISOString().slice(0, 10); }
export function dailyTarget(at = Date.now()) { return { ...TARGETS[((Math.floor(at / 86400000) % TARGETS.length) + TARGETS.length) % TARGETS.length], day: dayKey(at), expires: (Math.floor(at / 86400000) + 1) * 86400000 }; }
export function targetSamples(at) { const t = dailyTarget(at); return t.roasts.map((text, i) => ({ id: `target-${t.day}-${i}`, author: ['FlameKing99', 'RoastMaster'][i], text, bid: [30, 20][i], heat: [91, 65][i], color: ['yellow', 'purple'][i], category: 'Daily target', scope: 'target', targetDay: t.day, created: 2 - i })); }
export function playerLevel(xp = 0) {
  const thresholds = [0, 50, 125, 250, 450, 750, 1200, 2000];
  const names = ['Fresh take', 'Open mic', 'Sharp tongue', 'Certified menace', 'Crowd favorite', 'Heavy hitter', 'Local legend', 'Class act'];
  let i = 0; while (i < thresholds.length - 1 && xp >= thresholds[i + 1]) i++;
  const next = thresholds[i + 1] ?? null;
  return { level: i + 1, name: names[i], current: thresholds[i], next, progress: next ? Math.min(100, (xp - thresholds[i]) / (next - thresholds[i]) * 100) : 100 };
}
export const BADGES = [
  { id: 'first', name: 'Mic check', description: 'Post your first roast.', earned: s => s.stats.posts >= 1, symbol: '01' },
  { id: 'five', name: 'Regular menace', description: 'Post five roasts.', earned: s => s.stats.posts >= 5, symbol: '05' },
  { id: 'outbid', name: 'Spot stealer', description: 'Win an outbid.', earned: s => s.stats.outbids >= 1, symbol: '↗' },
  { id: 'remix', name: 'Original twist', description: 'Publish a credited remix.', earned: s => s.stats.remixes >= 1, symbol: '↻' },
  { id: 'vote', name: 'Good taste', description: 'Vote in a duel.', earned: s => s.stats.votes >= 1, symbol: 'VS' },
  { id: 'tiles', name: 'Land grab', description: 'Claim three territory tiles.', earned: s => s.stats.tiles >= 3, symbol: '▦' },
  { id: 'quick', name: 'Quick wit', description: 'Finish a Quickfire before the clock runs out.', earned: s => s.stats.quickfires >= 1, symbol: '60' },
  { id: 'streak', name: 'On a roll', description: 'Check in three days in a row.', earned: s => s.checkIn.best >= 3, symbol: '🔥' },
  { id: 'week', name: 'Seven-day menace', description: 'Build a seven-day streak.', earned: s => s.checkIn.best >= 7, symbol: '07' },
  { id: 'curator', name: 'Good company', description: 'Save three different roasts.', earned: s => s.saved.length >= 3, symbol: '★' },
  { id: 'quest', name: 'Side quest', description: 'Claim three quest rewards.', earned: s => s.stats.quests >= 3, symbol: '✓' },
  { id: 'level', name: 'Class act', description: 'Reach level four.', earned: s => s.xp >= 250, symbol: 'IV' },
];
export function questsFor(state, at = Date.now()) {
  const key = dayKey(at); const d = state.daily[key] || {};
  return [
    { id: 'post', name: 'Break the silence', description: 'Post one roast today.', total: 1, value: d.posts || 0, reward: 15 },
    { id: 'vote', name: 'Pick a side', description: 'Vote in one duel today.', total: 1, value: d.votes || 0, reward: 10 },
    { id: 'react', name: 'Spread the fire', description: 'React to three different roasts today.', total: 3, value: (d.reacted || []).length, reward: 10 },
  ].map(q => ({ ...q, claimed: state.questClaims.includes(`${key}:${q.id}`), done: q.value >= q.total }));
}
export function unreadCount(state) { return state.events.filter(e => !state.readEvents.includes(e.id)).length; }
export function timeUntil(expires, at) { const seconds = Math.max(0, Math.ceil((expires - at) / 1000)); return `${Math.floor(seconds / 3600).toString().padStart(2,'0')}:${Math.floor(seconds / 60 % 60).toString().padStart(2,'0')}:${(seconds % 60).toString().padStart(2,'0')}`; }
