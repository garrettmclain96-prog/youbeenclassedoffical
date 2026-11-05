'use client';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowUpRight, Asterisk, Coins, Flame, Swords, Target, Trophy, Map, Bell, Command } from 'lucide-react';
import { useBoard } from './BoardProvider';
import { DialogHost } from './Dialogs';
import { unreadCount } from '../lib/game-rules.mjs';
import { parseRoastLink } from '../lib/share-link.mjs';

const NAV = [{ href: '/', text: 'The board', Icon: Flame }, { href: '/duels', text: 'Duels', Icon: Swords }, { href: '/target', text: 'Daily target', Icon: Target }, { href: '/leaderboard', text: 'Leaderboard', Icon: Trophy }, { href: '/territory', text: 'Territory', Icon: Map }];
export function Logo() { return <Link href="/" className="brand" aria-label="The Class Board home"><span className="brand-icon"><Asterisk size={31} strokeWidth={3} /></span><span>THE CLASS BOARD<small>YOU BEEN CLASSED.</small></span></Link>; }
export function BoardShell({ children }) {
  const path = usePathname(); const router = useRouter(); const linkHandled = useRef(false);
  const { state, ready, storageAvailable, openDialog, closeDialog, notify } = useBoard();
  const unread = unreadCount(state);
  useEffect(() => {
    if (!ready) return;
    const keyboard = e => {
      if (document.querySelector('dialog[open]')) return;
      const typing = e.target instanceof HTMLElement && e.target.closest('input,textarea,select,[contenteditable=true]');
      const command = e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey || !typing);
      if (command) { e.preventDefault(); openDialog({kind:'commands'}); return; }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key.toLowerCase() === 'n') { e.preventDefault(); openDialog({kind:'post'}); }
      if (e.key === '?') { e.preventDefault(); openDialog({kind:'commands'}); }
      if (e.key === '/') { e.preventDefault(); if (path === '/') window.dispatchEvent(new Event('classboard:search')); else router.push('/?search=1#board'); }
    };
    window.addEventListener('keydown',keyboard);return () => window.removeEventListener('keydown',keyboard);
  },[ready,path,router,openDialog]);
  useEffect(() => {
    if (!ready || linkHandled.current) return; linkHandled.current = true;
    const shared = parseRoastLink(window.location.search);
    if (shared) openDialog({kind:'shared',post:shared});
    else if (new URLSearchParams(window.location.search).has('roast')) notify('This roast link is incomplete or unsupported. Your local progress is unchanged.');
  },[ready,openDialog,notify]);
  return <>
    <a href="#main" className="skip-link">Skip to content</a>
    <header className="site-header"><div className="header-inner">
      <Logo />
      <nav className="desktop-navigation" aria-label="Main navigation">{NAV.slice(0, 4).map(({ href, text }) => <Link key={href} href={href} aria-current={path === href ? 'page' : undefined}>{text}{href === '/target' && <span className="nav-dot" />}</Link>)}</nav>
      <div className="header-actions"><button className="icon-button desktop-tool" disabled={!ready} onClick={()=>openDialog({kind:"commands"})} aria-label="Open command palette"><Command size={18}/></button><button className="icon-button inbox-button" onClick={()=>openDialog({kind:"activity"})} aria-label={`Activity inbox, ${unread} unread`}><Bell size={18}/>{unread>0&&<span>{Math.min(99,unread)}</span>}</button><button className="wallet" onClick={() => openDialog({ kind: 'wallet' })} aria-label={`${state.balance} practice credits. About your wallet`}><Coins size={16} /><span>{ready ? state.balance : '—'}</span><small>CR</small></button><Link className="profile-avatar" href="/profile" aria-label="Open your clubhouse">{state.handle.slice(0, 2).toUpperCase()}</Link></div>
    </div></header>
    <div className="preview-strip"><div><span className="status-dot" /><strong>THE PLAYGROUND IS OPEN</strong><span className="preview-desktop">Practice credits. Real comebacks.</span><button onClick={() => openDialog({ kind: 'about' })}>Preview mode <ArrowUpRight size={12} /></button></div></div>
    {!storageAvailable && <p className="storage-warning" role="status">Browser storage is off. Your changes will last only for this visit.</p>}
    <main id="main" className="site-main">{children}</main>
    <footer className="site-footer"><div><Logo /><p>A little competition. A lot of character.</p></div><div><button onClick={() => openDialog({ kind: 'rules' })}>The house rules <ArrowUpRight size={13} /></button><button onClick={() => openDialog({kind:"features"})}>Explore all 17 additions <ArrowUpRight size={13}/></button><button onClick={() => openDialog({ kind: 'about' })}>About the playground <ArrowUpRight size={13} /></button><span>© {new Date().getFullYear()} YouBeenClassed™</span></div></footer>
    <nav className="mobile-navigation" aria-label="Mobile navigation">{NAV.map(({ href, text, Icon }) => <Link key={href} href={href} aria-current={path === href ? 'page' : undefined}><Icon size={21} strokeWidth={path === href ? 2.5 : 1.7} /><span>{text === 'Leaderboard' ? 'Ranks' : text === 'Daily target' ? 'Target' : text === 'The board' ? 'Board' : text}</span></Link>)}</nav>
    <DialogHost />
  </>;
}
export function PostButton({ children = 'Drop a roast', className = '', target, scope = 'board' }) {
  const { ready, openDialog } = useBoard();
  return <button disabled={!ready} className={`button button-yellow ${className}`} onClick={() => openDialog({ kind: 'post', target, scope })}>{children}<ArrowUpRight size={18} /></button>;
}
export function SectionIntro({ eyebrow, title, description, children }) { return <div className="page-intro"><div><span className="eyebrow"><span className="status-dot" />{eyebrow}</span><h1>{title}</h1>{description && <p>{description}</p>}</div>{children}</div>; }
