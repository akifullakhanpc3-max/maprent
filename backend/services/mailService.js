import nodemailer from 'nodemailer';
import { Resend } from 'resend';

/**
 * Mail Service
 * Handles sending system emails.
 * Uses Resend API for production (bypasses Render SMTP block) 
 * and Nodemailer as fallback/local dev.
 */

/**
 * Send Password Reset Email
 */
export const sendResetPasswordEmail = async (email, token) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
  const resendKey = process.env.RESEND_API_KEY;

  console.log('[MAIL_SERVICE] Attempting to send recovery email...');

  // 1. Try Resend (API Based - Works on Render)
  if (resendKey) {
    try {
      console.log('[MAIL_SERVICE] Using Resend API...');
      const resend = new Resend(resendKey);
      
      const { data, error } = await resend.emails.send({
        from: 'Occupra <onboarding@resend.dev>',
        to: [email],
        subject: 'Reset Your Occupra Password',
        html: getResetPasswordTemplate(resetUrl),
      });

      if (error) {
        console.error('[RESEND_ERROR]', error);
        throw error;
      }

      console.log('[MAIL_SERVICE] Email sent via Resend:', data.id);
      return true;
    } catch (error) {
      console.error('[MAIL_SERVICE] Resend failed, falling back to SMTP...', error.message);
    }
  }

  // 2. Fallback to Nodemailer SMTP
  const port = parseInt(process.env.EMAIL_PORT) || 465;
  const secure = process.env.EMAIL_SECURE === 'true' || port === 465;

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: port,
    secure: secure, 
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    connectionTimeout: 15000,
    tls: { rejectUnauthorized: false }
  });

  try {
    await transporter.sendMail({
      from: `"Occupra Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Reset Your Occupra Password',
      html: getResetPasswordTemplate(resetUrl),
    });
    console.log('[MAIL_SERVICE] Email sent successfully via SMTP');
    return true;
  } catch (error) {
    console.error('[MAIL_SERVICE_ERROR] SMTP Failure:', error.message);
    return { error: error.message };
  }
};

/**
 * Diagnostic Function: Test connection
 */
export const testEmailConnection = async (testEmail) => {
  const resendKey = process.env.RESEND_API_KEY;
  
  if (resendKey) {
    try {
      const resend = new Resend(resendKey);
      await resend.emails.send({
        from: 'Occupra <onboarding@resend.dev>',
        to: [testEmail],
        subject: 'Occupra Resend Diagnostic',
        text: 'This confirms Resend API is working on Render!'
      });
      return { success: true, method: 'Resend API', message: 'Test email sent.' };
    } catch (error) {
      return { success: false, method: 'Resend API', message: error.message };
    }
  }

  return { success: false, message: 'No RESEND_API_KEY found. SMTP is likely blocked on Render.' };
};

/**
 * Shared Email Template
 */
const getResetPasswordTemplate = (resetUrl) => `
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
`;
