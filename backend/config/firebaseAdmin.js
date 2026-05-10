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
      // 1. Remove surrounding quotes if they exist
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.substring(1, privateKey.length - 1);
      }
      
      // 2. Replace literal '\n' strings with actual newline characters
      privateKey = privateKey.replace(/\\n/g, '\n').trim();
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
