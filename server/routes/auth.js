const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');

// Validate SRM email and net_id
function validateEmail(email) {
  return email.endsWith('@srmist.edu.in');
}

function detectRole(email, netId) {
  // Admin: two letters + 4 digits + 'admin' e.g. vg0001admin@srmist.edu.in
  const adminNetIdPattern = /^[a-z]{2}\d{4}$/i;
  if (email.includes('admin') && adminNetIdPattern.test(netId)) return 'admin';

  // Net ID for student/faculty: two letters + 4 digits e.g. sk2366
  const regularPattern = /^[a-z]{2}\d{4}$/i;
  if (!regularPattern.test(netId)) return null;

  return null; // role chosen by user during registration (student or faculty)
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, role, net_id } = req.body;

  if (!name || !email || !password || !role || !net_id) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({ message: 'Email must be a valid @srmist.edu.in address' });
  }

  // Validate net_id format: two letters + 4 digits
  const netIdPattern = /^[a-z]{2}\d{4}$/i;
  if (!netIdPattern.test(net_id) && role !== 'admin') {
    return res.status(400).json({ message: 'Net ID must be two letters followed by 4 digits (e.g. sk2366)' });
  }

  // Admin role check
  if (role === 'admin') {
    const adminPattern = /^[a-z]{2}\d{4}$/i;
    const expectedEmail = `${net_id}admin@srmist.edu.in`;
    if (!adminPattern.test(net_id) || email !== expectedEmail) {
      return res.status(400).json({ message: 'Admin accounts must use format: netidadmin@srmist.edu.in' });
    }
  }

  // Students and faculty cannot register as admin
  if ((role === 'student' || role === 'faculty') && email.includes('admin')) {
    return res.status(400).json({ message: 'Invalid email for this role' });
  }

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email=$1 OR net_id=$2', [email, net_id]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'Email or Net ID already registered' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password, role, net_id) VALUES ($1,$2,$3,$4,$5) RETURNING id, name, email, role, net_id',
      [name, email, hashed, role, net_id]
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role, net_id: user.net_id }, process.env.JWT_SECRET, { expiresIn: '8h' });

    res.status(201).json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role, net_id: user.net_id }, process.env.JWT_SECRET, { expiresIn: '8h' });

    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, net_id: user.net_id } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
