const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const { z } = require('zod');
const { OAuth2Client } = require('google-auth-library');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/sendermail');

// Initializing OAuth Client
const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_CALLBACK_URL
);

// --- VALIDATION SCHEMAS ---
const registerSchema = z.object({
    fullName: z.string().min(1, 'Full Name is required').max(100),
    username: z.string()
        .min(3, 'Username must be at least 3 characters')
        .max(30)
        .regex(/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores'),
    email: z.string().email('Invalid email address'),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine(val => val === true, 'You must accept the terms and conditions')
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
});

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required')
});

const resetPasswordSchema = z.object({
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
});

// --- HELPER UTILITIES ---
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const generateAccessToken = (user) => {
    return jwt.sign(
        { userId: user._id.toString(), role: user.role || 'user' },
        process.env.JWT_SECRET || 'fallback_secret_key',
        { expiresIn: '15m' }
    );
};

const parseDevice = (userAgent = '') => {
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobi') || ua.includes('android') || ua.includes('iphone') || ua.includes('ipad')) return 'Mobile';
    if (ua.includes('postman') || ua.includes('insomnia')) return 'API Client';
    return 'Desktop';
};

const generateAndSaveRefreshToken = async (db, userId, req) => {
    const rawToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = hashToken(rawToken);

    const userAgent = req.headers['user-agent'] || 'unknown';
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const device = parseDevice(userAgent);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiration

    await db.collection('refresh_tokens').insertOne({
        tokenHash,
        userId: new ObjectId(userId),
        ip,
        userAgent,
        device,
        createdAt: new Date(),
        expiresAt,
        lastUsed: new Date()
    });

    return rawToken;
};

const getCookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', // Lax enables OAuth redirections safely
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
});

// --- CONTROLLERS ---

// 1. Check Username Availability
const checkUsernameAvailability = async (req, res) => {
    try {
        const username = (req.query.username || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
        if (!username || username.length < 3) {
            return res.status(400).json({ success: false, error: 'Username must be at least 3 characters and alphanumeric' });
        }
        const db = req.db;
       
        const existingUser = await db.collection('users').findOne({ username });
        if (existingUser) {
            return res.status(200).json({ success: true, available: false, reason: 'Username is already taken' });
        }

        const activeReservation = await db.collection('username_reservations').findOne({
            username,
            expiresAt: { $gt: new Date() }
        });
        if (activeReservation) {
            return res.status(200).json({ success: true, available: false, reason: 'Username is temporarily reserved' });
        }

        return res.status(200).json({ success: true, available: true });
    } catch (error) {
        return res.status(500).json({ success: false, error: 'Server error check failed' });
    }
};

// 2. Reserve Username
const reserveUsername = async (req, res) => {
    try {
        const username = (req.body.username || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
        if (!username || username.length < 3) {
            return res.status(400).json({ success: false, error: 'Username must be at least 3 characters' });
        }
        const db = req.db;

        const existingUser = await db.collection('users').findOne({ username });
        if (existingUser) {
            return res.status(400).json({ success: false, error: 'Username is already taken' });
        }

        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins TTL

        try {
            await db.collection('username_reservations').deleteOne({ username, expiresAt: { $lte: new Date() } });
            await db.collection('username_reservations').insertOne({ username, expiresAt, createdAt: new Date() });
        } catch (dbError) {
            if (dbError.code === 11000) {
                return res.status(409).json({ success: false, error: 'Username was just reserved by another session' });
            }
            throw dbError;
        }

        return res.status(200).json({ success: true, message: 'Username reserved for 15 minutes', expiresAt });
    } catch (error) {
        return res.status(500).json({ success: false, error: 'Server failed to reserve username' });
    }
};

// 3. Register
const register = async (req, res) => {
    try {
        const validatedData = registerSchema.parse(req.body);
        const username = validatedData.username.trim().toLowerCase();
        const email = validatedData.email.trim().toLowerCase();
        const db = req.db;

        const reservation = await db.collection('username_reservations').findOne({
            username,
            expiresAt: { $gt: new Date() }
        });
        if (!reservation) {
            const alreadyTaken = await db.collection('users').findOne({ username });
            if (alreadyTaken) return res.status(400).json({ success: false, error: 'Username is already taken' });
            return res.status(400).json({ success: false, error: 'Username reservation has expired. Please claim again.' });
        }

        const existingEmail = await db.collection('users').findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ success: false, error: 'Email address is already registered' });
        }

        const passwordHash = await bcrypt.hash(validatedData.password, 12);
        const result = await db.collection('users').insertOne({
            fullName: validatedData.fullName.trim(),
            username,
            email,
            password: passwordHash,
            authProvider: 'local',
            emailVerified: false,
            role: 'user',
            accountStatus: 'pending',
            failedLoginAttempts: 0,
            lockoutUntil: null,
            profileCompletionStatus: 'onboarding',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        const userId = result.insertedId;
        const rawVerifyToken = crypto.randomBytes(40).toString('hex');
        const tokenHash = hashToken(rawVerifyToken);
        const verifyExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        await db.collection('verification_tokens').insertOne({
            tokenHash,
            userId,
            type: 'email_verification',
            expiresAt: verifyExpiresAt,
            createdAt: new Date()
        });

        await db.collection('username_reservations').deleteOne({ username });
       
        // TRIGGER EMAIL SERVICE
        await sendVerificationEmail(email, validatedData.fullName, rawVerifyToken);

        return res.status(201).json({
            success: true,
            message: 'Registration successful! Please check your email to verify your account.'
        });
    } catch (error) {
        if (error instanceof z.ZodError) return res.status(400).json({ success: false, error: error.errors[0].message });
        return res.status(500).json({ success: false, error: 'Server registration failed', details: error.message });
    }
};

// 4. Verify Email
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) return res.status(400).json({ success: false, error: 'Token is required' });

        const db = req.db;
        const tokenHash = hashToken(token);

        const tokenDoc = await db.collection('verification_tokens').findOne({
            tokenHash,
            type: 'email_verification',
            expiresAt: { $gt: new Date() }
        });

        if (!tokenDoc) return res.status(400).json({ success: false, error: 'Invalid or expired verification token' });

        const userId = tokenDoc.userId;
        await db.collection('users').updateOne(
            { _id: new ObjectId(userId) },
            { $set: { emailVerified: true, accountStatus: 'active', updatedAt: new Date() } }
        );

        await db.collection('verification_tokens').deleteOne({ _id: tokenDoc._id });
        return res.status(200).json({ success: true, message: 'Account verified successfully!' });
    } catch (error) {
        return res.status(500).json({ success: false, error: 'Server verification failed' });
    }
};

