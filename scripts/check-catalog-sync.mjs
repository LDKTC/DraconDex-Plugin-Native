#!/usr/bin/env node
// catalog.js exists only because a file://-loaded plugin window can't fetch()
// or XHR a sibling file (see the comment at the top of catalog.js) — the data
// itself has exactly one source of truth, catalog.json, and catalog.js is a
// hand-kept copy of it. This is the thing that stops that copy from silently
// drifting: it doesn't parse catalog.js as JavaScript (no eval, this repo
// doesn't trust itself any more than it would a stranger's), it just strips
// the 'window.CATALOG = ' prefix and trailing ';' and requires what's left to
// be byte-for-byte valid JSON identical to catalog.json.
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const json = readFileSync(new URL('../catalog.json', import.meta.url), 'utf8');
const js = readFileSync(new URL('../catalog.js', import.meta.url), 'utf8');

// Anchored to the START of a line (not just anywhere in the file) so this
// doesn't also match the sentence in the comment above that quotes the same
// "window.CATALOG = " text.
const m = js.match(/^window\.CATALOG = ([\s\S]*);\s*$/m);
if (!m) {
  console.error('✗ catalog.js: expected a trailing "window.CATALOG = {...};" assignment');
  process.exit(1);
}

let fromJson, fromJs;
try { fromJson = JSON.parse(json); }
catch (e) { console.error(`✗ catalog.json is not valid JSON: ${e.message}`); process.exit(1); }
try { fromJs = JSON.parse(m[1]); }
catch (e) { console.error(`✗ catalog.js's assignment body is not valid JSON on its own: ${e.message}`); process.exit(1); }

try {
  assert.deepStrictEqual(fromJs, fromJson);
} catch (_) {
  console.error('✗ catalog.js and catalog.json have drifted apart — regenerate catalog.js from catalog.json');
  process.exit(1);
}

console.log('✓ catalog.js matches catalog.json');
