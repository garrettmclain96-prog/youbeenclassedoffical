import { BADGES, CARD_THEMES, CATEGORIES, dayKey, questsFor, targetSamples } from './game-rules.mjs';
export const STORAGE_KEY = 'classboard.preview.v2';
export const SEED_POSTS = [
  { id: '501', author: 'FlameKing99', text: 'Your business plan is a Pinterest board with a revenue projection.', bid: 47, heat: 128, category: 'Startup culture', color: 'yellow', age: '2h', created: 6 },
  { id: '500', author: 'RoastMaster', text: 'You call it a side hustle. Your accountant calls it a hobby.', bid: 35, heat: 96, category: 'The daily grind', color: 'purple', age: '3h', created: 5 },
  { id: '499', author: 'ClassActual', text: 'Your Wi-Fi has more connections than your LinkedIn profile.', bid: 28, heat: 84, category: 'Internet behavior', color: 'green', age: '4h', created: 4 },
  { id: '498', author: 'BoardTakr', text: 'Their entire brand strategy is posting “big things coming” every six months.', bid: 22, heat: 67, category: 'Startup culture', color: 'pink', age: '5h', created: 3 },
  { id: '497', author: 'Verdict99', text: 'That meeting could have been an email. That email could have been a thought.', bid: 18, heat: 53, category: 'The daily grind', color: 'blue', age: '6h', created: 2 },
];
export const TARGET = { name: 'DropshipDave', initials: 'DD', category: 'Fictional internet guru', text: 'Fourteen courses. Three ring lights. Still waiting on his first customer.' };
export const TARGET_POSTS = [
  { id: 't1', author: 'FlameKing99', text: 'The only thing he successfully dropships is responsibility.', bid: 30, heat: 91, color: 'yellow', category: 'Daily target', scope: 'target', created: 3 },
  { id: 't2', author: 'RoastMaster', text: 'His refund policy has more plot twists than his success story.', bid: 20, heat: 65, color: 'purple', category: 'Daily target', scope: 'target', created: 2 },
];
export const DUELS = [
  { id: 'd1', label: 'The office roast', sides: [{ author: 'FlameKing99', text: 'Your business has more pivots than a revolving door.', votes: 128, color: 'yellow' }, { author: 'RoastMaster', text: 'Your elevator pitch got off on the first floor.', votes: 115, color: 'purple' }] },
  { id: 'd2', label: 'Chronically online', sides: [{ author: 'ClassActual', text: 'Your screen time report needs its own intervention.', votes: 74, color: 'green' }, { author: 'BoardTakr', text: 'Your personal brand is just three podcasts in a trench coat.', votes: 82, color: 'pink' }] },
];

export const MAX_CREDITS = 500;
const STAT_KEYS = ['posts', 'outbids', 'remixes', 'votes', 'tiles', 'quickfires', 'quests', 'reactions'];
const validText = text => typeof text === 'string' && text.trim().length >= 8 && text.trim().length <= 240;
const validHandle = name => typeof name === 'string' && /^[a-zA-Z0-9_]{3,20}$/.test(name);
const validDay = day => typeof day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day) && Number.isFinite(Date.parse(day)) && new Date(day).toISOString().slice(0, 10) === day;
const validDraftKey = key => typeof key === 'string' && /^(board|target|quickfire):[a-zA-Z0-9_:-]{1,140}$/.test(key);
const isCount = n => Number.isSafeInteger(n) && n >= 0 && n <= 1000000;
const safeList = (a, max = 500) => [...new Set((Array.isArray(a) ? a : []).filter(x => typeof x === 'string' && x.length <= 180))].slice(0, max);

