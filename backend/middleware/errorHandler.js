class AppError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

// Wrap every async handler of a controller so rejected promises reach errorHandler.
const wrapAll = (handlers) =>
  Object.fromEntries(
    Object.entries(handlers).map(([name, fn]) => [
      name,
      (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next),
    ])
  );

const notFound = (req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      error: 'Duplicate value',
      details: err.errors.map((e) => ({ field: e.path, message: `${e.path} must be unique` })),
    });
  }

  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.errors.map((e) => ({ field: e.path, message: e.message })),
    });
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(409).json({
      error: 'Invalid reference, or the record is still used by related data',
    });
  }

  // Malformed JSON body etc. (errors raised by express itself carry a 4xx status)
  if (err.status && err.status >= 400 && err.status < 500) {
    return res.status(err.status).json({ error: err.message });
  }

  console.error(err);
  return res.status(500).json({ error: 'Internal server error' });
};

module.exports = { AppError, wrapAll, notFound, errorHandler };
