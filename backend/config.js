require("dotenv").config();

const toList = (value) =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

if (process.env.NODE_ENV === "production" && (!process.env.JWT_SECRET || process.env.JWT_SECRET === "change-this-in-production")) {
  console.error("FATAL ERROR: JWT_SECRET environment variable is required and must be secure in production.");
  process.exit(1);
}

module.exports = {
  port: Number(process.env.PORT || 3000),
  jwtSecret: process.env.JWT_SECRET || "change-this-in-production",
  corsOrigins: toList(
    process.env.CORS_ORIGINS ||
      (process.env.NODE_ENV === "production" ? "*" : "http://localhost:5173,http://127.0.0.1:5173")
  ),
  adminUsername: process.env.ADMIN_USERNAME || "admin",
  adminPassword: process.env.ADMIN_PASSWORD || "1234",
  defaultBarberPassword: process.env.DEFAULT_BARBER_PASSWORD || "1234",
};
