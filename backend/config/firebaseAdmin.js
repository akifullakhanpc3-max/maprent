import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Initializes Firebase Admin SDK using environment variables.
 * This is the recommended approach for production deployments like Render.
 */
if (!admin.apps.length) {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    // Replace \n with actual newlines if the key was provided as a string
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (projectId && clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log('✅ Firebase Admin SDK initialized successfully via Environment Variables.');
    } else {
      console.warn('⚠️ FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY is missing.');
      
      // Fallback for local development if a path is provided
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH) {
        // Dynamic import for the JSON file (must be default export or handled carefully)
        // Note: ESM require is not available, so we use fs or import()
        console.warn('⚠️ Path-based initialization is deprecated. Use Environment Variables.');
      }
    }
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
  }
}

export default admin;
