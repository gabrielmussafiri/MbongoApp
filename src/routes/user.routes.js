const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a user
router.post('/', async (req, res) => {
  try {
    const { email, password, role, agentId } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
        agentId
      }
    });
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update user's agent ID
router.put('/:id/agent', async (req, res) => {
  try {
    const { agentId } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { agentId }
    });
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a user
router.delete('/:id', async (req, res) => {
  try {
    await prisma.user.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router; 