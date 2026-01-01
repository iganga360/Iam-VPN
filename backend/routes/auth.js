const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// In-memory user store (replace with database in production)
const users = new Map();

// Initialize default admin user
const initializeAdmin = () => {
  const adminId = uuidv4();
  const hashedPassword = bcrypt.hashSync(
    process.env.ADMIN_PASSWORD || 'admin123',
    10
  );
  
  users.set(process.env.ADMIN_USERNAME || 'admin', {
    id: adminId,
    username: process.env.ADMIN_USERNAME || 'admin',
    password: hashedPassword,
    isAdmin: true,
    createdAt: new Date().toISOString()
  });
};

initializeAdmin();

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    if (users.has(username)) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const userId = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);

    users.set(username, {
      id: userId,
      username,
      password: hashedPassword,
      isAdmin: false,
      createdAt: new Date().toISOString()
    });

    const token = jwt.sign(
      { id: userId, username, isAdmin: false },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'User registered successfully',
      token,
      user: { id: userId, username, isAdmin: false }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const user = users.get(username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, isAdmin: user.isAdmin },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { 
        id: user.id, 
        username: user.username, 
        isAdmin: user.isAdmin 
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
router.get('/me', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = users.get(decoded.username);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      username: user.username,
      isAdmin: user.isAdmin
    });
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
});

module.exports = router;
