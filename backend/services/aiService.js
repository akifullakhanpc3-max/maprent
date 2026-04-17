const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * AI Service for Occupra Rental Platform
 * Handles property recommendations and descriptions with robust error handling.
 */

const CONFIG = {
  PRIMARY_MODEL: 'gemini-3-flash-agent',
  FALLBACK_MODEL: 'gemini-1.5-flash',
  MAX_RETRIES: 3,
  BACKOFF_DELAY: 2000, // Initial backoff delay in ms
  CAPACITY_ERROR_WAIT: 60000, // Wait 60s for capacity issues
};

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'PLACEHOLDER_KEY');

// Helper for delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Generates content using Gemini with retry logic and fallback.
 * @param {string} prompt - The prompt to send to the AI.
 * @param {boolean} isFallback - Whether this is a fallback attempt.
 * @param {number} attempt - Current attempt number.
 */
async function generateWithResilience(prompt, isFallback = false, attempt = 1) {
  const modelName = isFallback ? CONFIG.FALLBACK_MODEL : CONFIG.PRIMARY_MODEL;
  const model = genAI.getGenerativeModel({ model: modelName });

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error(`AI Error (Model: ${modelName}, Attempt: ${attempt}):`, error.message);

    // Detect capacity exhaustion or 503
    const isCapacityIssue = error.message?.includes('MODEL_CAPACITY_EXHAUSTED') || error.status === 503;
    
    if (attempt < CONFIG.MAX_RETRIES) {
      let waitTime = CONFIG.BACKOFF_DELAY * Math.pow(2, attempt - 1);
      
      if (isCapacityIssue) {
        console.log(`[AI SERVICE] Capacity exhausted. Waiting ${CONFIG.CAPACITY_ERROR_WAIT}ms before retry...`);
        waitTime = CONFIG.CAPACITY_ERROR_WAIT;
      }

      await delay(waitTime);
      return generateWithResilience(prompt, isFallback, attempt + 1);
    }

    // Attempt fallback if primary failed multiple times
    if (!isFallback) {
      console.warn(`[AI SERVICE] Primary model failed after ${CONFIG.MAX_RETRIES} attempts. Switching to Fallback: ${CONFIG.FALLBACK_MODEL}`);
      return generateWithResilience(prompt, true, 1);
    }

    throw new Error('AI Service persistently unavailable after multiple retries and fallback.');
  }
}

/**
 * Example function to generate property description
 */
async function generatePropertyDescription(details) {
  const prompt = `Generate a modern, attractive rental property description for Occupra.
  Title: ${details.title}
  Price: ${details.price}
  Type: ${details.bhkType}
  Amenities: ${details.amenities?.join(', ')}
  Allowed For: ${details.allowedFor?.join(', ')}
  
  Focus on the "Find your perfect space, your way" tagline. Keep it concise.`;

  return generateWithResilience(prompt);
}

module.exports = {
  generateWithResilience,
  generatePropertyDescription
};