// 4.1 Resend Verification Email
const resendVerification = async (req, res) => {
    try {
        const email = (req.body.email || '').trim().toLowerCase();
        if (!email) return res.status(400).json({ success: false, error: 'Email is required' });

        const db = req.db;
        const user = await db.collection('users').findOne({ email });
        if (!user) {
            // Anti-enumeration/Generic response or simple message
            return res.status(200).json({ success: true, message: 'If the email matches an unverified account, a new link has been sent.' });
        }

        if (user.emailVerified) {
            return res.status(400).json({ success: false, error: 'This account is already verified. Please log in.' });
        }

        // Delete any existing email verification tokens for this user
        await db.collection('verification_tokens').deleteMany({ userId: user._id, type: 'email_verification' });

        const rawVerifyToken = crypto.randomBytes(40).toString('hex');
        const tokenHash = hashToken(rawVerifyToken);
        const verifyExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        await db.collection('verification_tokens').insertOne({
            tokenHash,
            userId: user._id,
            type: 'email_verification',
            expiresAt: verifyExpiresAt,
            createdAt: new Date()
        });

        // Trigger email
        await sendVerificationEmail(email, user.fullName || user.username, rawVerifyToken);

        return res.status(200).json({ success: true, message: 'Verification email resent successfully.' });
    } catch (error) {
        return res.status(500).json({ success: false, error: 'Server failed to resend verification email' });
    }
};

