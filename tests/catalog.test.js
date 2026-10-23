import test from "node:test";
import assert from "node:assert/strict";
import { presets as basePresets, passageFor } from "../src/content.js";
import { entries, elimination, roundRobin } from "../src/core.js";
import { expandedPresets } from "../scripts/catalog.mjs";
const presets = Object.fromEntries(Object.entries(basePresets).map(([kind, items]) => [kind, [...items, ...expandedPresets[kind]]]));
test("at least 50 unique activities per site with complete four-language content", () => {
  for (const [kind, items] of Object.entries(presets)) {
    assert.ok(items.length >= 50);
    assert.equal(new Set(items.map(p => p.slug)).size, items.length);
    for (const p of items) {
      for (const field of [p.title, p.desc, ...(p.guide ? [p.guide] : [])]) {
        assert.equal(field.length,4); assert.ok(field.every(s => typeof s === "string" && s.length > 0));
      }
      if (p.list) for (const words of p.list) assert.equal(entries(words.join("\n")).length, words.length);
      if (kind === "type" && p.text) for (const lang of ["en","ko","ja","es"]) assert.ok(passageFor(lang,p).length >= 120);
      if (kind === "bracket" && p.guide) {
        const names = Array.from({length:p.count},(_,i)=>String(i));
        const rounds = p.mode === "league" ? roundRobin(names) : elimination(names);
        assert.ok(rounds.length > 0);
        if (p.mode === "league") assert.equal(rounds.flat().length,p.count*(p.count-1)/2);
      }
    }
  }
});
