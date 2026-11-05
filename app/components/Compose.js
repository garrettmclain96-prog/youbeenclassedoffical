'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Check, Coins, LoaderCircle, RotateCcw, Sparkles, Timer } from 'lucide-react';
import { boardPosts } from '../lib/board-state.mjs';
import { CATEGORIES, dailyTarget, dayKey } from '../lib/game-rules.mjs';
import { useBoard, useClock } from './BoardProvider';
import { Modal } from './Modal';

export function Compose({ dialog, onClose }) {
  const { state, now, act, notify, openDialog, storageAvailable } = useBoard();
  const clock = useClock();
  const scope = dialog.scope || (dialog.draftKey && state.drafts[dialog.draftKey]?.scope) || 'board';
  const targetDay = useRef(dialog.draftKey?.match(/^target:(\d{4}-\d{2}-\d{2}):/)?.[1] || dayKey(now)).current;
  const targetExpired = scope === 'target' && targetDay !== dayKey(now);
  const quick = dialog.quickfire || dialog.draftKey?.startsWith('quickfire:');
  const key = dialog.draftKey || (quick ? `quickfire:${dayKey(now)}` : `${scope}:${scope === 'target' ? `${targetDay}:` : ''}${dialog.target ? `outbid:${dialog.target.id}` : dialog.remix || dialog.remixSource ? `remix:${dialog.remix?.id || 'shared'}` : 'new'}`);
  const existing = state.drafts[key];
  const all = [...boardPosts(state, 'board', now), ...boardPosts(state, 'target', now), ...state.posts];
  const target = dialog.target || all.find(p => p.id === existing?.targetId);
  const remix = dialog.remix || all.find(p => p.id === existing?.remixId);
  const source = useRef(dialog.remixSource || existing?.remixSource || null).current;
  const min = target ? target.bid + 5 : 10;
  const [text, setText] = useState(dialog.seedText ?? existing?.text ?? remix?.text ?? source?.text ?? '');
  const [bid, setBid] = useState(existing?.bid || String(min));
  const [category, setCategory] = useState(existing?.category || (CATEGORIES.includes(remix?.category) ? remix.category : CATEGORIES[0]));
  const [deadline, setDeadline] = useState(existing?.deadline || 0);
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const abort = useRef(null); const submitting = useRef(false);
  const expired = !!deadline && clock >= deadline;
  const remaining = deadline ? Math.max(0, Math.ceil((deadline - clock) / 1000)) : 60;
  useEffect(() => () => abort.current?.abort(), []);
  useEffect(() => {
    if (submitting.current) return;
    act({ type: 'draft', key, text, bid, category, scope, targetId: target?.id, remixId: remix?.id, remixSource: source, deadline });
  }, [text, bid, category, deadline, key, act, scope, target?.id, remix?.id, source]);
  async function sharpen() {
    if (text.trim().length < 8 || busy) return;
    setBusy(true); setError('');
    const controller = new AbortController(); abort.current = controller;
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch('/api/roast', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({prompt:text}), signal:controller.signal });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || typeof data.roast !== 'string' || !data.roast.trim()) throw new Error([404,500,503].includes(response.status) ? 'AI sharpening isn’t connected in this preview. Your own words work just fine.' : 'Could not sharpen this roast. Your draft is still here.');
      setText(data.roast.slice(0,240)); notify('Sharper. Now give it your own twist.');
    } catch(e) { if (!controller.signal.aborted || abort.current === controller) setError(e.name === 'AbortError' ? 'The engine took too long. Your draft is still here.' : e.message); }
    finally { clearTimeout(timeout); setBusy(false); }
  }
  function submit(e) {
    e.preventDefault(); if (submitting.current) return;
    submitting.current = true;
    const unique = globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,12)}`;
    const ok = act({type:'post', id:`local-${unique}`, text, bid:Number(bid), category, targetId:target?.id, remixId:remix?.id, remixSource:source, scope, targetDay, draftKey:key, quickfire:!!quick});
    if (ok) onClose(); else submitting.current = false;
  }
  const attribution = remix || source;
  return <Modal title={quick ? 'SIXTY SECONDS. GO.' : target ? 'TAKE THEIR SPOT.' : attribution ? 'GIVE IT YOUR TWIST.' : scope === 'target' ? 'TAKE YOUR SHOT.' : 'MAKE IT A GOOD ONE.'} onClose={onClose}>
    <p className="modal-description">{quick ? 'One minute. One original comeback. Finish in time for 25 bonus XP.' : target ? 'A better comeback. A bigger bid. The spot is yours.' : 'Big energy. A little wit. Maximum 240 characters.'}</p>
    {quick && <div className={`quickfire-clock ${expired ? 'expired' : ''}`}><div><Timer size={23} /><strong>{deadline ? remaining : '60'}<small> SEC</small></strong><span>{expired ? 'Time’s up. Draft kept.' : deadline ? 'The clock is running.' : 'Ready when you are.'}</span></div>{!deadline || expired ? <button className="button button-yellow" onClick={() => { setText(''); setDeadline(Date.now()+60000); }}>{deadline ? 'New round' : 'Start the clock'}</button> : null}<p>YOUR PROMPT: Roast the {['overcomplicated morning routine','meeting that should have been an email','startup with no actual product','influencer announcing another rebrand'][Math.floor(now/86400000)%4]}.</p></div>}
    {scope === 'target' && <div className="draft-context">FICTIONAL TARGET · {targetDay}: @{dailyTarget(Date.parse(targetDay)).name}</div>}
    {targetExpired && <p className="form-error">This daily target has changed. Your draft is safe; enter it as a normal roast or close this dialog to see today’s target.</p>}
    {(target || attribution) && <blockquote className="challenge-quote">“{(target || attribution).text}”<small>{target ? 'CHALLENGING' : 'REMIXING'} @{(target || attribution).author}{source ? ' · ATTRIBUTION SUPPLIED BY SENDER' : ''}</small></blockquote>}
    {existing?.targetId && !target && <p className="field-hint">The original spot changed. Your draft is safe; this will enter as a new roast.</p>}
    <form onSubmit={submit}><label className="field-label" htmlFor="roast-text">Your roast</label><div className="textarea-wrap"><textarea id="roast-text" autoFocus value={text} readOnly={busy || (quick && (!deadline || expired))} onChange={e => setText(e.target.value)} minLength={8} maxLength={240} required rows={4} placeholder={quick && !deadline ? 'Start the clock to unlock the mic…' : 'The board is listening…'} /><span className={text.length>220?'near-limit':''}>{text.length}/240</span></div>
    <div className="compose-tools">{!quick && <button type="button" className="text-button" onClick={sharpen} disabled={busy || text.trim().length<8}>{busy ? <LoaderCircle className="spin" size={15}/> : <Sparkles size={15}/>}{busy?'Sharpening…':'Sharpen with AI'}</button>}<span className="draft-saved"><Check size={12}/>{storageAvailable ? text ? 'Draft saved on this device' : 'Draft recovery on' : 'Session only; storage is off'}</span></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    {scope !== 'target' && <div className="category-field"><label htmlFor="post-category" className="field-label">Your topic</label><select id="post-category" value={category} onChange={e=>setCategory(e.target.value)}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></div>}
    <div className="bid-field"><div><label htmlFor="bid-amount" className="field-label">Your bid <span>Practice credits</span></label><p>Minimum {min} cr · You have {state.balance} cr</p></div><div className="bid-input"><Coins size={17}/><input id="bid-amount" type="number" min={min} max={state.balance} step="1" required value={bid} onChange={e=>setBid(e.target.value)} aria-label="Bid in practice credits"/></div></div>
    <p className="local-disclosure"><Check size={14}/>Local preview. No payment. No cash prize.</p><button className="button button-yellow full-width" disabled={busy || targetExpired || state.balance<min || text.trim().length<8 || (quick && (!deadline || expired))}>{targetExpired?'This target’s day has ended':state.balance<min?'Claim rewards in your clubhouse':target?`Outbid for ${Number(bid)||min} cr`:`Post for ${Number(bid)||min} cr`}<ArrowUpRight size={18}/></button>
    {((quick && expired) || targetExpired) && text && <button type="button" className="text-button" onClick={()=>openDialog({kind:'post',seedText:text})}><RotateCcw size={14}/>Keep writing as a normal roast</button>}</form>
  </Modal>;
}
