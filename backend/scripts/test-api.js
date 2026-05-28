const BASE = process.env.API_BASE || "http://localhost:3000";

const results = [];

const record = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  const mark = ok ? "OK" : "FAIL";
  console.log(`[${mark}] ${name}${detail ? ` — ${detail}` : ""}`);
};

async function request(path, options = {}) {
  const response = await fetch(`${BASE}${path}`, options);
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { response, body };
}

async function main() {
  console.log(`Testing API at ${BASE}\n`);

  try {
    const health = await request("/api/health");
    record("GET /api/health", health.response.ok, String(health.body?.status || health.response.status));
  } catch (error) {
    record("GET /api/health", false, error.message);
    console.log("\nBackend no responde. Ejecuta: npm start");
    process.exit(1);
  }

  const barbers = await request("/api/barbers");
  record("GET /api/barbers", barbers.response.ok, `count=${Array.isArray(barbers.body) ? barbers.body.length : 0}`);

  const services = await request("/api/services");
  record("GET /api/services", services.response.ok, `count=${Array.isArray(services.body) ? services.body.length : 0}`);

  const gallery = await request("/api/gallery");
  record("GET /api/gallery", gallery.response.ok, `count=${Array.isArray(gallery.body) ? gallery.body.length : 0}`);

  const barberLogin = await request("/api/auth/barber/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "juan", password: "1234" }),
  });
  const barberToken = barberLogin.body?.token;
  record("POST /api/auth/barber/login", barberLogin.response.ok && Boolean(barberToken));

  if (barberToken) {
    const auth = { Authorization: `Bearer ${barberToken}` };
    const profile = await request("/api/barber/profile", { headers: auth });
    record("GET /api/barber/profile", profile.response.ok);

    const appointments = await request("/api/barber/appointments", { headers: auth });
    record("GET /api/barber/appointments", appointments.response.ok);

    const ranking = await request("/api/barber/ranking", { headers: auth });
    record("GET /api/barber/ranking", ranking.response.ok);
  }

  const adminLogin = await request("/api/auth/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "1234" }),
  });
  const adminToken = adminLogin.body?.token;
  record("POST /api/auth/admin/login", adminLogin.response.ok && Boolean(adminToken));

  if (adminToken) {
    const auth = { Authorization: `Bearer ${adminToken}` };
    const adminBarbers = await request("/api/admin/barbers", { headers: auth });
    record("GET /api/admin/barbers", adminBarbers.response.ok);

    const adminAppts = await request("/api/admin/appointments", { headers: auth });
    record("GET /api/admin/appointments", adminAppts.response.ok);
  }

  const failed = results.filter((item) => !item.ok);
  console.log(`\n${results.length - failed.length}/${results.length} pruebas pasaron`);
  process.exit(failed.length ? 1 : 0);
}

main();