export function initialState() {
  return { version: 3, balance: 100, handle: 'GuestRoaster', posts: [], hidden: [], likes: [], saved: [], votes: {}, tiles: {}, events: [], xp: 0, stats: Object.fromEntries(STAT_KEYS.map(k => [k, 0])), badges: {}, muted: [], drafts: {}, theme: 'acid', checkIn: { last: '', streak: 0, best: 0 }, daily: {}, questClaims: [], readEvents: [], seq: 0 };
}
export function boardPosts(state, scope = 'board', at = Date.now()) {
  const day = dayKey(at);
  return [...state.posts.filter(p => (p.scope || 'board') === scope && !p.archived && (scope !== 'target' || p.targetDay === day)), ...(scope === 'target' ? targetSamples(at) : SEED_POSTS)]
    .filter(p => !state.hidden.includes(p.id) && (p.own || !state.muted.includes(p.author)));
}
export function tileAt(state, id) {
  if (state.tiles[id]) return { ...state.tiles[id], owner: state.handle };
  const owned = [0, 1, 2, 6, 7, 8, 13, 14, 20, 21, 22, 28, 29, 35, 40, 41];
  if (!owned.includes(id)) return { owner: null, bid: 10, color: 'empty' };
  const person = SEED_POSTS[Math.floor(id / 7) % SEED_POSTS.length];
  return { owner: person.author, bid: 10 + (id % 5) * 5, color: person.color };
}
function record(state, at, kind, message) {
  const seq = state.seq + 1;
  return { ...state, seq, events: [{ id: `event-${seq}`, message, kind, at }, ...state.events].slice(0, 80) };
}
function finish(state, at, kind, message, notification = message) {
  let next = record(state, at, kind, message);
  const earned = BADGES.filter(b => !next.badges[b.id] && b.earned(next));
  for (const badge of earned) {
    next = { ...next, badges: { ...next.badges, [badge.id]: at } };
    next = record(next, at, 'badge', `Unlocked ${badge.name}.`);
  }
  return { state: next, message: earned.length ? `${notification} Badge unlocked: ${earned.map(b => b.name).join(', ')}.` : notification };
}
function progress(state, at, changes = {}) {
  const key = dayKey(at);
  const before = state.daily[key] || { posts: 0, votes: 0, reacted: [] };
  const daily = { ...state.daily, [key]: { ...before, ...changes } };
  return { ...state, daily: Object.fromEntries(Object.entries(daily).sort(([a], [b]) => a.localeCompare(b)).slice(-35)) };
}
export function applyAction(state, action) {
  const fail = error => ({ state, error });
  if (!action || typeof action !== 'object') return fail('That action is unavailable.');
  const at = action.at ?? Date.now();
  if (!Number.isFinite(at) || at < 0 || at > 1e13) return fail('Your device clock needs checking.');
  const day = dayKey(at);
  if (action.type === 'profile') {
    if (!validHandle(action.handle)) return fail('Use 3–20 letters, numbers, or underscores.');
    return finish({ ...state, handle: action.handle }, at, 'profile', `Your handle is now @${action.handle}.`);
  }
  if (action.type === 'post') {
    if (!validText(action.text)) return fail('Write a roast between 8 and 240 characters.');
    if (!action.id || typeof action.id !== 'string' || action.id.length > 160 || state.posts.some(p => p.id === action.id) || SEED_POSTS.some(p => p.id === action.id)) return fail('This roast is already on the board or needs a new ID.');
    if (state.posts.length >= 300) return fail('Your local collection is full. Export a backup before starting a fresh browser profile.');
    const scope = action.scope === 'target' ? 'target' : 'board';
    if (scope === 'target' && action.targetDay && action.targetDay !== day) return fail('This daily target has changed. Your draft is safe; enter it as a normal roast instead.');
    const all = [...boardPosts(state, scope, at)];
    const target = action.targetId && all.find(p => p.id === action.targetId);
    if (action.targetId && !target) return fail('That spot changed. Pick another roast to challenge.');
    const min = target ? target.bid + 5 : 10;
    if (!Number.isSafeInteger(action.bid) || action.bid < min) return fail(`This spot needs at least ${min} credits.`);
    if (action.bid > state.balance) return fail('Not enough practice credits. Try a lower bid or claim an earned reward.');
    const remix = action.remixId ? [...boardPosts(state, 'board', at), ...boardPosts(state, 'target', at), ...state.posts].find(p => p.id === action.remixId) : action.remixSource && validText(action.remixSource.text) && validHandle(action.remixSource.author) ? { text:action.remixSource.text, author:action.remixSource.author } : null;
    if (action.remixId && !remix) return fail('The original roast is no longer available. Save this as an original instead.');
    if (remix && remix.text.trim().toLowerCase() === action.text.trim().toLowerCase()) return fail('A remix needs your own twist. Change the original line first.');
    const draft = action.draftKey && state.drafts[action.draftKey];
    if (action.quickfire && (!draft?.deadline || at > draft.deadline || at < draft.deadline - 60000)) return fail('Time’s up. Save this as a normal draft or start another round.');
    const post = { id: action.id, text: action.text.trim(), author: state.handle, bid: action.bid, heat: 0, color: 'yellow', category: scope === 'target' ? 'Daily target' : CATEGORIES.includes(action.category) ? action.category : CATEGORIES[0], scope, own: true, created: at, age: 'just now', targetDay: scope === 'target' ? day : undefined, remix: remix ? { author: remix.author, text: remix.text } : undefined, quickfire: !!action.quickfire };
    const stats = { ...state.stats, posts: state.stats.posts + 1, outbids: state.stats.outbids + (target ? 1 : 0), remixes: state.stats.remixes + (remix ? 1 : 0), quickfires: state.stats.quickfires + (action.quickfire ? 1 : 0) };
    const drafts = { ...state.drafts }; if (action.draftKey) delete drafts[action.draftKey];
    const before = state.daily[day] || {};
    const next = progress({ ...state, balance: state.balance - action.bid, xp: state.xp + action.bid + (remix ? 15 : 0) + (action.quickfire ? 25 : 0), stats, drafts, posts: [post, ...state.posts], hidden: target ? [...state.hidden, target.id] : state.hidden }, at, { posts: (before.posts || 0) + 1 });
    return finish(next, at, action.quickfire ? 'quickfire' : remix ? 'remix' : 'post', target ? `You took a spot for ${action.bid} credits.` : remix ? `You remixed @${remix.author} for ${action.bid} credits.` : 'Your roast joined the board.', action.quickfire ? 'Beat the clock. Quick wit wins.' : target ? 'Spot taken. That’s how you get classed.' : 'You’re on the board.');
  }
  if (action.type === 'like' || action.type === 'save') {
    if (![...boardPosts(state, 'board', at), ...boardPosts(state, 'target', at)].some(p => p.id === action.postId)) return fail('That roast is no longer on the board.');
    const key = action.type === 'like' ? 'likes' : 'saved'; const active = state[key].includes(action.postId);
    let next = { ...state, [key]: active ? state[key].filter(id => id !== action.postId) : [...state[key], action.postId] };
    if (action.type === 'like' && !active) {
      const reacted = safeList([...(state.daily[day]?.reacted || []), action.postId]);
      next = progress({ ...next, stats: { ...state.stats, reactions: state.stats.reactions + 1 } }, at, { reacted });
    }
    return finish(next, at, action.type, action.type === 'save' ? active ? 'Removed a roast from your saved collection.' : 'Saved a roast for a rainy day.' : active ? 'Removed a fire reaction.' : 'Gave a roast some fire.');
  }
  if (action.type === 'vote') {
    if (!DUELS.some(d => d.id === action.duelId) || ![0, 1].includes(action.side)) return fail('Choose one of the two roasts.');
    if (Object.hasOwn(state.votes, action.duelId)) return fail('You already voted in this duel.');
    const next = progress({ ...state, xp: state.xp + 5, stats: { ...state.stats, votes: state.stats.votes + 1 }, votes: { ...state.votes, [action.duelId]: action.side } }, at, { votes: (state.daily[day]?.votes || 0) + 1 });
    return finish(next, at, 'vote', 'You cast your duel vote.', 'Vote locked in. Good taste.');
  }
  if (action.type === 'claim') {
    if (!Number.isInteger(action.tileId) || action.tileId < 0 || action.tileId >= 48) return fail('Choose a valid tile.');
    const tile = tileAt(state, action.tileId);
    if (tile.own) return fail('You already own this spot.');
    const cost = tile.owner ? tile.bid + 5 : 10;
    if (cost > state.balance) return fail('Not enough practice credits for this tile.');
    return finish({ ...state, balance: state.balance - cost, xp: state.xp + 10, stats: { ...state.stats, tiles: state.stats.tiles + 1 }, tiles: { ...state.tiles, [action.tileId]: { owner: state.handle, bid: cost, color: 'yellow', own: true } } }, at, 'territory', `You claimed tile ${action.tileId + 1} for ${cost} credits.`);
  }
  if (action.type === 'checkIn') {
    if (state.checkIn.last >= day) return fail('Today’s check-in is already claimed. Come back after midnight UTC.');
    if (state.balance === MAX_CREDITS) return fail('Your wallet is full. Spend some practice credits first.');
    const consecutive = state.checkIn.last === dayKey(at - 86400000);
    const streak = consecutive ? state.checkIn.streak + 1 : 1;
    const reward = Math.min(MAX_CREDITS - state.balance, 20 + Math.min(streak - 1, 6) * 2);
    return finish({ ...state, xp: state.xp + 10, balance: state.balance + reward, checkIn: { last: day, streak, best: Math.max(streak, state.checkIn.best) } }, at, 'reward', `${streak}-day streak. Claimed ${reward} practice credits.`);
  }
  if (action.type === 'quest') {
    const quest = questsFor(state, at).find(q => q.id === action.questId);
    if (!quest?.done) return fail('Finish this quest before claiming the reward.');
    if (quest.claimed) return fail('You already claimed this quest reward today.');
    if (state.balance === MAX_CREDITS) return fail('Your wallet is full. Spend some practice credits first.');
    const reward = Math.min(MAX_CREDITS - state.balance, quest.reward);
    return finish({ ...state, balance: state.balance + reward, xp: state.xp + 15, stats: { ...state.stats, quests: state.stats.quests + 1 }, questClaims: [...state.questClaims, `${day}:${quest.id}`].slice(-200) }, at, 'reward', `Quest complete: ${quest.name}. +${reward} practice credits.`);
  }
  if (action.type === 'draft') {
    if (!validDraftKey(action.key) || typeof action.text !== 'string' || action.text.length > 240) return fail('This draft could not be saved.');
    const next = { ...state.drafts };
    if (!action.text && !action.deadline) delete next[action.key];
    else next[action.key] = { text: action.text, bid: String(action.bid ?? 10).slice(0, 4), category: CATEGORIES.includes(action.category) ? action.category : CATEGORIES[0], scope: action.scope === 'target' ? 'target' : 'board', targetId: typeof action.targetId === 'string' ? action.targetId : '', remixId: typeof action.remixId === 'string' ? action.remixId : '', deadline: Number.isFinite(action.deadline) ? action.deadline : 0, updated: at };
    if (next[action.key] && action.remixSource && validText(action.remixSource.text) && validHandle(action.remixSource.author)) next[action.key].remixSource = { text:action.remixSource.text, author:action.remixSource.author };
    return { state: { ...state, drafts: Object.fromEntries(Object.entries(next).sort(([,a],[,b]) => b.updated - a.updated).slice(0, 20)) } };
  }
  if (action.type === 'discardDraft') { const drafts = { ...state.drafts }; delete drafts[action.key]; return { state: { ...state, drafts }, message: 'Draft removed.' }; }
  if (action.type === 'edit' || action.type === 'archive' || action.type === 'restorePost') {
    const post = state.posts.find(p => p.id === action.postId && p.own);
    if (!post) return fail('You can only manage your own roasts.');
    if (action.type === 'edit' && !validText(action.text)) return fail('Write a roast between 8 and 240 characters.');
    if (action.type === 'restorePost' && post.scope === 'target' && post.targetDay !== day) return fail('This target’s day has ended. Remix your line into a new board roast instead.');
    if (action.type === 'restorePost' && state.hidden.includes(post.id)) return fail('Another roast holds that spot now. Remix your old line to enter again.');
    const posts = state.posts.map(p => p.id !== post.id ? p : action.type === 'edit' ? { ...p, text: action.text.trim(), edited: true } : { ...p, archived: action.type === 'archive' });
    return finish({ ...state, posts }, at, 'manage', action.type === 'edit' ? 'Your roast was edited.' : action.type === 'archive' ? 'Roast archived. You can restore it in your clubhouse; credits are not refunded.' : 'Your roast is back on the board.');
  }
  if (action.type === 'mute' || action.type === 'unmute') {
    if (!validHandle(action.author) || action.author === state.handle) return fail('Choose another roaster to mute.');
    return finish({ ...state, muted: action.type === 'mute' ? safeList([...state.muted, action.author], 100) : state.muted.filter(n => n !== action.author) }, at, 'settings', action.type === 'mute' ? `Muted @${action.author} in your feeds.` : `Unmuted @${action.author}.`);
  }
  if (action.type === 'theme') {
    if (!CARD_THEMES.some(t => t.id === action.theme)) return fail('Choose one of the four card themes.');
    return { state: { ...state, theme: action.theme }, message: 'Your next share card has a new look.' };
  }
  if (action.type === 'markRead') return { state: { ...state, readEvents: state.events.map(e => e.id) } };
  return fail('That action is unavailable.');
}

