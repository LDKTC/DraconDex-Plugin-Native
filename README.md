# DraconDex-Plugin-Native (AI Native)

A read-only reference plugin for [DraconDex](https://github.com/LDKTC/App-DraconDex)
that publishes what this app *is* and what a plugin *can do* — as one file,
[`catalog.json`](catalog.json) — so both a human and an AI chat plugin have
somewhere to look it up instead of guessing.

Install it and open it, and you get a small in-app browser of DraconDex's
features and of the `window.pluginApi` surface every plugin (including this
one) runs inside. Nothing here is user data: there's nothing to type in, and
uninstalling it deletes no tables, because it declares none.

> Requires **DraconDex 4.8.0+** to be *auto-installed* as a dependency (see
> below). The plugin itself — the manifest, the window, `catalog.json` — works
> on any version that supports plugins at all (4.0.0+).

## Why this exists

[DraconDex-Plugin-Claude](https://github.com/LDKTC/DraconDex-Plugin-Claude),
[-Ollama](https://github.com/LDKTC/DraconDex-Plugin-Ollama) and
[-Codex](https://github.com/LDKTC/DraconDex-Plugin-Codex) are chat plugins —
each runs in its own sandboxed window with **no access to the app's data or to
any other plugin's data** (see
[App-DraconDex's `docs/PLUGINS.md`](https://github.com/LDKTC/App-DraconDex/blob/main/docs/PLUGINS.md)).
That sandbox doesn't loosen just because the AI on the other end would find
some app context useful — so instead of reaching for another plugin's table,
each of those three fetches `catalog.json` straight from this **public**
repo (`pluginApi.net.fetch` against `raw.githubusercontent.com`, same as
fetching any other declared origin) and folds a short summary of it into the
model's system prompt. That's the entire mechanism: one published file, read
over plain HTTPS, by plugins that declared they'd do exactly that.

Being an actual **installed plugin** (not just a URL the other three happen to
know about) is what makes "auto pull the first time an AI plugin is
installed" real rather than aspirational: each of the three declares this repo
under `dependencies` in its manifest, so installing any one of them installs
this one too — see [Install](#install).

## Install

Normally you don't install this directly — installing Claude Chat, Ollama
Chat or Codex Chat pulls it in automatically the first time (DraconDex
4.8.0+; see §1.8 "Plugin dependencies" in
[App-DraconDex's `docs/PLUGINS.md`](https://github.com/LDKTC/App-DraconDex/blob/main/docs/PLUGINS.md)).
Installing a second or third AI plugin afterward finds this one already
present and skips it — no error, no duplicate.

To install it on its own: **Settings → Plugin → Plugins**, paste
`https://github.com/LDKTC/DraconDex-Plugin-Native`, confirm the preview.

## What's in `catalog.json`

```json
{
  "catalogVersion": "1.0.0",
  "app": { "name": "DraconDex", "tagline": "…", "description": "…" },
  "features": [{ "id": "nexus", "name": "Nexus", "description": "…" }, "…"],
  "moduleKinds": ["collector", "manager", "…"],
  "pluginCapabilities": { "summary": "…", "can": ["…"], "cannot": ["…"] }
}
```

- `app` — what DraconDex is, in one name/tagline/description.
- `features` — the app's systems (Nexus, Scribe, Director, Navigator, Hero,
  Writer, Sage, Artisan, plugins, …), each a short id/name/description.
- `moduleKinds` — the 15 kinds a Nexus module node can be.
- `pluginCapabilities` — what `window.pluginApi` actually lets a plugin do
  and not do, condensed from `docs/PLUGINS.md` — the part most useful to an
  AI that's being asked "can you do X in this app."

It's plain data, not executable, and every field is written by this repo —
nothing in it comes from a user or from the app at runtime. `catalogVersion`
and `updated` are bumped by hand when the content changes; consumers are free
to cache it indefinitely and re-fetch occasionally rather than on every use.

## Structure

| File | Purpose |
| --- | --- |
| `dracondex-plugin.json` | Manifest: id `ai_native`, files. No tables, no panels, no permissions. |
| `catalog.json` | The published catalog — see above. |
| `index.html` + `app.js` | Renders `catalog.json` for a human. Plain `fetch('catalog.json')` — a same-directory file this plugin shipped itself, not `pluginApi.net`. |
| `style.css` | Mirrors the app's dark theme tokens. |
| `scripts/validate-manifest.mjs` | Local manifest check. Not shipped — it isn't in `files`. |

## Developing

```bash
node scripts/validate-manifest.mjs   # same rules the app enforces on install
node --check app.js
python3 -c "import json; json.load(open('catalog.json'))"   # or: node -e "JSON.parse(require('fs').readFileSync('catalog.json'))"
```

Then in DraconDex: **Settings → Plugin → Plugins**, paste this repo's link,
confirm the preview. Reinstalling after a change means uninstalling first
(the same `id` can't install twice).

## License

MIT, see [LICENSE](LICENSE).
