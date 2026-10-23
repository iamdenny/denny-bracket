import test from 'node:test';
import assert from 'node:assert/strict';
import { activityExpansion } from '../scripts/activity-expansion.mjs';
import { presets } from '../src/content.js';
import { expandedPresets } from '../scripts/catalog.mjs';
import { entries, elimination, roundRobin } from '../src/core.js';
test('200 expansion activities in four languages, 300 total without slug or payload duplicates',()=>{
 const kind='bracket';
 const all=[...presets[kind],...expandedPresets[kind]];
 assert.equal(activityExpansion.length,200); assert.equal(all.length,300);
 assert.equal(new Set(all.map(p=>p.slug)).size,300);
 for(let lang=0;lang<4;lang++){
  assert.equal(new Set(activityExpansion.map(p=>p.title[lang])).size,200);
  if(kind==='type')assert.equal(new Set(activityExpansion.map(p=>p.text[lang])).size,200);
  if(kind==='spin')assert.equal(new Set(activityExpansion.map(p=>JSON.stringify(p.list[lang]))).size,200);
  for(const p of activityExpansion){
   for(const key of ['title','desc','guide'])assert.ok(p[key][lang].trim().length>0);
   if(kind==='spin'){assert.equal(entries(p.list[lang].join('\n')).length,8);}
   if(kind==='type'){assert.ok(p.text[lang].length>60);assert.ok(p.text[lang].length*12<8000);}
  }
 }
 if(kind==='bracket') for(const p of activityExpansion){
  const names=Array.from({length:p.count},(_,i)=>String(i));
  const rounds=p.mode==='league'?roundRobin(names):elimination(names);
  const expected=p.mode==='league'?p.count*(p.count-1)/2:p.count-1;
  assert.equal(p.plan.roundMatches.reduce((a,b)=>a+b,0),expected);
  assert.equal(p.plan.roundMatches.length,p.mode==='league'?p.count-1:Math.ceil(Math.log2(p.count)));
  assert.equal(p.plan.totalMinutes,p.plan.roundMatches.reduce((n,m)=>n+Math.ceil(m/p.plan.courts)*p.plan.matchMinutes,0)+(p.plan.roundMatches.length-1)*p.plan.breakMinutes);
  assert.ok(rounds.length>0);
 }
});
