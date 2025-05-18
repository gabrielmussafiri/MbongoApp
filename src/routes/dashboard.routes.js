const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const authenticateToken = require('../middleware/auth');

// GET /api/dashboard/stats
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    console.log('Fetching dashboard stats for user:', req.user);
    let stats;
    if (req.user.role === 'ADMIN') {
      console.log('User is admin, fetching all stats');
      // Admin sees all stats
      const totalAgents = await prisma.agent.count();
      const totalTransactions = await prisma.transaction.count();
      const totalInflow = await prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { type: 'INPUT' }
      });
      const totalOutflow = await prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { type: 'OUTPUT' }
      });
      // Count agents by country
      const drcAgents = await prisma.agent.count({ where: { country: 'DRC' } });
      const saAgents = await prisma.agent.count({ where: { country: 'SA' } });

      stats = {
        totalAgents,
        totalTransactions,
        totalInflow: totalInflow._sum.amount || 0,
        totalOutflow: totalOutflow._sum.amount || 0,
        drcAgents,
        saAgents,
      };
    } else {
      console.log('User is agent, fetching agent stats');
      // Agent sees only their stats
      const agentId = req.user.agentId;
      if (!agentId) {
        console.log('No agent ID found in user object');
        return res.status(400).json({ message: 'Agent ID not found' });
      }

      console.log('Fetching agent with ID:', agentId);
      const agent = await prisma.agent.findUnique({
        where: { id: agentId },
        include: {
          subAccounts: true
        }
      });

      if (!agent) {
        console.log('Agent not found with ID:', agentId);
        return res.status(404).json({ message: 'Agent not found' });
      }

      console.log('Found agent with subaccounts:', agent.subAccounts.length);
      const agentAccountIds = agent.subAccounts.map(account => account.id);

      const agentTransactions = await prisma.transaction.findMany({
        where: {
          OR: [
            { sourceAccountId: { in: agentAccountIds } },
            { destAccountId: { in: agentAccountIds } }
          ]
        }
      });

      console.log('Found transactions:', agentTransactions.length);
      const totalTransactions = agentTransactions.length;
      const totalInflow = agentTransactions
        .filter(t => t.type === 'INPUT' && agentAccountIds.includes(t.destAccountId))
        .reduce((sum, t) => sum + t.amount, 0);
      const totalOutflow = agentTransactions
        .filter(t => t.type === 'OUTPUT' && agentAccountIds.includes(t.sourceAccountId))
        .reduce((sum, t) => sum + t.amount, 0);

      stats = {
        totalAgents: 1, // Agent only sees themselves
        totalTransactions,
        totalInflow,
        totalOutflow,
      };
    }

    console.log('Sending stats:', stats);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard stats' });
  }
});

// GET /api/dashboard/recent-transactions
router.get('/recent-transactions', authenticateToken, async (req, res) => {
  try {
    console.log('Fetching recent transactions for user:', req.user);
    let transactions;
    if (req.user.role === 'ADMIN') {
      console.log('User is admin, fetching all transactions');
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
      console.log('User is agent, fetching agent transactions');
      // Agent sees their recent transactions
      const agentId = req.user.agentId;
      if (!agentId) {
        console.log('No agent ID found in user object');
        return res.status(400).json({ message: 'Agent ID not found' });
      }

      console.log('Fetching agent with ID:', agentId);
      const agent = await prisma.agent.findUnique({
        where: { id: agentId },
        include: {
          subAccounts: true
        }
      });

      if (!agent) {
        console.log('Agent not found with ID:', agentId);
        return res.status(404).json({ message: 'Agent not found' });
      }

      console.log('Found agent with subaccounts:', agent.subAccounts.length);
      const agentAccountIds = agent.subAccounts.map(account => account.id);

      transactions = await prisma.transaction.findMany({
        where: {
          OR: [
            { sourceAccountId: { in: agentAccountIds } },
            { destAccountId: { in: agentAccountIds } }
          ]
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          sourceAccount: true,
          destAccount: true
        }
      });
      console.log('Found transactions:', transactions.length);
    }

    console.log('Sending transactions:', transactions);
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching recent transactions:', error);
    res.status(500).json({ message: 'Failed to fetch recent transactions' });
  }
});

module.exports = router;