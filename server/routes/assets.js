const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authMiddleware, requireRole } = require('../middleware/auth');

// GET /api/assets - Search available assets by date, time, type
router.get('/', authMiddleware, async (req, res) => {
  const { date, start_time, end_time, type } = req.query;
  try {
    let query = `
      SELECT a.* FROM assets a
      WHERE a.status = 'active'
    `;
    const params = [];

    if (type) {
      params.push(type);
      query += ` AND a.type = $${params.length}`;
    }

    if (date && start_time && end_time) {
      const startDT = `${date} ${start_time}`;
      const endDT = `${date} ${end_time}`;

      // Exclude assets with confirmed bookings in the time range
      params.push(startDT, endDT);
      query += `
        AND a.id NOT IN (
          SELECT asset_id FROM bookings
          WHERE status IN ('confirmed', 'pending')
          AND NOT (end_time <= $${params.length - 1} OR start_time >= $${params.length})
        )
        AND a.id NOT IN (
          SELECT asset_id FROM blocks
          WHERE NOT (end_time <= $${params.length - 1} OR start_time >= $${params.length})
        )
      `;
    }

    query += ' ORDER BY a.type, a.name';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/assets/all - Admin: all assets including inactive
router.get('/all', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM assets ORDER BY type, name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/assets - Admin: add asset
router.post('/', authMiddleware, requireRole('admin'), async (req, res) => {
  const { name, type, location, capacity } = req.body;
  if (!name || !type || !location || !capacity) {
    return res.status(400).json({ message: 'All fields required' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO assets (name, type, location, capacity) VALUES ($1,$2,$3,$4) RETURNING *',
      [name, type, location, capacity]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/assets/:id - Admin: update asset
router.put('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  const { name, type, location, capacity, status } = req.body;
  try {
    const result = await pool.query(
      'UPDATE assets SET name=$1, type=$2, location=$3, capacity=$4, status=$5 WHERE id=$6 RETURNING *',
      [name, type, location, capacity, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Asset not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/assets/:id - Admin: remove asset
router.delete('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    await pool.query('UPDATE assets SET status=$1 WHERE id=$2', ['inactive', req.params.id]);
    res.json({ message: 'Asset deactivated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
