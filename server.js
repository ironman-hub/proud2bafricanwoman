// Proud2bAfricanWoman — online shop server
// Express + libSQL (local SQLite file, or Turso on Vercel) + Vercel Blob photos + Stripe Checkout
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const { createClient } = require('@libsql/client');

const PORT = process.env.PORT || 3000;
const ON_VERCEL = !!process.env.VERCEL;
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(__dirname, 'data'));
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
// Vercel integrations may add a custom prefix to variable names, so look for them by suffix too
const envBySuffix = (suffix, test = () => true) => { const k = Object.keys(process.env).find(k => k.endsWith(suffix) && test(process.env[k])); return k ? process.env[k] : undefined; };
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN || envBySuffix('BLOB_READ_WRITE_TOKEN');
const USE_BLOB = !!BLOB_TOKEN;
if (!ON_VERCEL) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const CURRENCY = (process.env.CURRENCY || 'gbp').toLowerCase();
const stripe = process.env.STRIPE_SECRET_KEY
  ? require('stripe')(process.env.STRIPE_SECRET_KEY, process.env.STRIPE_TEST_HOST // only used for local automated tests
    ? { host: process.env.STRIPE_TEST_HOST.split(':')[0], port: +process.env.STRIPE_TEST_HOST.split(':')[1], protocol: 'http' } : {})
  : null;

const CATEGORIES = [
  { slug: 'jewellery', name: 'Jewellery' },
  { slug: 'home-decoration', name: 'Home & Decoration' },
  { slug: 'groceries', name: 'Groceries' },
  { slug: 'clothing', name: 'Clothing' },
  { slug: 'kids', name: 'Kids' },
  { slug: 'accessories', name: 'Accessories' },
  { slug: 'beauty-hair', name: 'Beauty & Hair' },
];
const CAT_SLUGS = new Set(CATEGORIES.map(c => c.slug));

// ---------- Database ----------
const DB_URL = process.env.TURSO_DATABASE_URL || envBySuffix('DATABASE_URL', v => /^(libsql|https?|wss?):/.test(v)) || (ON_VERCEL ? null : 'file:' + path.join(DATA_DIR, 'shop.db'));
const DB_TOKEN = process.env.TURSO_AUTH_TOKEN || envBySuffix('TURSO_AUTH_TOKEN') || envBySuffix('DATABASE_AUTH_TOKEN') || envBySuffix('_AUTH_TOKEN');
const client = DB_URL ? createClient({ url: DB_URL, authToken: DB_URL.startsWith('file:') ? undefined : DB_TOKEN }) : null;
const toObjects = rs => rs.rows.map(r => Object.fromEntries(rs.columns.map((c, i) => [c, typeof r[i] === 'bigint' ? Number(r[i]) : r[i]])));
const db = {
  all: async (sql, args = []) => toObjects(await client.execute({ sql, args })),
  get: async (sql, args = []) => (await db.all(sql, args))[0],
  run: async (sql, args = []) => { const r = await client.execute({ sql, args }); return { lastInsertRowid: Number(r.lastInsertRowid), changes: r.rowsAffected }; },
};

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  is_admin INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price INTEGER NOT NULL,
  category TEXT NOT NULL,
  image TEXT,
  in_stock INTEGER NOT NULL DEFAULT 1,
  featured INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  email TEXT,
  customer_name TEXT,
  items TEXT NOT NULL,
  subtotal INTEGER NOT NULL,
  shipping INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  address TEXT,
  stripe_session_id TEXT UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);
