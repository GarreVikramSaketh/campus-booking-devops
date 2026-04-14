const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authMiddleware, requireRole } = require('../middleware/auth');

// GET /api/blocks - Faculty: view my blocks
router.get('/', authMiddleware, requireRole('faculty', 'admin'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT bl.*, a.name as asset_name, a.type as asset_type
      FROM blocks bl
      JOIN assets a ON bl.asset_id = a.id
      WHERE bl.faculty_id = $1
      ORDER BY bl.start_time DESC
    `, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/blocks - Faculty: block a slot
router.post('/', authMiddleware, requireRole('faculty'), async (req, res) => {
  const { asset_id, start_time, end_time, reason } = req.body;
  if (!asset_id || !start_time || !end_time || !reason) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  try {
    // Cancel any student bookings in this slot
    const studentBookings = await pool.query(`
      SELECT b.id, b.user_id FROM bookings b
      JOIN users u ON b.user_id = u.id
      WHERE b.asset_id = $1 AND u.role = 'student'
      AND b.status = 'confirmed'
      AND NOT (b.end_time <= $2 OR b.start_time >= $3)
    `, [asset_id, start_time, end_time]);

    for (const sb of studentBookings.rows) {
      await pool.query('UPDATE bookings SET status=$1 WHERE id=$2', ['cancelled', sb.id]);
      await pool.query(
        'INSERT INTO notifications (user_id, message) VALUES ($1, $2)',
        [sb.user_id, `Your booking was cancelled because a faculty member blocked this slot for academic use.`]
      );
    }

    const result = await pool.query(
      'INSERT INTO blocks (faculty_id, asset_id, start_time, end_time, reason) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [req.user.id, asset_id, start_time, end_time, reason]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/blocks/:id - Faculty: remove block
router.delete('/:id', authMiddleware, requireRole('faculty', 'admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM blocks WHERE id=$1 AND faculty_id=$2', [req.params.id, req.user.id]);
    res.json({ message: 'Block removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
