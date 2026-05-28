const fs = require("fs");
const path = require("path");

const source = process.env.DATABASE_PATH
  ? path.resolve(process.env.DATABASE_PATH)
  : path.resolve(__dirname, "..", "database.sqlite");
const backupDir = path.resolve(__dirname, "..", "backups");
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const destination = path.join(backupDir, `database-${timestamp}.sqlite`);

fs.mkdirSync(backupDir, { recursive: true });

if (!fs.existsSync(source)) {
  console.error("Database file not found:", source);
  process.exit(1);
}

fs.copyFileSync(source, destination);
console.log(`Backup created at ${destination}`);
