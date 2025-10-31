const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/clerk');
const { symmetricEncrypt } = require('../lib/credential');
const { z } = require('zod');
const logger = require('../config/logger');

// Schema
const createCredentialSchema = z.object({
  name: z.string().max(30),
  value: z.string().max(500),
});

// GET /api/v1/credentials - Get all credentials for user
router.get('/', requireAuth, async (req, res) => {
  try {
    const { userId } = req.userContext;

    const credentials = await prisma.credential.findMany({
      where: {
        userId,
      },
      orderBy: {
        name: 'asc',
      },
      // Don't send encrypted value to client - or send it but decrypt on frontend if needed
      select: {
        id: true,
        userId: true,
        name: true,
        createdAt: true,
        // value: true, // Include if you want to send encrypted value to decrypt on frontend
      },
    });

    res.json({
      success: true,
      data: credentials,
    });
  } catch (error) {
    logger.error('Error fetching credentials', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch credentials',
        statusCode: 500,
      },
    });
  }
});

// GET /api/v1/credentials/:id - Get single credential (decrypted)
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { userId } = req.userContext;
    const { id } = req.params;

    const credential = await prisma.credential.findUnique({
      where: {
        id,
        userId,
      },
    });

    if (!credential) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Credential not found',
          statusCode: 404,
        },
      });
    }

    // Return credential without decrypted value for security
    // If you need decrypted value, decrypt it here
    res.json({
      success: true,
      data: {
        id: credential.id,
        userId: credential.userId,
        name: credential.name,
        createdAt: credential.createdAt,
        // value: symmetricDecrypt(credential.value), // Only if needed
      },
    });
  } catch (error) {
    logger.error('Error fetching credential', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch credential',
        statusCode: 500,
      },
    });
  }
});

// POST /api/v1/credentials - Create new credential
router.post('/', requireAuth, async (req, res) => {
  try {
    const { userId } = req.userContext;
    const validation = createCredentialSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid form data',
          statusCode: 400,
          details: validation.error.errors,
        },
      });
    }

    const { name, value } = validation.data;

    const encryptedValue = symmetricEncrypt(value);

    const credential = await prisma.credential.create({
      data: {
        userId,
        name,
        value: encryptedValue,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        id: credential.id,
        userId: credential.userId,
        name: credential.name,
        createdAt: credential.createdAt,
      },
    });
  } catch (error) {
    logger.error('Error creating credential', { error: error.message });
    
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: {
          message: 'Credential with this name already exists',
          statusCode: 409,
        },
      });
    }

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to create credential',
        statusCode: 500,
      },
    });
  }
});

// DELETE /api/v1/credentials/:id - Delete credential
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { userId } = req.userContext;
    const { id } = req.params;

    await prisma.credential.delete({
      where: {
        id,
        userId,
      },
    });

    res.json({
      success: true,
      message: 'Credential deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting credential', { error: error.message });
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Credential not found',
          statusCode: 404,
        },
      });
    }

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to delete credential',
        statusCode: 500,
      },
    });
  }
});

module.exports = router;

