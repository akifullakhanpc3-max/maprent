import admin from 'firebase-admin';

/**
 * Initializes Firebase Admin SDK using environment variables.
 * Highly robust version for production use.
 */
if (!admin.apps.length) {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (privateKey) {
      const header = "-----BEGIN PRIVATE KEY-----";
      const footer = "-----END PRIVATE KEY-----";
      
      // 1. Extract only the raw Base64 data
      // Remove headers, footers, literal \n, rogue backslashes, and all whitespace
      let rawKey = privateKey
        .replace(header, '')
        .replace(footer, '')
        .replace(/\\n/g, '')
        .replace(/\\/g, '') 
        .replace(/\s+/g, '');
      
      // 2. Re-format it perfectly (64 chars per line)
      const lines = rawKey.match(/.{1,64}/g);
      if (lines) {
        privateKey = `${header}\n${lines.join('\n')}\n${footer}\n`;
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
      console.error('❌ [FIREBASE_ADMIN] Missing credentials in .env file.');
    }
  } catch (error) {
    console.error('❌ [FIREBASE_ADMIN] Initialization Critical Error:', error.message);
  }
}

export default admin;
