# Campus Asset Booking System – SRM IST

A full-stack role-based campus asset booking system for students, faculty, and admins.

---

## Prerequisites

Make sure you have installed:
- Node.js (v18 or above) → https://nodejs.org
- PostgreSQL (v14 or above) → https://www.postgresql.org/download/

---

## Step-by-Step Setup After Unzipping

### Step 1 – Set up the PostgreSQL Database

Open pgAdmin or your terminal and run:

```
psql -U postgres
```

Then inside psql:

```sql
CREATE DATABASE campus_booking;
\q
```

Now run the schema file:

```
psql -U postgres -d campus_booking -f server/db/schema.sql
```

This creates all tables and seeds the admin account + 8 sample assets.

---

### Step 2 – Configure Database Password (if different)

Open `server/.env` and update:

```
DB_PASSWORD=your_postgres_password
```

---

### Step 3 – Install & Start the Backend

Open a terminal inside the project root:

```bash
cd server
npm install
npm run dev
```

Backend will start at: http://localhost:5000

---

### Step 4 – Install & Start the Frontend

Open a second terminal in the project root:

```bash
cd client
npm install
npm run dev
```

Frontend will start at: http://localhost:3000

---

## Default Admin Login

| Field    | Value                        |
|----------|------------------------------|
| Email    | vg0001admin@srmist.edu.in    |
| Password | Admin@1234                   |
| Role     | Admin                        |

---

## Registering New Users

**Students:**
- Email format: `netid@srmist.edu.in` (e.g. sk2366@srmist.edu.in)
- Net ID format: 2 letters + 4 digits (e.g. sk2366)
- Role: Student

**Faculty:**
- Email format: `netid@srmist.edu.in` (e.g. vk1234@srmist.edu.in)
- Net ID format: 2 letters + 4 digits (e.g. vk1234)
- Role: Faculty

**Admin:**
- Email format: `netidadmin@srmist.edu.in` (e.g. vg0001admin@srmist.edu.in)
- Net ID format: 2 letters + 4 digits (e.g. vg0001)
- Role: Admin (pre-configured only)

---

## Features by Role

### Student
- Search available assets by date, time, type
- Book assets (instant confirmation)
- Cancel bookings before start time
- View all current and past bookings
- Receive notifications

### Faculty
- Priority booking (overrides student conflicts automatically)
- Block asset slots for lectures/exams (students cannot see blocked slots)
- Submit recurring/semester booking requests for admin approval
- Cancel own bookings
- View booking history

### Admin
- Approve or reject booking requests
- Manage campus assets (add, edit, deactivate)
- Review and approve/reject recurring booking requests
- View asset usage reports with filters
- Summary dashboard with system stats

---

## Project Structure

```
campus-booking/
├── server/
│   ├── db/
│   │   ├── schema.sql        ← Database schema + seed
│   │   └── index.js          ← PostgreSQL connection
│   ├── middleware/
│   │   └── auth.js           ← JWT auth middleware
│   ├── routes/
│   │   ├── auth.js           ← Register / Login
│   │   ├── assets.js         ← Asset CRUD + search
│   │   ├── bookings.js       ← Booking management
│   │   ├── blocks.js         ← Faculty slot blocking
│   │   ├── recurring.js      ← Recurring requests
│   │   ├── reports.js        ← Usage reports
│   │   └── notifications.js  ← Notifications
│   ├── index.js              ← Express server entry
│   ├── .env                  ← Environment config
│   └── package.json
│
└── client/
    ├── src/
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── components/
    │   │   └── Layout.jsx
    │   ├── pages/
    │   │   ├── AuthPage.jsx
    │   │   ├── student/
    │   │   │   └── StudentPages.jsx
    │   │   ├── faculty/
    │   │   │   └── FacultyPages.jsx
    │   │   └── admin/
    │   │       └── AdminPages.jsx
    │   ├── utils/
    │   │   └── api.js
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| GET | /api/assets | Search available assets |
| GET | /api/assets/all | All assets (admin) |
| POST | /api/assets | Add asset (admin) |
| PUT | /api/assets/:id | Update asset (admin) |
| DELETE | /api/assets/:id | Deactivate asset (admin) |
| GET | /api/bookings/my | My bookings |
| POST | /api/bookings | Create booking |
| PUT | /api/bookings/:id/cancel | Cancel booking |
| PUT | /api/bookings/:id/approve | Admin approve |
| PUT | /api/bookings/:id/reject | Admin reject |
| POST | /api/blocks | Block slot (faculty) |
| DELETE | /api/blocks/:id | Remove block |
| POST | /api/recurring | Submit recurring request |
| PUT | /api/recurring/:id/approve | Admin approve recurring |
| GET | /api/reports/usage | Usage report (admin) |
| GET | /api/reports/summary | Dashboard stats (admin) |
| GET | /api/notifications | My notifications |
