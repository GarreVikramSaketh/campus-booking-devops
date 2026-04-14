const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authMiddleware, requireRole } = require('../middleware/auth');

// GET /api/bookings/my - Get my bookings
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.*, a.name as asset_name, a.type as asset_type, a.location
      FROM bookings b
      JOIN assets a ON b.asset_id = a.id
      WHERE b.user_id = $1
      ORDER BY b.start_time DESC
    `, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/bookings/all - Admin: all bookings
router.get('/all', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.*, a.name as asset_name, a.type as asset_type, u.name as user_name, u.role as user_role, u.net_id
      FROM bookings b
      JOIN assets a ON b.asset_id = a.id
      JOIN users u ON b.user_id = u.id
      ORDER BY b.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/bookings/pending - Admin: pending bookings
router.get('/pending', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.*, a.name as asset_name, a.type as asset_type, u.name as user_name, u.role as user_role, u.net_id
      FROM bookings b
      JOIN assets a ON b.asset_id = a.id
      JOIN users u ON b.user_id = u.id
      WHERE b.status = 'pending'
      ORDER BY b.created_at ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/bookings - Create booking
router.post('/', authMiddleware, async (req, res) => {
  const { asset_id, start_time, end_time, notes } = req.body;
  const user = req.user;

  if (!asset_id || !start_time || !end_time) {
    return res.status(400).json({ message: 'Asset, start time, and end time are required' });
  }

  try {
    // Check for block
    const blockCheck = await pool.query(`
      SELECT id FROM blocks
      WHERE asset_id = $1
      AND NOT (end_time <= $2 OR start_time >= $3)
    `, [asset_id, start_time, end_time]);

    if (blockCheck.rows.length > 0 && user.role === 'student') {
      return res.status(409).json({ message: 'This slot is blocked for academic use' });
    }

    // Check for existing bookings
    const conflict = await pool.query(`
      SELECT b.*, u.role as booker_role FROM bookings b
      JOIN users u ON b.user_id = u.id
      WHERE b.asset_id = $1
      AND b.status IN ('confirmed', 'pending')
      AND NOT (b.end_time <= $2 OR b.start_time >= $3)
    `, [asset_id, start_time, end_time]);

    // Faculty priority: cancel student bookings that conflict
    if (conflict.rows.length > 0) {
      if (user.role === 'faculty') {
        for (const existing of conflict.rows) {
          if (existing.booker_role === 'student') {
            await pool.query('UPDATE bookings SET status=$1 WHERE id=$2', ['cancelled', existing.id]);
            await pool.query(
              'INSERT INTO notifications (user_id, message) VALUES ($1, $2)',
              [existing.user_id, `Your booking for asset on ${start_time} was cancelled due to faculty priority booking.`]
            );
          } else {
            return res.status(409).json({ message: 'Slot already booked by faculty or admin' });
          }
        }
      } else {
        return res.status(409).json({ message: 'This slot is already booked' });
      }
    }

    // Faculty recurring goes to pending for admin approval (handled via recurring_requests)
    const status = 'confirmed';

    const result = await pool.query(
      'INSERT INTO bookings (user_id, asset_id, start_time, end_time, status, notes) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [user.id, asset_id, start_time, end_time, status, notes || null]
    );

    // Notification
    await pool.query(
      'INSERT INTO notifications (user_id, message) VALUES ($1, $2)',
      [user.id, `Booking confirmed for asset on ${start_time}.`]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/bookings/:id/cancel - Cancel booking
router.put('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const booking = await pool.query('SELECT * FROM bookings WHERE id=$1', [req.params.id]);
    if (booking.rows.length === 0) return res.status(404).json({ message: 'Booking not found' });

    const b = booking.rows[0];
    if (b.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (new Date(b.start_time) <= new Date()) {
      return res.status(400).json({ message: 'Cannot cancel a booking that has already started' });
    }

    await pool.query('UPDATE bookings SET status=$1 WHERE id=$2', ['cancelled', req.params.id]);
    await pool.query(
      'INSERT INTO notifications (user_id, message) VALUES ($1, $2)',
      [b.user_id, `Your booking on ${b.start_time} has been cancelled.`]
    );

    res.json({ message: 'Booking cancelled' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/bookings/:id/approve - Admin approve
router.put('/:id/approve', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query('UPDATE bookings SET status=$1 WHERE id=$2 RETURNING *', ['confirmed', req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Booking not found' });
    await pool.query(
      'INSERT INTO notifications (user_id, message) VALUES ($1, $2)',
      [result.rows[0].user_id, `Your booking request has been approved.`]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/bookings/:id/reject - Admin reject
router.put('/:id/reject', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query('UPDATE bookings SET status=$1 WHERE id=$2 RETURNING *', ['rejected', req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Booking not found' });
    await pool.query(
      'INSERT INTO notifications (user_id, message) VALUES ($1, $2)',
      [result.rows[0].user_id, `Your booking request has been rejected.`]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
