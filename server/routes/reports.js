const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authMiddleware, requireRole } = require('../middleware/auth');

// GET /api/reports/usage - Admin: asset usage report
router.get('/usage', authMiddleware, requireRole('admin'), async (req, res) => {
  const { start_date, end_date, asset_id } = req.query;
  try {
    let query = `
      SELECT
        a.name as asset_name,
        a.type as asset_type,
        a.location,
        COUNT(b.id) as total_bookings,
        COUNT(CASE WHEN b.status = 'confirmed' THEN 1 END) as confirmed,
        COUNT(CASE WHEN b.status = 'cancelled' THEN 1 END) as cancelled,
        TO_CHAR(DATE(b.start_time), 'YYYY-MM-DD') as booking_date
      FROM assets a
      LEFT JOIN bookings b ON a.id = b.asset_id
    `;
    const params = [];
    const conditions = [];

    if (start_date) {
      params.push(start_date);
      conditions.push(`DATE(b.start_time) >= $${params.length}`);
    }
    if (end_date) {
      params.push(end_date);
      conditions.push(`DATE(b.start_time) <= $${params.length}`);
    }
    if (asset_id) {
      params.push(asset_id);
      conditions.push(`a.id = $${params.length}`);
    }

    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    query += ' GROUP BY a.id, a.name, a.type, a.location, booking_date ORDER BY booking_date DESC, total_bookings DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/reports/summary - Admin: summary stats
router.get('/summary', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE role = 'student') as total_students,
        (SELECT COUNT(*) FROM users WHERE role = 'faculty') as total_faculty,
        (SELECT COUNT(*) FROM assets WHERE status = 'active') as total_assets,
        (SELECT COUNT(*) FROM bookings WHERE status = 'confirmed') as total_confirmed,
        (SELECT COUNT(*) FROM bookings WHERE status = 'pending') as total_pending,
        (SELECT COUNT(*) FROM bookings WHERE status = 'cancelled') as total_cancelled,
        (SELECT COUNT(*) FROM recurring_requests WHERE status = 'pending') as pending_recurring
    `);
    res.json(stats.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
