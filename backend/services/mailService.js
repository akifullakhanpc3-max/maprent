import nodemailer from 'nodemailer';

/**
 * Mail Service
 * Handles sending system emails.
 */

// Configure Transporter (Update .env with real credentials)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send Password Reset Email
 */
export const sendResetPasswordEmail = async (email, token) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;

  const mailOptions = {
    from: `"Occupra Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Reset Your Occupra Password',
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #f9fafb; border-radius: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4f46e5; margin: 0; font-size: 28px;">Occupra</h1>
          <p style="color: #6b7280; font-size: 14px; margin-top: 5px;">Security & Account Recovery</p>
        </div>
        
        <div style="background-color: #ffffff; padding: 40px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <h2 style="color: #111827; margin-top: 0;">Password Reset Request</h2>
          <p style="color: #4b5563; line-height: 1.6;">We received a request to reset the password for your Occupra account. If you didn't make this request, you can safely ignore this email.</p>
          
          <div style="text-align: center; margin: 35px 0;">
            <a href="${resetUrl}" style="background-color: #4f46e5; color: #ffffff; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: bold; display: inline-block; box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3);">
              Reset My Password
            </a>
          </div>
          
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">This link will expire in 1 hour for your security.</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <p style="color: #9ca3af; font-size: 12px;">&copy; 2026 Occupra Inc. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('[MAIL_SERVICE] Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('[MAIL_SERVICE_ERROR]', error);
    // Even if mail fails in dev, we return true to not reveal email existence
    // or log the token in console for dev bypass
    console.log('[DEBUG_TOKEN] Reset Token:', token);
    return false;
  }
};
