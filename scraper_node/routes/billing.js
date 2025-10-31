const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/clerk');
const { getCreditsPack, PackId } = require('../lib/billing');
const stripe = require('../lib/stripe');
const logger = require('../config/logger');

// Helper function to get app URL
function getAppUrl(path) {
  const appUrl = process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
  return `${appUrl}/${path}`;
}

// GET /api/v1/billing/credits - Get available credits
router.get('/credits', requireAuth, async (req, res) => {
  try {
    const { userId } = req.userContext;

    const balance = await prisma.userBalance.findUnique({
      where: {
        userId,
      },
    });

    const credits = balance ? balance.credits : -1;

    res.json({
      success: true,
      data: {
        credits,
      },
    });
  } catch (error) {
    logger.error('Error fetching credits', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch credits',
        statusCode: 500,
      },
    });
  }
});

// POST /api/v1/billing/setup - Setup user (initialize balance)
router.post('/setup', requireAuth, async (req, res) => {
  try {
    const { userId } = req.userContext;

    const userBalance = await prisma.userBalance.findUnique({
      where: {
        userId,
      },
    });

    if (!userBalance) {
      await prisma.userBalance.create({
        data: {
          userId,
          credits: 200,
        },
      });
    }

    res.json({
      success: true,
      message: 'User setup completed',
    });
  } catch (error) {
    logger.error('Error setting up user', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to setup user',
        statusCode: 500,
      },
    });
  }
});

// POST /api/v1/billing/purchase - Create Stripe checkout session
router.post('/purchase', requireAuth, async (req, res) => {
  try {
    const { userId } = req.userContext;
    const { packId } = req.body;

    if (!packId || !Object.values(PackId).includes(packId)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid package',
          statusCode: 400,
        },
      });
    }

    const selectedPack = getCreditsPack(packId);

    if (!selectedPack || !selectedPack.priceId) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid package configuration',
          statusCode: 400,
        },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      invoice_creation: {
        enabled: true,
      },
      success_url: getAppUrl('billing'),
      cancel_url: getAppUrl('billing'),
      metadata: {
        userId,
        packId,
      },
      line_items: [
        {
          quantity: 1,
          price: selectedPack.priceId,
        },
      ],
    });

    if (!session.url) {
      return res.status(500).json({
        success: false,
        error: {
          message: 'Cannot create Stripe session',
          statusCode: 500,
        },
      });
    }

    res.json({
      success: true,
      data: {
        checkoutUrl: session.url,
      },
    });
  } catch (error) {
    logger.error('Error creating purchase session', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to create purchase session',
        statusCode: 500,
      },
    });
  }
});

// GET /api/v1/billing/purchases - Get user purchases
router.get('/purchases', requireAuth, async (req, res) => {
  try {
    const { userId } = req.userContext;

    const purchases = await prisma.userPurchase.findMany({
      where: {
        userId,
      },
      orderBy: {
        date: 'desc',
      },
    });

    res.json({
      success: true,
      data: purchases,
    });
  } catch (error) {
    logger.error('Error fetching purchases', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch purchases',
        statusCode: 500,
      },
    });
  }
});

// GET /api/v1/billing/purchases/:id/invoice - Get invoice download URL
router.get('/purchases/:id/invoice', requireAuth, async (req, res) => {
  try {
    const { userId } = req.userContext;
    const { id } = req.params;

    const purchase = await prisma.userPurchase.findUnique({
      where: {
        id,
        userId,
      },
    });

    if (!purchase) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Purchase not found',
          statusCode: 404,
        },
      });
    }

    const session = await stripe.checkout.sessions.retrieve(purchase.stripeId);
    
    if (!session.invoice) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Invoice not found',
          statusCode: 404,
        },
      });
    }

    const invoice = await stripe.invoices.retrieve(session.invoice);

    res.json({
      success: true,
      data: {
        invoiceUrl: invoice.hosted_invoice_url,
      },
    });
  } catch (error) {
    logger.error('Error fetching invoice', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch invoice',
        statusCode: 500,
      },
    });
  }
});

module.exports = router;

