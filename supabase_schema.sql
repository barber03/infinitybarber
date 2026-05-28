-- Supabase / PostgreSQL Schema para Infinity Barber

CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  duration_minutes INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  image_url TEXT
);

CREATE TABLE IF NOT EXISTS profiles (
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
);

CREATE TABLE IF NOT EXISTS gallery (
  id SERIAL PRIMARY KEY,
  url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clients (
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
);

CREATE TABLE IF NOT EXISTS appointments (
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
);

CREATE TABLE IF NOT EXISTS barber_time_off (
  id SERIAL PRIMARY KEY,
  barber_id INTEGER NOT NULL REFERENCES profiles(id),
  off_date TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (barber_id, off_date)
);

CREATE TABLE IF NOT EXISTS barber_portfolio (
  id SERIAL PRIMARY KEY,
  barber_id INTEGER NOT NULL REFERENCES profiles(id),
  url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS client_users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  pin_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS appointment_change_requests (
  id SERIAL PRIMARY KEY,
  appointment_id INTEGER NOT NULL REFERENCES appointments(id),
  client_user_id INTEGER NOT NULL REFERENCES client_users(id),
  requested_date TEXT NOT NULL,
  requested_time TEXT NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_notifications (
  id SERIAL PRIMARY KEY,
  client_user_id INTEGER NOT NULL REFERENCES client_users(id),
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_barber_time_off_barber_date ON barber_time_off (barber_id, off_date);
CREATE INDEX IF NOT EXISTS idx_barber_portfolio_barber ON barber_portfolio (barber_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_client ON user_notifications (client_user_id);
CREATE INDEX IF NOT EXISTS idx_change_requests_appointment ON appointment_change_requests (appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointments_barber_date ON appointments (barber_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles (role);
