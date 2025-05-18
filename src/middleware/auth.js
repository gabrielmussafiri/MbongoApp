const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

function authenticateToken(req, res, next) {
  console.log('Auth middleware - checking token...');
  const authHeader = req.headers['authorization'];
  console.log('Auth header:', authHeader ? 'Exists' : 'Missing');

  if (!authHeader) {
    console.log('No auth header found');
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  console.log('Token extracted:', token ? 'Exists' : 'Missing');

  if (!token) {
    console.log('No token found in auth header');
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    console.log('Verifying token...');
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Token decoded successfully:', decoded);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(403).json({ message: 'Invalid token' });
  }
}

module.exports = authenticateToken; 