function decodeState(s) {
  if (!s || ![2,3].includes(s.version) || !Number.isSafeInteger(s.balance) || s.balance < 0 || s.balance > (s.version === 2 ? 100 : MAX_CREDITS) || !validHandle(s.handle)) return null;
  if (['posts', 'hidden', 'likes', 'saved', 'events'].some(k => !Array.isArray(s[k])) || !s.votes || typeof s.votes !== 'object' || Array.isArray(s.votes) || !s.tiles || typeof s.tiles !== 'object' || Array.isArray(s.tiles)) return null;
  const clean = initialState();
  clean.balance = s.balance; clean.handle = s.handle;
  clean.posts = s.posts.filter(p => p && typeof p.id === 'string' && p.id.length < 160 && validText(p.text) && validHandle(p.author) && Number.isSafeInteger(p.bid) && p.bid >= 10 && p.bid <= MAX_CREDITS && Number.isFinite(p.created) && p.created >= 0 && p.created < 1e13).slice(0,300).map(p => ({ id: p.id, text: p.text, author: p.author, bid: p.bid, created: p.created, own: true, color: 'yellow', heat: 0, age: 'just now', scope: p.scope === 'target' ? 'target' : 'board', targetDay: p.scope === 'target' ? validDay(p.targetDay) ? p.targetDay : dayKey(p.created) : undefined, category: p.scope === 'target' ? 'Daily target' : CATEGORIES.includes(p.category) ? p.category : CATEGORIES[0], archived: !!p.archived, edited: !!p.edited, quickfire: !!p.quickfire, remix: p.remix && validHandle(p.remix.author) && validText(p.remix.text) ? { author: p.remix.author, text: p.remix.text } : undefined }));
  clean.posts = [...new Map(clean.posts.map(p => [p.id,p])).values()];
  for (const key of ['hidden', 'likes', 'saved']) clean[key] = safeList(s[key]);
  clean.votes = Object.fromEntries(Object.entries(s.votes).filter(([id, side]) => DUELS.some(d => d.id === id) && [0,1].includes(side)));
  clean.tiles = Object.fromEntries(Object.entries(s.tiles).filter(([id,t]) => /^\d{1,2}$/.test(id) && Number(id) < 48 && t && validHandle(t.owner) && Number.isSafeInteger(t.bid) && t.bid >= 10 && t.bid <= MAX_CREDITS).map(([id,t]) => [Number(id), { owner:t.owner, bid:t.bid, own:true, color:'yellow' }]));
  clean.events = s.events.filter(e => e && typeof e.id === 'string' && typeof e.message === 'string' && Number.isFinite(e.at) && e.at >= 0 && e.at < 1e13).slice(0,80).map(e => ({ id:e.id.slice(0,160), message:e.message.slice(0,400), at:e.at, kind:typeof e.kind === 'string' ? e.kind.slice(0,20) : 'activity' }));
  const oldXP = clean.posts.reduce((n,p) => n+p.bid,0) + Object.keys(clean.votes).length*5 + Object.keys(clean.tiles).length*10;
  clean.xp = isCount(s.xp) ? s.xp : oldXP;
  clean.stats = Object.fromEntries(STAT_KEYS.map(k => [k, isCount(s.stats?.[k]) ? s.stats[k] : k === 'posts' ? clean.posts.length : k === 'votes' ? Object.keys(clean.votes).length : k === 'tiles' ? Object.keys(clean.tiles).length : 0]));
  clean.muted = safeList(s.muted,100).filter(validHandle);
  clean.theme = CARD_THEMES.some(t => t.id === s.theme) ? s.theme : 'acid';
  if (s.checkIn && (s.checkIn.last === '' || validDay(s.checkIn.last)) && isCount(s.checkIn.streak) && isCount(s.checkIn.best)) clean.checkIn = { last:s.checkIn.last, streak:s.checkIn.streak, best:Math.max(s.checkIn.best,s.checkIn.streak) };
  if (s.daily && typeof s.daily === 'object' && !Array.isArray(s.daily)) clean.daily = Object.fromEntries(Object.entries(s.daily).filter(([day,d]) => validDay(day) && d && typeof d === 'object').sort(([a],[b]) => a.localeCompare(b)).slice(-35).map(([day,d]) => [day, { posts:isCount(d.posts) ? d.posts : 0, votes:isCount(d.votes) ? d.votes : 0, reacted:safeList(d.reacted,300) }]));
  clean.questClaims = safeList(s.questClaims,200).filter(v => /^\d{4}-\d{2}-\d{2}:(post|vote|react)$/.test(v));
  clean.readEvents = safeList(s.readEvents,80);
  clean.seq = Math.max(isCount(s.seq) ? s.seq : 0, clean.events.length, ...clean.events.map(e => /^event-\d+$/.test(e.id) && isCount(Number(e.id.slice(6))) ? Number(e.id.slice(6)) : 0));
  if (s.drafts && typeof s.drafts === 'object' && !Array.isArray(s.drafts)) clean.drafts = Object.fromEntries(Object.entries(s.drafts).filter(([key,d]) => validDraftKey(key) && d && typeof d.text === 'string' && d.text.length <= 240 && Number.isFinite(d.updated) && d.updated >= 0 && d.updated < 1e13).slice(0,20).map(([key,d]) => [key, { text:d.text, bid:String(d.bid ?? 10).slice(0,4), scope:d.scope === 'target' ? 'target' : 'board', category:CATEGORIES.includes(d.category) ? d.category : CATEGORIES[0], updated:d.updated, targetId:typeof d.targetId === 'string' ? d.targetId.slice(0,160) : '', remixId:typeof d.remixId === 'string' ? d.remixId.slice(0,160) : '', deadline:Number.isFinite(d.deadline) && d.deadline > 0 && d.deadline < 1e13 ? d.deadline : 0, remixSource:d.remixSource && validText(d.remixSource.text) && validHandle(d.remixSource.author) ? {text:d.remixSource.text,author:d.remixSource.author} : undefined }]));
  for (const b of BADGES) if ((s.badges && Number.isFinite(s.badges[b.id]) && s.badges[b.id] >= 0 && s.badges[b.id] < 1e13) || b.earned(clean)) clean.badges[b.id] = Number.isFinite(s.badges?.[b.id]) ? s.badges[b.id] : 0;
  return clean;
}
export function restoreState(raw) { try { return decodeState(JSON.parse(raw)) || initialState(); } catch { return initialState(); } }
export function exportBackup(state, at = Date.now()) { return JSON.stringify({ format:'classboard-backup', version:3, exportedAt:new Date(at).toISOString(), state }, null, 2); }
export function parseBackup(text) {
  if (typeof text !== 'string' || text.length > 2000000) return { error:'Choose a Class Board JSON backup under 2 MB.' };
  try {
    const data = JSON.parse(text);
    if (data?.format !== 'classboard-backup' || data.version !== 3) return { error:'This is not a supported Class Board backup.' };
    const state = decodeState(data.state);
    return state ? { state } : { error:'This backup has invalid data. Your current progress is unchanged.' };
  } catch { return { error:'This file is not valid JSON. Your current progress is unchanged.' }; }
}
