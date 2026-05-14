import nodemailer from 'nodemailer';

/**
 * Mail Service
 * Handles sending system emails via Nodemailer SMTP.
 */

const createTransporter = () => {
  const port = parseInt(process.env.EMAIL_PORT) || 465;
  const secure = process.env.EMAIL_SECURE === 'true' || port === 465;

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: port,
    secure: secure, 
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    connectionTimeout: 20000, 
    greetingTimeout: 20000,
    socketTimeout: 30000,
    tls: { 
      rejectUnauthorized: false,
      minVersion: 'TLSv1.2'
    },
    debug: process.env.NODE_ENV !== 'production',
    logger: process.env.NODE_ENV !== 'production'
  });
};

/**
 * Send Password Reset Email
 */
export const sendResetPasswordEmail = async (email, token) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
  const transporter = createTransporter();

  console.log(`[MAIL_FLOW] Preparing Reset Email for: ${email}`);

  try {
    const info = await transporter.sendMail({
      from: `"Occupra Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Reset Your Occupra Password',
      html: getResetTemplate(resetUrl),
    });

    console.log(`[MAIL_FLOW] Success! MessageID: ${info.messageId}`);
    console.log(`[MAIL_FLOW] Accepted: ${info.accepted}`);
    return true;
  } catch (error) {
    console.error(`[MAIL_FLOW_ERROR] Failed to send to ${email}:`, error.message);
    return { error: error.message };
  }
};

/**
 * Send Booking/Contact Notification to Owner
 */
export const sendBookingNotificationEmail = async (ownerEmail, bookingData, propertyTitle) => {
  const transporter = createTransporter();

  console.log(`[MAIL_FLOW] Forwarding Booking Notification to Owner: ${ownerEmail}`);
  console.log(`[MAIL_FLOW] From Tenant: ${bookingData.name} (${bookingData.email || 'N/A'})`);

  try {
    const info = await transporter.sendMail({
      from: `"Occupra Alerts" <${process.env.EMAIL_USER}>`,
      to: ownerEmail,
      replyTo: bookingData.email || bookingData.phone,
      subject: `New Application: ${propertyTitle}`,
      html: getBookingTemplate(bookingData, propertyTitle),
    });

    console.log(`[MAIL_FLOW] Forwarded successfully to ${ownerEmail}. MessageID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`[MAIL_FLOW_ERROR] Forwarding failed to ${ownerEmail}:`, error.message);
    return false;
  }
};

/**
 * Diagnostic Function: Test SMTP connection
 */
export const testEmailConnection = async (testEmail) => {
  const transporter = createTransporter();

  try {
    console.log('[DIAG] Verifying SMTP connection...');
    await transporter.verify();
    
    console.log(`[DIAG] Sending test mail to: ${testEmail}`);
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: testEmail,
      subject: 'Occupra SMTP Diagnostic',
      text: 'If you see this, your SMTP configuration is working and forwarding to this inbox.'
    });

    return { 
      success: true, 
      method: 'Nodemailer SMTP', 
      accepted: info.accepted,
      response: info.response 
    };
  } catch (error) {
    return { 
      success: false, 
      method: 'Nodemailer SMTP', 
      message: error.message,
      code: error.code,
      config: {
        host: process.env.EMAIL_HOST,
        user: process.env.EMAIL_USER
      }
    };
  }
};

/**
 * Templates
 */
const getResetTemplate = (resetUrl) => `
  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
    <h2 style="color: #4f46e5;">Password Reset</h2>
    <p>You requested a password reset. Click the button below to continue:</p>
    <a href="${resetUrl}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
    <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">This link expires in 1 hour.</p>
  </div>
`;

const getBookingTemplate = (data, title) => `
  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
    <h2 style="color: #4f46e5;">New Property Application</h2>
    <p>You have received a new application for <strong>${title}</strong>.</p>
    
    <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p><strong>Tenant Name:</strong> ${data.name}</p>
      <p><strong>Phone:</strong> ${data.phone}</p>
      <p><strong>Move-in Date:</strong> ${new Date(data.moveInDate).toLocaleDateString()}</p>
      <p><strong>Duration:</strong> ${data.duration} months</p>
      <p><strong>Message:</strong> ${data.message || 'No message provided'}</p>
    </div>
    
    <p>You can reply directly to this email to contact the tenant.</p>
  </div>
`;
