require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/assets', require('./routes/assets'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/blocks', require('./routes/blocks'));
app.use('/api/recurring', require('./routes/recurring'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/notifications', require('./routes/notifications'));

app.get('/', (req, res) => res.json({ message: 'Campus Booking API running' }));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
