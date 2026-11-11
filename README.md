# Proud2bAfricanWoman — Online Shop

A complete online shop: product catalogue in 7 categories, customer accounts, card payments (Stripe), WhatsApp contact, and an admin dashboard where the owner adds and deletes products herself.

## What's included

| Area | Features |
|---|---|
| **Shop** | Home page, shop page with category / price / stock filters, search and sort, product pages, shopping bag, secure checkout |
| **Categories** | Jewellery · Home & Decoration · Clothing · Kids · Accessories · Beauty & Hair (Groceries is switched off for now, see below) |
| **Product options** | Each product can have sizes, colours and material. One choice is just shown; several choices make the customer pick before adding to the bag. The choice shows in the bag, at Stripe checkout, on WhatsApp orders and in Admin → Orders. |
| **Customer reviews** | `/reviews`: customers upload up to 3 photos of themselves wearing their pieces, with a star rating and a few words. **Nothing is published until the owner approves it in Admin → Reviews.** Approved reviews appear on the Reviews page, on the product page and on the homepage ("Our happy clients"). |
| **Our Impact** | `/impact`: the brand's mission, commitments and values. Linked in the top menu and footer. |
| **Languages** | English (default), French, Spanish and German. Visitors choose in the header (or the phone menu); visitors whose browser is in French, Spanish or German are offered their language. Product names, descriptions and reviews stay as written. Translations live in `public/js/i18n-dict.js`. |
| **Payments** | Stripe Checkout: Visa, Mastercard, Amex, Apple Pay, Google Pay (plus Klarna/PayPal if switched on in Stripe). Shipping address and shipping rates collected at checkout. |
| **Customers** | Register, log in, order history, change password |
| **WhatsApp** | Floating chat button on every page, "Ask about this piece" on each product, "Order via WhatsApp" in the bag |
| **Social** | Facebook, TikTok, Instagram, YouTube and X in the footer |
| **Look** | Boutique-style storefront in the brand's ndop indigo: rotating announcement bar, full-width photo slideshow, photo category tiles, 4-column product grid with quick add-to-cart, trust icons, collection banners, "Meet the owner", mailing-list sign-up |
| **Admin (owner)** | **Photos tab**: replace every homepage slide, category picture and banner with her own photos (one click, with a Reset button). Add a product (photo, name, price, category, description), edit it, mark it sold out, delete it; see paid orders with delivery addresses and mark them shipped; customer list; settings for the WhatsApp number, social links, shipping prices and the top banner. Nothing needs code changes. |

## 1. Run it on your computer (5 minutes)

