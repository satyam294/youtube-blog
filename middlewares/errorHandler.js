function errorHandler(err, req, res, next) {
  // Always log the complete error on the server
  console.error(err.message);
  console.error(err.stack);

  const statusCode = err.statusCode || 500;

  const message = err.isOperational
    ? err.message
    : "Something went wrong. Please try again later.";

  return res.status(statusCode).render("error", {
    message,
    stack: process.env.NODE_ENV === "production"
      ? null
      : err.stack
  });
}

module.exports = errorHandler;