const { Pool } = require("pg");
const path = require("path");
const config = require("./config");
const { hashPassword } = require("./auth");

// Configuración de Supabase / Postgres
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: (process.env.DATABASE_URL && process.env.DATABASE_URL.includes("pooler.supabase.com")) ? { rejectUnauthorized: false } : undefined,
});

const safeAlter = async (db, sql) => {
  try {
    await db.queryAsync(sql);
  } catch (error) {
    if (String(error.message || "").toLowerCase().includes("already exists") || String(error.message || "").toLowerCase().includes("duplicate column")) return;
    console.error("Migration error:", error.message);
  }
};

const slugifyUsername = (value, fallback) => {
  const candidate = String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return candidate || fallback;
};

function convertQuery(sql) {
  let i = 1;
  return sql.replace(/\?/g, () => `$${i++}`);
}

const db = {
  pool,
  queryAsync: (sql, params = []) => {
    return pool.query(convertQuery(sql), params);
  },
  run: function(sql, params, cb) {
    if (typeof params === 'function') { cb = params; params = []; }
    let queryToRun = convertQuery(sql);
    const sqlUpper = sql.trim().toUpperCase();
    if (sqlUpper.startsWith('INSERT ') && !sqlUpper.includes('RETURNING')) {
      queryToRun += ' RETURNING id';
    }
    pool.query(queryToRun, params || [])
      .then(res => {
        const context = {
          changes: res.rowCount || 0,
          lastID: (res.rows && res.rows.length > 0 && res.rows[0].id) ? res.rows[0].id : undefined
        };
        if (cb) cb.call(context, null);
      })
      .catch(err => {
        if (cb) cb.call({changes: 0}, err);
      });
  },
  get: function(sql, params, cb) {
    if (typeof params === 'function') { cb = params; params = []; }
    pool.query(convertQuery(sql), params || [])
      .then(res => {
        if (cb) cb(null, res.rows.length > 0 ? res.rows[0] : null);
      })
      .catch(err => {
        if (cb) cb(err, null);
      });
  },
  all: function(sql, params, cb) {
    if (typeof params === 'function') { cb = params; params = []; }
    pool.query(convertQuery(sql), params || [])
      .then(res => {
        if (cb) cb(null, res.rows);
      })
      .catch(err => {
        if (cb) cb(err, null);
      });
  },
  prepare: function(sql) {
    return {
      run: function(...args) {
        let cb;
        if (typeof args[args.length - 1] === 'function') {
          cb = args.pop();
        }
        db.run(sql, args, cb);
      },
      finalize: () => {}
    };
  },
  serialize: function(cb) {
    cb();
  }
};

console.log("Connecting to PostgreSQL...");

