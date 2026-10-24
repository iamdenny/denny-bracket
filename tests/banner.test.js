import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../src/network-ads.js', import.meta.url), 'utf8')
  .replace(/^import \{ getPreferences, savePreferences \} from ["']\.\/consent\.js["'];\s*/m, '');

function setup({host='spin.iamdenny.com',approved=true,width=300}={}) {
  let frames = [], observe, preferences = null;
  const controls = {'[data-ads-off]': {hidden: true, listeners: {}, addEventListener(name, listener) { this.listeners[name] = listener; }}};
  const slot = {
    clientWidth: width,
    replaceChildren(frame) { frames = [frame]; },
    querySelector() { return frames[0]; },
    getBoundingClientRect() { return {top: 0, bottom: 250}; },
  };
  const listeners = {};
  const dispatchConsent = (ads, analytics = false) => {
    preferences = {version: 2, ads, analytics, at: Date.now()};
    for (const listener of listeners['denny-consent-changed'] || []) {
      listener({detail: {ads, analytics}});
    }
  };
  const context = {
    JSON, Date, encodeURIComponent,
    location: {hostname: host, reload() { frames = []; }},
    innerHeight: 800,
    getPreferences() { return preferences; },
    savePreferences(value) { dispatchConsent(value.ads, value.analytics); },
    window: {addEventListener(name, listener) { (listeners[name] ||= []).push(listener); }},
    IntersectionObserver: class {constructor(callback) {observe = callback;} observe() {}},
    document: {
      hidden: false,
      querySelector(selector) {
        if (selector === '#config') return {textContent: JSON.stringify({domain:'spin.iamdenny.com',adsterra:{approved,key:'a'.repeat(32)}})};
        if (selector === '[data-network-ad]') return slot;
        return controls[selector];
      },
      createElement() { return {setAttribute(key,value) {this[key]=value;}, remove() {frames=[];}}; },
      addEventListener() {},
    },
  };
  vm.runInNewContext(source, context);
  return {
    frames: () => frames,
    allow: (analytics = false) => dispatchConsent(true, analytics),
    off: () => controls['[data-ads-off]'].listeners.click(),
    observe: () => observe([{isIntersecting: true}]),
    preferences: () => preferences,
  };
}

test('ads load only after the shared privacy choice grants ads and are removed on revocation', () => {
  const state = setup();
  state.observe();
  assert.equal(state.frames().length, 0);
  state.allow();
  assert.equal(state.frames().length, 1);
  const frame = state.frames()[0];
  state.observe();
  state.allow();
  assert.equal(state.frames()[0], frame);
  assert.ok(!frame.sandbox.includes('allow-top-navigation'));
  assert.ok(!frame.sandbox.includes('allow-same-origin'));
  state.allow(true);
  state.off();
  assert.equal(state.frames().length, 0);
  assert.equal(state.preferences().ads, false);
  assert.equal(state.preferences().analytics, true);
});

test('unapproved units, preview hosts and undersized containers never request ads', () => {
  for (const options of [{approved:false}, {host:'localhost'}, {width:290}]) {
    const state = setup(options);
    state.allow();
    state.observe();
    assert.equal(state.frames().length, 0);
  }
});
