// Load environment variables FIRST, before any other imports
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { connectDB, getDB, setupIndexes } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const instagramRoutes = require('./routes/instagramRoutes');
const socialRoutes = require('./routes/socialRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// Increase limit to 5MB (or higher if needed)
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

// Cookie parser for HttpOnly refresh tokens
app.use(cookieParser());

// CORS configuration to support HttpOnly credentials
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}));

// Inject DB context into each request
app.use((req, res, next) => {
    try {
        req.db = getDB();
        next();
    } catch (err) {
        next(err);
    }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/instagram', instagramRoutes);
app.use('/api/social', socialRoutes);

app.get('/', (req, res) => {
    res.send('Hi-Profile API is running...');
});

// Connect to DB, run index setup, and start server
connectDB().then(async () => {
    // Verifying and configuring indexes (Unique + TTL)
    await setupIndexes();
    
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}).catch((error) => {
    console.error('\n[Startup] MongoDB connection failed. Express server was NOT started.');
    console.error('[Startup] Resolve the database connection issue and save a file to trigger nodemon restart.\n');
});