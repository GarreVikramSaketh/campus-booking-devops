const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authMiddleware, requireRole } = require('../middleware/auth');

// GET /api/recurring/my - Faculty: my recurring requests
router.get('/my', authMiddleware, requireRole('faculty'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, a.name as asset_name, a.type as asset_type
      FROM recurring_requests r
      JOIN assets a ON r.asset_id = a.id
      WHERE r.faculty_id = $1
      ORDER BY r.created_at DESC
    `, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/recurring/all - Admin: all recurring requests
router.get('/all', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, a.name as asset_name, a.type as asset_type, u.name as faculty_name, u.net_id
      FROM recurring_requests r
      JOIN assets a ON r.asset_id = a.id
      JOIN users u ON r.faculty_id = u.id
      ORDER BY r.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/recurring - Faculty: submit recurring request
router.post('/', authMiddleware, requireRole('faculty'), async (req, res) => {
  const { asset_id, pattern, start_date, end_date, start_time, end_time } = req.body;
  if (!asset_id || !pattern || !start_date || !end_date || !start_time || !end_time) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO recurring_requests (faculty_id, asset_id, pattern, start_date, end_date, start_time, end_time) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [req.user.id, asset_id, pattern, start_date, end_date, start_time, end_time]
    );

    // Notify all admins
    const admins = await pool.query("SELECT id FROM users WHERE role='admin'");
    for (const admin of admins.rows) {
      await pool.query(
        'INSERT INTO notifications (user_id, message) VALUES ($1, $2)',
        [admin.id, `New recurring booking request submitted by faculty ${req.user.name}.`]
      );
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/recurring/:id/approve - Admin: approve recurring
router.put('/:id/approve', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const reqResult = await pool.query('SELECT * FROM recurring_requests WHERE id=$1', [req.params.id]);
    if (reqResult.rows.length === 0) return res.status(404).json({ message: 'Request not found' });

    const r = reqResult.rows[0];
    await pool.query('UPDATE recurring_requests SET status=$1, admin_notes=$2 WHERE id=$3', ['approved', req.body.notes || null, req.params.id]);

    // Generate individual bookings
    const start = new Date(r.start_date);
    const end = new Date(r.end_date);
    const bookingsCreated = [];

    for (let d = new Date(start); d <= end; ) {
      const startDT = `${d.toISOString().split('T')[0]} ${r.start_time}`;
      const endDT = `${d.toISOString().split('T')[0]} ${r.end_time}`;

      const b = await pool.query(
        'INSERT INTO bookings (user_id, asset_id, start_time, end_time, status, booking_type) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
        [r.faculty_id, r.asset_id, startDT, endDT, 'confirmed', 'recurring']
      );
      bookingsCreated.push(b.rows[0]);

      if (r.pattern === 'daily') d.setDate(d.getDate() + 1);
      else d.setDate(d.getDate() + 7);
    }

    await pool.query(
      'INSERT INTO notifications (user_id, message) VALUES ($1, $2)',
      [r.faculty_id, `Your recurring booking request has been approved. ${bookingsCreated.length} slots reserved.`]
    );

    res.json({ message: 'Approved', bookings_created: bookingsCreated.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/recurring/:id/reject - Admin: reject recurring
router.put('/:id/reject', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query('UPDATE recurring_requests SET status=$1, admin_notes=$2 WHERE id=$3 RETURNING *', ['rejected', req.body.notes || null, req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Not found' });
    await pool.query(
      'INSERT INTO notifications (user_id, message) VALUES ($1, $2)',
      [result.rows[0].faculty_id, `Your recurring booking request has been rejected.`]
    );
    res.json({ message: 'Rejected' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
