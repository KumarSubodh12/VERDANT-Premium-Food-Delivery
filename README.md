# 🌿 VERDANT — Premium Food Delivery Website

A full-stack premium food delivery web app with **hand gesture control**, shuffle & scroll animations, a stunning dark-green premium theme, and **Stripe payment integration**.

---

## ✨ Features

| Feature | Details |
|---|---|
| **Hand Gesture Control** | MediaPipe Hands — index finger moves cursor, pinch = click, swipe = shuffle/scroll |
| **Shuffle Animation** | 3D card flip animation when browsing menu |
| **Scroll Animations** | Intersection Observer — smooth fade/slide reveals |
| **Premium Theme** | Dark forest green (#050f08) + white + gold accents |
| **Stripe Payment** | Full PaymentIntent flow with webhook support |
| **Cart System** | Add/remove/quantity adjust, GST, delivery fee |
| **Menu Filters** | Starters / Mains / Desserts / Drinks |

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env and paste your Stripe keys
```

### 3. Set Stripe keys

**In `.env`:**
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**In `index.html`** (line ~450), replace:
```js
stripe = Stripe('pk_test_51OxxxxxxxxxYOUR_STRIPE_KEY_HERE');
```
with your actual publishable key.

### 4. Move frontend to public/
```bash
mkdir public
cp index.html public/
```

### 5. Start the server
```bash
npm run dev        # Development (with nodemon)
npm start          # Production
```

### 6. Open http://localhost:3000

---

## 🤚 Gesture Controls

| Gesture | Action |
|---|---|
| ☝️ Point index finger | Move cursor |
| 🤏 Pinch thumb + index | Click / Add to cart |
| 👋 Swipe wrist left/right | Shuffle menu |
| ✋ Move hand up/down | Scroll page |

**Allow camera access** when prompted. The live feed appears in the bottom-right corner.

---

## 💳 Stripe Integration

### Test Cards
| Card | Result |
|---|---|
| `4242 4242 4242 4242` | ✅ Success |
| `4000 0000 0000 9995` | ❌ Decline |
| `4000 0025 0000 3155` | 🔐 3D Secure |

Use any future expiry date and any 3-digit CVV.

### Payment Flow
```
Client                    Backend                   Stripe
  |                          |                         |
  |-- POST /api/create-pi -->|                         |
  |                          |-- Create PaymentIntent ->|
  |                          |<-- clientSecret ---------|
  |<-- clientSecret ---------|                         |
  |                          |                         |
  |-- stripe.confirmCardPayment(clientSecret) -------->|
  |<-- payment_intent.succeeded webhook ---------------|
  |                          |<-- webhook event -------|
  |                          |-- Save order, send email|
```

### Webhook Setup
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/webhook`
3. Listen for: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copy the webhook signing secret to `.env`

---

## 🗂 Project Structure

```
verdant-food/
├── index.html          # Frontend (hand gestures, UI, animations)
├── server.js           # Express backend + Stripe
├── package.json        # Dependencies
├── .env.example        # Environment template
├── .env               # Your keys (git-ignored)
└── public/            # Static files served by Express
    └── index.html     # Copy of frontend
```

---

## 🛠 Production Deployment

### Deploy to Vercel / Railway / Render
1. Set environment variables in your host dashboard
2. Set build command: `npm install`
3. Set start command: `node server.js`
4. Update `CLIENT_URL` in `.env` to your domain

### Deploy to Heroku
```bash
heroku create verdant-food
heroku config:set STRIPE_SECRET_KEY=sk_live_...
git push heroku main
```

---

## 📦 Tech Stack

- **Frontend**: Vanilla JS, CSS3, HTML5
- **Hand Tracking**: MediaPipe Hands (Google)
- **Payments**: Stripe.js + Stripe Node SDK
- **Backend**: Node.js, Express
- **Fonts**: Playfair Display, Cormorant Garamond, Space Mono

---

## 🔒 Security Notes

- Never expose `STRIPE_SECRET_KEY` in frontend code
- Validate payment amounts server-side before charging
- Use HTTPS in production
- Set up Stripe webhook signature verification (already implemented)

---

Made with 🌿 by VERDANT