// 5. Login
const login = async (req, res) => {
    try {
        const validatedData = loginSchema.parse(req.body);
        const email = validatedData.email.trim().toLowerCase();
        const db = req.db;

        const user = await db.collection('users').findOne({ email });
        if (!user) return res.status(401).json({ success: false, error: 'Invalid email or password' });

        // Brute-force lockout security gate
        const now = new Date();
        if (user.lockoutUntil && user.lockoutUntil > now) {
            const minutesLeft = Math.ceil((user.lockoutUntil - now) / (60 * 1000));
            return res.status(423).json({
                success: false,
                error: `Account locked temporarily. Try again in ${minutesLeft} minutes.`
            });
        }

        if (!user.password) {
            return res.status(401).json({ success: false, error: 'This account uses OAuth. Please continue with Google/GitHub.' });
        }

        const passwordMatch = await bcrypt.compare(validatedData.password, user.password);
        if (!passwordMatch) {
            const newFailedAttempts = (user.failedLoginAttempts || 0) + 1;
            const updatePayload = { failedLoginAttempts: newFailedAttempts };

            if (newFailedAttempts >= 5) {
                updatePayload.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min lock
                updatePayload.failedLoginAttempts = 0; // reset
            }

            await db.collection('users').updateOne({ _id: user._id }, { $set: updatePayload });
            if (newFailedAttempts >= 5) {
                return res.status(423).json({ success: false, error: 'Account locked due to 5 failed login attempts. Try again in 15 minutes.' });
            }
            return res.status(401).json({ success: false, error: 'Invalid email or password' });
        }

        await db.collection('users').updateOne({ _id: user._id }, { $set: { failedLoginAttempts: 0, lockoutUntil: null } });

        if (!user.emailVerified) {
            return res.status(403).json({ success: false, error: 'Please verify your email.', requiresVerification: true });
        }

        if (user.accountStatus === 'locked' || user.accountStatus === 'suspended') {
            return res.status(403).json({ success: false, error: 'Your account is inactive. Please contact support.' });
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = await generateAndSaveRefreshToken(db, user._id, req);

        await db.collection('users').updateOne({ _id: user._id }, { $set: { lastLogin: new Date(), updatedAt: new Date() } });
        res.cookie('refreshToken', refreshToken, getCookieOptions());

        return res.status(200).json({
            success: true,
            accessToken,
            user: {
                id: user._id.toString(),
                fullName: user.fullName,
                username: user.username,
                email: user.email,
                role: user.role,
                profileCompletionStatus: user.profileCompletionStatus
            }
        });
    } catch (error) {
        if (error instanceof z.ZodError) return res.status(400).json({ success: false, error: error.errors[0].message });
        return res.status(500).json({ success: false, error: 'Server login failed' });
    }
};

// 6. Refresh Token Rotation (Core Security Feature)
const refreshToken = async (req, res) => {
    try {
        const rawCookieToken = req.cookies?.refreshToken;
        if (!rawCookieToken) {
            return res.status(401).json({ success: false, error: 'Refresh token missing. Log in again.' });
        }

        const db = req.db;
        const tokenHash = hashToken(rawCookieToken);

        const activeToken = await db.collection('refresh_tokens').findOne({
            tokenHash,
            expiresAt: { $gt: new Date() }
        });

        if (!activeToken) {
            res.clearCookie('refreshToken', getCookieOptions());
            return res.status(401).json({ success: false, error: 'Invalid or expired session.' });
        }

        const user = await db.collection('users').findOne({ _id: activeToken.userId });
        if (!user || user.accountStatus === 'locked') {
            res.clearCookie('refreshToken', getCookieOptions());
            return res.status(401).json({ success: false, error: 'User is locked/inactive.' });
        }

        // Revoke the old token immediately
        await db.collection('refresh_tokens').deleteOne({ _id: activeToken._id });

        // Rotate: Generate a brand new pair
        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = await generateAndSaveRefreshToken(db, user._id, req);

        res.cookie('refreshToken', newRefreshToken, getCookieOptions());

        return res.status(200).json({
            success: true,
            accessToken: newAccessToken
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: 'Token rotation failed' });
    }
};

// 7. Logout Current Device
const logout = async (req, res) => {
    try {
        const rawToken = req.cookies?.refreshToken;
        if (rawToken) {
            const db = req.db;
            const tokenHash = hashToken(rawToken);
            await db.collection('refresh_tokens').deleteOne({ tokenHash });
        }
        res.clearCookie('refreshToken', getCookieOptions());
        return res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, error: 'Logout failed' });
    }
};

