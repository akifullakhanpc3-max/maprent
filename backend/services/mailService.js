import nodemailer from 'nodemailer';
import { Resend } from 'resend';

/**
 * Mail Service
 * Uses Resend API for production (bypasses Render SMTP block)
 * Fallback to Nodemailer SMTP for local development.
 */

const getResendClient = () => {
  const key = process.env.RESEND_API_KEY;
  if (key && key.startsWith('re_')) {
    return new Resend(key);
  }
  return null;
};

/**
 * Send Password Reset Email
 */
export const sendResetPasswordEmail = async (email, token) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
  const resend = getResendClient();

  console.log(`[MAIL_FLOW] Sending Reset Email to: ${email}`);

  // 1. Try Resend API (Works on Render)
  if (resend) {
    try {
      console.log('[MAIL_FLOW] Using Resend API (Port 443)...');
      const { data, error } = await resend.emails.send({
        from: 'Occupra <onboarding@resend.dev>',
        to: [email],
        subject: 'Reset Your Occupra Password',
        html: getResetTemplate(resetUrl),
      });

      if (error) throw error;
      console.log(`[MAIL_FLOW] API Success! ID: ${data.id}`);
      return true;
    } catch (apiError) {
      console.error('[MAIL_FLOW_ERROR] Resend API Failed:', apiError.message);
    }
  }

  // 2. Fallback to SMTP (Likely to fail on Render, works locally)
  return await sendViaSMTP(email, 'Reset Your Occupra Password', getResetTemplate(resetUrl));
};

/**
 * Send Booking/Contact Notification to Owner
 */
export const sendBookingNotificationEmail = async (ownerEmail, bookingData, propertyTitle) => {
  const resend = getResendClient();

  console.log(`[MAIL_FLOW] Forwarding Booking Notification to: ${ownerEmail}`);

  if (resend) {
    try {
      console.log('[MAIL_FLOW] Using Resend API (Port 443)...');
      const { data, error } = await resend.emails.send({
        from: 'Occupra Alerts <onboarding@resend.dev>',
        to: [ownerEmail],
        reply_to: bookingData.email || bookingData.phone,
        subject: `New Application: ${propertyTitle}`,
        html: getBookingTemplate(bookingData, propertyTitle),
      });

      if (error) throw error;
      console.log(`[MAIL_FLOW] API Success! ID: ${data.id}`);
      return true;
    } catch (apiError) {
      console.error('[MAIL_FLOW_ERROR] Resend API Failed:', apiError.message);
    }
  }

  return await sendViaSMTP(ownerEmail, `New Application: ${propertyTitle}`, getBookingTemplate(bookingData, propertyTitle), bookingData.email);
};

/**
 * SMTP Fallback Logic
 */
const sendViaSMTP = async (to, subject, html, replyTo = null) => {
  console.log('[MAIL_FLOW] Falling back to SMTP...');
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 465,
    secure: process.env.EMAIL_SECURE === 'true' || process.env.EMAIL_PORT === '465',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    connectionTimeout: 10000,
    tls: { rejectUnauthorized: false }
  });

  try {
    const info = await transporter.sendMail({
      from: `"Occupra" <${process.env.EMAIL_USER}>`,
      to,
      replyTo,
      subject,
      html
    });
    console.log(`[MAIL_FLOW] SMTP Success! ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('[MAIL_FLOW_ERROR] SMTP Final Failure:', error.message);
    return false;
  }
};

/**
 * Diagnostic Function
 */
export const testEmailConnection = async (testEmail) => {
  const resend = getResendClient();
  
  if (resend) {
    try {
      const { data, error } = await resend.emails.send({
        from: 'Occupra <onboarding@resend.dev>',
        to: [testEmail],
        subject: 'Occupra API Diagnostic',
        text: 'This confirms Resend API is working and bypassing the Render firewall!'
      });
      if (error) throw error;
      return { success: true, method: 'Resend API', id: data.id };
    } catch (e) {
      return { success: false, method: 'Resend API', message: e.message };
    }
  }

  return { success: false, message: 'No RESEND_API_KEY found. SMTP will likely fail on Render.' };
};

/**
 * Templates
 */
const getResetTemplate = (resetUrl) => `
  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
    <h2 style="color: #4f46e5;">Password Reset</h2>
    <p>You requested a password reset. Click the button below to continue:</p>
    <a href="${resetUrl}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
  </div>
`;

const getBookingTemplate = (data, title) => `
  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
    <h2 style="color: #4f46e5;">New Application: ${title}</h2>
    <div style="background: #f9fafb; padding: 15px; border-radius: 8px;">
      <p><strong>Tenant:</strong> ${data.name}</p>
      <p><strong>Phone:</strong> ${data.phone}</p>
      <p><strong>Message:</strong> ${data.message || 'None'}</p>
    </div>
  </div>
`;