CREATE TABLE IF NOT EXISTS subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);`;

const DEFAULT_SETTINGS = {
  whatsapp: process.env.WHATSAPP_NUMBER || '447000000000',
  email: 'info@proud2bafricanwoman.com',
  phone: '',
  facebook: 'https://facebook.com/',
  tiktok: 'https://tiktok.com/',
  instagram: 'https://instagram.com/',
  youtube: 'https://youtube.com/',
  x: 'https://x.com/',
  announcement: 'Worldwide shipping · Handpicked African craft · Secure checkout',
  shipping_uk: '445',
  shipping_eu: '695',
  shipping_world: '1295',
  free_shipping_over: '7500',
  hours: 'Mon – Fri: 9am – 6pm · Sat: 9am – 12pm · Closed Sundays',
  hero_title: 'Proud to be an African Woman',
  hero_subtitle: 'Statement jewellery, fashion & lifestyle — rooted in culture',
};
// Default photography (free Unsplash licence). The owner replaces any of these in Admin > Photos.
const U = 'https://images.unsplash.com/';
const DEFAULT_IMAGES = {
  img_hero1: U + 'photo-1696962701419-6f510910e838?w=2200&h=1000&fit=crop&crop=faces&q=80&auto=format',
  img_hero2: U + 'photo-1527203561188-dae1bc1a417f?w=2200&h=1000&fit=crop&crop=faces&q=80&auto=format',
  img_hero3: U + 'photo-1631346543932-ce110c10dbec?w=2200&h=1000&fit=crop&crop=faces&q=80&auto=format',
  'img_cat_jewellery': U + 'photo-1713845784497-fe3d7ed176d8?w=900&h=900&fit=crop&crop=faces&q=80&auto=format',
  'img_cat_home-decoration': U + 'photo-1596626417050-39c7f6ddd2c9?w=900&h=900&fit=crop&q=80&auto=format',
  'img_cat_groceries': U + 'photo-1758745464235-ccb8c1253074?w=900&h=900&fit=crop&q=80&auto=format',
  'img_cat_clothing': U + 'photo-1696962678565-bee84e6b9cb6?w=900&h=900&fit=crop&crop=faces&q=80&auto=format',
  'img_cat_kids': U + 'photo-1791774023235-b7b5628d671e?w=900&h=900&fit=crop&crop=faces&q=80&auto=format',
  'img_cat_accessories': U + 'photo-1757140448469-b89958de834d?w=900&h=900&fit=crop&q=80&auto=format',
  'img_cat_beauty-hair': U + 'photo-1643956740911-62c19a5405f0?w=900&h=900&fit=crop&crop=faces&q=80&auto=format',
  img_banner1: U + 'photo-1530785602389-07594beb8b73?w=1400&h=1000&fit=crop&crop=faces&q=80&auto=format',
  img_banner2: U + 'photo-1552793084-49132af00ff1?w=1400&h=1000&fit=crop&crop=faces&q=80&auto=format',
};
Object.assign(DEFAULT_SETTINGS, DEFAULT_IMAGES);

async function init() {
  if (!client) throw new Error('No database connected. On Vercel, add the Turso database integration (see README).');
  await client.executeMultiple(SCHEMA);
  await client.batch(Object.entries(DEFAULT_SETTINGS).map(([k, v]) => ({ sql: 'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', args: [k, v] })), 'write');
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    const email = process.env.ADMIN_EMAIL.trim().toLowerCase();
    const existing = await db.get('SELECT id, password_hash, is_admin FROM users WHERE email = ?', [email]);
    if (!existing) await db.run('INSERT INTO users (name, email, password_hash, is_admin) VALUES (?, ?, ?, 1)', [process.env.ADMIN_NAME || 'Nelly', email, bcrypt.hashSync(process.env.ADMIN_PASSWORD, 10)]);
    else if (!existing.is_admin || !bcrypt.compareSync(process.env.ADMIN_PASSWORD, existing.password_hash)) await db.run('UPDATE users SET is_admin = 1, password_hash = ? WHERE id = ?', [bcrypt.hashSync(process.env.ADMIN_PASSWORD, 10), existing.id]);
  }
  if ((await db.get('SELECT COUNT(*) n FROM products')).n === 0 && process.env.SEED !== 'false') {
    const seed = [
      ['Horn Drop Earrings', 'Hand-finished ivory-tone horn drop on a gold hook. Light, striking and made to be noticed.', 1299, 'earring-horn.jpg', 1],
      ['Map of Africa Earrings', 'Our signature gold-tone Africa outline earrings — carry the continent with you, every day.', 1299, 'earring-africa-gold.jpg', 1],
      ['Indigo Woven Disc Earrings', 'Tightly hand-woven disc in deep indigo. A quiet nod to the ndop cloth that inspires our brand.', 1299, 'earring-indigo-disc.jpg', 1],
      ['Fuchsia Woven Disc Earrings', 'Bold fuchsia hand-woven disc earrings. Joyful colour for every occasion.', 1299, 'earring-fuchsia-disc.jpg', 0],
    ];
    await client.batch(seed.map(([n, d, p, img, f]) => ({ sql: 'INSERT INTO products (name, description, price, category, image, featured) VALUES (?, ?, ?, ?, ?, ?)', args: [n, d, p, 'jewellery', '/img/seed/' + img, f] })), 'write');
  }
}
let readyPromise = null;
const ready = () => (readyPromise = readyPromise || init().catch(e => { readyPromise = null; throw e; }));

const getSettings = async () => Object.fromEntries((await db.all('SELECT key, value FROM settings')).map(r => [r.key, r.value]));
const setSetting = (k, v) => db.run('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', [k, v]);

// ---------- Photo storage (Vercel Blob online, local folder on your computer) ----------
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, /^image\/(jpeg|png|webp|gif|avif)$/.test(file.mimetype)),
});
async function storeImage(file, folder) {
  const ext = ({ 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif', 'image/avif': '.avif' })[file.mimetype] || '.jpg';
  const name = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
  if (USE_BLOB) {
    const { put } = require('@vercel/blob');
    const blob = await put(`${folder}/${name}`, file.buffer, { access: 'public', contentType: file.mimetype, token: BLOB_TOKEN });
    return blob.url;
  }
  if (ON_VERCEL) throw new Error('Photo storage is not connected. In Vercel, add a Blob store to this project (see README).');
  await fs.promises.writeFile(path.join(UPLOAD_DIR, name), file.buffer);
  return '/uploads/' + name;
}
async function removeImage(url) {
  try {
    if (!url) return;
    if (USE_BLOB && /\.blob\.vercel-storage\.com\//.test(url)) { const { del } = require('@vercel/blob'); await del(url, { token: BLOB_TOKEN }); }
    else if (url.startsWith('/uploads/')) await fs.promises.rm(path.join(UPLOAD_DIR, path.basename(url)), { force: true });
  } catch (e) { console.error('Could not remove image', e.message); }
}

// ---------- App ----------
const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use('/api', async (req, res, next) => {
  try { await ready(); next(); }
  catch (e) { console.error(e); res.status(500).json({ error: e.message.startsWith('No database') ? e.message : 'The shop database is not reachable right now.' }); }
});

// Stripe webhook needs the raw body, so it is registered before express.json()
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) return res.status(400).send('Webhook not configured');
  let event;
  try { event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET); }
  catch (e) { return res.status(400).send(`Webhook error: ${e.message}`); }
  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') await markPaid(event.data.object);
  res.json({ received: true });
});

app.use(express.json({ limit: '1mb' }));
app.use(cookieSession({
  name: 'p2baw',
  keys: [process.env.SESSION_SECRET || 'change-this-secret-in-production'],
  maxAge: 30 * 24 * 60 * 60 * 1000,
  sameSite: 'lax',
  httpOnly: true,
}));
// Secure cookies when the visitor is on HTTPS (live site); plain cookies on http://localhost so local testing works
app.use((req, res, next) => { if (req.sessionOptions) req.sessionOptions.secure = req.secure; next(); });
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// On your computer Express serves the pages; on Vercel the public/ folder is served by Vercel's CDN.
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }));
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

// Async route wrapper so errors reach the error handler
const h = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ---------- Helpers ----------
const currentUser = async req => req.session && req.session.uid
  ? (await db.get('SELECT id, name, email, is_admin FROM users WHERE id = ?', [req.session.uid])) || null
  : null;
const requireUser = h(async (req, res, next) => { const u = await currentUser(req); if (!u) return res.status(401).json({ error: 'Please log in.' }); req.user = u; next(); });
const requireAdmin = h(async (req, res, next) => { const u = await currentUser(req); if (!u || !u.is_admin) return res.status(403).json({ error: 'Admins only.' }); req.user = u; next(); });
const publicUser = u => u && ({ id: u.id, name: u.name, email: u.email, isAdmin: !!u.is_admin });
const cleanEmail = e => String(e || '').trim().toLowerCase();
const validEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const toPence = v => { const n = Math.round(parseFloat(String(v).replace(/[^0-9.]/g, '')) * 100); return Number.isFinite(n) && n > 0 ? n : null; };
const imgUrl = i => !i ? null : /^(https?:)?\//.test(i) ? i : '/uploads/' + i; // older local rows stored only the file name
const productOut = p => p && ({ ...p, in_stock: !!p.in_stock, featured: !!p.featured, image: imgUrl(p.image) });

const attempts = new Map();
const rateLimit = (req, res, next) => {
  const key = req.ip; const now = Date.now();
  const list = (attempts.get(key) || []).filter(t => now - t < 15 * 60 * 1000);
  if (list.length >= 20) return res.status(429).json({ error: 'Too many attempts. Please wait a few minutes.' });
  list.push(now); attempts.set(key, list); next();
};

// ---------- Public API ----------
app.get('/api/config', h(async (req, res) => {
  const s = await getSettings();
  const counts = Object.fromEntries((await db.all('SELECT category, COUNT(*) n FROM products GROUP BY category')).map(r => [r.category, r.n]));
  res.json({
    categories: CATEGORIES.map(c => ({ ...c, count: counts[c.slug] || 0, image: s['img_cat_' + c.slug] || null })),
    images: Object.fromEntries(Object.keys(DEFAULT_IMAGES).map(k => [k, s[k]])),
    currency: CURRENCY,
    paymentsEnabled: !!stripe,
    settings: {
      whatsapp: s.whatsapp, email: s.email, phone: s.phone,
      facebook: s.facebook, tiktok: s.tiktok, instagram: s.instagram, youtube: s.youtube, x: s.x,
      announcement: s.announcement, hours: s.hours, hero_title: s.hero_title, hero_subtitle: s.hero_subtitle,
      shipping_uk: +s.shipping_uk, shipping_eu: +s.shipping_eu, shipping_world: +s.shipping_world,
      free_shipping_over: +s.free_shipping_over,
    },
  });
}));

app.get('/api/products', h(async (req, res) => {
  const where = []; const args = [];
  if (req.query.category && CAT_SLUGS.has(req.query.category)) { where.push('category = ?'); args.push(req.query.category); }
  if (req.query.q) { where.push('(name LIKE ? OR description LIKE ?)'); args.push(`%${req.query.q}%`, `%${req.query.q}%`); }
  if (req.query.min) { where.push('price >= ?'); args.push(Math.round(+req.query.min * 100) || 0); }
  if (req.query.max) { where.push('price <= ?'); args.push(Math.round(+req.query.max * 100) || 1e9); }
  if (req.query.instock === '1') where.push('in_stock = 1');
  if (req.query.featured === '1') where.push('featured = 1');
  const sorts = { new: 'created_at DESC, id DESC', old: 'created_at ASC, id ASC', 'price-asc': 'price ASC', 'price-desc': 'price DESC', az: 'name COLLATE NOCASE ASC', za: 'name COLLATE NOCASE DESC', featured: 'featured DESC, id DESC' };
  const order = sorts[req.query.sort] || sorts.featured;
  const limit = Math.min(parseInt(req.query.limit) || 200, 500);
  const rows = await db.all(`SELECT * FROM products ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY ${order} LIMIT ${limit}`, args);
  res.json(rows.map(productOut));
}));

app.get('/api/products/:id', h(async (req, res) => {
  const p = await db.get('SELECT * FROM products WHERE id = ?', [req.params.id]);
  if (!p) return res.status(404).json({ error: 'Product not found' });
  res.json(productOut(p));
}));

app.post('/api/subscribe', rateLimit, h(async (req, res) => {
  const email = cleanEmail(req.body.email);
  if (!validEmail(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
  await db.run('INSERT OR IGNORE INTO subscribers (email) VALUES (?)', [email]);
  res.json({ ok: true });
}));

// ---------- Auth ----------
app.get('/api/me', h(async (req, res) => res.json({ user: publicUser(await currentUser(req)) })));

app.post('/api/register', rateLimit, h(async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = cleanEmail(req.body.email);
  const password = String(req.body.password || '');
  if (!name) return res.status(400).json({ error: 'Please enter your name.' });
  if (!validEmail(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  if (await db.get('SELECT id FROM users WHERE email = ?', [email])) return res.status(409).json({ error: 'An account with this email already exists. Try logging in.' });
  const info = await db.run('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)', [name, email, bcrypt.hashSync(password, 10)]);
  req.session.uid = info.lastInsertRowid;
  res.json({ user: publicUser(await currentUser(req)) });
}));

app.post('/api/login', rateLimit, h(async (req, res) => {
  const u = await db.get('SELECT * FROM users WHERE email = ?', [cleanEmail(req.body.email)]);
  if (!u || !bcrypt.compareSync(String(req.body.password || ''), u.password_hash)) return res.status(401).json({ error: 'Email or password is incorrect.' });
  req.session.uid = u.id;
  res.json({ user: publicUser(u) });
}));

app.post('/api/logout', (req, res) => { req.session = null; res.json({ ok: true }); });

app.post('/api/account/password', requireUser, h(async (req, res) => {
  const u = await db.get('SELECT * FROM users WHERE id = ?', [req.user.id]);
  if (!bcrypt.compareSync(String(req.body.current || ''), u.password_hash)) return res.status(400).json({ error: 'Current password is incorrect.' });
  if (String(req.body.password || '').length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters.' });
  await db.run('UPDATE users SET password_hash = ? WHERE id = ?', [bcrypt.hashSync(req.body.password, 10), u.id]);
  res.json({ ok: true });
}));

app.get('/api/my/orders', requireUser, h(async (req, res) => {
  const rows = await db.all("SELECT id, items, subtotal, shipping, total, status, created_at FROM orders WHERE user_id = ? AND status != 'pending' ORDER BY id DESC", [req.user.id]);
  res.json(rows.map(o => ({ ...o, items: JSON.parse(o.items) })));
}));

// ---------- Checkout (Stripe) ----------
app.post('/api/checkout', h(async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Online payments are not switched on yet. Please contact us on WhatsApp to order.' });
  const cart = Array.isArray(req.body.items) ? req.body.items : [];
  if (!cart.length) return res.status(400).json({ error: 'Your bag is empty.' });

  // Prices always come from the database, never from the browser
  const items = [];
  for (const it of cart.slice(0, 50)) {
    const p = await db.get('SELECT * FROM products WHERE id = ?', [it.id]);
    const qty = Math.max(1, Math.min(20, parseInt(it.qty) || 1));
    if (!p) continue;
    if (!p.in_stock) return res.status(400).json({ error: `Sorry, "${p.name}" is sold out.` });
    items.push({ id: p.id, name: p.name, price: p.price, qty, image: imgUrl(p.image) });
  }
  if (!items.length) return res.status(400).json({ error: 'These products are no longer available.' });

  const s = await getSettings();
  const subtotal = items.reduce((a, i) => a + i.price * i.qty, 0);
  const freeOver = +s.free_shipping_over || 0;
  const isFree = freeOver > 0 && subtotal >= freeOver;
  const user = await currentUser(req);
  const origin = (process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
  const absImg = i => !i ? null : i.startsWith('http') ? i : origin + i;

  const shipOpt = (label, amount, min, max) => ({
    shipping_rate_data: {
      type: 'fixed_amount', display_name: label,
      fixed_amount: { amount: isFree && label.startsWith('UK') ? 0 : amount, currency: CURRENCY },
      delivery_estimate: { minimum: { unit: 'business_day', value: min }, maximum: { unit: 'business_day', value: max } },
    },
  });

  try {
    const order = await db.run('INSERT INTO orders (user_id, email, items, subtotal, total) VALUES (?, ?, ?, ?, ?)',
      [user ? user.id : null, user ? user.email : null, JSON.stringify(items), subtotal, subtotal]);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: items.map(i => ({
        quantity: i.qty,
        price_data: {
          currency: CURRENCY, unit_amount: i.price,
          product_data: { name: i.name, ...(i.image && absImg(i.image).startsWith('https') ? { images: [absImg(i.image)] } : {}) },
        },
      })),
      shipping_address_collection: { allowed_countries: (process.env.SHIP_COUNTRIES || 'GB,IE,FR,DE,NL,BE,ES,IT,PT,US,CA,ZA,NG,GH,KE,ZW').split(',') },
      shipping_options: [
        shipOpt(isFree ? 'UK Royal Mail (free)' : 'UK Royal Mail', +s.shipping_uk, 2, 4),
        shipOpt('Europe', +s.shipping_eu, 4, 8),
        shipOpt('Rest of world', +s.shipping_world, 6, 14),
      ],
      phone_number_collection: { enabled: true },
      ...(user ? { customer_email: user.email } : {}),
      client_reference_id: String(order.lastInsertRowid),
      metadata: { order_id: String(order.lastInsertRowid) },
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/shop?cancelled=1`,
    });
    await db.run('UPDATE orders SET stripe_session_id = ? WHERE id = ?', [session.id, order.lastInsertRowid]);
    res.json({ url: session.url });
  } catch (e) {
    console.error('Stripe error:', e.message);
    res.status(500).json({ error: 'We could not start the payment. Please try again or contact us on WhatsApp.' });
  }
}));