Requires Node.js 18 or newer (https://nodejs.org).

```bash
npm install
cp .env.example .env      # then open .env and fill it in
npm start
```

Open http://localhost:3000 (never open the .html files directly; the site needs the server). The admin logs in at **http://localhost:3000/account** with the `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env` and lands on **/admin**.

Forgot the admin password, or want another admin? Run:
```bash
npm run make-admin -- nelly@example.com HerNewPassword123
```

## 2. Switch on payments (Stripe)

1. Create a free account at https://dashboard.stripe.com/register (in the owner's name, with her bank account for payouts).
2. Go to **Developers → API keys** and copy the **Secret key** into `.env` as `STRIPE_SECRET_KEY`.
   - `sk_test_...` = test mode. Pay with the card `4242 4242 4242 4242`, any future date and any CVC.
   - `sk_live_...` = real money. Swap to this when you go live.
3. **Recommended:** go to **Developers → Webhooks → Add endpoint**
   - URL: `https://YOUR-DOMAIN/api/stripe/webhook`
   - Event: `checkout.session.completed` (and `checkout.session.async_payment_succeeded`)
   - Copy the signing secret into `.env` as `STRIPE_WEBHOOK_SECRET`.

   Orders are also confirmed when the customer returns to the thank-you page. The webhook catches the ones who close the tab early.
4. Optional: under **Settings → Payment methods**, turn on Apple Pay, Google Pay, Klarna or PayPal. They appear at checkout automatically.

Until a Stripe key is added, the site still works: the bag offers **Order via WhatsApp** with the order pre-written.

## 3. Put it online with Vercel (about 15 minutes, no installing needed)

Vercel runs the site for free on its Hobby plan. Vercel servers don't keep files, so the site stores its data in two free add-ons: **Turso** (the database for products, orders and accounts) and **Vercel Blob** (uploaded photos).

### Step A — Put the code on GitHub
1. Sign in at https://github.com (create a free account if needed).
2. Click **+ → New repository**, name it `proud2bafricanwoman`, choose **Private**, then click **Create repository**.
3. On the next page click **uploading an existing file**.
4. Unzip the download, open the `p2baw` folder, select **everything inside it** (the `public` folder, `server.js`, `package.json`, `vercel.json`, and the rest) and drag it into the GitHub page. Don't drag the `p2baw` folder itself, and don't upload `node_modules` or `.env`.
5. Click **Commit changes**.

### Step B — Create the Vercel project
1. Go to https://vercel.com/signup and choose **Continue with GitHub**.
2. Click **Add New… → Project**, find `proud2bafricanwoman` and click **Import**.
3. Leave the build settings as they are. Open **Environment Variables** and add:
   | Name | Value |
   |---|---|
   | `ADMIN_EMAIL` | Nelly's email |
   | `ADMIN_PASSWORD` | a strong password (8+ characters) |
   | `SESSION_SECRET` | any long random text |
   | `WHATSAPP_NUMBER` | e.g. `447123456789` |
4. Click **Deploy**. The first version will say the database isn't connected. That's expected, and Step C fixes it.

### Step C — Connect the database and photo storage
1. In the project, open the **Storage** tab.
2. **Database:** click **Create Database** (or **Browse Marketplace**), pick **Turso Cloud**, choose the free plan, accept, and **Connect** it to this project (tick Production and Preview).
3. **Photos:** click **Create** → **Blob**, choose **Public** access, name it `photos`, and **Connect** it to this project.
4. Go to **Deployments**, click **⋯** on the latest one, then **Redeploy**. This loads the new connections.

### Step D — Open the site
- Shop: `https://proud2bafricanwoman.vercel.app` (Vercel shows the exact link on the project page)
- Admin: add `/account` to the link, log in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`, and you land on the dashboard. Add products and photos there.

### Step E — Payments and own domain (when ready)
- Add `STRIPE_SECRET_KEY` and `PUBLIC_URL` (the site link) under **Settings → Environment Variables**, then redeploy. For the Stripe webhook use `https://YOUR-LINK/api/stripe/webhook`.
- **Settings → Domains** lets you connect `proud2bafricanwoman.com`.

> Any time you change Environment Variables in Vercel, **Redeploy** so they take effect.
> Photos uploaded in the admin are shrunk automatically in the browser, so phone photos upload fine (limit 4MB after shrinking).

### Alternative: Render.com
The same code also runs on Render.com as a normal server (`npm start`). Add a persistent disk mounted at `/var/data` and set `DATA_DIR=/var/data`. Turso and Blob are optional there.

## Switching Groceries back on

Open `server.js`, find the line `// { slug: 'groceries', name: 'Groceries' },` near the top and delete the `//` at the start. Commit the change; Vercel redeploys on its own. While it is off, any grocery products stay in the database (visible in Admin → Products marked "hidden category") but don't show in the shop.

## Editing translations

`public/js/i18n-dict.js` has one row per sentence: `[English, French, Spanish, German]`. Change the text in a column to fix a translation. If you change an English sentence on the website, change the first column of its row to match, or that sentence will stay in English.

## 4. Hand-over checklist

- [ ] Set a strong `ADMIN_PASSWORD` and a long random `SESSION_SECRET`
- [ ] Admin → Settings: real **WhatsApp number** (digits only with country code, e.g. `447123456789`) and the **real social media links**
- [ ] Check the shipping prices and free-delivery threshold
- [ ] Place one test order with `sk_test_` → check it appears in Admin → Orders → switch to `sk_live_`
- [ ] Delete or replace the 4 starter earrings (they come from the old design mock-up)
- [ ] Admin → Photos: swap the starter photos for Nelly's own photography when she has it
- [ ] Admin → Reviews: check for new reviews regularly (a red number shows how many are waiting)

## About the starter photos

The homepage slideshow, category tiles and banners start with free photos from Unsplash (https://unsplash.com/license: free for commercial use, no attribution required). They load straight from Unsplash's image servers. Each one can be replaced in **Admin → Photos**. Her own product and model photos will always convert best.

The mailing list collects email addresses (Admin → Customers). Copy them into an email tool such as Mailchimp to send newsletters.

## Notes

- **Prices are always taken from the database at checkout.** A customer can't change a price in their browser.
- Passwords are hashed with bcrypt. Sessions are signed, http-only cookies.
- Photos: JPG, PNG or WEBP (large phone photos are shrunk automatically). Square or portrait (4:5) photos look best.
- Shipping countries can be changed with `SHIP_COUNTRIES` (comma-separated country codes).
- On your computer, data lives in `data/`. On Vercel it lives in Turso (database) and Vercel Blob (photos). Both have their own dashboards and backups.

### Project structure
```
server.js          Express server: database, API, Stripe (exported for Vercel; runs with npm start locally)
make-admin.js      Create or reset an admin account
vercel.json        Vercel settings (clean page URLs)
public/            Website pages, styles, scripts, logo, ndop pattern, fonts, starter photos
data/              Created on your computer only: shop.db + uploaded photos
```
