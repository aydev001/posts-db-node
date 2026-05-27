const multer = require('multer');
const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');
const { MAX_FILE_SIZE_BYTES } = require('./upload');

function notFound(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let details = err.details;

  if (err instanceof multer.MulterError) {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      const mb = (MAX_FILE_SIZE_BYTES / (1024 * 1024)).toFixed(0);
      message = `File too large. Max allowed size is ${mb} MB.`;
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = `Unexpected file field: ${err.field}. Use "image".`;
    } else {
      message = err.message;
    }
  } else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = 'Validation failed';
    details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  } else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  if (statusCode >= 500) {
    console.error('Server error:', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {}),
  });
}

module.exports = { notFound, errorHandler };
