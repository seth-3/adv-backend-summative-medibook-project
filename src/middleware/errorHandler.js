const AppError = require('../utils/AppError');

// MySQL error codes we turn into friendly HTTP errors
const MYSQL_ERRORS = {
  ER_DUP_ENTRY: [409, 'A record with this value already exists'],
  ER_ROW_IS_REFERENCED_2: [409, 'Cannot delete: this record still has appointments'],
  ER_CHECK_CONSTRAINT_VIOLATED: [422, 'The data breaks a database rule'],
};

function notFound(req, res, next) {
  next(new AppError(404, `Route ${req.method} ${req.originalUrl} not found`));
}

function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message, details: err.details });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Request body is not valid JSON' });
  }
  if (MYSQL_ERRORS[err.code]) {
    const [status, message] = MYSQL_ERRORS[err.code];
    return res.status(status).json({ error: message });
  }
  console.error(err);
  return res.status(500).json({ error: 'Something went wrong on the server' });
}

module.exports = { notFound, errorHandler };
