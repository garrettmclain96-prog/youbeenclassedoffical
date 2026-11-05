'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, Bell, Check, Copy, Download, Search, Timer } from 'lucide-react';
import { CARD_THEMES, FEATURES } from '../lib/game-rules.mjs';
import { roastLink } from '../lib/share-link.mjs';
import { shareRoast } from '../lib/share-card';
import { useBoard } from './BoardProvider';
import { Modal } from './Modal';

function FeatureList({ onClose }) {
  const { openDialog } = useBoard(); const router = useRouter();
  function launch(where) {
    if (where === 'quickfire') { openDialog({kind:'post',quickfire:true}); return; }
    if (['activity','commands'].includes(where)) { openDialog({kind:where}); return; }
    onClose();
    router.push(where === 'board' ? '/#board' : where === 'target' ? '/target' : where === 'clubhouse' ? '/profile' : `/profile#${where}`);
  }
  return <Modal title="17 NEW WAYS TO PLAY." onClose={onClose} className="wide-modal"><p className="modal-description">More comebacks. More reasons to come back. Every feature below opens where you can use it.</p><div className="feature-list">{FEATURES.map(([name,description,where],i)=><button key={name} onClick={()=>launch(where)}><span>{String(i+1).padStart(2,'0')}</span><div><strong>{name}</strong><p>{description}</p></div><ArrowUpRight size={17}/></button>)}</div></Modal>;
}
function Activity({ onClose }) {
  const { state, act } = useBoard();
  return <Modal title="YOUR PAPER TRAIL." onClose={onClose}><div className="activity-heading"><p className="modal-description">Only your actual actions on this device. No made-up activity.</p><button className="text-button" onClick={()=>act({type:'markRead'})}><Check size={14}/>Mark all read</button></div>{state.events.length ? <ol className="activity-list">{state.events.map(e=><li key={e.id} className={state.readEvents.includes(e.id)?'':'unread'}><span className="activity-bullet"/><div><p>{e.message}</p><time dateTime={new Date(e.at).toISOString()}>{new Date(e.at).toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}</time></div></li>)}</ol> : <div className="empty-state"><Bell size={30}/><h3>QUIET… TOO QUIET.</h3><p>Post, vote, or check in. Your history will appear here.</p></div>}</Modal>;
}
function Commands({ onClose }) {
  const { openDialog, ready } = useBoard(); const router = useRouter(); const [query,setQuery] = useState('');
  const routes = [
    {name:'Drop a roast',hint:'N',run:()=>openDialog({kind:'post'})},
    {name:'Start 60-second Quickfire',hint:'60',run:()=>openDialog({kind:'post',quickfire:true})},
    {name:'Search the board',hint:'/',run:()=>{onClose();router.push('/?search=1#board');window.dispatchEvent(new Event('classboard:search'));}},
    ...[['Your clubhouse','/profile'],['Daily quests','/profile#quests'],['Your achievements','/profile#badges'],['Draft recovery','/profile#drafts'],['Card themes','/profile#themes'],['Export or restore a backup','/profile#backup'],['Duel arena','/duels'],['Today’s target','/target'],['Territory map','/territory']].map(([name,url])=>({name,hint:'↗',run:()=>{onClose();router.push(url);}})),
    {name:'Activity inbox',hint:'↗',run:()=>openDialog({kind:'activity'})},
    {name:'Explore all 17 new features',hint:'17',run:()=>openDialog({kind:'features'})},
    {name:'House rules',hint:'↗',run:()=>openDialog({kind:'rules'})},
  ];
  const filtered = routes.filter(a=>a.name.toLowerCase().includes(query.trim().toLowerCase()));
  return <Modal title="YOUR NEXT MOVE." onClose={onClose}><div className="command-search"><Search size={18}/><input autoFocus aria-label="Search commands" placeholder="Find a feature or place…" value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&filtered[0]&&ready){e.preventDefault();filtered[0].run();}if(e.key==='ArrowDown'){e.preventDefault();e.currentTarget.closest('.modal-inner').querySelector('.command-list button')?.focus();}}}/></div><div className="command-list">{filtered.length ? filtered.map((a,i)=><button key={a.name} disabled={!ready} onClick={a.run} onKeyDown={e=>{if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();const all=e.currentTarget.parentElement.querySelectorAll('button');let next=e.key==='Home'?0:e.key==='End'?all.length-1:(i+(e.key==='ArrowDown'?1:-1)+all.length)%all.length;all[next].focus();}}}><span>{a.name}</span><kbd>{a.hint}</kbd></button>) : <p className="field-hint">No commands match. Try “draft”, “quest”, or “share”.</p>}</div><p className="shortcut-hint"><kbd>K</kbd> commands · <kbd>N</kbd> new roast · <kbd>/</kbd> search · <kbd>?</kbd> help. Shortcuts pause while you type.</p></Modal>;
}
function EditRoast({ post, onClose }) {
  const { act } = useBoard(); const [text,setText] = useState(post.text);
  return <Modal title="THE SECOND DRAFT." onClose={onClose}><p className="modal-description">Edit your own words. Your existing bid and credit balance stay the same.</p><form onSubmit={e=>{e.preventDefault();if(act({type:'edit',postId:post.id,text}))onClose();}}><label className="field-label" htmlFor="edit-roast">Your roast</label><div className="textarea-wrap"><textarea id="edit-roast" rows={5} required minLength={8} maxLength={240} value={text} onChange={e=>setText(e.target.value)}/><span>{text.length}/240</span></div><button className="button button-yellow full-width edit-submit" disabled={text.trim().length<8}>Save the better version<Check size={17}/></button></form></Modal>;
}
function ShareDialog({ post, onClose }) {
  const { state, act, notify } = useBoard(); const [busy,setBusy]=useState(false); const [manual,setManual]=useState('');
  const theme = CARD_THEMES.find(t=>t.id===state.theme) || CARD_THEMES[0];
  async function image() { setBusy(true);try{await shareRoast(post,notify,state.theme);}finally{setBusy(false);} }
  async function copy() {
    const link=roastLink(post,window.location.origin);
    try {if(!navigator.clipboard)throw new Error('Clipboard unavailable');await navigator.clipboard.writeText(link);notify('Roast link copied. Viewers need access to this preview.');}
    catch {setManual(link);}
  }
  return <Modal title="TAKE IT TO THE CHAT." onClose={onClose}><p className="modal-description">Your roast deserves a group-chat debut.</p><div className="share-preview" style={{background:theme.paper,color:theme.text,borderColor:theme.bg}}><span style={{color:theme.id==='paper'?theme.ink:theme.bg}}>THE CLASS BOARD</span><blockquote>“{post.text}”</blockquote><small style={{color:theme.id==='paper'?theme.ink:theme.bg}}>@{post.author}</small></div><fieldset className="theme-picker"><legend>Choose your card style</legend>{CARD_THEMES.map(t=><button key={t.id} type="button" className={state.theme===t.id?'selected':''} style={{'--swatch':t.bg}} onClick={()=>act({type:'theme',theme:t.id})} aria-pressed={state.theme===t.id}><i/>{t.name}</button>)}</fieldset><button className="button button-yellow full-width" disabled={busy} onClick={image}><Download size={17}/>{busy?'Making your card…':'Share / download image'}</button><button className="button button-outline full-width secondary-share" onClick={copy}><Copy size={16}/>Copy roast link</button>{manual&&<label className="field-label">Copy this link<input className="text-input" readOnly value={manual} onFocus={e=>e.target.select()}/></label>}<p className="field-hint">The image works anywhere. The link carries the roast and attribution, but does not publish a public post. Viewers still need access to this private preview.</p></Modal>;
}
function SharedRoast({post,onClose}) {
  const {openDialog}=useBoard();
  return <Modal title="YOU’VE BEEN SENT A TAKE." onClose={onClose}><p className="modal-description">Shared roast preview. Attribution is supplied by the sender; it isn’t a verified account.</p><blockquote className="shared-roast">“{post.text}”<small>@{post.author}</small></blockquote><button className="button button-yellow full-width" onClick={()=>openDialog({kind:'post',remixSource:post})}>Got a better version?<ArrowUpRight size={18}/></button><p className="field-hint">Remixing creates a new local post with a credit to the original.</p></Modal>;
}
export function ExtraDialog({dialog,onClose}) {
  if(dialog.kind==='features')return <FeatureList onClose={onClose}/>;
  if(dialog.kind==='activity')return <Activity onClose={onClose}/>;
  if(dialog.kind==='commands')return <Commands onClose={onClose}/>;
  if(dialog.kind==='edit')return <EditRoast post={dialog.post} onClose={onClose}/>;
  if(dialog.kind==='share')return <ShareDialog post={dialog.post} onClose={onClose}/>;
  if(dialog.kind==='shared')return <SharedRoast post={dialog.post} onClose={onClose}/>;
  return null;
}
