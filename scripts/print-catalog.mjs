#!/usr/bin/env node
// CLI viewer for catalog.json — the same content app.js renders inside a
// DraconDex plugin window, visible here from a terminal instead, with no
// DraconDex install required.
//
// `--preamble` prints something different: not this repo's own rendering,
// but the exact model-facing string that DraconDex-Plugin-Claude/-Ollama/
// -Codex compute from this file. Each of those runs in its own separate,
// sandboxed plugin window and fetches catalog.json over plain HTTPS — see
// README.md's "Why this exists" — so `preamble()` below is that function's
// usage of catalog.json from outside this app, made visible here too. Its
// body is a byte-for-byte copy of `preamble()` in each of those repos'
// src/catalog.js; if you change what a plugin actually sends a model,
// change it there and mirror the edit here.
//
// Zero dependencies. Run with
//   node scripts/print-catalog.mjs [--preamble] [path/to/catalog.json]
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const HELP = `Usage: node scripts/print-catalog.mjs [options] [path/to/catalog.json]

Prints catalog.json for CLI viewing — no DraconDex install required.

Options:
  --preamble   Print the exact model-facing summary DraconDex-Plugin-Claude/
               -Ollama/-Codex fold into their system prompt from this file,
               computed from outside this app, in their own plugin windows.
  -h, --help   Show this help.

With no path given, reads ./catalog.json.`;

const args = process.argv.slice(2);
if (args.includes('-h') || args.includes('--help')) {
  console.log(HELP);
  process.exit(0);
}
const showPreamble = args.includes('--preamble');
const pathArg = args.find((a) => !a.startsWith('-'));
const catalogPath = resolve(pathArg || 'catalog.json');

let catalog;
try {
  catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
} catch (e) {
  console.error(`✗ ${catalogPath}: ${e.message}`);
  process.exit(1);
}

// Mirrors preamble() in DraconDex-Plugin-Claude/-Ollama/-Codex's src/catalog.js.
function preamble(c) {
  const lines = [];
  const appName = c.app?.name || 'DraconDex';
  const appDesc = c.app?.description || c.app?.tagline || '';
  lines.push(`You are running as a plugin inside ${appName}${appDesc ? `, ${appDesc}` : ''}.`);
  const features = Array.isArray(c.features) ? c.features.map((f) => f?.name).filter(Boolean) : [];
  if (features.length) lines.push(`Its features include: ${features.join(', ')}.`);
  if (c.pluginCapabilities?.summary) lines.push(c.pluginCapabilities.summary);
  lines.push('As a plugin, you can only store data in your own table(s) and reach network hosts your own manifest declares — you have no access to the app\'s own data or to any other plugin\'s data.');
  return lines.join(' ');
}

if (showPreamble) {
  console.log(preamble(catalog) || '(empty — catalog has no app/features/pluginCapabilities.summary)');
  process.exit(0);
}

function rule(char = '─', n = 60) {
  return char.repeat(n);
}

console.log(rule('='));
console.log(`${catalog.app?.name || 'DraconDex'}${catalog.app?.tagline ? ` — ${catalog.app.tagline}` : ''}`);
if (catalog.app?.description) console.log(catalog.app.description);
console.log(rule('='));

if (Array.isArray(catalog.features) && catalog.features.length) {
  console.log('\nFEATURES');
  for (const f of catalog.features) {
    console.log(`  • ${f?.name}${f?.id ? ` (${f.id})` : ''}`);
    if (f?.description) console.log(`    ${f.description}`);
  }
}

if (Array.isArray(catalog.moduleKinds) && catalog.moduleKinds.length) {
  console.log('\nMODULE KINDS');
  console.log(`  ${catalog.moduleKinds.join(', ')}`);
}

if (catalog.pluginCapabilities) {
  console.log('\nPLUGIN CAPABILITIES');
  if (catalog.pluginCapabilities.summary) console.log(`  ${catalog.pluginCapabilities.summary}`);
  if (Array.isArray(catalog.pluginCapabilities.can) && catalog.pluginCapabilities.can.length) {
    console.log('\n  Can:');
    for (const item of catalog.pluginCapabilities.can) console.log(`    ✓ ${item}`);
  }
  if (Array.isArray(catalog.pluginCapabilities.cannot) && catalog.pluginCapabilities.cannot.length) {
    console.log('\n  Cannot:');
    for (const item of catalog.pluginCapabilities.cannot) console.log(`    ✕ ${item}`);
  }
}

const footerParts = [];
if (catalog.catalogVersion) footerParts.push(`catalog v${catalog.catalogVersion}`);
if (catalog.updated) footerParts.push(`updated ${catalog.updated}`);
if (catalog.forAppMinVersion) footerParts.push(`${catalog.forApp || 'DraconDex'} ${catalog.forAppMinVersion}+`);
console.log(`\n${rule()}`);
if (footerParts.length) console.log(footerParts.join(' · '));
console.log('Run with --preamble to see the model-facing summary a chat plugin computes from this file.');
