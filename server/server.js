const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const instagramRoutes = require('./routes/instagramRoutes');
const socialRoutes = require('./routes/socialRoutes');

dotenv.config();

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
});