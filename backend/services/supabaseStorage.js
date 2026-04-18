const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BUCKET = process.env.SUPABASE_BUCKET || 'property-images';

/**
 * Uploads a file buffer to Supabase Storage.
 * @param {Buffer} buffer     - The raw file buffer from multer memoryStorage
 * @param {string} originalname - Original filename (used to extract extension)
 * @param {string} mimetype   - MIME type (e.g. 'image/jpeg')
 * @returns {Promise<string>} Public URL of the uploaded image
 */
const uploadImage = async (buffer, originalname, mimetype) => {
  // Generate a collision-safe unique filename
  const ext = originalname.split('.').pop().toLowerCase();
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, buffer, {
      contentType: mimetype,
      upsert: false,
    });

  if (error) {
    console.error('[SUPABASE_STORAGE] Upload error:', error.message);
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  // Get the public URL (bucket must be set to Public in Supabase Dashboard)
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename);
  return data.publicUrl;
};

module.exports = { uploadImage };
