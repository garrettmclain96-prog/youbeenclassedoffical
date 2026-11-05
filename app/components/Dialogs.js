'use client';
import { useState } from 'react';
import { ArrowUpRight, Check, Coins, LoaderCircle, Sparkles, X } from 'lucide-react';
import { useBoard } from './BoardProvider';
import { Modal } from './Modal';
import { Compose } from './Compose';
import { ExtraDialog } from './DialogExtras';

function Profile({ onClose }) {
  const { state, act } = useBoard();
  const [handle, setHandle] = useState(state.handle);
  return <Modal title="MAKE A NAME." onClose={onClose}><p className="modal-description">A good roast deserves a recognizable signature.</p><form onSubmit={e => { e.preventDefault(); if (act({ type: 'profile', handle })) onClose(); }}><label htmlFor="profile-handle" className="field-label">Your handle</label><input className="text-input" id="profile-handle" autoFocus required pattern="[a-zA-Z0-9_]{3,20}" minLength={3} maxLength={20} value={handle} onChange={e => setHandle(e.target.value)} /><p className="field-hint">3–20 letters, numbers, or underscores. This is a local profile, not a registered account.</p><button className="button button-yellow full-width">Save my handle<ArrowUpRight size={18} /></button></form></Modal>;
}
export function DialogHost() {
  const { dialog, closeDialog, state } = useBoard();
  if (!dialog) return null;
  if (dialog.kind === 'post') return <Compose key={`${dialog.draftKey || dialog.target?.id || dialog.remix?.id || 'new'}-${dialog.scope}-${!!dialog.quickfire}`} dialog={dialog} onClose={closeDialog} />;
  if (['features','activity','commands','edit','share','shared'].includes(dialog.kind)) return <ExtraDialog dialog={dialog} onClose={closeDialog} />;
  if (dialog.kind === 'profile') return <Profile onClose={closeDialog} />;
  if (dialog.kind === 'wallet') return <Modal title="BIG TALK. ZERO CASH." onClose={closeDialog}><div className="wallet-total"><Coins size={35} />{state.balance}<span>practice credits left</span></div><p className="modal-description">You start with 100 practice credits. Use them to post, outbid a roast, or claim territory. Earn more through daily check-ins and quests (wallet limit: 500). These credits have no monetary value and cannot be purchased or redeemed.</p><div className="note-box">This is your local playground. Posts and votes stay on this browser; they are not published to other players.</div><button className="button button-yellow full-width" onClick={closeDialog}>Got it<Check size={17} /></button></Modal>;
  if (dialog.kind === 'rules') return <Modal title="A FEW HOUSE RULES." onClose={closeDialog}><ol className="rules-list"><li><strong>Roast the take. Not the person.</strong><p>Fictional characters, bad business ideas, and everyday annoyances are fair game.</p></li><li><strong>Stay clever.</strong><p>No threats, private information, hate, or targeting someone who didn’t opt in.</p></li><li><strong>Make every word count.</strong><p>You get 240 characters. Post for 10 credits or outbid a spot by at least 5.</p></li><li><strong>It’s a playground.</strong><p>The board includes example posts. Your changes save locally. No real-money contests or prizes.</p></li></ol><button className="button button-yellow full-width" onClick={closeDialog}>Let’s play<ArrowUpRight size={18} /></button></Modal>;
  return <Modal title="WELCOME TO THE PLAYGROUND." onClose={closeDialog}><p className="modal-description">The Class Board is a little friendly competition for people with something funny to say. Post a roast, challenge a spot, vote in a duel, and share a comeback.</p><div className="note-box"><strong>You’re using an interactive preview.</strong><p>Example players show how the board works. Your posts, bids, saved roasts, and votes persist in this browser. They are not shared across devices or published to a public database. Payments and cash prizes are off.</p></div><button className="button button-yellow full-width" onClick={closeDialog}>Find my next comeback<ArrowUpRight size={18} /></button></Modal>;
}
