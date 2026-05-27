function errorHandler(err, req, res, next) {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "validation_error", detail: [{ field: "body", message: "invalid JSON" }] });
  }
  console.error(err.stack || err.message);
  res.status(500).json({ error: "internal_server_error", message: "An unexpected error occurred." });
}

module.exports = { errorHandler };
