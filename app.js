// AI Native — a read-only reference plugin. It has no window.pluginApi tables
// and needs none: its whole job is to publish catalog.json (this app's public
// feature/tool catalog, bundled as a plain file in `files`) and render it for
// a human, here. It works identically whether it's installed or just opened
// straight from disk — there's no capability that only exists once installed.
//
// The other half of the point is that catalog.json is also a real file at a
// stable raw-GitHub URL: DraconDex-Plugin-Claude/-Ollama/-Codex fetch it
// directly (see their src/catalog.js) to give their connected model some
// baseline knowledge of this app, since a plugin sandbox can never read
// another plugin's files or tables directly — see
// https://github.com/LDKTC/App-DraconDex/blob/main/docs/PLUGINS.md

document.getElementById('close-btn').onclick = () => window.close();

const root = document.getElementById('root');
const loading = document.getElementById('loading');
const errorBox = document.getElementById('error');

function showError(e) {
  loading.hidden = true;
  errorBox.textContent = String(e?.message || e);
  errorBox.hidden = false;
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function section(titleText) {
  const s = el('section', 'cat-section');
  s.appendChild(el('h2', 'cat-h2', titleText));
  return s;
}

function renderHeader(app) {
  const head = el('div', 'cat-head');
  head.appendChild(el('h1', 'cat-name', app?.name || 'DraconDex'));
  if (app?.tagline) head.appendChild(el('p', 'cat-tagline', app.tagline));
  if (app?.description) head.appendChild(el('p', 'cat-desc', app.description));
  return head;
}

function renderFeatures(features) {
  const s = section('Features');
  const list = el('ul', 'cat-list');
  for (const f of features || []) {
    const li = el('li', 'cat-feature');
    li.appendChild(el('strong', null, f.name));
    if (f.description) li.appendChild(el('p', null, f.description));
    list.appendChild(li);
  }
  s.appendChild(list);
  return s;
}

function renderCapabilities(caps) {
  const s = section('What a plugin can do');
  if (caps?.summary) s.appendChild(el('p', 'cat-hint', caps.summary));

  const cols = el('div', 'cat-cols');

  const canCol = el('div', 'cat-col');
  canCol.appendChild(el('h3', 'cat-h3 cat-can', 'Can'));
  const canList = el('ul', 'cat-list cat-plain');
  for (const line of caps?.can || []) canList.appendChild(el('li', null, line));
  canCol.appendChild(canList);

  const cannotCol = el('div', 'cat-col');
  cannotCol.appendChild(el('h3', 'cat-h3 cat-cannot', 'Cannot'));
  const cannotList = el('ul', 'cat-list cat-plain');
  for (const line of caps?.cannot || []) cannotList.appendChild(el('li', null, line));
  cannotCol.appendChild(cannotList);

  cols.append(canCol, cannotCol);
  s.appendChild(cols);
  return s;
}

function renderFooter(catalog) {
  const parts = [];
  if (catalog.catalogVersion) parts.push(`catalog v${catalog.catalogVersion}`);
  if (catalog.updated) parts.push(`updated ${catalog.updated}`);
  if (catalog.forAppMinVersion) parts.push(`DraconDex ${catalog.forAppMinVersion}+`);
  return el('p', 'cat-footer', parts.join(' · '));
}

function render(catalog) {
  root.replaceChildren();
  root.appendChild(renderHeader(catalog.app));
  root.appendChild(renderFeatures(catalog.features));
  root.appendChild(renderCapabilities(catalog.pluginCapabilities));
  root.appendChild(renderFooter(catalog));
}

async function start() {
  try {
    // A plain relative fetch of a file this plugin shipped itself — not
    // window.pluginApi.net, which is only for origins a manifest declares.
    // AI Native declares none: it doesn't need the network to do its job.
    const res = await fetch('catalog.json');
    if (!res.ok) throw new Error(`catalog.json: HTTP ${res.status}`);
    const catalog = await res.json();
    loading.hidden = true;
    render(catalog);
  } catch (e) {
    showError(e);
  }
}

start();
