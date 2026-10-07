export const errorHandler = (err, req, res, next) => {
  const databaseUnavailable = [
    'MongoServerSelectionError',
    'MongooseServerSelectionError',
    'MongoNetworkError',
    'MongoNotConnectedError'
  ].includes(err.name);

  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal server error. Please try again.';

  if (err.code === 'DUPLICATE_EMAIL' || err.code === 11000 && err.keyPattern?.email) {
    statusCode = 409;
    message = 'Email already registered. Sign in or use another email address.';
  } else if (err.name === 'ValidationError' || err.name === 'CastError') {
    statusCode = 400;
    message = err.message;
  } else if (databaseUnavailable || /buffering timed out|not connected to mongodb/i.test(err.message || '')) {
    statusCode = 503;
    message = 'Database connection failed. Please try again in a moment.';
  } else if (statusCode >= 500) {
    statusCode = 500;
    message = 'Internal server error. Please try again.';
  }

  console.error('[api] Request failed', {
    method: req.method,
    path: req.originalUrl,
    statusCode,
    errorName: err.name,
    errorCode: err.code,
    message: err.message
  });

  res.status(statusCode).json({ message });
};
