import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Initializes Firebase Admin SDK using environment variables.
 * Highly robust version for Render/Production.
 */
if (!admin.apps.length) {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (privateKey) {
      // Fix potential formatting issues from Render env var UI
      privateKey = privateKey.replace(/\\n/g, '\n').trim();
      // Remove surrounding quotes if they exist
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.substring(1, privateKey.length - 1);
      }
    }

    if (projectId && clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log('✅ [FIREBASE_ADMIN] Initialized successfully.');
    } else {
      const missing = [];
      if (!projectId) missing.push('FIREBASE_PROJECT_ID');
      if (!clientEmail) missing.push('FIREBASE_CLIENT_EMAIL');
      if (!privateKey) missing.push('FIREBASE_PRIVATE_KEY');
      
      console.error(`❌ [FIREBASE_ADMIN] Missing credentials: ${missing.join(', ')}`);
      console.error('Check your Render Environment Variables dashboard.');
    }
  } catch (error) {
    console.error('❌ [FIREBASE_ADMIN] Initialization Critical Error:', error.message);
  }
}

export default admin;
