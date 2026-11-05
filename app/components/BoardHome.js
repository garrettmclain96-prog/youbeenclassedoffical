'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Asterisk, Check, Crosshair, Flame, Search, Swords, Trophy, X } from 'lucide-react';
import { boardPosts, SEED_POSTS } from '../lib/board-state.mjs';
import { useBoard, useClock } from './BoardProvider';
import { CATEGORIES, dailyTarget, timeUntil } from '../lib/game-rules.mjs';
import { PlayDeck } from './Clubhouse';
import { PostButton } from './BoardShell';
import { Avatar, RoastCard } from './RoastCard';
export function TargetCard() {
  const { now, ready }=useBoard();const clock=useClock();const target=dailyTarget(now);
  return <div className="target-card"><div className="target-card-label"><span><span className="status-dot"/>TODAY’S TARGET</span><Crosshair size={17}/></div><span className="fiction-label">A FICTIONAL CHARACTER · {target.day}</span><div className="target-face" aria-hidden="true"><span>⌐■_■</span><Asterisk size={80} strokeWidth={1}/></div><h3 className={target.first.length>9?'long-target':''}>{target.first}<br/>{target.last}<span>™</span></h3><p>{target.text}</p><div className="target-reset"><span>NEXT TARGET IN</span><strong>{ready&&clock?timeUntil(target.expires,clock):'--:--:--'}</strong></div><Link className="button button-black" href="/target">Take your shot<ArrowUpRight size={18}/></Link><span className="target-card-foot">{target.tag}</span></div>;
}
export function MiniLeaderboard() {
  const { state } = useBoard();
  const rows = SEED_POSTS.slice(0, 3).map((p, i) => ({ name: p.author, points: [247, 183, 152][i], color: p.color }));
  const ownScore = state.xp;
  if (ownScore > 0) rows.push({ name: state.handle, points: ownScore, color: 'yellow' });
  rows.sort((a, b) => b.points - a.points);
  return <section className="mini-leaderboard"><div className="side-heading"><h3>THE HEAVY HITTERS</h3><Trophy size={17} /></div><p className="side-subtitle">Example rankings + your local score</p>{rows.slice(0, 3).map((p, i) => <div className="mini-leader-row" key={`${p.name}-${i}`}><span className="mini-rank">{String(i + 1).padStart(2, '0')}</span><Avatar name={p.name} color={p.color} /><strong>{p.name}</strong><span>{p.points}<small> XP</small></span></div>)}<Link className="side-link" href="/leaderboard">See the whole leaderboard<ArrowRight size={15} /></Link></section>;
}
function Hero() {
  const { openDialog } = useBoard();
  return <section className="board-hero"><div className="hero-copy"><span className="eyebrow"><span className="status-dot" />THE INTERNET NEEDED A COMEBACK.</span><h1>BIG TALK.<br /><span>BIGGER</span><br />COMEBACKS<span className="hero-period">.</span></h1><p>A board for your best shots. Roast a take, steal a spot,<br className="desktop-break" /> and give the internet something worth sharing.</p><div className="hero-buttons"><PostButton /><button className="how-button" onClick={() => openDialog({ kind: 'rules' })}>How it works<ArrowUpRight size={15} /></button></div><span className="hero-fine"><Check size={13} />100 free practice credits. No wallet required.</span></div><div className="hero-art" aria-label="Featured example roast"><div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" /><span className="art-label">FOUND IN THE WILD ↘</span><div className="roast-ticket"><div className="ticket-heading"><span>OFFICIALLY<br />UNOFFICIAL.</span><Asterisk size={34} strokeWidth={2.5} /></div><span className="ticket-quote-mark">“</span><p>YOUR BUSINESS<br />PLAN IS A<br /><em>PINTEREST<br />BOARD.</em></p><div className="ticket-bottom"><span>@FLAMEKING99</span><span>CLASS A<span className="ticket-star">✳</span></span></div><div className="ticket-barcode" /></div><div className="hero-sticker"><span>THAT’S</span><strong>CLASS.</strong><ArrowUpRight size={19} /></div></div></section>;
}
export default function BoardHome() {
  const { state, openDialog, now } = useBoard();
  const [topic, setTopic] = useState('All topics');
  useEffect(()=>{ const search=()=>setSearching(true); if(new URLSearchParams(window.location.search).get('search')==='1')setSearching(true);window.addEventListener('classboard:search',search);return()=>window.removeEventListener('classboard:search',search);},[]);
  const [tab, setTab] = useState('Trending'); const [query, setQuery] = useState(''); const [searching, setSearching] = useState(false);
  const posts = useMemo(() => {
    let all = boardPosts(state, 'board', now);
    if(topic !== 'All topics') all = all.filter(p=>p.category===topic);
    if (tab === 'Saved') all = all.filter(p => state.saved.includes(p.id));
    if (tab === 'Yours') all = all.filter(p => p.own);
    if (query.trim()) all = all.filter(p => `${p.text} ${p.author} ${p.category}`.toLowerCase().includes(query.trim().toLowerCase()));
    return [...all].sort((a, b) => tab === 'Newest' || tab === 'Yours' ? b.created - a.created : b.bid - a.bid);
  }, [state, tab, query, topic, now]);
  return <><Hero /><div className="word-strip" aria-hidden="true"><span>TAKE A SHOT.</span><Asterisk /><span>TAKE A SPOT.</span><Asterisk /><span>GET CLASSED.</span><Asterisk /><span>REPEAT.</span><Asterisk /></div>
    <PlayDeck/><div className="content-grid" id="board"><section className="board-feed"><div className="section-title"><div><span className="eyebrow">THE GOOD. THE BAD. THE UNCALLED-FOR.</span><h2>ON THE BOARD<span className="small-count">{boardPosts(state).length.toString().padStart(2, '0')}</span></h2></div><button className={`icon-button search-toggle ${searching ? 'is-active' : ''}`} aria-label={searching ? 'Close search' : 'Search roasts'} aria-expanded={searching} onClick={() => { setSearching(!searching); setQuery(''); }}>{searching ? <X size={20} /> : <Search size={20} />}</button></div>
      <div className="feed-toolbar"><div className="feed-tabs" role="tablist" aria-label="Filter roasts" onKeyDown={e => { const tabs = ["Trending", "Newest", "Saved", "Yours"]; let next; if (e.key === "ArrowRight") next = (tabs.indexOf(tab) + 1) % tabs.length; if (e.key === "ArrowLeft") next = (tabs.indexOf(tab) + tabs.length - 1) % tabs.length; if (e.key === "Home") next = 0; if (e.key === "End") next = tabs.length - 1; if (next !== undefined) { e.preventDefault(); setTab(tabs[next]); e.currentTarget.querySelectorAll("button")[next].focus(); } }}>{['Trending', 'Newest', 'Saved', 'Yours'].map(t => <button key={t} role="tab" tabIndex={tab === t ? 0 : -1} id={`tab-${t}`} aria-controls="roast-feed" aria-selected={tab === t} onClick={() => setTab(t)}>{t === 'Trending' && <Flame size={14} />}{t}</button>)}</div><span className="sample-label">EXAMPLE BOARD</span></div>
      <div className="topic-filters" role="group" aria-label="Roast topics">{['All topics',...CATEGORIES].map(c=><button key={c} aria-pressed={topic===c} onClick={()=>setTopic(c)}>{c}</button>)}</div>{state.muted.length>0&&<Link className="muted-notice" href="/profile#settings">{state.muted.length} roaster{state.muted.length===1?'':'s'} hidden · Manage mutes<ArrowRight size={12}/></Link>}
      {searching && <div className="search-field"><Search size={17} /><input type="search" autoFocus aria-label="Search text or author" value={query} onChange={e => setQuery(e.target.value)} placeholder="Find a roast, a roaster, a terrible take…" /></div>}
      <div id="roast-feed" role="tabpanel" aria-labelledby={`tab-${tab}`} className="roast-feed">{posts.length ? posts.map((post, i) => <RoastCard key={post.id} post={post} rank={i + 1} />) : <div className="empty-state"><Asterisk size={38} /><h3>{query ? 'NO TAKES FOUND.' : tab === 'Saved' ? 'KEEP THE GOOD ONES.' : 'THE MIC IS YOURS.'}</h3><p>{query ? 'Try a different word or author.' : tab === 'Saved' ? 'Tap the bookmark on a roast to save it here.' : 'Your first roast deserves a spot right here.'}</p>{!query && tab !== 'Saved' && <PostButton />}</div>}</div>
      <div className="feed-end"><span>YOU’VE SEEN THE COMPETITION.</span><h3>GOT A BETTER ONE?</h3><PostButton>Prove it</PostButton><p>Keep it clever. We’re all here for a laugh.</p></div>
    </section><aside className="board-sidebar"><TargetCard /><MiniLeaderboard /><Link href="/duels" className="duel-teaser"><span className="duel-teaser-icon"><Swords size={26} /></span><div><span className="eyebrow">TWO ROASTS. ONE WINNER.</span><h3>SETTLE IT IN THE ARENA.</h3><span>Cast your vote<ArrowRight size={15} /></span></div></Link><button className="house-rules" onClick={() => openDialog({ kind: 'rules' })}><span>BE FUNNY.<br /><strong>DON’T BE THAT GUY.</strong></span><ArrowUpRight size={20} /></button></aside></div>
    <section className="how-section" id="how-to-play"><span className="eyebrow">ZERO COMPLICATED RULES.</span><h2>ALL YOU NEED IS<br /><em>A BETTER COMEBACK.</em></h2><div className="how-grid">{[['01', 'SAY YOUR PIECE.', 'Drop an original roast. Give a terrible take the attention it deserves.'], ['02', 'TAKE YOUR SPOT.', 'Back your words with practice credits. Outbid a roast to take its place.'], ['03', 'MAKE THE ROUNDS.', 'React, vote, and turn your best line into a share card. Give your group chat something good.']].map(([n, title, description]) => <div key={n}><span>{n}<ArrowUpRight size={19} /></span><h3>{title}</h3><p>{description}</p></div>)}</div></section>
  </>;
}
