function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  const status = error.statusCode || error.status || 500;
  const response = { error: status >= 500 && process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message || 'Internal server error' };
  if (process.env.NODE_ENV !== 'production' && error.name) response.type = error.name;
  return res.status(status).json(response);
}

module.exports = errorHandler;