// ═══════════════════════════════════════════════════════════
//  VERDANT — Backend Server
//  Express + Stripe Payment Integration
//  Run: node server.js  (after npm install)
// ═══════════════════════════════════════════════════════════

const express = require('express');
const Stripe = require('stripe');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY); // Set in .env

// ─── MIDDLEWARE ───
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000' }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── SERVE FRONTEND ───
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── CREATE PAYMENT INTENT ───
// Called when user clicks "Pay Securely"
app.post('/api/create-payment-intent', async (req, res) => {
  const { amount, currency = 'inr', customerName, customerEmail, items } = req.body;

  if (!amount || amount < 100) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  try {
    // Optional: create or retrieve Stripe customer
    let customer;
    if (customerEmail) {
      const existing = await stripe.customers.list({ email: customerEmail, limit: 1 });
      if (existing.data.length > 0) {
        customer = existing.data[0];
      } else {
        customer = await stripe.customers.create({
          email: customerEmail,
          name: customerName,
          metadata: { source: 'verdant-web' }
        });
      }
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Amount in paise (INR)
      currency,
      customer: customer?.id,
      automatic_payment_methods: { enabled: true },
      metadata: {
        customerName: customerName || 'Guest',
        customerEmail: customerEmail || '',
        itemCount: items ? items.length : 0,
        items: items ? JSON.stringify(items.map(i => `${i.name} x${i.qty}`)) : ''
      },
      description: `Verdant Food Order — ${customerName || 'Guest'}`,
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });

  } catch (error) {
    console.error('Stripe error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ─── WEBHOOK — Handle Stripe events ───
// Register this URL in Stripe Dashboard > Webhooks
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = event.data.object;
      console.log(`✅ Payment succeeded: ${pi.id} — ₹${pi.amount / 100}`);
      // TODO: Save order to database, send confirmation email, trigger kitchen
      handleSuccessfulOrder(pi);
      break;
    }
    case 'payment_intent.payment_failed': {
      const pi = event.data.object;
      console.log(`❌ Payment failed: ${pi.id}`);
      break;
    }
    case 'charge.refunded': {
      console.log(`↩️  Refund issued: ${event.data.object.id}`);
      break;
    }
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

async function handleSuccessfulOrder(paymentIntent) {
  // In production: save to DB, send email, notify kitchen
  const order = {
    id: `ORD-${Date.now()}`,
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    customer: paymentIntent.metadata.customerName,
    email: paymentIntent.metadata.customerEmail,
    items: paymentIntent.metadata.items,
    timestamp: new Date().toISOString(),
    status: 'confirmed'
  };
  console.log('📦 New order:', JSON.stringify(order, null, 2));
  // TODO: db.orders.create(order)
  // TODO: sendConfirmationEmail(order)
  // TODO: notifyKitchen(order)
}

// ─── GET ORDER STATUS ───
app.get('/api/order/:paymentIntentId', async (req, res) => {
  try {
    const pi = await stripe.paymentIntents.retrieve(req.params.paymentIntentId);
    res.json({
      status: pi.status,
      amount: pi.amount,
      currency: pi.currency,
      customer: pi.metadata.customerName
    });
  } catch (error) {
    res.status(404).json({ error: 'Order not found' });
  }
});

// ─── MENU API ───
app.get('/api/menu', (req, res) => {
  const menu = [
    { id: 1, name: 'Truffle Risotto', price: 2200, category: 'mains', available: true },
    { id: 2, name: 'Wagyu Burger', price: 3800, category: 'mains', available: true },
    { id: 3, name: 'Lobster Bisque', price: 2800, category: 'starters', available: true },
    { id: 4, name: 'Salmon Tartare', price: 2200, category: 'starters', available: true },
    { id: 5, name: 'Dark Chocolate Fondant', price: 1400, category: 'desserts', available: true },
    { id: 6, name: 'Crème Brûlée', price: 1200, category: 'desserts', available: true },
    { id: 7, name: 'Smoked Duck Breast', price: 3400, category: 'mains', available: true },
    { id: 8, name: 'Burrata Salad', price: 1800, category: 'starters', available: true },
    { id: 9, name: 'Elderflower Spritz', price: 800, category: 'drinks', available: true },
    { id: 10, name: 'Matcha Latte', price: 650, category: 'drinks', available: true },
    { id: 11, name: 'Tiramisu Royale', price: 1300, category: 'desserts', available: true },
    { id: 12, name: 'Grilled Sea Bass', price: 3200, category: 'mains', available: true },
  ];
  res.json({ items: menu, total: menu.length });
});

// ─── HEALTH CHECK ───
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: process.env.NODE_ENV || 'development' });
});

// ─── START SERVER ───
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🌿 VERDANT Server running on http://localhost:${PORT}`);
  console.log(`   Stripe mode: ${process.env.STRIPE_SECRET_KEY?.startsWith('sk_live') ? 'LIVE 🔴' : 'TEST ✅'}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = app;
