const Log = require('../models/Log');

/**
 * Creates a system activity log entry.
 * @param {string} userId - ID of the user performing the action
 * @param {string} tenantId - ID of the tenant the action belongs to
 * @param {string} action - Action string (e.g. 'USER_LOGIN')
 * @param {object} metadata - Additional info (optional)
 */
const createLog = async (userId, tenantId, action, metadata = {}) => {
  try {
    if (!userId || !tenantId) return; // Don't log if missing context

    const log = new Log({
      userId,
      tenantId,
      action,
      metadata
    });
    await log.save();
  } catch (err) {
    console.error('Logging Error:', err.message);
  }
};

module.exports = { createLog };
