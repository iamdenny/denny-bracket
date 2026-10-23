import test from 'node:test';
import assert from 'node:assert/strict';
import { createHistory } from '../src/undo-history.js';
import { elimination, advance } from '../src/core.js';
test('undo restores scored rounds and redo restores advancement without shared references', () => {
  const history = createHistory();
  const state = { names: ['A','B','C','D'], rounds: elimination(['A','B','C','D']) };
  history.push(state);
  for (const match of state.rounds[0]) { match.sa = 3; match.sb = 1; match.winner = match.a; }
  history.push(state);
  state.rounds.push(advance(state.rounds[0]));
  const scored = history.undo(state);
  assert.equal(scored.rounds.length, 1);
  assert.equal(scored.rounds[0][0].sa, 3);
  const initial = history.undo(scored);
  assert.equal(initial.rounds[0][0].sa, null);
  const replay = history.redo(initial);
  assert.equal(replay.rounds[0][0].sa, 3);
  assert.equal(history.redo(replay).rounds.length, 2);
});
test('a new edit clears redo and history is bounded', () => {
  const history = createHistory(2);
  history.push({ n: 1 }); history.push({ n: 2 }); history.push({ n: 3 });
  assert.deepEqual(history.undo({n:4}), {n:3});
  history.push({n:9});
  assert.equal(history.canRedo, false);
  assert.deepEqual(history.undo({n:10}), {n:9});
  assert.deepEqual(history.undo({n:9}), {n:2});
  assert.equal(history.undo({n:2}), null);
});
