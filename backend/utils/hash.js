const crypto = require('crypto');

/**
 * Generate SHA-256 hash from data
 * @param {string} data - Data to hash
 * @returns {string} - 64 character hex hash
 */
function generateHash(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Generate marks hash
 * Format: studentId|courseId|marks
 */
function generateMarksHash(studentId, courseId, marks) {
  const data = `${studentId}|${courseId}|${marks}`;
  return generateHash(data);
}

/**
 * Generate certificate hash
 */
function generateCertificateHash(certificateData) {
  return generateHash(certificateData);
}

module.exports = {
  generateHash,
  generateMarksHash,
  generateCertificateHash
};
