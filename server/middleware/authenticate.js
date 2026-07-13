const jwt = require('jsonwebtoken');

const authenticateUser = (req, res, next) => {
    let token = null;
    const authHeader = req.headers['authorization'];
   
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.accessToken) {
        token = req.cookies.accessToken;
    }
   
    if (!token) {
        return res.status(401).json({ success: false, error: 'Access token missing. Authentication required.' });
    }
   
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
        req.user = {
            userId: decoded.userId,
            role: decoded.role || 'user'
        };
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Access token expired.',
                code: 'TOKEN_EXPIRED'
            });
        }
        return res.status(403).json({ success: false, error: 'Invalid access token.' });
    }
};

module.exports = authenticateUser;
