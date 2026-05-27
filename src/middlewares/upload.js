const multer = require('multer');
const ApiError = require('../utils/ApiError');

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const storage = multer.memoryStorage();

function fileFilter(_req, file, cb) {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return cb(
      ApiError.badRequest(
        `Unsupported image type: ${file.mimetype}. Allowed: ${[...ALLOWED_MIME_TYPES].join(', ')}`
      ),
      false
    );
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 1,
  },
});

module.exports = upload;
module.exports.MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_BYTES;
