const { Pool } = require("pg");
const fs = require("fs");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: (process.env.DATABASE_URL && process.env.DATABASE_URL.includes("pooler.supabase.com")) ? { rejectUnauthorized: false } : undefined,
});

function convertQuery(sql) {
  let i = 1;
  return sql.replace(/\?/g, () => `$${i++}`);
}

const queryAsync = (sql, params = []) => {
  return pool.query(convertQuery(sql), params);
};

async function migrate() {
  console.log("=== INICIANDO MIGRACIÓN A SUPABASE (POSTGRES) ===");

  if (!fs.existsSync("./sqlite_data.json")) {
    console.error("Error: sqlite_data.json not found! Please run the dump script first.");
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync("./sqlite_data.json", "utf-8"));

  // 1. Clean existing tables in topological order (reverse dependencies)
  console.log("Clearing existing tables in PostgreSQL...");
  await queryAsync("DELETE FROM appointment_change_requests");
  await queryAsync("DELETE FROM user_notifications");
  await queryAsync("DELETE FROM barber_portfolio");
  await queryAsync("DELETE FROM barber_time_off");
  await queryAsync("DELETE FROM appointments");
  await queryAsync("DELETE FROM client_users");
  await queryAsync("DELETE FROM clients");
  await queryAsync("DELETE FROM gallery");
  await queryAsync("DELETE FROM profiles");
  await queryAsync("DELETE FROM services");
  console.log("Existing tables cleared.");

  // Helper function to insert rows
  const insertRows = async (tableName, columns, rows) => {
    console.log(`Inserting ${rows.length} rows into ${tableName}...`);
    for (const row of rows) {
      const vals = [];
      const placeholders = [];
      columns.forEach((col, idx) => {
        let val = row[col];
        if (col === "specialties" || col === "work_schedule") {
          if (val && typeof val === "object") {
            val = JSON.stringify(val);
          }
        }
        vals.push(val);
        placeholders.push(`$${idx + 1}`);
      });
      const sql = `INSERT INTO ${tableName} (${columns.join(", ")}) VALUES (${placeholders.join(", ")})`;
      await queryAsync(sql, vals);
    }

    // Reset PostgreSQL sequence
    if (rows.length > 0) {
      await queryAsync(
        `SELECT setval(pg_get_serial_sequence('${tableName}', 'id'), coalesce(max(id), 1)) FROM ${tableName}`
      );
      console.log(`Reset sequence for ${tableName}.`);
    }
  };

  // 2. Insert Level 0 tables
  await insertRows(
    "services",
    ["id", "name", "price", "duration_minutes", "created_at", "image_url"],
    data.services
  );

  await insertRows(
    "profiles",
    [
      "id",
      "full_name",
      "username",
      "role",
      "avatar_url",
      "description",
      "password_hash",
      "created_at",
      "specialties",
      "commission_rate",
      "work_schedule",
    ],
    data.profiles
  );

  await insertRows("gallery", ["id", "url", "created_at"], data.gallery);

  await insertRows(
    "clients",
    [
      "id",
      "name",
      "phone",
      "email",
      "age",
      "hair_type",
      "favorite_style",
      "last_visit",
      "notes",
      "avatar_url",
      "loyalty_points",
      "created_at",
    ],
    data.clients
  );

  await insertRows(
    "client_users",
    ["id", "name", "phone", "pin_hash", "created_at"],
    data.client_users
  );

  // 3. Insert Level 1 tables
  await insertRows(
    "appointments",
    [
      "id",
      "customer_name",
      "customer_phone",
      "service_id",
      "barber_id",
      "appointment_date",
      "start_time",
      "status",
      "payment_method",
      "payment_reference",
      "payment_status",
      "notes",
      "ai_recommendation",
      "created_at",
      "payment_screenshot",
    ],
    data.appointments
  );

  await insertRows(
    "barber_time_off",
    ["id", "barber_id", "off_date", "reason", "created_at"],
    data.barber_time_off
  );

  await insertRows(
    "barber_portfolio",
    ["id", "barber_id", "url", "caption", "created_at"],
    data.barber_portfolio
  );

  await insertRows(
    "user_notifications",
    ["id", "client_user_id", "type", "message", "is_read", "created_at"],
    data.user_notifications
  );

  // 4. Insert Level 2 tables
  await insertRows(
    "appointment_change_requests",
    [
      "id",
      "appointment_id",
      "client_user_id",
      "requested_date",
      "requested_time",
      "reason",
      "status",
      "admin_notes",
      "created_at",
    ],
    data.appointment_change_requests
  );

  console.log("=== MIGRACIÓN COMPLETADA CON ÉXITO ===");
  await pool.end();
  process.exit(0);
}

migrate().catch(async (err) => {
  console.error("Migration failed:", err);
  await pool.end();
  process.exit(1);
});
