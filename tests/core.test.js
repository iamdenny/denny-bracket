import { test } from "node:test";
import assert from "node:assert/strict";
import {
  randomInt,
  shuffle,
  groups,
  roundRobin,
  elimination,
  advance,
  standings,
  scoreTyping,
  encodeState,
  decodeState,
  safeState,
  csv,
  entries,
} from "../src/core.js";
test("random selection rejects modulo-biased tail", () => {
  let calls = 0;
  const source = {
    getRandomValues(a) {
      a[0] = calls++ === 0 ? 4294967295 : 7;
    },
  };
  assert.equal(randomInt(10, source), 7);
  assert.equal(calls, 2);
});
test("shuffle preserves entries and groups stay balanced", () => {
  const a = ["a", "b", "c", "d", "e"];
  assert.deepEqual(shuffle(a, () => 0).sort(), a);
  const g = groups(a, 2);
  assert.deepEqual(
    g.map((x) => x.length),
    [3, 2],
  );
  assert.throws(() => groups(a, 0));
});
test("round robin pairs occur exactly once with no double booking", () => {
  for (let n = 2; n <= 20; n++) {
    const rounds = roundRobin(Array.from({ length: n }, (_, i) => "" + i)),
      pairs = new Set();
    for (const round of rounds) {
      const players = new Set();
      for (const m of round) {
        assert(!players.has(m.a));
        assert(!players.has(m.b));
        players.add(m.a);
        players.add(m.b);
        const pair = [m.a, m.b].sort((a, b) => a - b).join("-");
        assert(!pairs.has(pair));
        pairs.add(pair);
      }
    }
    assert.equal(pairs.size, (n * (n - 1)) / 2);
  }
});
test("elimination byes and all rounds produce one winner", () => {
  for (let n = 2; n <= 64; n++) {
    const names = Array.from({ length: n }, (_, i) => "" + i);
    let [r] = elimination(names),
      matches = 0;
    while (true) {
      for (const m of r) {
        assert(!(m.a === null && m.b === null));
        if (m.winner === null) {
          m.winner = m.a;
          matches++;
        }
      }
      if (r.length === 1) break;
      r = advance(r);
    }
    assert.equal(matches, n - 1);
  }
});
test("league standings include draws and goal difference", () => {
  const r = standings(
    ["A", "B", "C"],
    [
      [
        { a: 0, b: 1, sa: 2, sb: 0 },
        { a: 1, b: 2, sa: 1, sb: 1 },
      ],
    ],
  );
  assert.deepEqual(
    r.map((x) => [x.name, x.pts]),
    [
      ["A", 3],
      ["C", 1],
      ["B", 1],
    ],
  );
});
test("typing measures Unicode normalized characters and final-position accuracy", () => {
  assert.deepEqual(scoreTyping("hello", "hello", 60), {
    correct: 5,
    total: 5,
    wpm: 1,
    cpm: 5,
    accuracy: 100,
  });
  assert.equal(scoreTyping("가", "가", 60).correct, 1);
  assert.equal(scoreTyping("hello", "hxllo", 60).accuracy, 80);
  assert.equal(scoreTyping("a", "a", 0).wpm, 0);
});
test("snapshot roundtrip and malicious states rejected", () => {
  const s = { v: 1, kind: "spin", names: ["한글", "日本語", "español"] };
  assert.deepEqual(safeState("spin", decodeState(encodeState(s))), s);
  assert.throws(() => safeState("spin", { ...s, names: [{}] }));
  assert.throws(() =>
    safeState("type", { v: 1, kind: "type", text: "x", seconds: 5 }),
  );
  assert.throws(() => decodeState("x".repeat(24001)));
});
test("completed knockout snapshot restores only valid advancing results", () => {
  const s = {
    v: 1,
    kind: "bracket",
    names: ["A", "B", "C"],
    mode: "knockout",
    scores: [
      [
        [null, null],
        [2, 1],
      ],
      [[1, 3]],
    ],
  };
  const restored = safeState("bracket", s);
  assert.equal(restored.rounds.length, 2);
  assert.equal(restored.rounds[1][0].winner, 1);
  assert.throws(() =>
    safeState("bracket", {
      ...s,
      scores: [
        [
          [null, null],
          [1, 1],
        ],
      ],
    }),
  );
});
test("CSV neutralizes spreadsheet formulas and quotes", () => {
  assert(csv([['=HYPERLINK("x")']]).includes("'=HYPERLINK"));
  assert.throws(() => entries("only one"));
  assert.throws(() => entries("a\n" + "b".repeat(61)));
});