async function markPaid(session) {
  if (!session || session.payment_status !== 'paid') return null;
  const order = await db.get('SELECT * FROM orders WHERE stripe_session_id = ?', [session.id]);
  if (!order) return null;
  if (order.status === 'pending') {
    const d = session.customer_details || {};
    const ship = session.shipping_details || (session.collected_information && session.collected_information.shipping_details) || {};
    const addr = ship.address || d.address || {};
    const address = [ship.name || d.name, addr.line1, addr.line2, addr.city, addr.postal_code, addr.state, addr.country, d.phone].filter(Boolean).join(', ');
    const shipping = (session.shipping_cost && session.shipping_cost.amount_total) || 0;
    await db.run("UPDATE orders SET status = 'paid', email = ?, customer_name = ?, address = ?, shipping = ?, total = ? WHERE id = ?",
      [d.email || order.email, ship.name || d.name || null, address, shipping, session.amount_total || order.total, order.id]);
  }
  return db.get('SELECT * FROM orders WHERE id = ?', [order.id]);
}

app.get('/api/checkout/confirm', h(async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Payments not configured' });
  let session;
  try { session = await stripe.checkout.sessions.retrieve(String(req.query.session_id || '')); }
  catch (e) { return res.status(400).json({ error: 'Could not find that payment.' }); }
  const order = await markPaid(session);
  if (!order) return res.json({ paid: false });
  res.json({ paid: true, order: { id: order.id, total: order.total, items: JSON.parse(order.items), email: order.email } });
}));

