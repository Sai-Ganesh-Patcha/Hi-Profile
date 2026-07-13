const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const {
    checkUsernameAvailability,
    reserveUsername,
    register,
    verifyEmail,
    resendVerification,
    login,
    refreshToken,
    logout,
    logoutAll,
    forgotPassword,
    resetPassword,
    getMe,
    handleOAuthUserAuthentication
} = require('../controllers/authController');

const authenticateUser = require('../middleware/authenticate');

// --- RATE LIMITERS ---
const commonLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: { success: false, error: 'Too many requests, please try again after 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
});

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    message: { success: false, error: 'Too many registration attempts, please try again after an hour' },
    standardHeaders: true,
    legacyHeaders: false,
});

const resendLimiter = rateLimit({
    windowMs: 30 * 60 * 1000, // 30 minutes
    max: 5,
    message: { success: false, error: 'Too many verification email requests, please try again after 30 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: { success: false, error: 'Too many login attempts, please try again after 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
});

const forgotResetLimiter = rateLimit({
    windowMs: 30 * 60 * 1000, // 30 minutes
    max: 5,
    message: { success: false, error: 'Too many password reset requests, please try again after 30 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
});

// --- ROUTES ---

// 1. Username availability and reservation
router.get('/username-check', commonLimiter, checkUsernameAvailability);
router.post('/username-reserve', commonLimiter, reserveUsername);

// 2. Register, verify and resend verification email
router.post('/register', registerLimiter, register);
router.get('/verify-email', commonLimiter, verifyEmail);
router.post('/resend-verification', resendLimiter, resendVerification);

// 3. Login, logout and refresh tokens
router.post('/login', loginLimiter, login);
router.post('/refresh', commonLimiter, refreshToken);
router.post('/logout', commonLimiter, logout);
router.post('/logout-all', authenticateUser, logoutAll);

// 4. Password forgot and reset
router.post('/forgot-password', forgotResetLimiter, forgotPassword);
router.post('/reset-password', forgotResetLimiter, resetPassword);

// 5. Active user profile payload
router.get('/me', authenticateUser, getMe);

// 6. OAuth stubs (Google / GitHub redirection endpoints)
router.get('/google', (req, res) => {
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.GOOGLE_CALLBACK_URL)}&response_type=code&scope=profile%20email`;
    res.redirect(url);
});

router.get('/google/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) {
        return res.redirect(`${process.env.CLIENT_URL}/login?error=OAUTH_CODE_MISSING`);
    }
    try {
        if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID.startsWith('your_')) {
            console.log('[OAuth Callback] Google client ID not configured.');
            return res.redirect(`${process.env.CLIENT_URL}/login?error=OAUTH_NOT_CONFIGURED`);
        }
        
        // Load dynamically to avoid issues
        const { OAuth2Client } = require('google-auth-library');
        const oAuth2Client = new OAuth2Client(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_CALLBACK_URL
        );
        
        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);
        
        const ticket = await oAuth2Client.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        
        const oauthUser = {
            email: payload.email,
            fullName: payload.name,
            provider: 'google',
            providerId: payload.sub,
            profilePicture: payload.picture
        };
        
        await handleOAuthUserAuthentication(req.db, oauthUser, req, res);
    } catch (error) {
        console.error('[Google OAuth Error]', error);
        res.redirect(`${process.env.CLIENT_URL}/login?error=OAUTH_FAILED`);
    }
});

router.get('/github', (req, res) => {
    const url = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.GITHUB_CALLBACK_URL)}&scope=user:email`;
    res.redirect(url);
});

router.get('/github/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) {
        return res.redirect(`${process.env.CLIENT_URL}/login?error=OAUTH_CODE_MISSING`);
    }
    try {
        if (!process.env.GITHUB_CLIENT_ID || process.env.GITHUB_CLIENT_ID.startsWith('your_')) {
            console.log('[OAuth Callback] GitHub client ID not configured.');
            return res.redirect(`${process.env.CLIENT_URL}/login?error=OAUTH_NOT_CONFIGURED`);
        }
        
        // Dynamically require to check for fetch availability or fallback
        const nodeFetch = globalThis.fetch || require('node-fetch');
        
        const tokenResponse = await nodeFetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code,
                redirect_uri: process.env.GITHUB_CALLBACK_URL
            })
        });
        
        const tokenData = await tokenResponse.json();
        const githubToken = tokenData.access_token;
        
        if (!githubToken) {
            return res.redirect(`${process.env.CLIENT_URL}/login?error=OAUTH_TOKEN_MISSING`);
        }
        
        const userResponse = await nodeFetch('https://api.github.com/user', {
            headers: {
                'Authorization': `token ${githubToken}`,
                'User-Agent': 'hiprofile-app'
            }
        });
        const githubUser = await userResponse.json();
        
        const emailsResponse = await nodeFetch('https://api.github.com/user/emails', {
            headers: {
                'Authorization': `token ${githubToken}`,
                'User-Agent': 'hiprofile-app'
            }
        });
        const emails = await emailsResponse.json();
        
        let primaryEmail = null;
        if (Array.isArray(emails)) {
            const found = emails.find(e => e.primary && e.verified);
            primaryEmail = found ? found.email : emails[0]?.email;
        }
        
        primaryEmail = primaryEmail || githubUser.email;
        
        if (!primaryEmail) {
            return res.redirect(`${process.env.CLIENT_URL}/login?error=OAUTH_EMAIL_MISSING`);
        }
        
        const oauthUser = {
            email: primaryEmail,
            fullName: githubUser.name || githubUser.login,
            provider: 'github',
            providerId: githubUser.id,
            profilePicture: githubUser.avatar_url
        };
        
        await handleOAuthUserAuthentication(req.db, oauthUser, req, res);
    } catch (error) {
        console.error('[GitHub OAuth Error]', error);
        res.redirect(`${process.env.CLIENT_URL}/login?error=OAUTH_FAILED`);
    }
});

module.exports = router;
