/* Website translation: English (default), French, Spanish, German.
   The visitor picks a language in the header (or accepts the offer that appears when their browser
   is set to French, Spanish or German). The choice is remembered in this browser.
   Page text is translated from the dictionaries in js/i18n-dict.js. Product names, product
   descriptions and customer reviews stay exactly as written. */
(function () {
  const LANGS = { en: 'English', fr: 'Français', es: 'Español', de: 'Deutsch' };
  const SHORT = { en: 'EN', fr: 'FR', es: 'ES', de: 'DE' };
  const KEY = 'p2baw_lang';
  const store = {
    get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} },
  };
  const qsLang = new URLSearchParams(location.search).get('lang');
  if (qsLang && LANGS[qsLang]) store.set(KEY, qsLang);
  const off = document.body && document.body.dataset.i18n === 'off'; // admin dashboard stays in English
  const lang = off ? 'en' : (LANGS[store.get(KEY)] ? store.get(KEY) : 'en');
  const DICT = (window.P2B_DICT && window.P2B_DICT[lang]) || {};
  const norm = s => s.replace(/\s+/g, ' ').trim();
  // Look-ups ignore differences in spacing and line breaks
  const table = new Map(Object.entries(DICT).map(([k, v]) => [norm(k), v]));
  const debug = /[?&]i18n-debug/.test(location.search);
  const missing = new Set();

  const fill = (s, vars) => String(s).replace(/\{(\w+)\}/g, (m, k) => vars && vars[k] != null ? vars[k] : m);
  function t(s, vars) {
    if (s == null) return '';
    const hit = lang === 'en' ? null : table.get(norm(String(s)));
    if (!hit && lang !== 'en' && debug) missing.add(norm(String(s)));
    return fill(hit || s, vars);
  }

  // ---------- Translate what is on the page ----------
  const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'CODE', 'PRE']);
  const done = new WeakMap(); // text node -> the value we set (so we never translate twice)
  const ATTRS = ['placeholder', 'aria-label', 'title', 'alt'];
  const skipEl = el => { for (let e = el; e && e !== document; e = e.parentElement) { if (SKIP.has(e.tagName) || e.getAttribute('translate') === 'no' || e.classList.contains('notranslate')) return true; } return false; };
  const looksLikeText = s => /[A-Za-z]{2}/.test(s);

  // Exact match first, then a few common wrappers: "/ Clothing" (breadcrumbs), "Clothing ✕" (filter chips), "Size:"
  function lookup(key) {
    let hit = table.get(key); if (hit) return hit;
    let m;
    if ((m = key.match(/^\/\s*(.+)$/)) && (hit = table.get(m[1]))) return '/ ' + hit;
    if ((m = key.match(/^(.+?)\s*✕$/)) && (hit = table.get(m[1]))) return hit + ' ✕';
    if ((m = key.match(/^(.+?)\s*:$/)) && (hit = table.get(m[1]))) return hit + ' :'.slice(lang === 'fr' ? 0 : 1);
    return null;
  }
  // Headings marked data-t are translated as one phrase, keeping their <em> styling
  function phrase(el) {
    if (el.dataset.tDone) return;
    const hit = table.get(norm(el.innerHTML));
    if (hit) { el.innerHTML = hit; el.dataset.tDone = '1'; el.setAttribute('translate', 'no'); }
    else if (debug) missing.add(norm(el.innerHTML));
  }
  function textNode(n) {
    const v = n.nodeValue;
    if (!v || done.get(n) === v || !looksLikeText(v) || skipEl(n.parentElement)) return;
    const key = norm(v);
    const hit = lookup(key);
    if (hit) {
      const lead = v.match(/^\s*/)[0], trail = v.match(/\s*$/)[0];
      const nv = lead + hit + trail; n.nodeValue = nv; done.set(n, nv);
    } else if (debug) missing.add(key);
  }
  function element(el) {
    if (el.tagName === 'TEXTAREA' ? skipEl(el.parentElement) || el.getAttribute('translate') === 'no' : skipEl(el)) return;
    for (const a of ATTRS) {
      const v = el.getAttribute(a); if (!v || !looksLikeText(v)) continue;
      const mark = 'data-i18n-' + a;
      if (el.getAttribute(mark) === v) continue;
      const hit = lookup(norm(v));
      if (hit) { el.setAttribute(a, hit); el.setAttribute(mark, hit); } else if (debug) missing.add(norm(v));
    }
  }
  function translate(root) {
    if (lang === 'en' && !debug) return;
    if (root.nodeType === 3) return textNode(root);
    if (root.nodeType !== 1) return;
    if (root.hasAttribute('data-t')) phrase(root);
    root.querySelectorAll('[data-t]').forEach(phrase);
    element(root);
    root.querySelectorAll('[placeholder],[aria-label],[title],[alt]').forEach(element);
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n; while ((n = w.nextNode())) textNode(n);
  }
  function translateTitle() {
    const parts = document.title.split(/\s+([|—])\s+/);
    document.title = parts.map(p => (p === '|' || p === '—') ? ` ${p} ` : t(p)).join('');
  }

  // ---------- Language switcher + "translate this page?" offer ----------
  function setLang(l) { store.set(KEY, l); const u = new URL(location.href); u.searchParams.delete('lang'); location.href = u.toString(); }
  function switcher(id, short) {
    return `<label class="lang" title="${LANGS[lang]}"><span class="sr">Language</span><select id="${id}" aria-label="Language" translate="no">${Object.keys(LANGS).map(k => `<option value="${k}" ${k === lang ? 'selected' : ''}>${short ? SHORT[k] : SHORT[k] + ' · ' + LANGS[k]}</option>`).join('')}</select></label>`;
  }
  function offer() {
    if (store.get(KEY) || lang !== 'en') return;
    const want = (navigator.languages || [navigator.language || '']).map(l => String(l).slice(0, 2).toLowerCase()).find(l => l === 'en' || (LANGS[l] && window.P2B_DICT && window.P2B_DICT[l]));
    if (!want || want === 'en') return;
    const d = window.P2B_DICT[want];
    const box = document.createElement('div');
    box.className = 'lang-offer'; box.setAttribute('role', 'dialog'); box.setAttribute('translate', 'no');
    box.innerHTML = `<p>${d['__offer'] || 'View this website in ' + LANGS[want] + '?'}</p><div class="acts"><button class="btn btn-primary btn-sm" data-l="${want}">${d['__yes'] || LANGS[want]}</button><button class="btn btn-ghost btn-sm" data-l="en">${d['__no'] || 'Keep English'}</button></div>`;
    box.onclick = e => { const b = e.target.closest('[data-l]'); if (!b) return; if (b.dataset.l === 'en') { store.set(KEY, 'en'); box.remove(); } else setLang(b.dataset.l); };
    document.body.appendChild(box);
  }

  function mount() {
    if (off) return;
    const slot = document.getElementById('lang-slot');
    if (slot) slot.outerHTML = switcher('lang-sel', true);
    const nav = document.querySelector('#menu .mnav');
    if (nav) nav.insertAdjacentHTML('beforebegin', `<div class="lang-m">${switcher('lang-sel-m')}</div>`);
    document.querySelectorAll('#lang-sel,#lang-sel-m').forEach(s => s.onchange = () => setLang(s.value));
    document.documentElement.lang = lang;
    translate(document.body); translateTitle();
    if (lang !== 'en' || debug) {
      new MutationObserver(ms => ms.forEach(m => {
        if (m.type === 'characterData') textNode(m.target);
        else if (m.type === 'attributes') element(m.target);
        else m.addedNodes.forEach(translate);
      })).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    }
    offer();
    if (debug) setTimeout(() => {
      const pre = document.createElement('pre'); pre.id = 'i18n-missing'; pre.setAttribute('translate', 'no');
      pre.textContent = JSON.stringify([...missing], null, 1); document.body.appendChild(pre);
    }, 2500);
  }

  window.P2B_I18N = { t, lang, langs: LANGS, mount, translate, setLang, missing };
})();
