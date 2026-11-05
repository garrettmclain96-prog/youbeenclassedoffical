import test from 'node:test';
import assert from 'node:assert/strict';
import { applyAction, boardPosts, initialState, restoreState, tileAt } from './board-state.mjs';

const post = (overrides = {}) => ({ type: 'post', id: 'local-test', text: 'This meeting could have been a passing thought.', bid: 10, at: 100, ...overrides });

test('posting spends credits and survives serialization without affecting the seed board', () => {
  const original = initialState();
  const result = applyAction(original, post());
  assert.equal(result.error, undefined);
  assert.equal(original.balance, 100);
  assert.equal(result.state.balance, 90);
  const loaded = restoreState(JSON.stringify(result.state));
  assert.equal(loaded.posts[0].text, post().text);
  assert.equal(loaded.balance, 90);
  assert.equal(boardPosts(loaded).length, 6);
});
test('an outbid replaces exactly the challenged spot and requires an increment of five', () => {
  const original = initialState();
  assert.ok(applyAction(original, post({ targetId: '501', bid: 51 })).error);
  const { state } = applyAction(original, post({ targetId: '501', bid: 52 }));
  assert.equal(state.balance, 48);
  assert.equal(boardPosts(state).length, 5);
  assert.equal(boardPosts(state).some(p => p.id === '501'), false);
  assert.equal(boardPosts(state)[0].bid, 52);
  assert.ok(applyAction(state, post({ id: 'second', targetId: '501', bid: 52 })).error);
});
test('credits cannot go negative across posts and territory claims', () => {
  const spent = applyAction(initialState(), post({ bid: 95 })).state;
  const attempted = applyAction(spent, { type: 'claim', tileId: 3 });
  assert.ok(attempted.error);
  assert.equal(attempted.state.balance, 5);
  for (const bid of [-5, 0, 9, 10.5, NaN, Infinity, 101]) assert.ok(applyAction(initialState(), post({ bid })).error);
});
test('one duel vote persists even when the first side is zero', () => {
  const result = applyAction(initialState(), { type: 'vote', duelId: 'd1', side: 0 });
  const loaded = restoreState(JSON.stringify(result.state));
  assert.equal(loaded.votes.d1, 0);
  assert.ok(applyAction(loaded, { type: 'vote', duelId: 'd1', side: 1 }).error);
  assert.ok(applyAction(loaded, { type: 'vote', duelId: 'unknown', side: 0 }).error);
});
test('likes toggle without accumulating fake reactions and saved roasts survive reload', () => {
  let state = applyAction(initialState(), { type: 'like', postId: '501' }).state;
  assert.deepEqual(state.likes, ['501']);
  state = applyAction(state, { type: 'like', postId: '501' }).state;
  assert.deepEqual(state.likes, []);
  state = applyAction(state, { type: 'save', postId: '500' }).state;
  assert.deepEqual(restoreState(JSON.stringify(state)).saved, ['500']);
});
test('target submissions stay off the main board and retain their challenge context', () => {
  const { state } = applyAction(initialState(), post({ scope: 'target' }));
  assert.equal(boardPosts(state).length, 5);
  assert.equal(boardPosts(state, 'target', 100).length, 3);
  assert.equal(boardPosts(state, 'target', 100)[0].scope, 'target');
  assert.ok(applyAction(state, post({ id: 'other', scope: 'board', targetId: 't1', bid: 35 })).error);
});
test('territory claims are deterministic, persisted, and cannot be charged twice', () => {
  const original = initialState();
  assert.deepEqual(tileAt(original, 0), tileAt(initialState(), 0));
  const { state } = applyAction(original, { type: 'claim', tileId: 3 });
  assert.equal(state.balance, 90);
  assert.equal(tileAt(restoreState(JSON.stringify(state)), 3).own, true);
  assert.ok(applyAction(state, { type: 'claim', tileId: 3 }).error);
  for (const tileId of [-1, 48, 1.5, '3']) assert.ok(applyAction(state, { type: 'claim', tileId }).error);
});
test('malformed and obsolete local storage resets safely', () => {
  for (const raw of ['', 'not json', 'null', '{}', '{"version":1}']) assert.deepEqual(restoreState(raw), initialState());
  const wrong = { ...initialState(), posts: null };
  assert.deepEqual(restoreState(JSON.stringify(wrong)), initialState());
  const contaminated = { ...initialState(), posts: [null, { id: 'bad', text: '<script>' }], votes: { d1: 3, bad: 0 }, tiles: { 99: { owner: 'Bad', bid: 10 } } };
  const clean = restoreState(JSON.stringify(contaminated));
  assert.deepEqual(clean.posts, []);
  assert.deepEqual(clean.votes, {});
  assert.deepEqual(clean.tiles, {});
});
test('duplicate submissions and invalid text leave the wallet untouched', () => {
  const first = applyAction(initialState(), post()).state;
  const duplicate = applyAction(first, post());
  assert.ok(duplicate.error);
  assert.equal(duplicate.state.balance, 90);
  for (const text of ['', 47, null, 'x'.repeat(241)]) assert.ok(applyAction(first, post({ id: 'other', text })).error);
});
