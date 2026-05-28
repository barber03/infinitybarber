const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const config = require("./config");

const sanitizeProfile = (profile) => ({
  id: profile.id,
  full_name: profile.full_name,
  username: profile.username,
  role: profile.role,
});

const createToken = (profile) =>
  jwt.sign(
    {
      sub: String(profile.id),
      role: profile.role,
      username: profile.username,
      full_name: profile.full_name,
    },
    config.jwtSecret,
    { expiresIn: "12h" }
  );

const comparePassword = (plainText, passwordHash) => bcrypt.compareSync(plainText, passwordHash || "");
const hashPassword = (plainText) => bcrypt.hashSync(plainText, 10);

const authenticate = (req, res, next) => {
  const authorization = req.headers.authorization || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";

  if (!token) {
    res.status(401).json({ error: "Missing authentication token" });
    return;
  }

  try {
    req.auth = jwt.verify(token, config.jwtSecret);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired session" });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.auth || !roles.includes(req.auth.role)) {
    res.status(403).json({ error: "Insufficient permissions" });
    return;
  }

  next();
};

// ── Autenticación de Clientes (panel de usuario) ─────────────────────────────
const hashPin = (pin) => bcrypt.hashSync(String(pin), 10);
const comparePin = (pin, pinHash) => bcrypt.compareSync(String(pin), pinHash || "");

const createClientToken = (clientUser) =>
  jwt.sign(
    {
      sub: String(clientUser.id),
      role: "client",
      name: clientUser.name,
      phone: clientUser.phone,
    },
    config.jwtSecret,
    { expiresIn: "24h" }
  );

const authenticateClient = (req, res, next) => {
  const authorization = req.headers.authorization || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";

  if (!token) {
    res.status(401).json({ error: "Missing authentication token" });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    if (decoded.role !== "client") {
      res.status(403).json({ error: "Client access required" });
      return;
    }
    req.client = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired session" });
  }
};
// ── fin autenticación clientes ────────────────────────────────────────────────

module.exports = {
  authenticate,
  authenticateClient,
  comparePassword,
  comparePin,
  createClientToken,
  createToken,
  hashPassword,
  hashPin,
  requireRole,
  sanitizeProfile,
};
