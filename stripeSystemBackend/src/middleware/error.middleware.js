const errorHandler = (err, req, res, next) => {
  console.error(`[${req.method}] ${req.path} —`, err.message);

  const status = err.status || 500;
  const message = err.message || "Internal server error";

  res.status(status).json({ message });
};

module.exports = { errorHandler };
