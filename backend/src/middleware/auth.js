function requireApiKey(req, res, next) {
  const providedKey = req.headers["x-api-key"];

  if (!providedKey || providedKey !== process.env.API_SECRET_KEY) {
    return res.status(401).json({ error: "Unauthorized — missing or invalid API key" });
  }

  next();
}

module.exports = requireApiKey;