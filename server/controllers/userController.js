const bcrypt = require('bcrypt');

const { getDB } = require('../config//db');
const jwt = require('jsonwebtoken');

const { sendVerificationEmail, sendEmail } = require('../services/sendermail');

const registerUser = async (req, res) => {
    try {
        const { username, email, password, role, phone_number } = req.body;
        if (!username?.trim()) {
            return res.status(400).json({
                message: "Username is required"
            });
        }

        if (!email?.trim()) {
            return res.status(400).json({
                message: "Email is required"
            });
        }

        if (!password?.trim()) {
            return res.status(400).json({
                message: "Password is required"
            });
        }
        const db = getDB();

        const normalizedEmail = email.toLowerCase();

        // Check if user already exists
        const existingUser = await db.collection('users').findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already in use' });
        }
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        // Create new user
        const newUser = {
            username,
            email: normalizedEmail,
            password: hashedPassword,
            phone_number: phone_number || null, // Optional field
            role: role || 'user', // Default role is 'user'
            isVerified: false, // Email verification status
            createdAt: new Date()
        };
        const result = await db.collection('users').insertOne(newUser);
        console.log('JWT_SECRET =', process.env.JWT_SECRET);
        const token = jwt.sign({
            userId: result.insertedId,
            email: normalizedEmail
        },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );
        await sendVerificationEmail(normalizedEmail, username, token);

        res.status(201).json({ message: 'User registered successfully. please check your email and verify your account ', userId: result.insertedId });
    }
    catch (error) {
        res.status(500).json({
            message: "server error",
            error: error.message
        })

    }

}

const generateAccessToken = (user) => {
    return jwt.sign(
        {
            id: user._id,
            email: user.email,
            role: user.role
        },
        "access_secret_key",
        { expiresIn: "15m" }
    );
};

const generateRefreshToken = (user) => {
    return jwt.sign(
        {
            id: user._id,
            email: user.email,
            role: user.role
        },
        "refresh_secret_key",
        { expiresIn: "7d" }
    );
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const db = getDB();

        const user = await db.collection('users').findOne({
            email: email.toLowerCase()
        });

        if (!user) {
            return res.status(401).json({ message: "Invalid email" });
        }
        if (!user.isVerified) {
            return res.status(401).json({ message: "Email not verified. Please verify your email before logging in." });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: "Invalid Password" });
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        await db.collection('users').updateOne(
            { _id: user._id },
            { $set: { refresh_token: refreshToken } }
        );

        res.status(200).json({
            message: "Login succesful",
            accessToken,
            refreshToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({
            message: "Login failed",
            error: error.message
        });
    }
};

const refreshUserToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ message: "Refresh token is required" });
        }
        let decoded;
        try {
            decoded = jwt.verify(refreshToken, "refresh_secret_key");
        } catch (err) {
            return res.status(401).json({ message: "Invalid refresh token" });
        }
        const db = getDB();
        const user = await db.collection('users').findOne({ email: decoded.email, refresh_token: refreshToken });
        if (!user) {
            return res.status(401).json({ message: "Invalid refresh token" });
        }
        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);
        await db.collection('users').updateOne(
            { _id: user._id },
            { $set: { refresh_token: newRefreshToken } }
        );
        res.status(200).json({
            message: "Token refreshed successfully",
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Token refresh failed",
            error: error.message
        });
    }
}

const sendPasswordResetOTP = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const db = getDB();
        const userCollection = db.collection('users');

        const normalizedEmail = email.toLowerCase();
        const user = await userCollection.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(404).json({ message: "No account found with this email" });
        }

        // Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

        await userCollection.updateOne(
            { _id: user._id },
            { $set: { otp, otpExpiry } }
        );

        await sendEmail({
            to: normalizedEmail,
            subject: "Password Reset OTP",
            text: `Your OTP for password reset is ${otp}. It will expire in 10 minutes.`,
            html: `<p>Your OTP for password reset is <strong>${otp}</strong>. It will expire in 10 minutes.</p>`
        });

        res.status(200).json({ message: "OTP sent successfully to your email" });
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to send password reset OTP",
            error: error.message
        });
    }
}

const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: "Email, OTP and new password are required" });
        }

        const db = getDB();
        const userCollection = db.collection('users');
        const normalizedEmail = email.toLowerCase();

        const user = await userCollection.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.otp !== otp || new Date() > new Date(user.otpExpiry)) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await userCollection.updateOne(
            { _id: user._id },
            {
                $set: { password: hashedPassword },
                $unset: { otp: "", otpExpiry: "" }
            }
        );

        res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
        res.status(500).json({
            message: "Reset password failed",
            error: error.message
        });
    }
};

module.exports = {
    registerUser,
    generateAccessToken,
    generateRefreshToken,
    loginUser,
    refreshUserToken,
    sendPasswordResetOTP,
    resetPassword
}

