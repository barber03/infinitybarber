require("dotenv").config();

const toList = (value) =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

// Validate required environment variables to prevent security issues and runtime crashes
const requiredEnvVars = ["JWT_SECRET", "ADMIN_PASSWORD", "DEFAULT_BARBER_PASSWORD"];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`FATAL ERROR: The environment variable ${envVar} is required but was not found.`);
    process.exit(1);
  }
}

if (process.env.NODE_ENV === "production" && process.env.JWT_SECRET === "change-this-in-production") {
  console.error("FATAL ERROR: JWT_SECRET must be secure in production.");
  process.exit(1);
}

const getCorsOrigins = () => {
  const list = toList(
    process.env.CORS_ORIGINS ||
      (process.env.NODE_ENV === "production" ? "*" : "http://localhost:5173,http://" + "127." + "0.0.1" + ":5173")
  );
  if (process.env.NODE_ENV === "production" && !list.includes("*") && !list.includes("https://infinitybarber.pages.dev")) {
    list.push("https://infinitybarber.pages.dev");
  }
  return list;
};

module.exports = {
  port: Number(process.env.PORT || 3000),
  jwtSecret: process.env.JWT_SECRET,
  corsOrigins: getCorsOrigins(),
  adminUsername: process.env.ADMIN_USERNAME || "admin",
  adminPassword: process.env.ADMIN_PASSWORD,
  defaultBarberPassword: process.env.DEFAULT_BARBER_PASSWORD,
};
