import test from 'node:test';
import assert from 'node:assert/strict';
import { applyAction, boardPosts, exportBackup, initialState, MAX_CREDITS, parseBackup, restoreState, tileAt } from './board-state.mjs';
import { BADGES, dailyTarget, dayKey, FEATURES, playerLevel, questsFor } from './game-rules.mjs';
import { parseRoastLink, roastLink } from './share-link.mjs';

const TODAY = Date.UTC(2026,10,5,12);
const DAY = 86400000;
const action = (s,a,at=TODAY) => applyAction(s,{...a,at});
const posting = (id='local-1',extra={}) => ({type:'post',id,text:'Your business plan needs a lifeguard, because every idea is drowning.',bid:10,...extra});

test('upgrades a real v2 saved profile without losing credits, votes, posts, or earned score',()=>{
  const legacy={version:2,balance:83,handle:'OldRoaster',posts:[{id:'legacy',text:'That meeting should have been a passing thought.',author:'OldRoaster',bid:17,created:TODAY,scope:'board'}],hidden:[],likes:['501'],saved:['500'],votes:{d1:0},tiles:{3:{owner:'OldRoaster',bid:10}},events:[]};
  const loaded=restoreState(JSON.stringify(legacy));
  assert.equal(loaded.version,3);assert.equal(loaded.balance,83);assert.equal(loaded.posts[0].text,legacy.posts[0].text);
  assert.equal(loaded.votes.d1,0);assert.equal(loaded.xp,32);assert.equal(loaded.handle,'OldRoaster');
  assert.equal(loaded.stats.posts,1);assert.ok(Object.hasOwn(loaded.badges,'first'));
});
test('a daily bonus is claimable once, respects UTC rollover, and cannot be replayed with an older day',()=>{
  const first=action(initialState(),{type:'checkIn'}).state;
  assert.equal(first.balance,120);assert.equal(first.checkIn.streak,1);
  assert.ok(action(first,{type:'checkIn'}).error);
  const second=action(first,{type:'checkIn'},TODAY+DAY).state;
  assert.equal(second.balance,142);assert.equal(second.checkIn.streak,2);
  assert.ok(action(second,{type:'checkIn'},TODAY).error);
  const skipped=action(second,{type:'checkIn'},TODAY+4*DAY).state;
  assert.equal(skipped.checkIn.streak,1);assert.equal(skipped.checkIn.best,2);
});
test('streak badges unlock once, while wallet rewards stop at the credit cap',()=>{
  let s=initialState();for(let i=0;i<7;i++)s=action(s,{type:'checkIn'},TODAY+i*DAY).state;
  assert.ok(Object.hasOwn(s.badges,'streak'));assert.ok(Object.hasOwn(s.badges,'week'));
  assert.equal(s.events.filter(e=>e.kind==='badge'&&e.message.includes('On a roll')).length,1);
  s={...s,balance:499};const capped=action(s,{type:'checkIn'},TODAY+7*DAY).state;
  assert.equal(capped.balance,MAX_CREDITS);assert.ok(action(capped,{type:'checkIn'},TODAY+8*DAY).error);
  assert.equal(restoreState(JSON.stringify(capped)).balance,500);
});
test('quests require the promised action, pay once, and reset on the next UTC day',()=>{
  let s=initialState();assert.ok(action(s,{type:'quest',questId:'post'}).error);
  s=action(s,posting()).state;const before=s.balance;
  s=action(s,{type:'quest',questId:'post'}).state;
  assert.equal(s.balance,before+15);assert.ok(action(s,{type:'quest',questId:'post'}).error);
  assert.equal(questsFor(s,TODAY).find(q=>q.id==='post').claimed,true);
  const next=questsFor(s,TODAY+DAY).find(q=>q.id==='post');assert.equal(next.value,0);assert.equal(next.claimed,false);
});
test('the fire quest counts different roasts, not toggling the same reaction repeatedly',()=>{
  let s=initialState();for(let i=0;i<5;i++)s=action(s,{type:'like',postId:'501'}).state;
  assert.equal(questsFor(s,TODAY).find(q=>q.id==='react').value,1);
  s=action(s,{type:'like',postId:'500'}).state;s=action(s,{type:'like',postId:'499'}).state;
  assert.equal(questsFor(s,TODAY).find(q=>q.id==='react').done,true);
  const earned=action(s,{type:'quest',questId:'react'});assert.equal(earned.state.balance,110);
  assert.ok(action(earned.state,{type:'quest',questId:'react'}).error);
});
test('daily targets rotate predictably at midnight and older entries remain in the collection',()=>{
  const before=dailyTarget(Date.UTC(2026,10,5,23,59,59));const after=dailyTarget(Date.UTC(2026,10,6));
  assert.notEqual(before.id,after.id);assert.equal(after.day,'2026-11-06');
  let s=action(initialState(),posting('target-entry',{scope:'target'})).state;
  assert.equal(boardPosts(s,'target',TODAY).length,3);
  assert.equal(boardPosts(s,'target',TODAY+DAY).length,2);
  assert.equal(s.posts[0].targetDay,'2026-11-05');assert.equal(s.posts.length,1);
  assert.deepEqual(dailyTarget(TODAY),dailyTarget(TODAY));
  assert.ok(action(s,posting('stale-target',{scope:'target',targetDay:'2026-11-05'}),TODAY+DAY).error);
});
test('normal and remixed drafts survive reload, while draft edits do not spend credits',()=>{
  const d={type:'draft',key:'board:remix:shared',text:'A first draft with a slightly different punchline.',bid:'15',category:'Startup culture',remixSource:{text:'An original roast that deserves an actual credit.',author:'SomeoneElse'}};
  const s=action(initialState(),d).state;const loaded=restoreState(JSON.stringify(s));
  assert.equal(loaded.balance,100);assert.equal(loaded.drafts[d.key].text,d.text);
  assert.equal(loaded.drafts[d.key].remixSource.author,'SomeoneElse');
  assert.equal(action(loaded,{type:'discardDraft',key:d.key}).state.drafts[d.key],undefined);
});
test('remixes require an original twist and retain credit, including remixes of your archived work',()=>{
  assert.ok(action(initialState(),posting('r1',{text:boardPosts(initialState())[0].text,remixId:'501'})).error);
  let s=action(initialState(),posting('r1',{remixId:'501'})).state;
  assert.equal(s.posts[0].remix.author,'FlameKing99');assert.equal(s.stats.remixes,1);assert.ok(Object.hasOwn(s.badges,'remix'));
  s=action(s,{type:'archive',postId:'r1'}).state;
  const result=action(s,posting('r2',{remixId:'r1',text:'Your pivot has more plot twists than a mystery paperback.'}));
  assert.equal(result.error,undefined);assert.equal(result.state.posts[0].remix.author,'GuestRoaster');
});
test('Quickfire accepts a valid round before the deadline, rejects expired or restarted-clock submissions, and consumes the draft',()=>{
  const draft={type:'draft',key:'quickfire:2026-11-05',text:'This quick comeback only needs one very sharp minute.',bid:'10',deadline:TODAY+60000};
  const s=action(initialState(),draft).state;
  const post=posting('quick-1',{text:draft.text,quickfire:true,draftKey:draft.key});
  assert.ok(action(s,post,TODAY+60001).error);assert.ok(action(s,post,TODAY-1).error);
  const won=action(s,post,TODAY+59999).state;
  assert.equal(won.stats.quickfires,1);assert.equal(won.xp,35);assert.ok(Object.hasOwn(won.badges,'quick'));assert.equal(won.drafts[draft.key],undefined);
  assert.ok(action(won,{...post,id:'quick-2'},TODAY+59999).error);
});
test('editing, archiving, and restoring own roasts never refund credits or erase earned XP',()=>{
  let s=action(initialState(),posting()).state;const balance=s.balance,xp=s.xp;
  assert.ok(action(s,{type:'edit',postId:'501',text:'Trying to edit someone else is not an allowed move.'}).error);
  s=action(s,{type:'edit',postId:'local-1',text:'This is the better version of a very dubious business plan.'}).state;
  assert.equal(s.posts[0].edited,true);assert.equal(s.balance,balance);
  s=action(s,{type:'archive',postId:'local-1'}).state;
  assert.equal(boardPosts(s).length,5);assert.equal(s.xp,xp);assert.equal(s.balance,balance);
  s=action(s,{type:'restorePost',postId:'local-1'}).state;assert.equal(boardPosts(s).length,6);
});
test('muting changes visibility without deleting posts or bookmarks, and can be undone',()=>{
  let s=action(initialState(),{type:'save',postId:'501'}).state;
  s=action(s,{type:'mute',author:'FlameKing99'}).state;
  assert.equal(boardPosts(s).some(p=>p.author==='FlameKing99'),false);assert.deepEqual(s.saved,['501']);
  s=action(s,{type:'unmute',author:'FlameKing99'}).state;
  assert.equal(boardPosts(s).some(p=>p.id==='501'),true);
  assert.ok(action(s,{type:'mute',author:s.handle}).error);
});
test('earned badges persist after unsaving or archiving and do not generate duplicate unlock events',()=>{
  let s=initialState();for(const postId of ['501','500','499'])s=action(s,{type:'save',postId}).state;
  assert.ok(Object.hasOwn(s.badges,'curator'));s=action(s,{type:'save',postId:'499'}).state;
  s=action(s,{type:'save',postId:'499'}).state;
  assert.equal(s.events.filter(e=>e.kind==='badge'&&e.message.includes('Good company')).length,1);
  assert.ok(Object.hasOwn(restoreState(JSON.stringify(s)).badges,'curator'));
});
test('the activity inbox uses distinct event IDs and marking read leaves action history intact',()=>{
  let s=action(initialState(),{type:'checkIn'}).state;s=action(s,posting()).state;
  assert.equal(new Set(s.events.map(e=>e.id)).size,s.events.length);
  const count=s.events.length;s=action(s,{type:'markRead'}).state;
  assert.equal(s.readEvents.length,count);assert.equal(s.events.length,count);
  s=action(s,{type:'vote',duelId:'d1',side:0}).state;
  assert.ok(s.events.some(e=>!s.readEvents.includes(e.id)));
});
test('backup round trips preserve all gameplay, drafts, card themes, and mute preferences',()=>{
  let s=action(initialState(),{type:'checkIn'}).state;s=action(s,posting()).state;
  s=action(s,{type:'theme',theme:'paper'}).state;s=action(s,{type:'mute',author:'RoastMaster'}).state;
  s=action(s,{type:'draft',key:'board:new',text:'This is a second roast that is still in progress.',bid:'10'}).state;
  const imported=parseBackup(exportBackup(s,TODAY));assert.equal(imported.error,undefined);
  for(const field of ['balance','handle','xp','theme'])assert.equal(imported.state[field],s[field]);
  assert.deepEqual(imported.state.muted,s.muted);assert.equal(imported.state.drafts['board:new'].text,s.drafts['board:new'].text);assert.equal(imported.state.posts[0].text,s.posts[0].text);
  assert.ok(parseBackup('{"format":"not-a-backup"}').error);assert.ok(parseBackup('bad json').error);assert.ok(parseBackup('x'.repeat(2000001)).error);
});
test('imported strings and timestamps cannot create unsupported routes, prototypes, or impossible wallets',()=>{
  const malicious={...initialState(),balance:501,events:[{id:'event-9',at:1e100,message:'bad'}]};
  assert.ok(parseBackup(JSON.stringify({format:'classboard-backup',version:3,state:malicious})).error);
  const malformed={...initialState(),drafts:{'__proto__':{text:'malicious'},'board:new':{text:'Safe text in a valid draft.',updated:1e100}},events:[{id:'event-Infinity',message:'bad',at:1e100}]};
  const loaded=restoreState(JSON.stringify(malformed));assert.deepEqual(loaded.drafts,{});assert.deepEqual(loaded.events,[]);assert.ok(Number.isFinite(loaded.seq));
});
test('a share link carries Unicode text safely, uses the current origin, and rejects malformed payloads',()=>{
  const p={text:'Your “growth strategy” is three podcasts in a trench coat. 🔥',author:'QA_Roaster'};
  const url=roastLink(p,'https://example.test/profile?old=1#badge');
  assert.equal(new URL(url).origin,'https://example.test');assert.equal(new URL(url).pathname,'/');
  assert.equal(parseRoastLink(new URL(url).search).text,p.text);assert.equal(parseRoastLink('?roast=bad-json'),null);
  assert.equal(parseRoastLink('?roast='+encodeURIComponent(JSON.stringify({v:1,text:p.text,author:'<script>'}))),null);
});
test('level boundaries are stable and the full feature set is discoverable',()=>{
  assert.equal(playerLevel(0).level,1);assert.equal(playerLevel(49).level,1);assert.equal(playerLevel(50).level,2);
  assert.equal(playerLevel(250).level,4);assert.equal(playerLevel(2000).level,8);assert.equal(playerLevel(2000).progress,100);
  assert.equal(FEATURES.length,17);assert.equal(new Set(FEATURES.map(f=>f[0])).size,17);assert.equal(BADGES.length,12);
});
test('a complete return loop preserves balances and score across an outbid, Quickfire, quests, a vote, a claim, and a reload',()=>{
  let s=initialState();s=action(s,{type:'checkIn'}).state;
  s=action(s,posting('take-spot',{targetId:'501',bid:52})).state;
  s=action(s,{type:'draft',key:'quickfire:2026-11-05',text:'A comeback sharper than a spreadsheet pretending to be a business.',bid:'10',deadline:TODAY+60000}).state;
  s=action(s,posting('quick',{quickfire:true,draftKey:'quickfire:2026-11-05'}),TODAY+1000).state;
  s=action(s,{type:'vote',duelId:'d1',side:0}).state;
  s=action(s,{type:'quest',questId:'post'}).state;s=action(s,{type:'quest',questId:'vote'}).state;
  s=action(s,{type:'claim',tileId:3}).state;
  assert.equal(s.balance,73);assert.equal(s.xp,142);assert.equal(playerLevel(s.xp).level,3);
  const reloaded=parseBackup(exportBackup(s)).state;
  assert.equal(reloaded.balance,73);assert.equal(tileAt(reloaded,3).own,true);assert.equal(reloaded.votes.d1,0);assert.equal(reloaded.xp,142);
});
