const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const authenticateToken = require('../middleware/auth');

const prisma = new PrismaClient();

// Get all agents
router.get('/', async (req, res) => {
  try {
    const agents = await prisma.agent.findMany({
      include: { subAccounts: true, users: true }
    });
    // Attach the first user email (if any) to each agent for frontend display
    const agentsWithEmail = agents.map(agent => ({
      ...agent,
      email: agent.users[0]?.email || ''
    }));
    res.json(agentsWithEmail);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a single agent
router.get('/:id', async (req, res) => {
  try {
    const agent = await prisma.agent.findUnique({
      where: { id: req.params.id },
      include: {
        subAccounts: true
      }
    });
    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }
    res.json(agent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new agent
router.post('/', async (req, res) => {
  try {
    const { name, country, contact, email, password } = req.body;

    // Create the agent
    const agent = await prisma.agent.create({
      data: {
        name,
        country,
        contact
      }
    });

    // Create the agent's user account
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'AGENT',
        agentId: agent.id
      }
    });

    res.status(201).json({
      agent,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Create default agent
router.post('/create-default', async (req, res) => {
  try {
    const defaultAgent = await prisma.agent.create({
      data: {
        name: 'Default Agent',
        country: 'DRC',
        contact: 'default@example.com'
      }
    });
    res.status(201).json(defaultAgent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update an agent
router.put('/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Forbidden: Admins only' });
  }
  try {
    const agent = await prisma.agent.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(agent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete an agent
router.delete('/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Forbidden: Admins only' });
  }
  try {
    await prisma.agent.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Agent deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router; 