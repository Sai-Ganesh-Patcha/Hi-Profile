// Load environment variables FIRST, before any other imports
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const instagramRoutes = require('./routes/instagramRoutes');
const socialRoutes = require('./routes/socialRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// Increase limit to 5MB (or higher if needed)
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

// Middleware
app.use(cors());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/instagram', instagramRoutes);
app.use('/api/social', socialRoutes);

app.get('/', (req, res) => {
    res.send('Hi-Profile API is running...');
});

// Connect to DB and start server
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}).catch((error) => {
    console.error('\n[Startup] MongoDB connection failed. Express server was NOT started.');
    console.error('[Startup] Resolve the database connection issue and save a file to trigger nodemon restart.\n');
});