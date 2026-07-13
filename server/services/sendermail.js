const nodeMailer = require('nodemailer');

const transporter = nodeMailer.createTransport({
    host: process.env.MAIL_SERVER || 'smtp.gmail.com',
    port: parseInt(process.env.MAIL_PORT || '587', 10),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD
    }
});

const sendVerificationEmail = async (email, name, token) => {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const verificationLink = `${clientUrl}/verify-email?token=${token}`;
    
    await transporter.sendMail({
        from: `"Hi-Profile" <${process.env.EMAIL_FROM || process.env.MAIL_USERNAME || 'noreply@hiprofile.bio'}>`,
        to: email,
        subject: 'Verify Your Hi-Profile Account',
        html: `<div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; border: 1px solid #e0e0e0; border-radius: 8px;">
                 <h2 style="color: #3E66FB;">Welcome to Hi-Profile!</h2>
                 <p>Hello ${name},</p>
                 <p>Thank you for registering. Please click the button below to verify your email address and activate your account:</p>
                 <div style="margin: 24px 0;">
                   <a href="${verificationLink}" style="background-color: #3E66FB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verify Email Address</a>
                 </div>
                 <p style="color: #666; font-size: 0.9em;">If you cannot click the button above, copy and paste this URL into your browser:</p>
                 <p style="color: #666; font-size: 0.9em; word-break: break-all;">${verificationLink}</p>
                 <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                 <p style="color: #999; font-size: 0.8em;">This link will expire in 24 hours. If you did not create a Hi-Profile account, please ignore this email.</p>
               </div>`
    });
};

const sendPasswordResetEmail = async (email, name, token) => {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetLink = `${clientUrl}/reset-password?token=${token}`;
    
    await transporter.sendMail({
        from: `"Hi-Profile" <${process.env.EMAIL_FROM || process.env.MAIL_USERNAME || 'noreply@hiprofile.bio'}>`,
        to: email,
        subject: 'Reset Your Hi-Profile Password',
        html: `<div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; border: 1px solid #e0e0e0; border-radius: 8px;">
                 <h2 style="color: #3E66FB;">Password Reset Request</h2>
                 <p>Hello ${name},</p>
                 <p>We received a request to reset the password for your Hi-Profile account. Click the button below to set a new password:</p>
                 <div style="margin: 24px 0;">
                   <a href="${resetLink}" style="background-color: #3E66FB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
                 </div>
                 <p style="color: #666; font-size: 0.9em;">If you cannot click the button above, copy and paste this URL into your browser:</p>
                 <p style="color: #666; font-size: 0.9em; word-break: break-all;">${resetLink}</p>
                 <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                 <p style="color: #999; font-size: 0.8em;">This link will expire in 1 hour. If you did not request a password reset, please ignore this email and your password will remain unchanged.</p>
               </div>`
    });
};

const sendEmail = async ({ to, subject, text, html }) => {
    await transporter.sendMail({
        from: `"Hi-Profile" <${process.env.EMAIL_FROM || process.env.MAIL_USERNAME || 'noreply@hiprofile.bio'}>`,
        to,
        subject,
        text,
        html
    });
};

module.exports = {
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendEmail
};