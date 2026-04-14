-- Campus Asset Booking System - Database Schema

-- ❌ REMOVE CREATE DATABASE
-- ❌ REMOVE \c command

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'faculty', 'admin')),
  net_id VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assets (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('classroom', 'lab', 'sports')),
  location VARCHAR(100) NOT NULL,
  capacity INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  asset_id INTEGER REFERENCES assets(id) ON DELETE CASCADE,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'rejected')),
  booking_type VARCHAR(20) DEFAULT 'single' CHECK (booking_type IN ('single', 'recurring')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blocks (
  id SERIAL PRIMARY KEY,
  faculty_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  asset_id INTEGER REFERENCES assets(id) ON DELETE CASCADE,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recurring_requests (
  id SERIAL PRIMARY KEY,
  faculty_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  asset_id INTEGER REFERENCES assets(id) ON DELETE CASCADE,
  pattern VARCHAR(20) NOT NULL CHECK (pattern IN ('daily', 'weekly')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ✅ Seed admin user (password: Admin@1234)
INSERT INTO users (name, email, password, role, net_id)
VALUES (
  'Vijay Gupta',
  'vg0001admin@srmist.edu.in',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'admin',
  'vg0001'
)
ON CONFLICT (email) DO NOTHING;

-- Seed sample assets
INSERT INTO assets (name, type, location, capacity) VALUES
  ('Room A101', 'classroom', 'Block A, Floor 1', 60),
  ('Room A102', 'classroom', 'Block A, Floor 1', 40),
  ('CS Lab 1', 'lab', 'Block B, Floor 2', 30),
  ('CS Lab 2', 'lab', 'Block B, Floor 2', 30),
  ('Physics Lab', 'lab', 'Block C, Floor 1', 25),
  ('Basketball Court', 'sports', 'Sports Complex', 20),
  ('Badminton Court', 'sports', 'Sports Complex', 8),
  ('Seminar Hall', 'classroom', 'Block D, Ground', 120)
ON CONFLICT DO NOTHING;