const initDB = async () => {
  try {
    await db.queryAsync(`CREATE TABLE IF NOT EXISTS services (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      duration_minutes INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      image_url TEXT
    )`);

    await db.queryAsync(`CREATE TABLE IF NOT EXISTS profiles (
      id SERIAL PRIMARY KEY,
      full_name TEXT NOT NULL,
      username TEXT UNIQUE,
      role TEXT NOT NULL,
      avatar_url TEXT,
      description TEXT,
      barber_password TEXT,
      password_hash TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      specialties TEXT,
      commission_rate REAL DEFAULT 15,
      work_schedule TEXT
    )`);

    await db.queryAsync(`CREATE TABLE IF NOT EXISTS gallery (
      id SERIAL PRIMARY KEY,
      url TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    await db.queryAsync(`CREATE TABLE IF NOT EXISTS clients (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL UNIQUE,
      email TEXT,
      age INTEGER,
      hair_type TEXT,
      favorite_style TEXT,
      last_visit TEXT,
      notes TEXT,
      avatar_url TEXT,
      loyalty_points INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    await db.queryAsync(`CREATE TABLE IF NOT EXISTS appointments (
      id SERIAL PRIMARY KEY,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      service_id INTEGER NOT NULL REFERENCES services(id),
      barber_id INTEGER NOT NULL REFERENCES profiles(id),
      appointment_date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      payment_method TEXT DEFAULT 'nequi',
      payment_reference TEXT,
      payment_status TEXT DEFAULT 'pending_review',
      notes TEXT,
      ai_recommendation TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      payment_screenshot TEXT
    )`);

    await db.queryAsync(`CREATE TABLE IF NOT EXISTS barber_time_off (
      id SERIAL PRIMARY KEY,
      barber_id INTEGER NOT NULL REFERENCES profiles(id),
      off_date TEXT NOT NULL,
      reason TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (barber_id, off_date)
    )`);

    await db.queryAsync(`CREATE TABLE IF NOT EXISTS barber_portfolio (
      id SERIAL PRIMARY KEY,
      barber_id INTEGER NOT NULL REFERENCES profiles(id),
      url TEXT NOT NULL,
      caption TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    await db.queryAsync(`CREATE TABLE IF NOT EXISTS client_users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL UNIQUE,
      pin_hash TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    await db.queryAsync(`CREATE TABLE IF NOT EXISTS appointment_change_requests (
      id SERIAL PRIMARY KEY,
      appointment_id INTEGER NOT NULL REFERENCES appointments(id),
      client_user_id INTEGER NOT NULL REFERENCES client_users(id),
      requested_date TEXT NOT NULL,
      requested_time TEXT NOT NULL,
      reason TEXT,
      status TEXT DEFAULT 'pending',
      admin_notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    await db.queryAsync(`CREATE TABLE IF NOT EXISTS user_notifications (
      id SERIAL PRIMARY KEY,
      client_user_id INTEGER NOT NULL REFERENCES client_users(id),
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    await db.queryAsync("CREATE INDEX IF NOT EXISTS idx_barber_time_off_barber_date ON barber_time_off (barber_id, off_date)");
    await db.queryAsync("CREATE INDEX IF NOT EXISTS idx_barber_portfolio_barber ON barber_portfolio (barber_id)");
    await db.queryAsync("CREATE INDEX IF NOT EXISTS idx_user_notifications_client ON user_notifications (client_user_id)");
    await db.queryAsync("CREATE INDEX IF NOT EXISTS idx_change_requests_appointment ON appointment_change_requests (appointment_id)");
    await db.queryAsync("CREATE INDEX IF NOT EXISTS idx_appointments_barber_date ON appointments (barber_id, appointment_date)");
    await db.queryAsync("CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles (role)");

    const defaultScheduleJson = JSON.stringify({
      days: ["mon", "tue", "wed", "thu", "fri", "sat"],
      slots: ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00", "18:00"],
    });

    await db.queryAsync("UPDATE profiles SET commission_rate = 15 WHERE role = 'barber' AND commission_rate IS NULL");
    await db.queryAsync("UPDATE profiles SET work_schedule = $1 WHERE role = 'barber' AND work_schedule IS NULL", [defaultScheduleJson]);
    await db.queryAsync("UPDATE services SET price = 18.0 WHERE name LIKE 'IA: %'");

    const servicesCount = await db.queryAsync("SELECT COUNT(*) AS count FROM services");
    if (Number(servicesCount.rows[0].count) === 0) {
      await db.queryAsync("INSERT INTO services (name, price, duration_minutes) VALUES ($1, $2, $3)", ["Corte Clasico", 15.0, 30]);
      await db.queryAsync("INSERT INTO services (name, price, duration_minutes) VALUES ($1, $2, $3)", ["Corte + Barba", 25.0, 45]);
      await db.queryAsync("INSERT INTO services (name, price, duration_minutes) VALUES ($1, $2, $3)", ["Perfilado de Barba", 10.0, 20]);
      await db.queryAsync("INSERT INTO services (name, price, duration_minutes) VALUES ($1, $2, $3)", ["Corte Nino", 12.0, 30]);
      await db.queryAsync("INSERT INTO services (name, price, duration_minutes) VALUES ($1, $2, $3)", ["IA: Recomendacion Personalizada", 18.0, 45]);
      console.log("Default services inserted");
    }

    const adminCount = await db.queryAsync("SELECT COUNT(*) AS count FROM profiles WHERE role = 'admin'");
    if (Number(adminCount.rows[0].count) === 0) {
      await db.queryAsync(
        "INSERT INTO profiles (full_name, username, role, avatar_url, description, password_hash) VALUES ($1, $2, $3, $4, $5, $6)",
        ["Administrador General", config.adminUsername, "admin", "", "Control total de la operacion.", hashPassword(config.adminPassword)]
      );
    }

    const barberCount = await db.queryAsync("SELECT COUNT(*) AS count FROM profiles WHERE role = 'barber'");
    if (Number(barberCount.rows[0].count) === 0) {
      await db.queryAsync(
        "INSERT INTO profiles (full_name, username, role, avatar_url, description, password_hash, specialties, commission_rate, work_schedule) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
        ["Barbero Juan", "juan", "barber", "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=400&q=80", "Especialista en fades y acabados limpios.", hashPassword(config.defaultBarberPassword), JSON.stringify(["Fade", "Degradados", "Acabado premium"]), 15, defaultScheduleJson]
      );
      await db.queryAsync(
        "INSERT INTO profiles (full_name, username, role, avatar_url, description, password_hash, specialties, commission_rate, work_schedule) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
        ["Barbero Carlos", "carlos", "barber", "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80", "Barba, perfilado y estilo clasico.", hashPassword(config.defaultBarberPassword), JSON.stringify(["Barba", "Perfilado", "Estilo clasico"]), 12, defaultScheduleJson]
      );
      console.log("Default barbers inserted");
    }

    const galleryCount = await db.queryAsync("SELECT COUNT(*) AS count FROM gallery");
    if (Number(galleryCount.rows[0].count) === 0) {
      await db.queryAsync("INSERT INTO gallery (url) VALUES ($1)", ["https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600&q=80"]);
      await db.queryAsync("INSERT INTO gallery (url) VALUES ($1)", ["https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=600&q=80"]);
      await db.queryAsync("INSERT INTO gallery (url) VALUES ($1)", ["https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=600&q=80"]);
      await db.queryAsync("INSERT INTO gallery (url) VALUES ($1)", ["https://images.unsplash.com/photo-1633337474586-4171ea7fb221?w=600&q=80"]);
      console.log("Default gallery images inserted");
    }

    const profiles = await db.queryAsync("SELECT id, full_name, role, username, barber_password, password_hash FROM profiles");
    for (const profile of profiles.rows) {
      const username = profile.username || (profile.role === "admin" ? config.adminUsername : slugifyUsername(profile.full_name, `barber-${profile.id}`));
      const plainPassword = profile.barber_password || (profile.role === "admin" ? config.adminPassword : config.defaultBarberPassword);
      const passwordHash = profile.password_hash || hashPassword(plainPassword);

      await db.queryAsync("UPDATE profiles SET username = $1, password_hash = $2 WHERE id = $3", [username, passwordHash, profile.id]);
    }

    console.log("Database initialized successfully.");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
};

db.serialize(() => {
  initDB();
});

module.exports = db;
