const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const authenticateToken = require('../middleware/auth');

const prisma = new PrismaClient();

// Get all sub-accounts
router.get('/', authenticateToken, async (req, res) => {
  try {
    let subAccounts;
    if (req.user.role === 'ADMIN') {
      // Admin sees all sub-accounts
      subAccounts = await prisma.subAccount.findMany({
        include: {
          agent: true
        }
      });
    } else {
      // Agent sees only their own sub-accounts
      subAccounts = await prisma.subAccount.findMany({
        where: {
          agentId: req.user.agentId
        },
        include: {
          agent: true
        }
      });
    }
    res.json(subAccounts);
  } catch (error) {
    console.error('Error fetching sub-accounts:', error);
    res.status(500).json({ message: error.message, stack: error.stack });
  }
});

// Get a single sub-account
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const subAccount = await prisma.subAccount.findUnique({
      where: { id: req.params.id },
      include: {
        agent: true,
        transactions: true
      }
    });

    if (!subAccount) {
      return res.status(404).json({ message: 'Sub-account not found' });
    }

    // Check if agent is authorized to view this sub-account
    if (req.user.role !== 'ADMIN' && subAccount.agentId !== req.user.agentId) {
      return res.status(403).json({ message: 'Forbidden: You can only view your own sub-accounts' });
    }

    res.json(subAccount);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new sub-account
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { agentId, type, currency, balance } = req.body;

    // Validate that the agent exists
    const agent = await prisma.agent.findUnique({
      where: { id: agentId }
    });

    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    // Only admins can create sub-accounts for any agent
    if (req.user.role !== 'ADMIN' && agentId !== req.user.agentId) {
      return res.status(403).json({ message: 'Forbidden: You can only create sub-accounts for yourself' });
    }

    const subAccount = await prisma.subAccount.create({
      data: {
        agentId,
        type,
        currency,
        balance
      }
    });
    res.status(201).json(subAccount);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a sub-account
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const subAccount = await prisma.subAccount.findUnique({
      where: { id: req.params.id }
    });

    if (!subAccount) {
      return res.status(404).json({ message: 'Sub-account not found' });
    }

    // Only admins can update any sub-account
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden: Only admins can update sub-accounts' });
    }

    const updatedSubAccount = await prisma.subAccount.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(updatedSubAccount);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a sub-account
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const subAccount = await prisma.subAccount.findUnique({
      where: { id: req.params.id }
    });

    if (!subAccount) {
      return res.status(404).json({ message: 'Sub-account not found' });
    }

    // Only admins can delete sub-accounts
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden: Only admins can delete sub-accounts' });
    }

    await prisma.subAccount.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Sub-account deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router; 