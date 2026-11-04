/* Shared layout, cart and helpers for every page */
(function () {
  const I = {
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>',
    bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4.5 8.5h15l-1 12h-13l-1-12Z"/><path d="M8.5 8.5V7a3.5 3.5 0 0 1 7 0v1.5"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 7h18M3 12h18M3 17h18"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m6 6 12 12M18 6 6 18"/></svg>',
    left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="m15 5-7 7 7 7"/></svg>',
    right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="m9 5 7 7-7 7"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 12h16m-6-6 6 6-6 6"/></svg>',
    filter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M3 7h11M18 7h3M3 17h3M10 17h11"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.3-1.5 1.6-1.5h1.7V3.6c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.5-4 4.1v2.3H7.6V13h2.8v8h3.1Z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r=".9" fill="currentColor" stroke="none"/></svg>',
    tiktok: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.6 3c.3 2.2 1.6 3.6 3.9 3.8v2.6c-1.4.1-2.6-.3-3.9-1.1v5.5c0 6.6-7.2 8.7-10.1 4-1.9-3-.7-8.4 5.4-8.6v2.8c-.5.1-1 .2-1.4.3-1.4.5-2.2 1.3-2 2.9.4 3 5.9 3.9 5.4-2V3h2.7Z"/></svg>',
    youtube: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.6 7.2c-.2-.9-.9-1.6-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4c-.9.2-1.6.9-1.8 1.8C2 8.8 2 12 2 12s0 3.2.4 4.8c.2.9.9 1.6 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4c.9-.2 1.6-.9 1.8-1.8.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8ZM10 15V9l5.2 3L10 15Z"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.8 3h3.1l-6.8 7.8 8 10.2h-6.3l-4.9-6.4L5.3 21H2.2l7.3-8.3L1.8 3h6.4l4.4 5.9L17.8 3Zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5Z"/></svg>',
  };
  I.whatsapp = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2Zm5.8 14.01c-.24.68-1.42 1.3-1.96 1.35-.5.05-.97.23-3.27-.68-2.77-1.09-4.52-3.92-4.66-4.1-.13-.18-1.1-1.47-1.1-2.8 0-1.34.7-2 .95-2.27.24-.27.53-.34.71-.34l.51.01c.16 0 .38-.06.6.46.22.53.75 1.83.82 1.96.07.14.11.29.02.47-.09.18-.13.29-.27.45l-.4.47c-.13.13-.27.28-.12.55.16.27.7 1.15 1.5 1.86 1.03.92 1.9 1.2 2.17 1.34.27.13.42.11.58-.07.16-.18.67-.78.85-1.05.18-.27.36-.22.6-.13.25.09 1.56.74 1.83.87.27.13.45.2.51.31.07.11.07.65-.17 1.33Z"/></svg>';

  const state = { config: null, user: null };
  const $ = (s, el = document) => el.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const money = (pence, withCode) => {
    const cur = (state.config && state.config.currency || 'gbp').toUpperCase();
    const s = new Intl.NumberFormat('en-GB', { style: 'currency', currency: cur }).format((pence || 0) / 100);
    return withCode ? `${s} ${cur}` : s;
  };

  async function api(url, opts = {}) {
    const o = { credentials: 'same-origin', ...opts };
    if (o.body && !(o.body instanceof FormData)) { o.headers = { 'Content-Type': 'application/json', ...(o.headers || {}) }; o.body = JSON.stringify(o.body); }
    const r = await fetch(url, o);
    let data = null; try { data = await r.json(); } catch (e) {}
    if (!r.ok) throw new Error((data && data.error) || 'Something went wrong. Please try again.');
    return data;
  }

  const waLink = (msg) => {
    const n = (state.config && state.config.settings.whatsapp || '').replace(/\D/g, '');
    return `https://wa.me/${n}${msg ? '?text=' + encodeURIComponent(msg) : ''}`;
  };

  // ---------- Cart (kept in this browser) ----------
  const CART_KEY = 'p2baw_cart_v1';
  let cart = [];
  try { cart = JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (e) { cart = []; }
  const saveCart = () => { try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) {} renderCart(); };
  const cartCount = () => cart.reduce((a, i) => a + i.qty, 0);
  const cartTotal = () => cart.reduce((a, i) => a + i.qty * i.price, 0);

  function addToCart(p, qty = 1) {
    if (!p.in_stock) return toast('Sorry, this piece is sold out.', true);
    const line = cart.find(i => i.id === p.id);
    if (line) line.qty = Math.min(20, line.qty + qty);
    else cart.push({ id: p.id, name: p.name, price: p.price, image: p.image, category: p.category, qty });
    saveCart();
    openCart();
  }

  let toastT;
  function toast(msg, err) {
    let t = $('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.className = 'toast' + (err ? ' err' : ''); t.innerHTML = msg;
    requestAnimationFrame(() => t.classList.add('show'));
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 3800);
  }

  // ---------- Layout ----------
  const page = document.body.dataset.page || '';
  const catName = slug => { const c = state.config.categories.find(c => c.slug === slug); return c ? c.name : slug; };
  const brand = (cls = '') => `<a href="/" class="brand ${cls}" aria-label="Proud2bAfricanWoman home"><img src="/img/logo-black.png" alt=""><span class="bt"><b>Proud2b<i>African</i>Woman</b><small>African Lifestyle</small></span></a>`;

  function header() {
    const s = state.config.settings;
    const items = (s.announcement || '').split('·').map(x => x.trim()).filter(Boolean);
    const params = new URLSearchParams(location.search);
    const activeCat = params.get('category');
    return `
    <div class="announce" aria-label="Announcements"><div class="wrap">
      <button data-ann="-1" aria-label="Previous message">${I.left}</button>
      <div class="msgs" aria-live="polite">${items.map((t, i) => `<span class="${i ? '' : 'on'}">${esc(t)}</span>`).join('')}</div>
      <button data-ann="1" aria-label="Next message">${I.right}</button>
    </div></div>
    <header class="site-header">
      <div class="wrap hdr">
        <div class="hdr-left">
          <button class="icon-btn menu-btn" data-open="menu" aria-label="Open menu">${I.menu}</button>
          <form class="hdr-search" action="/shop" role="search"><input name="q" placeholder="Search" aria-label="Search products" value="${esc(params.get('q') || '')}"><button aria-label="Search">${I.search}</button></form>
          <a class="icon-btn search-m" href="/shop" aria-label="Search">${I.search}</a>
        </div>
        ${brand()}
        <div class="hdr-right">
          <span class="locale">United Kingdom | ${(state.config.currency || 'gbp').toUpperCase()} £</span>
          <a class="icon-btn" href="${state.user && state.user.isAdmin ? '/admin' : '/account'}" aria-label="${state.user ? 'My account' : 'Log in'}" title="${state.user ? esc(state.user.name) : 'Log in / Register'}">${I.user}</a>
          <button class="icon-btn" data-open="cart" aria-label="Open cart">${I.bag}<span class="bag-count" data-n="${cartCount()}">${cartCount() || ''}</span></button>
        </div>
      </div>
      <nav class="catnav" aria-label="Categories"><ul>
        <li><a href="/shop?sort=new" class="${page === 'shop' && !activeCat && params.get('sort') === 'new' ? 'active' : ''}">New in</a></li>
        ${state.config.categories.map(c => `<li><a href="/shop?category=${c.slug}" class="${activeCat === c.slug ? 'active' : ''}">${esc(c.name)}</a></li>`).join('')}
      </ul></nav>
    </header>
    <div class="drawer-backdrop" data-close></div>
    <aside class="drawer left" id="menu" aria-label="Menu">
      <div class="drawer-head">${brand()}<button class="icon-btn" data-close aria-label="Close menu">${I.close}</button></div>
      <div class="drawer-body">
        <form action="/shop" class="hdr-search" style="display:flex;width:100%;margin:14px 0 8px"><input name="q" placeholder="Search" aria-label="Search"><button aria-label="Search">${I.search}</button></form>
        <nav class="mnav">
          <a href="/shop?sort=new">New in</a>
          <a href="/shop">Shop all <small>${state.config.categories.reduce((a, c) => a + c.count, 0)}</small></a>
          ${state.config.categories.map(c => `<a href="/shop?category=${c.slug}">${esc(c.name)} <small>${c.count}</small></a>`).join('')}
          <a href="/info">Shipping &amp; contact</a>
          <a href="/account">${state.user ? 'My account' : 'Log in / Register'}</a>
          ${state.user && state.user.isAdmin ? '<a href="/admin">Admin dashboard</a>' : ''}
        </nav>
      </div>
      <div class="drawer-foot"><a class="btn btn-wa btn-block" href="${waLink('Hello! I have a question about your products.')}" target="_blank" rel="noopener">${I.whatsapp.replace('<svg', '<svg width="20" height="20"')} Chat on WhatsApp</a></div>
    </aside>
    <aside class="drawer right" id="cart" aria-label="Cart">
      <div class="drawer-head"><h3>Your cart</h3><button class="icon-btn" data-close aria-label="Close cart">${I.close}</button></div>
      <div class="drawer-body" id="cart-body"></div>
      <div class="drawer-foot" id="cart-foot"></div>
    </aside>`;
  }

  function footer() {
    const s = state.config.settings;
    const socials = ['facebook', 'tiktok', 'instagram', 'youtube', 'x'];
    const labels = { facebook: 'Facebook', tiktok: 'TikTok', instagram: 'Instagram', youtube: 'YouTube', x: 'X (Twitter)' };
    return `
    <footer class="site-footer">
      <div class="wrap ft-top">
        <div class="ft-brand">
          ${brand()}
          <p>Authentic African jewellery, fashion, home and beauty — carefully selected to celebrate culture, confidence and bold African elegance.</p>
          <div class="socials">${socials.filter(k => s[k]).map(k => `<a href="${esc(s[k])}" target="_blank" rel="noopener" aria-label="${labels[k]}" title="${labels[k]}">${I[k]}</a>`).join('')}</div>
        </div>
        <div><h5>Shop</h5><ul>${state.config.categories.map(c => `<li><a href="/shop?category=${c.slug}">${esc(c.name)}</a></li>`).join('')}</ul></div>
        <div><h5>Customer care</h5><ul>
          <li><a href="/info#shipping">Shipping rates</a></li>
          <li><a href="/info#contact">Contact us</a></li>
          <li><a href="/account">My account</a></li>
          <li><a href="/account">Track my orders</a></li>
          <li><a href="${waLink('Hello! I have a question.')}" target="_blank" rel="noopener">WhatsApp us</a></li>
        </ul></div>
        <div><h5>Business hours</h5><ul>
          ${(s.hours || '').split('·').map(h => `<li>${esc(h.trim())}</li>`).join('')}
          ${s.email ? `<li><a href="mailto:${esc(s.email)}">${esc(s.email)}</a></li>` : ''}
          ${s.phone ? `<li><a href="tel:${esc(s.phone)}">${esc(s.phone)}</a></li>` : ''}
        </ul></div>
      </div>
      <div class="ft-mid"><div class="wrap">
        <span class="lbl">Follow us</span>
        <div class="socials">${socials.filter(k => s[k]).map(k => `<a href="${esc(s[k])}" target="_blank" rel="noopener" aria-label="${labels[k]}">${I[k]}</a>`).join('')}</div>
      </div></div>
      <div class="wrap ft-bottom">
        <span>© ${new Date().getFullYear()}, Proud2bAfricanWoman</span>
        <div class="pay-icons" aria-label="Accepted payments"><span>VISA</span><span>MASTERCARD</span><span>AMEX</span><span>APPLE PAY</span><span>GOOGLE PAY</span></div>
      </div>
    </footer>
    <a class="wa-float" href="${waLink('Hello Proud2bAfricanWoman! 👋')}" target="_blank" rel="noopener" aria-label="Chat with us on WhatsApp">${I.whatsapp}<span class="wa-tip">Chat with us</span></a>`;
  }

  function renderCart() {
    document.querySelectorAll('.bag-count').forEach(b => { b.textContent = cartCount() || ''; b.dataset.n = cartCount(); });
    const body = $('#cart-body'), foot = $('#cart-foot');
    if (!body) return;
    if (!cart.length) {
      body.innerHTML = `<div class="cart-empty"><div class="t">Your cart is empty</div><p class="muted">Discover pieces that celebrate African elegance.</p><a class="btn btn-primary" href="/shop" style="margin-top:12px">Continue shopping</a>
        ${state.user ? '' : '<p style="margin-top:28px;font-size:14px">Have an account? <a href="/account" style="text-decoration:underline">Log in</a> to check out faster.</p>'}</div>`;
      foot.style.display = 'none'; return;
    }
    foot.style.display = '';
    body.innerHTML = cart.map(i => `
      <div class="cart-line">
        <a href="/product?id=${i.id}"><img src="${esc(i.image || '/img/ndop.jpg')}" alt=""></a>
        <div><h4><a href="/product?id=${i.id}">${esc(i.name)}</a></h4><span class="muted" style="font-size:14px">${money(i.price)}</span><br>
          <div class="qty"><button data-q="${i.id}" data-d="-1" aria-label="Decrease">−</button><span>${i.qty}</span><button data-q="${i.id}" data-d="1" aria-label="Increase">+</button></div><br>
          <button class="remove" data-rm="${i.id}">Remove</button></div>
        <div class="price">${money(i.price * i.qty)}</div>
      </div>`).join('');
    const total = cartTotal();
    const free = state.config.settings.free_shipping_over;
    const left = free - total;
    foot.innerHTML = `
      ${free > 0 ? `<div class="ship-bar">${left > 0 ? `You're <b>${money(left)}</b> away from free UK delivery` : 'You\'ve unlocked <b>free UK delivery</b>'}<div class="bar"><i style="width:${Math.min(100, total / free * 100)}%"></i></div></div>` : ''}
      <div class="totals"><span>Estimated total</span><b>${money(total, true)}</b></div>
      <p class="muted" style="font-size:13px;margin:0 0 16px">Taxes included. Shipping calculated at checkout.</p>
      <button class="btn btn-primary btn-block" id="checkout-btn">Check out</button>
      <a class="btn btn-outline btn-block" style="margin-top:10px" target="_blank" rel="noopener" href="${waLink(waOrderText())}">${I.whatsapp.replace('<svg', '<svg width="18" height="18" style="color:#1fae5b"')} Order via WhatsApp</a>
      <div class="pay-icons"><span>VISA</span><span>MASTERCARD</span><span>AMEX</span><span>APPLE PAY</span><span>GOOGLE PAY</span></div>`;
  }

  function waOrderText() {
    return 'Hello! I would like to order:\n' + cart.map(i => `• ${i.qty} × ${i.name} (${money(i.price)})`).join('\n') + `\nSubtotal: ${money(cartTotal())}`;
  }

  async function checkout(btn) {
    if (!state.config.paymentsEnabled) {
      toast(`Card payments are being set up. <a href="${waLink(waOrderText())}" target="_blank" rel="noopener">Order on WhatsApp</a>`, true);
      return;
    }
    btn.disabled = true; btn.textContent = 'Redirecting to secure payment…';
    try {
      const r = await api('/api/checkout', { method: 'POST', body: { items: cart.map(i => ({ id: i.id, qty: i.qty })) } });
      location.href = r.url;
    } catch (e) { toast(esc(e.message), true); btn.disabled = false; btn.textContent = 'Check out'; }
  }

  function openDrawer(id) {
    document.querySelectorAll('.drawer').forEach(d => d.classList.toggle('open', d.id === id));
    $('.drawer-backdrop').classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeDrawers() {
    document.querySelectorAll('.drawer.open').forEach(d => d.classList.remove('open'));
    const b = $('.drawer-backdrop'); if (b) b.classList.remove('open');
    document.body.style.overflow = '';
  }
  const openCart = () => { renderCart(); openDrawer('cart'); };

  // ---------- Product card ----------
  function productCard(p) {
    return `
    <article class="card ${p.in_stock ? '' : 'is-sold'}">
      <a class="media" href="/product?id=${p.id}" aria-label="${esc(p.name)}">
        <img src="${esc(p.image || '/img/ndop.jpg')}" alt="${esc(p.name)}" loading="lazy">
        ${!p.in_stock ? '<span class="tag sold">Sold out</span>' : p.featured ? '<span class="tag">Bestseller</span>' : ''}
      </a>
      <h3><a href="/product?id=${p.id}">${esc(p.name)}</a></h3>
      <div class="row">
        <span class="price">${money(p.price, true)}</span>
        ${p.in_stock ? `<button class="add" data-add="${p.id}" aria-label="Add ${esc(p.name)} to cart" title="Add to cart">${I.bag}</button>` : ''}
      </div>
    </article>`;
  }
  const productCache = new Map();
  const remember = list => { list.forEach(p => productCache.set(p.id, p)); return list; };

  function reveal() {
    const els = document.querySelectorAll('.reveal:not(.in)');
    if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -6% 0px' });
    els.forEach(e => io.observe(e));
  }

  // Horizontal scrollers with arrow buttons
  function scroller(btnPrev, btnNext, track) {
    const step = () => track.clientWidth * 0.8;
    btnPrev.onclick = () => track.scrollBy({ left: -step(), behavior: 'smooth' });
    btnNext.onclick = () => track.scrollBy({ left: step(), behavior: 'smooth' });
  }

  // ---------- Events ----------
  let annI = 0, annT;
  function ann(d) {
    const spans = document.querySelectorAll('.announce .msgs span'); if (!spans.length) return;
    spans[annI].classList.remove('on'); annI = (annI + d + spans.length) % spans.length; spans[annI].classList.add('on');
    clearInterval(annT); annT = setInterval(() => ann(1), 4500);
  }
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-open],[data-close],[data-add],[data-q],[data-rm],[data-ann],#checkout-btn');
    if (!t) return;
    if (t.dataset.open) { t.dataset.open === 'cart' ? openCart() : openDrawer(t.dataset.open); }
    else if (t.hasAttribute('data-close')) closeDrawers();
    else if (t.dataset.add) { const p = productCache.get(+t.dataset.add); if (p) addToCart(p); }
    else if (t.dataset.q) { const l = cart.find(i => i.id === +t.dataset.q); if (l) { l.qty += +t.dataset.d; if (l.qty < 1) cart = cart.filter(i => i !== l); saveCart(); } }
    else if (t.dataset.rm) { cart = cart.filter(i => i.id !== +t.dataset.rm); saveCart(); }
    else if (t.dataset.ann) ann(+t.dataset.ann);
    else if (t.id === 'checkout-btn') checkout(t);
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawers(); });
  window.addEventListener('scroll', () => { const h = $('.site-header'); if (h) h.classList.toggle('scrolled', scrollY > 10); }, { passive: true });

  // ---------- Boot ----------
  const ready = (async () => {
    let config, me;
    try { [config, me] = await Promise.all([api('/api/config'), api('/api/me').catch(() => ({ user: null }))]); }
    catch (e) {
      const offline = location.protocol === 'file:';
      document.body.innerHTML = `<div style="max-width:560px;margin:80px auto;padding:32px;border:1px solid #ddd;font-family:Arial,sans-serif;line-height:1.6">
        <h2 style="margin-top:0">${offline ? 'Open this site through its server' : 'The shop could not load'}</h2>
        <p>${offline ? 'This page was opened as a file from your computer. Start the site with <b>npm start</b> and visit <b>http://localhost:3000</b>, or use the live website link.' : esc(e.message)}</p></div>`;
      document.body.hidden = false;
      throw e;
    }
    state.config = config; state.user = me.user;
    if (document.body.dataset.layout !== 'none') {
      document.body.insertAdjacentHTML('afterbegin', header());
      if (document.body.dataset.footer !== 'none') document.body.insertAdjacentHTML('beforeend', footer());
      renderCart();
      annT = setInterval(() => ann(1), 4500);
    }
    setTimeout(reveal, 30);
    return state;
  })();

  window.P2B = {
    ready, state, api, money, esc, waLink, toast, productCard, remember, addToCart, openCart, reveal, catName, scroller, icons: I,
    clearCart: () => { cart = []; saveCart(); }, closeDrawers, openDrawer,
    setUser: u => { state.user = u; },
  };
})();
