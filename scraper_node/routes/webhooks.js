const express = require('express');
const router = express.Router();
const stripe = require('../lib/stripe');
const prisma = require('../lib/prisma');
const { getCreditsPack, PackId } = require('../lib/billing');
const logger = require('../config/logger');

// Stripe webhook endpoint (no auth required - uses signature verification)
// Note: This route should be mounted with express.raw() middleware in main.js
router.post('/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Missing stripe-signature header',
        statusCode: 400,
      },
    });
  }

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      default:
        logger.info(`Unhandled Stripe event type: ${event.type}`);
        break;
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Stripe webhook error', { error: error.message });
    res.status(400).json({
      success: false,
      error: {
        message: `Webhook Error: ${error.message}`,
        statusCode: 400,
      },
    });
  }
});

async function handleCheckoutSessionCompleted(session) {
  if (!session.metadata) {
    throw new Error('Missing metadata');
  }

  const { userId, packId } = session.metadata;

  if (!userId) {
    throw new Error('Missing user id');
  }
  if (!packId) {
    throw new Error('Missing pack id');
  }

  const purchasedPack = getCreditsPack(packId);
  if (!purchasedPack) {
    throw new Error('Purchase pack not found');
  }

  await prisma.userBalance.upsert({
    where: {
      userId,
    },
    create: {
      userId,
      credits: purchasedPack.credits,
    },
    update: {
      credits: {
        increment: purchasedPack.credits,
      },
    },
  });

  await prisma.userPurchase.create({
    data: {
      userId,
      stripeId: session.id,
      description: `${purchasedPack.name} - ${purchasedPack.credits} credits`,
      amount: session.amount_total,
      currency: session.currency,
    },
  });

  logger.info('Checkout session completed', { userId, packId, credits: purchasedPack.credits });
}

module.exports = router;

