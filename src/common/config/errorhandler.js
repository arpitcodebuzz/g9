export const errorHandler = (err, req, res, next) => {
  if (err && err.error && err.error.isJoi) {
    return res.status(400).json({
      status: false,
      message: "Validation failed",
      errors: err.error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      })),
    });
  }

  return res.status(500).json({
    status: false,
    message: 'Internal server error..',
  });
};