// 7.1 Logout All Devices
const logoutAll = async (req, res) => {
    try {
        if (!req.user || !req.user.userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }
        const db = req.db;
        const userId = new ObjectId(req.user.userId);
        
        await db.collection('refresh_tokens').deleteMany({ userId });
        res.clearCookie('refreshToken', getCookieOptions());
        
        return res.status(200).json({ success: true, message: 'Logged out from all devices successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, error: 'Logout all failed' });
    }
};

// 8. Forgot Password (Anti-Enumeration Safeguard)
const forgotPassword = async (req, res) => {
    try {
        const email = (req.body.email || '').trim().toLowerCase();
        if (!email) return res.status(400).json({ success: false, error: 'Email is required' });
        const db = req.db;

        const user = await db.collection('users').findOne({ email });

        // Standard Safeguard: return success message regardless of existence to prevent account scanning
        if (!user) {
            return res.status(200).json({
                success: true,
                message: 'If the email matches an account, you will receive a reset link shortly.'
            });
        }

        await db.collection('verification_tokens').deleteMany({ userId: user._id, type: 'password_reset' });

        const rawResetToken = crypto.randomBytes(40).toString('hex');
        const tokenHash = hashToken(rawResetToken);
        const resetExpiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

        await db.collection('verification_tokens').insertOne({
            tokenHash,
            userId: user._id,
            type: 'password_reset',
            expiresAt: resetExpiresAt,
            createdAt: new Date()
        });

        // Trigger password reset email here
        await sendPasswordResetEmail(email, user.fullName || user.username, rawResetToken);

        return res.status(200).json({
            success: true,
            message: 'If the email matches an account, you will receive a reset link shortly.'
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: 'Server failed to process reset request' });
    }
};

// 9. Reset Password
const resetPassword = async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) return res.status(400).json({ success: false, error: 'Token is required' });

        const validatedData = resetPasswordSchema.parse(req.body);
        const db = req.db;
        const tokenHash = hashToken(token);

        const tokenDoc = await db.collection('verification_tokens').findOne({
            tokenHash,
            type: 'password_reset',
            expiresAt: { $gt: new Date() }
        });

        if (!tokenDoc) return res.status(400).json({ success: false, error: 'Invalid or expired password reset token' });

        const userId = tokenDoc.userId;
        const passwordHash = await bcrypt.hash(validatedData.password, 12);

        await db.collection('users').updateOne(
            { _id: new ObjectId(userId) },
            { $set: { password: passwordHash, failedLoginAttempts: 0, lockoutUntil: null, updatedAt: new Date() } }
        );

        // Security requirement: logout user everywhere by revoking all active sessions
        await db.collection('refresh_tokens').deleteMany({ userId: new ObjectId(userId) });
        await db.collection('verification_tokens').deleteOne({ _id: tokenDoc._id });

        return res.status(200).json({ success: true, message: 'Password reset successful. Please log in again.' });
    } catch (error) {
        if (error instanceof z.ZodError) return res.status(400).json({ success: false, error: error.errors[0].message });
        return res.status(500).json({ success: false, error: 'Server failed to reset password' });
    }
};

// 10. Get Active User Profile (Me)
const getMe = async (req, res) => {
    try {
        if (!req.user || !req.user.userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }
        const db = req.db;
        const user = await db.collection('users').findOne({ _id: new ObjectId(req.user.userId) });
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        return res.status(200).json({
            success: true,
            user: {
                id: user._id.toString(),
                fullName: user.fullName,
                username: user.username,
                email: user.email,
                role: user.role,
                profileCompletionStatus: user.profileCompletionStatus || 'onboarding'
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: 'Failed to get profile' });
    }
};

// --- SHARE OAUTH LOGIC ---
const handleOAuthUserAuthentication = async (db, { email, fullName, provider, providerId, profilePicture }, req, res) => {
    email = email.trim().toLowerCase();
    let user = await db.collection('users').findOne({ email });

    if (!user) {
        // Redirect to frontend login with descriptive query error to instruct registration
        return res.redirect(`${process.env.CLIENT_URL}/login?error=USER_NOT_FOUND&provider=${provider}`);
    }

    if (user.accountStatus === 'suspended' || user.accountStatus === 'deleted' || user.accountStatus === 'locked') {
        return res.redirect(`${process.env.CLIENT_URL}/login?error=${encodeURIComponent('Your account is restricted. Contact support.')}`);
    }

    if (!user.emailVerified) {
        return res.redirect(`${process.env.CLIENT_URL}/login?error=${encodeURIComponent('Please verify your email before using social login.')}`);
    }

    // Link credentials if user doesn't have OAuth ID attached
    const providers = user.authenticationProviders || [];
    const providerIdStr = providerId.toString();
    const hasProvider = providers.some(p => p && p.provider === provider) ||
                        (provider === 'google' && user.googleId === providerIdStr) ||
                        (provider === 'github' && user.githubId === providerIdStr);

    const updatePayload = {};
    if (!hasProvider) {
        if (provider === 'google') updatePayload.googleId = providerIdStr;
        if (provider === 'github') updatePayload.githubId = providerIdStr;

        const newProvidersList = [...providers];
        newProvidersList.push({ provider, providerId: providerIdStr, linkedAt: new Date() });
        updatePayload.authenticationProviders = newProvidersList;

        if (!user.profilePicture && profilePicture) updatePayload.profilePicture = profilePicture;
        updatePayload.updatedAt = new Date();

        await db.collection('users').updateOne({ _id: user._id }, { $set: updatePayload });
        user = await db.collection('users').findOne({ _id: user._id });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = await generateAndSaveRefreshToken(db, user._id, req);

    await db.collection('users').updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } });
    res.cookie('refreshToken', refreshToken, getCookieOptions());

    const redirectUrl = user.profileCompletionStatus === 'completed'
        ? `${process.env.CLIENT_URL}/timeline`
        : `${process.env.CLIENT_URL}/upload`;

    return res.redirect(redirectUrl);
};

module.exports = {
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
};
