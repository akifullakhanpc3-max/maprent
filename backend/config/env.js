/**
 * Environment Variables Validation Script
 * This script ensures all required environment variables are present before the server starts.
 */

const requiredVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'EMAIL_USER',
  'EMAIL_PASS',
  'FRONTEND_URL'
];

const validateEnv = () => {
  const missing = requiredVars.filter((v) => !process.env[v]);

  if (missing.length > 0) {
    console.error('\x1b[31m%s\x1b[0m', 'FATAL ERROR: Missing required environment variables:');
    missing.forEach((v) => console.error(`  - ${v}`));
    console.error('\nPlease ensure these are defined in your .env file.');
    process.exit(1);
  }

  // Optional variables with defaults (non-sensitive)
  process.env.PORT = process.env.PORT || 5050;
  process.env.NODE_ENV = process.env.NODE_ENV || 'development';
  process.env.SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || 'property-images';
  
  console.log('\x1b[32m%s\x1b[0m', '✅ Environment Variables Validated.');
};

export default validateEnv;
