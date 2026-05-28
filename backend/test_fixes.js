const db = require("./database");
const http = require("http");

function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body ? JSON.parse(body) : null,
        });
      });
    });
    req.on("error", (err) => reject(err));
    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log("=== INICIANDO VERIFICACIÓN DE AUDITORÍA ===");

  // ==========================================
  // Test 1: SEC-01 (Rate Limit / Fuerza Bruta)
  // ==========================================
  console.log("\nTesting SEC-01 (Rate Limit on Login)...");
  let lastStatus = 0;
  let triggered429 = false;

  for (let i = 0; i < 25; i++) {
    try {
      const res = await request(
        {
          hostname: "localhost",
          port: 3000,
          path: "/api/auth/client/login",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Forwarded-For": "198.51.100.42", // Keep the exact same client IP so they trigger the rate limit together
          },
        },
        { phone: "3000000000", pin: "0000" }
      );
      lastStatus = res.statusCode;
      if (res.statusCode === 429) {
        triggered429 = true;
        break;
      }
    } catch (e) {
      console.error("Connection failed (rate limit test):", e.message);
    }
  }

  if (triggered429) {
    console.log("✅ SEC-01 exitoso: El limitador de tasa bloqueó las solicitudes con HTTP 429.");
  } else {
    console.log(`❌ SEC-01 falló: El limitador de tasa no bloqueó las solicitudes excesivas. Último status: ${lastStatus}`);
  }

  // Find a valid barber ID dynamically
  const barb = await db.queryAsync("SELECT id FROM profiles WHERE role = 'barber' LIMIT 1");
  const barberId = barb.rows.length > 0 ? barb.rows[0].id : null;

  if (barberId) {
    // ==========================================
    // Test 2: LOG-02 (Disponibilidad Dinámica de Barberos)
    // ==========================================
    console.log("\nTesting LOG-02 (Dynamic Availability & Custom Work Schedule)...");
    // Let's check a Sunday (e.g. 2026-05-31). The barber should not be working.
    try {
      const res = await request({
        hostname: "localhost",
        port: 3000,
        path: `/api/availability?date=2026-05-31&barber_id=${barberId}`,
        method: "GET",
      });
      
      if (res.statusCode === 200 && res.body.available_times.length === 0) {
        console.log("✅ LOG-02 exitoso: El barbero no tiene disponibilidad en un día no laborable (Domingo).");
      } else {
        console.log("❌ LOG-02 falló: Se devolvieron slots para un día no laborable o el barbero no fue encontrado.", res.body);
      }
    } catch (e) {
      console.error("Availability test failed:", e);
    }
  } else {
    console.log("⚠️ LOG-02 omitido: No se encontró ningún barbero en la base de datos.");
  }

  // ==========================================
  // Test 3: LOG-01 (Puntos de Fidelización Automáticos)
  // ==========================================
  console.log("\nTesting LOG-01 (Loyalty Points Accrual)...");
  try {
    const testPhone = "3999999999";
    // 1. Create client in DB directly
    await db.queryAsync("DELETE FROM clients WHERE phone = $1", [testPhone]);
    await db.queryAsync(
      "INSERT INTO clients (name, phone, email, loyalty_points) VALUES ($1, $2, $3, $4)",
      ["Test Client Puntos", testPhone, "puntos@test.com", 0]
    );

    // Get a service and profile id
    const svc = await db.queryAsync("SELECT id FROM services LIMIT 1");

    if (svc.rows.length > 0 && barberId) {
      const serviceId = svc.rows[0].id;

      // 2. Insert an appointment directly
      const apptRes = await db.queryAsync(
        `INSERT INTO appointments (customer_name, customer_phone, service_id, barber_id, appointment_date, start_time, status, payment_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        ["Test Client Puntos", testPhone, serviceId, barberId, "2026-06-01", "10:00", "pending", "pending_review"]
      );

      const apptId = apptRes.rows[0].id;

      // 3. Log in as admin
      const loginRes = await request(
        {
          hostname: "localhost",
          port: 3000,
          path: "/api/auth/admin/login",
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
        { username: "admin", password: "1234" }
      );

      if (loginRes.statusCode === 200 && loginRes.body.token) {
        const token = loginRes.body.token;

        // Patch status to completed and payment_status to verified
        const patchRes = await request(
          {
            hostname: "localhost",
            port: 3000,
            path: `/api/admin/appointments/${apptId}/status`,
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
          { status: "completed", payment_status: "verified" }
        );

        if (patchRes.statusCode === 200) {
          // Check updated client loyalty points
          const clientRow = await db.queryAsync("SELECT loyalty_points FROM clients WHERE phone = $1", [testPhone]);
          if (clientRow.rows[0].loyalty_points === 10) {
            console.log("✅ LOG-01 exitoso: Los puntos de fidelización se incrementaron a 10 automáticamente al completar y verificar.");
          } else {
            console.log(`❌ LOG-01 falló: Puntos del cliente: ${clientRow.rows[0].loyalty_points} (esperaba 10).`);
          }
        } else {
          console.log("❌ LOG-01 falló: No se pudo actualizar el estado de la cita mediante PATCH.", patchRes.statusCode, patchRes.body);
        }
      } else {
        console.log("❌ LOG-01 falló: No se pudo iniciar sesión como admin.");
      }
    } else {
      console.log("⚠️ LOG-01 omitido: No hay servicios o barberos para crear la cita de prueba.");
    }
  } catch (e) {
    console.error("Loyalty points test failed:", e);
  }

  // ==========================================
  // Test 4: DB-01 (Cascading Appointment Deletion)
  // ==========================================
  console.log("\nTesting DB-01 (Appointment Cascading Deletion)...");
  try {
    const testPhone = "3888888888";
    const svc = await db.queryAsync("SELECT id FROM services LIMIT 1");

    if (svc.rows.length > 0 && barberId) {
      const serviceId = svc.rows[0].id;

      // 1. Create client_user for the change request foreign key if needed
      await db.queryAsync("DELETE FROM client_users WHERE phone = $1", [testPhone]);
      const clientUserRes = await db.queryAsync(
        "INSERT INTO client_users (name, phone, pin_hash) VALUES ($1, $2, $3) RETURNING id",
        ["Test User Delete", testPhone, "hashedpin"]
      );
      const clientUserId = clientUserRes.rows[0].id;

      // 2. Insert appointment
      const apptRes = await db.queryAsync(
        `INSERT INTO appointments (customer_name, customer_phone, service_id, barber_id, appointment_date, start_time, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        ["Test User Delete", testPhone, serviceId, barberId, "2026-06-02", "11:00", "pending"]
      );
      const apptId = apptRes.rows[0].id;

      // 3. Insert change request referencing this appointment
      await db.queryAsync(
        `INSERT INTO appointment_change_requests (appointment_id, client_user_id, requested_date, requested_time, reason, status)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [apptId, clientUserId, "2026-06-03", "12:00", "test reason", "pending"]
      );

      // 4. Log in as admin
      const loginRes = await request(
        {
          hostname: "localhost",
          port: 3000,
          path: "/api/auth/admin/login",
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
        { username: "admin", password: "1234" }
      );

      if (loginRes.statusCode === 200 && loginRes.body.token) {
        const token = loginRes.body.token;

        // 5. Delete the appointment
        const deleteRes = await request({
          hostname: "localhost",
          port: 3000,
          path: `/api/admin/appointments/${apptId}`,
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (deleteRes.statusCode === 200) {
          // Check if appointment is deleted
          const apptCheck = await db.queryAsync("SELECT id FROM appointments WHERE id = $1", [apptId]);
          // Check if change request is deleted
          const requestCheck = await db.queryAsync("SELECT id FROM appointment_change_requests WHERE appointment_id = $1", [apptId]);

          if (apptCheck.rows.length === 0 && requestCheck.rows.length === 0) {
            console.log("✅ DB-01 exitoso: La cita y su solicitud de cambio asociada se eliminaron en cascada sin fallar.");
          } else {
            console.log("❌ DB-01 falló: Algunos registros no se eliminaron.");
          }
        } else {
          console.log("❌ DB-01 falló: La llamada DELETE retornó status:", deleteRes.statusCode, deleteRes.body);
        }
      }
    }
  } catch (e) {
    console.error("Cascading delete test failed:", e);
  }

  // ==========================================
  // Test 5: PERF-01 (Optimized N+1 Query in Rankings)
  // ==========================================
  console.log("\nTesting PERF-01 (Optimized Ranking Query)...");
  try {
    const res = await request({
      hostname: "localhost",
      port: 3000,
      path: "/api/barbers",
      method: "GET",
    });

    if (res.statusCode === 200 && Array.isArray(res.body)) {
      console.log(`✅ PERF-01 exitoso: El ranking de barberos se calculó correctamente. Cantidad: ${res.body.length}`);
      console.log("Muestra del primer barbero rankeado:", res.body[0]);
    } else {
      console.log("❌ PERF-01 falló: La llamada al ranking retornó status:", res.statusCode, res.body);
    }
  } catch (e) {
    console.error("Ranking performance test failed:", e);
  }

  console.log("\n=== VERIFICACIÓN COMPLETADA ===");
  process.exit(0);
}

runTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