// ---------- Admin API ----------
app.post('/api/admin/products', requireAdmin, upload.single('image'), h(async (req, res) => {
  const { name, description = '', category } = req.body;
  const price = toPence(req.body.price);
  if (!name || !String(name).trim()) return res.status(400).json({ error: 'Product name is required.' });
  if (!price) return res.status(400).json({ error: 'Enter a valid price, e.g. 12.99' });
  if (!CAT_SLUGS.has(category)) return res.status(400).json({ error: 'Choose a category.' });
  if (!req.file) return res.status(400).json({ error: 'Please add a product photo (JPG, PNG or WEBP).' });
  const image = await storeImage(req.file, 'products');
  const info = await db.run('INSERT INTO products (name, description, price, category, image, in_stock, featured) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [String(name).trim(), String(description).trim(), price, category, image, req.body.in_stock === 'false' ? 0 : 1, req.body.featured === 'true' ? 1 : 0]);
  res.json(productOut(await db.get('SELECT * FROM products WHERE id = ?', [info.lastInsertRowid])));
}));

app.put('/api/admin/products/:id', requireAdmin, upload.single('image'), h(async (req, res) => {
  const p = await db.get('SELECT * FROM products WHERE id = ?', [req.params.id]);
  if (!p) return res.status(404).json({ error: 'Not found' });
  const name = req.body.name != null ? String(req.body.name).trim() : p.name;
  const price = req.body.price != null ? toPence(req.body.price) : p.price;
  const category = req.body.category != null ? req.body.category : p.category;
  if (!name || !price || !CAT_SLUGS.has(category)) return res.status(400).json({ error: 'Check the name, price and category.' });
  let image = p.image;
  if (req.file) { image = await storeImage(req.file, 'products'); await removeImage(imgUrl(p.image)); }
  await db.run('UPDATE products SET name = ?, description = ?, price = ?, category = ?, image = ?, in_stock = ?, featured = ? WHERE id = ?',
    [name, req.body.description != null ? String(req.body.description).trim() : p.description, price, category, image,
      req.body.in_stock != null ? (req.body.in_stock === 'false' ? 0 : 1) : p.in_stock,
      req.body.featured != null ? (req.body.featured === 'true' ? 1 : 0) : p.featured, p.id]);
  res.json(productOut(await db.get('SELECT * FROM products WHERE id = ?', [p.id])));
}));

app.delete('/api/admin/products/:id', requireAdmin, h(async (req, res) => {
  const p = await db.get('SELECT * FROM products WHERE id = ?', [req.params.id]);
  if (!p) return res.status(404).json({ error: 'Not found' });
  await db.run('DELETE FROM products WHERE id = ?', [p.id]);
  await removeImage(imgUrl(p.image));
  res.json({ ok: true });
}));

app.get('/api/admin/orders', requireAdmin, h(async (req, res) => {
  const rows = await db.all("SELECT * FROM orders WHERE status != 'pending' ORDER BY id DESC LIMIT 500");
  res.json(rows.map(o => ({ ...o, items: JSON.parse(o.items) })));
}));

app.patch('/api/admin/orders/:id', requireAdmin, h(async (req, res) => {
  const status = String(req.body.status || '');
  if (!['paid', 'shipped', 'cancelled'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  await db.run('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
  res.json({ ok: true });
}));

app.get('/api/admin/stats', requireAdmin, h(async (req, res) => {
  const n = async sql => (await db.get(sql)).n;
  res.json({
    products: await n('SELECT COUNT(*) n FROM products'),
    customers: await n('SELECT COUNT(*) n FROM users WHERE is_admin = 0'),
    orders: await n("SELECT COUNT(*) n FROM orders WHERE status IN ('paid','shipped')"),
    toShip: await n("SELECT COUNT(*) n FROM orders WHERE status = 'paid'"),
    revenue: await n("SELECT COALESCE(SUM(total),0) n FROM orders WHERE status IN ('paid','shipped')"),
    paymentsEnabled: !!stripe,
    photosEnabled: USE_BLOB || !ON_VERCEL,
  });
}));

app.get('/api/admin/customers', requireAdmin, h(async (req, res) => {
  res.json(await db.all('SELECT id, name, email, created_at FROM users WHERE is_admin = 0 ORDER BY id DESC'));
}));

app.get('/api/admin/subscribers', requireAdmin, h(async (req, res) => {
  res.json(await db.all('SELECT email, created_at FROM subscribers ORDER BY id DESC'));
}));

// Homepage / category photos
app.post('/api/admin/media/:key', requireAdmin, upload.single('image'), h(async (req, res) => {
  const key = req.params.key;
  if (!(key in DEFAULT_IMAGES)) return res.status(400).json({ error: 'Unknown photo slot' });
  if (!req.file) return res.status(400).json({ error: 'Please choose a photo.' });
  const url = await storeImage(req.file, 'site');
  const old = (await getSettings())[key];
  await setSetting(key, url);
  if (old !== DEFAULT_IMAGES[key]) await removeImage(old);
  res.json({ key, url });
}));
app.delete('/api/admin/media/:key', requireAdmin, h(async (req, res) => {
  const key = req.params.key;
  if (!(key in DEFAULT_IMAGES)) return res.status(400).json({ error: 'Unknown photo slot' });
  const old = (await getSettings())[key];
  await setSetting(key, DEFAULT_IMAGES[key]);
  if (old !== DEFAULT_IMAGES[key]) await removeImage(old);
  res.json({ key, url: DEFAULT_IMAGES[key] });
}));

app.get('/api/admin/settings', requireAdmin, h(async (req, res) => res.json(await getSettings())));
app.put('/api/admin/settings', requireAdmin, h(async (req, res) => {
  for (const k of Object.keys(DEFAULT_SETTINGS)) {
    if (req.body[k] == null || k.startsWith('img_')) continue;
    let v = String(req.body[k]).trim();
    if (k === 'whatsapp') v = v.replace(/[^0-9]/g, '');
    if (k.startsWith('shipping_') || k === 'free_shipping_over') v = String(Math.max(0, Math.round(parseFloat(v || '0') * 100)) || 0);
    await setSetting(k, v);
  }
  res.json(await getSettings());
}));

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// Errors
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) return res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'Photo is too large (max 4MB). Try a smaller photo.' : err.message });
  console.error(err);
  res.status(500).json({ error: err.message && /storage is not connected/.test(err.message) ? err.message : 'Something went wrong.' });
});

module.exports = app;

if (!ON_VERCEL && require.main === module) {
  ready().then(() => {
    app.listen(PORT, () => {
      console.log(`Proud2bAfricanWoman shop running on http://localhost:${PORT}`);
      if (!stripe) console.log('⚠  STRIPE_SECRET_KEY not set — checkout is disabled until you add it to .env');
      if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) console.log(`Admin login: ${process.env.ADMIN_EMAIL} → http://localhost:${PORT}/account`);
      else console.log('⚠  ADMIN_EMAIL / ADMIN_PASSWORD not set in .env — no admin account. Run: npm run make-admin -- you@email.com YourPassword');
    });
  }).catch(e => { console.error('Could not start:', e.message); process.exit(1); });
}
