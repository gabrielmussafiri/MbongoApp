const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const authenticateToken = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/transactions')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG and PDF are allowed.'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Helper function to generate validation code
function generateValidationCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

// Get pending transaction requests
router.get('/requests', authenticateToken, async (req, res) => {
  try {
    const { status = 'PENDING' } = req.query;
    const agentId = req.user.agentId || req.user.id;

    console.log('Current user:', {
      id: req.user.id,
      agentId: req.user.agentId,
      role: req.user.role
    });

    // Build the where clause based on user role
    const whereClause = {
      type: 'REQUEST',
      status,
      ...(req.user.role !== 'ADMIN' && {
        OR: [
          { requestedBy: agentId },
          { processedBy: agentId }
        ]
      })
    };

    console.log('Fetching requests with where clause:', JSON.stringify(whereClause, null, 2));

    // First, let's check if there are any requests at all
    const allRequests = await prisma.transaction.findMany({
      where: { type: 'REQUEST' },
      select: {
        id: true,
        type: true,
        status: true,
        requestedBy: true,
        processedBy: true
      }
    });

    console.log('All requests in system:', allRequests);

    const requests = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        sourceAccount: {
          include: {
            agent: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        destAccount: {
          include: {
            agent: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('Filtered requests found:', requests.length);
    console.log('First request details:', requests[0] ? {
      id: requests[0].id,
      type: requests[0].type,
      status: requests[0].status,
      requestedBy: requests[0].requestedBy,
      processedBy: requests[0].processedBy
    } : 'No requests found');

    res.json(requests);
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    res.status(500).json({ error: 'Failed to fetch pending requests' });
  }
});

// Get all transactions
router.get('/', authenticateToken, async (req, res) => {
  try {
    let transactions;
    if (req.user.role === 'ADMIN') {
      // Admin sees all transactions
      transactions = await prisma.transaction.findMany({
        include: {
          sourceAccount: {
            include: { agent: true }
          },
          destAccount: true
        }
      });
    } else {
      // Agent sees only their own transactions
      transactions = await prisma.transaction.findMany({
        where: {
          OR: [
            { sourceAccount: { agentId: req.user.agentId } },
            { destAccount: { agentId: req.user.agentId } }
          ]
        },
        include: {
          sourceAccount: {
            include: { agent: true }
          },
          destAccount: true
        }
      });
    }
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get recent transactions
router.get('/recent', authenticateToken, async (req, res) => {
  try {
    let transactions;
    if (req.user.role === 'ADMIN') {
      // Admin sees all recent transactions
      transactions = await prisma.transaction.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          sourceAccount: true,
          destAccount: true
        }
      });
    } else {
      // Agent sees their recent transactions and shared recent transactions
      transactions = await prisma.transaction.findMany({
        where: {
          OR: [
            // Their own transactions
            { sourceAccount: { agentId: req.user.agentId } },
            { destAccount: { agentId: req.user.agentId } },
            // Shared transactions (example: where status is 'COMPLETED')
            { status: 'COMPLETED' }
          ]
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          sourceAccount: true,
          destAccount: true
        }
      });
    }
    res.json(transactions || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a single transaction
router.get('/:id', async (req, res) => {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: req.params.id },
      include: {
        sourceAccount: true,
        destAccount: true
      }
    });
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a transaction
router.post('/', authenticateToken, upload.single('proof'), async (req, res) => {
  try {
    const { 
      amount, 
      currency, 
      type, 
      sourceAccountId, 
      sender,
      description,
      agentId 
    } = req.body;

    // Validate required fields
    if (!amount || !currency || !type || !sourceAccountId || !sender || !agentId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Get the source account
    const sourceAccount = await prisma.subAccount.findUnique({
      where: { id: sourceAccountId },
      include: { agent: true }
    });

    if (!sourceAccount) {
      return res.status(404).json({ message: 'Source account not found' });
    }

    // Validate agent
    const agent = await prisma.agent.findUnique({
      where: { id: agentId }
    });

    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    // Validate currency based on agent type
    if (req.user.role !== 'ADMIN') {
      const allowedCurrencies = agent.country === 'DRC' ? ['USD'] : ['ZAR'];
      if (!allowedCurrencies.includes(currency)) {
        return res.status(400).json({ 
          message: `Invalid currency for ${agent.country} agent. Allowed currencies: ${allowedCurrencies.join(', ')}` 
        });
      }
    }

    let transaction;
    if (type === 'INPUT') {
      // Immediately set to COMPLETED and increment balance
      transaction = await prisma.$transaction(async (prisma) => {
        // Create the transaction
        const tx = await prisma.transaction.create({
          data: {
            amount: parseFloat(amount),
            currency,
            type,
            status: 'COMPLETED',
            description,
            sender,
            sourceAccountId,
            destAccountId: sourceAccountId, // For now, same as source
            proofFile: req.file ? req.file.path : null,
            processedBy: agentId
          },
          include: {
            sourceAccount: true,
            destAccount: true
          }
        });
        // Increment the sub-account balance
        await prisma.subAccount.update({
          where: { id: sourceAccountId },
          data: {
            balance: {
              increment: parseFloat(amount)
            }
          }
        });
        return tx;
      });
    } else {
      // Default: create as PENDING, do not update balances
      transaction = await prisma.transaction.create({
        data: {
          amount: parseFloat(amount),
          currency,
          type,
          status: 'PENDING',
          description,
          sender,
          sourceAccountId,
          destAccountId: sourceAccountId, // For now, same as source
          proofFile: req.file ? req.file.path : null,
          processedBy: agentId
        },
        include: {
          sourceAccount: true,
          destAccount: true
        }
      });
    }

    res.status(201).json(transaction);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update transaction status
router.put('/:id/status', authenticateToken, async (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Forbidden: Admins only' });
  }
  try {
    const { status } = req.body;
    const transaction = await prisma.transaction.findUnique({
      where: { id: req.params.id }
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (status === 'VALIDATED') {
      // Update balances
      await prisma.subAccount.update({
        where: { id: transaction.sourceAccountId },
        data: {
          balance: {
            decrement: transaction.amount
          }
        }
      });

      await prisma.subAccount.update({
        where: { id: transaction.destAccountId },
        data: {
          balance: {
            increment: transaction.amount
          }
        }
      });
    }

    const updatedTransaction = await prisma.transaction.update({
      where: { id: req.params.id },
      data: { status }
    });

    res.json(updatedTransaction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Create a new transaction request
router.post('/request', authenticateToken, async (req, res) => {
  try {
    const { amount, currency, sourceAccountId, destAgentId, description, sender } = req.body;

    // Validate all required fields
    if (
      !amount ||
      !currency ||
      (!sourceAccountId && req.user.role === 'ADMIN') ||
      !destAgentId ||
      !description ||
      !sender
    ) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: {
          amount: !amount ? 'Amount is required' : null,
          currency: !currency ? 'Currency is required' : null,
          sourceAccountId: (!sourceAccountId && req.user.role === 'ADMIN') ? 'Source account ID is required' : null,
          destAgentId: !destAgentId ? 'Destination agent ID is required' : null,
          description: !description ? 'Description is required' : null,
          sender: !sender ? 'Sender is required' : null
        }
      });
    }

    // Validate source account exists (only if provided)
    let sourceAccount = null;
    if (sourceAccountId) {
      sourceAccount = await prisma.subAccount.findUnique({
        where: { id: sourceAccountId }
      });
      if (!sourceAccount) {
        return res.status(404).json({ message: 'Source account not found' });
      }
    }

    // Validate destination agent exists
    const destAgent = await prisma.agent.findUnique({
      where: { id: destAgentId }
    });

    if (!destAgent) {
      return res.status(404).json({ message: 'Destination agent not found' });
    }

    // Only check agent ownership if the user is not an admin and sourceAccountId is provided
    if (req.user.role !== 'ADMIN' && sourceAccountId && sourceAccount.agentId !== req.user.agentId) {
      return res.status(403).json({ message: 'You can only use your own accounts' });
    }

    // Generate validation code and set expiration (24 hours)
    const validationCode = generateValidationCode();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Build the data object for transaction.create from scratch
    const data = {
      amount: parseFloat(amount),
      currency,
      type: 'REQUEST',
      status: 'PENDING',
      description,
      sender,
      requestedBy: req.user.agentId || req.user.id,
      processedBy: destAgentId,
      validationCode,
      expiresAt
    };
    if (sourceAccountId) {
      data.sourceAccount = { connect: { id: sourceAccountId } };
    }
    // Debug log
    console.log('Transaction create data:', data);

    // Create the transaction request
    const transaction = await prisma.transaction.create({
      data,
      include: {
        sourceAccount: true,
        destAccount: true
      }
    });

    res.status(201).json(transaction);
  } catch (error) {
    console.error('Error creating transaction request:', error);
    res.status(400).json({ message: error.message });
  }
});

// Process a transaction request
router.post('/process/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { validationCode, subAccountId, decline, localAmount } = req.body;
    const agentId = req.user.agentId;

    // Get the transaction request
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        sourceAccount: true,
        destAccount: true,
      },
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (transaction.status !== 'PENDING') {
      return res.status(400).json({ error: 'Transaction is not pending' });
    }

    if (transaction.type !== 'REQUEST') {
      return res.status(400).json({ error: 'Transaction is not a request' });
    }

    // Debug: print agent IDs and transaction
    console.log('DEBUG: transaction.processedBy:', transaction.processedBy, 'agentId:', agentId);
    console.log('DEBUG: transaction object:', JSON.stringify(transaction, null, 2));
    console.log('DEBUG: Incoming validation code:', validationCode);
    console.log('DEBUG: Transaction validation code:', transaction.validationCode);
    console.log('DEBUG: Incoming request body:', req.body);
    console.log('DEBUG: Transaction processedBy:', transaction.processedBy);
    console.log('DEBUG: User agentId:', agentId);

    // Verify the agent is authorized to process this transaction
    if (transaction.processedBy !== agentId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to process this transaction' });
    }

    // Handle decline
    if (decline) {
      const declinedTransaction = await prisma.transaction.update({
        where: { id },
        data: {
          status: 'DECLINED'
        },
      });
      return res.json(declinedTransaction);
    }

    // Validate required fields for processing
    if (!validationCode) {
      return res.status(400).json({ error: 'Validation code is required' });
    }
    if (!subAccountId) {
      return res.status(400).json({ error: 'Destination sub account is required' });
    }
    if (!localAmount || isNaN(Number(localAmount)) || Number(localAmount) <= 0) {
      return res.status(400).json({ error: 'A valid localAmount is required' });
    }

    // Verify validation code
    if (transaction.validationCode !== validationCode) {
      return res.status(400).json({ error: 'Invalid validation code' });
    }

    // Verify the transaction hasn't expired
    if (new Date() > transaction.expiresAt) {
      return res.status(400).json({ error: 'Transaction request has expired' });
    }

    // Verify the selected sub-account has sufficient balance
    const destSubAccount = await prisma.subAccount.findUnique({
      where: { id: subAccountId }
    });
    if (!destSubAccount) {
      return res.status(404).json({ error: 'Selected sub-account not found' });
    }
    if (destSubAccount.balance < Number(localAmount)) {
      return res.status(400).json({ error: 'Insufficient balance in selected sub-account' });
    }

    // Start a transaction to ensure atomicity
    const result = await prisma.$transaction(async (prisma) => {
      // Update the transaction status, set destAccountId, and store localAmount
      const updatedTransaction = await prisma.transaction.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          destAccountId: subAccountId,
          localAmount: Number(localAmount)
        },
      });

      // Decrement the selected sub-account (ZAR) by localAmount
      const updatedDest = await prisma.subAccount.update({
        where: { id: subAccountId },
        data: {
          balance: {
            decrement: Number(localAmount),
          },
        },
      });
      console.log('Decremented destination account:', updatedDest);

      return updatedTransaction;
    });

    res.json(result);
  } catch (error) {
    console.error('Error processing transaction:', error);
    res.status(500).json({ error: 'Failed to process transaction' });
  }
});

// Request a top up from another agent
router.post('/top-up', authenticateToken, async (req, res) => {
  try {
    const { amount, currency, destAgentId, note } = req.body;
    if (!amount || !currency || !destAgentId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    // Validate destination agent exists
    const destAgent = await prisma.agent.findUnique({ where: { id: destAgentId } });
    if (!destAgent) {
      return res.status(404).json({ message: 'Destination agent not found' });
    }
    // Fetch requesting agent's name for sender
    const requestingAgent = await prisma.agent.findUnique({ where: { id: req.user.agentId } });
    const senderName = requestingAgent ? requestingAgent.name : 'Unknown Agent';
    // Generate validation code and set expiration (24 hours)
    const validationCode = generateValidationCode();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    // Create the top up transaction request
    const transaction = await prisma.transaction.create({
      data: {
        amount: parseFloat(amount),
        currency,
        type: 'TOP_UP',
        status: 'PENDING',
        description: note || 'Top up request',
        sender: senderName,
        requestedBy: req.user.agentId || req.user.id,
        processedBy: destAgentId,
        validationCode,
        expiresAt
      }
    });
    res.status(201).json(transaction);
  } catch (error) {
    console.error('Error creating top up request:', error);
    res.status(400).json({ message: error.message });
  }
});

async function updatePendingToRequest() {
  const updated = await prisma.transaction.updateMany({
    where: { status: 'PENDING' },
    data: { type: 'REQUEST' }
  });
  console.log('Updated:', updated);
}

// updatePendingToRequest().finally(() => prisma.$disconnect());

module.exports = router; 