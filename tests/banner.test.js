import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../src/network-ads.js',import.meta.url),'utf8');
function setup({host='spin.iamdenny.com',approved=true,width=300}={}){
 let frames=[],writes=[],observe;
 const controls={'[data-ads-allow]':{},'[data-ads-off]':{hidden:true}};
 const slot={clientWidth:width,replaceChildren(f){frames=[f]},querySelector(){return frames[0]},getBoundingClientRect(){return {top:0,bottom:250}}};
 const context={JSON,Date,encodeURIComponent,location:{hostname:host,reload(){frames=[]}},innerHeight:800,localStorage:{getItem(){return null},setItem(k,v){writes.push(v)}},IntersectionObserver:class{constructor(cb){observe=cb}observe(){}},document:{hidden:false,querySelector(s){if(s==='#config')return {textContent:JSON.stringify({domain:'spin.iamdenny.com',adsterra:{approved,key:'a'.repeat(32)}})};if(s==='[data-network-ad]')return slot;return controls[s]},createElement(){return {setAttribute(k,v){this[k]=v},remove(){frames=[]}}},addEventListener(){}}};
 vm.runInNewContext(source,context);return {frames:()=>frames,allow:()=>controls['[data-ads-allow]'].onclick(),off:()=>controls['[data-ads-off]'].onclick(),observe:()=>observe([{isIntersecting:true}])};
}
test('ad requests require explicit permission and are not refreshed by visibility',()=>{const s=setup();s.observe();assert.equal(s.frames().length,0);s.allow();assert.equal(s.frames().length,1);const f=s.frames()[0];s.observe();s.allow();assert.equal(s.frames()[0],f);assert.ok(!f.sandbox.includes('allow-top-navigation'));assert.ok(!f.sandbox.includes('allow-same-origin'));s.off();assert.equal(s.frames().length,0)});
test('unapproved units, preview hosts and undersized containers never request ads',()=>{for(const opts of [{approved:false},{host:'localhost'},{width:290}]){const s=setup(opts);s.allow();s.observe();assert.equal(s.frames().length,0)}});
