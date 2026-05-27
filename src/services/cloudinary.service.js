const cloudinary = require('../config/cloudinary');
const ApiError = require('../utils/ApiError');

const FOLDER = process.env.CLOUDINARY_FOLDER || 'back-lesson';

function uploadBuffer(buffer, { folder = FOLDER } = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          return reject(ApiError.internal(`Cloudinary upload failed: ${error.message}`));
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );
    stream.end(buffer);
  });
}

async function destroy(publicId) {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
  } catch (err) {
    console.warn(`Failed to delete Cloudinary asset ${publicId}:`, err.message);
  }
}

module.exports = { uploadBuffer, destroy };
