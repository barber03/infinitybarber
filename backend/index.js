const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const multer = require("multer");
const db = require("./database");
const config = require("./config");
const {
  DEFAULT_WORK_SCHEDULE,
  parseJsonField,
  normalizeSpecialties,
  normalizeWorkSchedule,
  formatBarberRow,
  computeBarberStats,
  computeBarberRanking,
} = require("./barberHelpers");
const {
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
} = require("./auth");

const app = express();
app.set("trust proxy", 1);

const isProduction = process.env.NODE_ENV === "production";
const isLocalRequest = (req) =>
  ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(req.ip) ||
  ["localhost", "127.0.0.1"].includes(req.hostname);
const { createClient } = require("@supabase/supabase-js");
const supabaseUrl = process.env.SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY || "placeholder";
const supabase = createClient(supabaseUrl, supabaseKey);
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || "infinity-barber-uploads";

const allowedStatuses = ["pending", "confirmed", "completed", "cancelled", "no_show"];
const allowedPaymentStatuses = ["pending_review", "verified", "rejected"];
const availableTimes = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === "development",
  handler: (_req, res) => {
    res.status(429).json({
      error: "Demasiados intentos de inicio de sesion. Espera unos minutos e intenta de nuevo.",
    });
  },
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 400,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => !isProduction || isLocalRequest(req),
  handler: (_req, res) => {
    res.status(429).json({
      error: "Demasiadas solicitudes. Intenta de nuevo en unos minutos.",
    });
  },
});

const multerUploader = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    const allowedExtensions = [".png", ".jpg", ".jpeg", ".webp"];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
      cb(null, true);
      return;
    }
    cb(new Error("Only .png, .jpg, .jpeg, and .webp images are allowed"));
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

const uploadToSupabase = (folder, fallbackName) => {
  return async (req, res, next) => {
    multerUploader.single("image")(req, res, async (err) => {
      if (err) return res.status(400).json({ error: err.message });
      if (!req.file) return next();

      const extension = path.extname(req.file.originalname) || ".jpg";
      const safeBaseName = path.basename(req.file.originalname, extension).toLowerCase().replace(/[^a-z0-9-_]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || fallbackName;
      const filename = `${Date.now()}-${safeBaseName}${extension.toLowerCase()}`;
      const filePath = `${folder}/${filename}`;

      const { data, error } = await supabase.storage
        .from(SUPABASE_BUCKET)
        .upload(filePath, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false
        });

      if (error) {
        console.warn("Supabase upload failed, falling back to local storage:", error.message || error);
        try {
          const localFolder = path.join(frontendPublicPath, folder);
          if (!fs.existsSync(localFolder)) {
            fs.mkdirSync(localFolder, { recursive: true });
          }
          const localPath = path.join(localFolder, filename);
          fs.writeFileSync(localPath, req.file.buffer);
          
          req.file.filename = filename;
          req.file.supabaseUrl = `/${folder}/${filename}`;
          return next();
        } catch (localError) {
          console.error("Local fallback upload error:", localError);
          return res.status(500).json({ error: "Failed to upload image" });
        }
      }

      const { data: publicUrlData } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(filePath);
      
      req.file.filename = filename;
      req.file.supabaseUrl = publicUrlData.publicUrl;
      next();
    });
  };
};

const galleryUpload = { single: () => uploadToSupabase("gallery", "gallery-image") };
const barberUpload = { single: () => uploadToSupabase("barbers", "barber-avatar") };
const barberPortfolioUpload = { single: () => uploadToSupabase("barber-portfolio", "portfolio-cut") };
const paymentUpload = { single: () => uploadToSupabase("payments", "payment-receipt") };
const clientUpload = { single: () => uploadToSupabase("clients", "client-avatar") };
const servicesUpload = { single: () => uploadToSupabase("services", "service-image") };

const normalizeName = (value) => String(value || "").trim().replace(/\s+/g, " ");
const normalizePhone = (value) => String(value || "").replace(/[^\d+]/g, "").slice(0, 20);
const normalizeEmail = (value) => String(value || "").trim().toLowerCase().slice(0, 120);
const normalizeUsername = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9._-]/g, "");
const isValidDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
const isValidTime = (value) => availableTimes.includes(String(value || ""));

const deleteManagedFile = async (url) => {
  if (!url || !url.includes(SUPABASE_BUCKET)) return;
  try {
    const urlParts = url.split(`/${SUPABASE_BUCKET}/`);
    if (urlParts.length === 2) {
      const filePath = urlParts[1];
      await supabase.storage.from(SUPABASE_BUCKET).remove([filePath]);
    }
  } catch (error) {
    console.error("Failed to delete file from Supabase", error);
  }
};


const sendDbError = (res, error) => res.status(500).json({ error: error.message || "Unexpected database error" });

const getTodayLocalDate = () => {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().split("T")[0];
};

const findConflictingAppointment = ({ appointment_date, start_time, barber_id, excludeId }, callback) => {
  const sql = `
    SELECT id
    FROM appointments
    WHERE appointment_date = ?
      AND start_time = ?
      AND barber_id = ?
      AND status != 'cancelled'
      AND (CAST(? AS INTEGER) IS NULL OR id != CAST(? AS INTEGER))
    LIMIT 1
  `;

  db.get(sql, [appointment_date, start_time, barber_id, excludeId ?? null, excludeId ?? null], callback);
};

const publicBarberFields = "id, full_name, avatar_url, description, specialties, commission_rate";
const barberAdminFields = "id, full_name, username, role, avatar_url, description, specialties, commission_rate, work_schedule, created_at";
const barberProfileSelectFields =
  "id, full_name, username, avatar_url, description, specialties, commission_rate, work_schedule, created_at";

const mapPublicBarbers = (rows, callback) => {
  const basePayload = rows.map((row) => {
    const formatted = formatBarberRow(row);
    return {
      id: formatted.id,
      full_name: formatted.full_name,
      avatar_url: formatted.avatar_url,
      description: formatted.description,
      specialties: formatted.specialties,
      rank: null,
    };
  });

  computeBarberRanking(db, (rankingError, ranking) => {
    if (rankingError || !ranking?.length) {
      callback(null, basePayload);
      return;
    }

    const rankById = new Map(ranking.map((item) => [item.id, item.rank]));
    callback(
      null,
      basePayload.map((item) => ({
        ...item,
        rank: rankById.get(item.id) || null,
      }))
    );
  });
};
const appointmentSelect = `
  SELECT
    a.*,
    s.name AS service_name,
    s.duration_minutes,
    s.price AS service_price,
    p.full_name AS barber_name
  FROM appointments a
  LEFT JOIN services s ON s.id = a.service_id
  LEFT JOIN profiles p ON p.id = a.barber_id
`;

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || config.corsOrigins.length === 0 || config.corsOrigins.includes(origin) || config.corsOrigins.includes("*")) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin not allowed"));
    },
    credentials: false,
  })
);
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(express.json({ limit: "1mb" }));
app.use("/api", apiLimiter);
// Local directories serve as static fallbacks from frontend/public for historical data
const frontendPublicPath = path.join(__dirname, "../frontend/public");
app.use("/gallery", express.static(path.join(frontendPublicPath, "gallery")));
app.use("/barbers", express.static(path.join(frontendPublicPath, "barbers")));
app.use("/clients", express.static(path.join(frontendPublicPath, "clients")));
app.use("/barber-portfolio", express.static(path.join(frontendPublicPath, "barber-portfolio")));
app.use("/payments", express.static(path.join(frontendPublicPath, "payments")));

app.post("/api/payments/upload", paymentUpload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Missing payment screenshot" });
  res.status(201).json({ url: req.file.supabaseUrl });
});

app.get("/", (_req, res) => {
  res.send("Infinity Barber API funcionando correctamente 🚀");
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", date: new Date().toISOString() });
});

app.use("/api", require("./routes/faceDetection"));


app.post("/api/chat", async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: "Messages array is required" });

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const AI_MODEL = process.env.AI_MODEL || "gpt-4o";

  if (!GITHUB_TOKEN) return res.status(500).json({ error: "AI configuration missing on server" });

  const queryDb = (query, params = []) => new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => err ? reject(err) : resolve(rows));
  });
  const runDb = (query, params = []) => new Promise((resolve, reject) => {
    db.run(query, params, function(err) { err ? reject(err) : resolve(this) });
  });

  try {
    const servicesRows = await queryDb("SELECT id, name, price FROM services ORDER BY id ASC");
    const barbersRows = await queryDb("SELECT id, full_name FROM profiles WHERE role = 'barber' ORDER BY id ASC");

    const servicesListStr = servicesRows.map(s => `${s.id}: ${s.name} ($${s.price})`).join(", ");
    const barbersListStr = barbersRows.map(b => `${b.id}: ${b.full_name}`).join(", ");

    const tools = [
      {
        type: "function",
        function: {
          name: "get_availability",
          description: "Consulta qué horas (ejm: 09:00, 10:00) ya están reservadas para un barbero en una fecha.",
          parameters: {
            type: "object",
            properties: {
              barber_id: { type: "number", description: `ID del barbero: ${barbersRows.map(b => `${b.id} (${b.full_name})`).join(", ")}` },
              date: { type: "string", description: "Fecha YYYY-MM-DD" }
            },
            required: ["barber_id", "date"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "book_appointment",
          description: "Programa una cita y la guarda en el sistema.",
          parameters: {
            type: "object",
            properties: {
              customer_name: { type: "string" },
              customer_phone: { type: "string" },
              date: { type: "string", description: "YYYY-MM-DD" },
              time: { type: "string", description: "HH:00" },
              service_id: { type: "number", description: `ID del servicio: ${servicesRows.map(s => `${s.id} (${s.name})`).join(", ")}` },
              barber_id: { type: "number", description: `ID del barbero: ${barbersRows.map(b => `${b.id} (${b.full_name})`).join(", ")}` },
              payment_method: { type: "string", description: "'nequi' o 'efectivo'" },
              payment_screenshot: { type: "string", description: "Si es nequi, URL de la imagen del pago." }
            },
            required: ["customer_name", "customer_phone", "date", "time", "service_id", "barber_id", "payment_method"]
          }
        }
      }
    ];

    const sysDate = new Date().toISOString().split('T')[0];
    let currentMessages = [
      {
        role: "system",
        content: `Eres Infinity, la IA de Infinity Barber. Tu función es atender preguntas y agendar citas eficientemente.
Servicios (IDs): ${servicesListStr}.
Barberos (IDs): ${barbersListStr}.
Horarios: Lunes a Sábado, 09:00 a 18:00. Hoy es ${sysDate}.

SI EL USUARIO QUIERE AGENDAR:
1. Pregunta barbero preferido, servicio, fecha y hora. Verifica get_availability.
2. Explica que el pago es por Nequi y envía EXACTAMENTE esto: "Aquí tienes el QR de pago Nequi:\n\n![QR Nequi](/nequi-qr.jpeg)\n\nPor favor, usa el 📎 (clip) en el chat para enviar la captura del pago completado."
3. Espera a que el usuario adjunte la imagen. Te llegará la URL.
4. Pide NOMBRE y TELEFONO. Luego ejecuta book_appointment (payment_method='nequi' y pasas la url en payment_screenshot).
5. Confirma la cita amablemente.`
      },
      ...messages,
    ];
    let response;
    let keepCalling = true;

    while (keepCalling) {
      response = await fetch("https://models.inference.ai.azure.com/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${GITHUB_TOKEN}` },
        body: JSON.stringify({
          messages: currentMessages,
          tools: tools,
          model: AI_MODEL,
          temperature: 0.7,
        }),
      });

      const data = await response.json();
      if (!response.ok) return res.status(response.status).json({ error: data.error?.message || "AI Error" });

      const choice = data.choices[0].message;
      currentMessages.push(choice);

      if (choice.tool_calls) {
        for (const toolCall of choice.tool_calls) {
          const args = JSON.parse(toolCall.function.arguments);
          let resultStr = "";

          if (toolCall.function.name === "get_availability") {
            const rows = await queryDb("SELECT start_time FROM appointments WHERE appointment_date = ? AND barber_id = ? AND status != 'cancelled'", [args.date, args.barber_id]);
            const occupied = rows.map(r => r.start_time);
            resultStr = JSON.stringify({ occupied_times: occupied });
          } else if (toolCall.function.name === "book_appointment") {
            const p_method = args.payment_method || 'nequi';
            const p_screen = args.payment_screenshot || '';
            const conflict = await queryDb("SELECT id FROM appointments WHERE appointment_date = ? AND start_time = ? AND barber_id = ? AND status != 'cancelled'", [args.date, args.time, args.barber_id]);
            if (conflict.length > 0) {
              resultStr = JSON.stringify({ error: "El horario ya está ocupado. Ofrece otra hora." });
            } else if (p_method === 'nequi' && !p_screen) {
              resultStr = JSON.stringify({ error: "No enviaste el payment_screenshot. Pídeselo al usuario." });
            } else {
              await runDb("INSERT INTO appointments (customer_name, customer_phone, service_id, barber_id, appointment_date, start_time, status, payment_method, payment_reference, payment_screenshot, payment_status) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, 'PAGO_IA', ?, 'pending_review')", [args.customer_name, args.customer_phone, args.service_id, args.barber_id, args.date, args.time, p_method, p_screen]);
              resultStr = JSON.stringify({ success: true, message: "La cita se creó correctamente" });
            }
          }

          currentMessages.push({ role: "tool", tool_call_id: toolCall.id, name: toolCall.function.name, content: resultStr });
        }
      } else {
        keepCalling = false;
        res.json({ message: choice.content });
      }
    }
  } catch (error) {
    console.error("AI Fetch Error:", error);
    res.status(500).json({ error: "Error de servidor al procesar la IA" });
  }
});

app.post("/api/auth/admin/login", authLimiter, (req, res) => {
  const username = normalizeUsername(req.body?.username);
  const password = String(req.body?.password || "");

  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }

  db.get(
    "SELECT id, full_name, username, role, password_hash FROM profiles WHERE role = 'admin' AND username = ?",
    [username],
    (error, profile) => {
      if (error) return sendDbError(res, error);
      if (!profile || !comparePassword(password, profile.password_hash)) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      res.json({
        token: createToken(profile),
        user: sanitizeProfile(profile),
      });
    }
  );
});

app.post("/api/auth/barber/login", authLimiter, (req, res) => {
  const username = normalizeUsername(req.body?.username);
  const password = String(req.body?.password || "");

  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }

  db.get(
    "SELECT id, full_name, username, role, password_hash FROM profiles WHERE role = 'barber' AND username = ?",
    [username],
    (error, profile) => {
      if (error) return sendDbError(res, error);
      if (!profile || !comparePassword(password, profile.password_hash)) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      res.json({
        token: createToken(profile),
        user: sanitizeProfile(profile),
      });
    }
  );
});

app.get("/api/auth/me", authenticate, (req, res) => {
  db.get(
    "SELECT id, full_name, username, role FROM profiles WHERE id = ?",
    [req.auth.sub],
    (error, profile) => {
      if (error) return sendDbError(res, error);
      if (!profile) {
        res.status(404).json({ error: "Profile not found" });
        return;
      }

      res.json({ user: sanitizeProfile(profile) });
    }
  );
});

app.get("/api/services", (_req, res) => {
  db.all("SELECT * FROM services ORDER BY name ASC", [], (error, rows) => {
    if (error) return sendDbError(res, error);
    res.json(rows);
  });
});

app.get("/api/barbers", (_req, res) => {
  db.all(
    `SELECT ${publicBarberFields} FROM profiles WHERE role = 'barber' ORDER BY full_name ASC`,
    [],
    (error, rows) => {
      if (error) return sendDbError(res, error);
      mapPublicBarbers(rows, (mapError, payload) => {
        if (mapError) return sendDbError(res, mapError);
        res.json(payload);
      });
    }
  );
});

app.get("/api/gallery", (_req, res) => {
  db.all("SELECT id, url, created_at FROM gallery ORDER BY created_at DESC, id DESC", [], (error, rows) => {
    if (error) return sendDbError(res, error);
    res.json(rows);
  });
});

app.get("/api/availability", (req, res) => {
  const appointmentDate = String(req.query.date || "");
  const barberId = Number(req.query.barber_id || 0);

  if (!isValidDate(appointmentDate) || !barberId) {
    res.status(400).json({ error: "Date and barber are required" });
    return;
  }

  db.get("SELECT work_schedule FROM profiles WHERE id = ? AND role = 'barber'", [barberId], (profileErr, profile) => {
    if (profileErr) return sendDbError(res, profileErr);
    if (!profile) {
      res.status(404).json({ error: "Barber not found" });
      return;
    }

    const schedule = normalizeWorkSchedule(parseJsonField(profile.work_schedule, DEFAULT_WORK_SCHEDULE));

    const dateObj = new Date(appointmentDate + "T00:00:00");
    const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" }).toLowerCase();

    if (!schedule.days.includes(dayName)) {
      res.json({ booked_times: [], available_times: [] });
      return;
    }

    db.get(
      "SELECT id FROM barber_time_off WHERE barber_id = ? AND off_date = ?",
      [barberId, appointmentDate],
      (timeOffErr, timeOff) => {
        if (timeOffErr) return sendDbError(res, timeOffErr);
        if (timeOff) {
          res.json({ booked_times: [], available_times: [] });
          return;
        }

        db.all(
          `SELECT start_time
           FROM appointments
           WHERE appointment_date = ?
             AND barber_id = ?
             AND status != 'cancelled'`,
          [appointmentDate, barberId],
          (error, rows) => {
            if (error) return sendDbError(res, error);
            res.json({
              booked_times: rows.map((row) => row.start_time),
              available_times: schedule.slots,
            });
          }
        );
      }
    );
  });
});

app.post("/api/appointments", (req, res) => {
  const customerName = normalizeName(req.body?.customer_name);
  const customerPhone = normalizePhone(req.body?.customer_phone);
  const appointmentDate = String(req.body?.appointment_date || "");
  const startTime = String(req.body?.start_time || "");
  const paymentMethod = String(req.body?.payment_method || "nequi").trim().toLowerCase();
  const paymentReference = normalizeName(req.body?.payment_reference);
  const paymentScreenshot = String(req.body?.payment_screenshot || "");
  const serviceId = Number(req.body?.service_id || 0);
  const barberId = Number(req.body?.barber_id || 0);
  const aiRecommendation = req.body?.ai_recommendation ? String(req.body.ai_recommendation) : null;

  if (!customerName || customerName.length < 3) {
    res.status(400).json({ error: "Customer name is required" });
    return;
  }

  if (!customerPhone || customerPhone.replace(/\D/g, "").length < 7) {
    res.status(400).json({ error: "A valid phone number is required" });
    return;
  }

  if (!serviceId || !barberId || !isValidDate(appointmentDate) || !isValidTime(startTime)) {
    res.status(400).json({ error: "Invalid appointment data" });
    return;
  }

  if (paymentMethod === "nequi" && !paymentScreenshot) {
    res.status(400).json({ error: "Para pagos por Nequi es obligatorio subir la captura de pantalla." });
    return;
  }

  if (appointmentDate < getTodayLocalDate()) {
    res.status(400).json({ error: "The selected date is no longer available" });
    return;
  }

  db.get("SELECT id FROM services WHERE id = ?", [serviceId], (serviceError, service) => {
    if (serviceError) return sendDbError(res, serviceError);
    if (!service) {
      res.status(400).json({ error: "Service not found" });
      return;
    }

    db.get("SELECT id FROM profiles WHERE id = ? AND role = 'barber'", [barberId], (barberError, barber) => {
      if (barberError) return sendDbError(res, barberError);
      if (!barber) {
        res.status(400).json({ error: "Barber not found" });
        return;
      }

      findConflictingAppointment(
        {
          appointment_date: appointmentDate,
          start_time: startTime,
          barber_id: barberId,
        },
        (conflictError, conflict) => {
          if (conflictError) return sendDbError(res, conflictError);
          if (conflict) {
            res.status(409).json({ error: "Selected time is already booked for this barber" });
            return;
          }

          db.run(
            `INSERT INTO appointments (
              customer_name,
              customer_phone,
              service_id,
              barber_id,
              appointment_date,
              start_time,
              status,
              payment_method,
              payment_reference,
              payment_screenshot,
              payment_status,
              ai_recommendation
            ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, 'pending_review', ?)`,
            [
              customerName,
              customerPhone,
              serviceId,
              barberId,
              appointmentDate,
              startTime,
              paymentMethod,
              paymentMethod === 'nequi' ? paymentReference : null,
              paymentMethod === 'nequi' ? paymentScreenshot : null,
              aiRecommendation
            ],
            function insertAppointment(insertError) {
              if (insertError) return sendDbError(res, insertError);
              res.status(201).json({
                id: this.lastID,
                message: "Appointment created successfully and pending payment review",
              });
            }
          );
        }
      );
    });
  });
});

app.get("/api/admin/appointments", authenticate, requireRole("admin"), (_req, res) => {
  db.all(
    `${appointmentSelect}
     ORDER BY a.appointment_date DESC, a.start_time DESC`,
    [],
    (error, rows) => {
      if (error) return sendDbError(res, error);
      res.json(rows);
    }
  );
});

app.get("/api/barber/appointments", authenticate, requireRole("barber"), (req, res) => {
  db.all(
    `${appointmentSelect}
     WHERE a.barber_id = ?
     ORDER BY a.appointment_date ASC, a.start_time ASC`,
    [req.auth.sub],
    (error, rows) => {
      if (error) return sendDbError(res, error);
      res.json(rows);
    }
  );
});

const loadBarberProfileBundle = (barberId, callback) => {
  db.get(
    `SELECT ${barberProfileSelectFields} FROM profiles WHERE id = ? AND role = 'barber'`,
    [barberId],
    (profileError, profileRow) => {
      if (profileError) return callback(profileError);
      if (!profileRow) return callback(null, null);

      db.all(
        "SELECT id, off_date, reason, created_at FROM barber_time_off WHERE barber_id = ? ORDER BY off_date ASC",
        [barberId],
        (timeOffError, timeOffRows) => {
          if (timeOffError) return callback(timeOffError);

          db.all(
            "SELECT id, url, caption, created_at FROM barber_portfolio WHERE barber_id = ? ORDER BY created_at DESC",
            [barberId],
            (portfolioError, portfolioRows) => {
              if (portfolioError) return callback(portfolioError);

              computeBarberStats(db, barberId, (statsError, stats) => {
                if (statsError) return callback(statsError);

                callback(null, {
                  profile: formatBarberRow(profileRow),
                  time_off: timeOffRows,
                  portfolio: portfolioRows,
                  stats,
                });
              });
            }
          );
        }
      );
    }
  );
};

app.get("/api/barber/profile", authenticate, requireRole("barber"), (req, res) => {
  loadBarberProfileBundle(req.auth.sub, (error, payload) => {
    if (error) return sendDbError(res, error);
    if (!payload) {
      res.status(404).json({ error: "Barber not found" });
      return;
    }
    res.json(payload);
  });
});

app.patch("/api/barber/profile", authenticate, requireRole("barber"), (req, res) => {
  const description = normalizeName(req.body?.description);
  const specialties = JSON.stringify(normalizeSpecialties(req.body?.specialties));
  const workSchedule = JSON.stringify(normalizeWorkSchedule(req.body?.work_schedule));

  db.run(
    "UPDATE profiles SET description = ?, specialties = ?, work_schedule = ? WHERE id = ? AND role = 'barber'",
    [description, specialties, workSchedule, req.auth.sub],
    function updateBarberProfile(error) {
      if (error) return sendDbError(res, error);
      if (this.changes === 0) {
        res.status(404).json({ error: "Barber not found" });
        return;
      }

      loadBarberProfileBundle(req.auth.sub, (loadError, payload) => {
        if (loadError) return sendDbError(res, loadError);
        res.json(payload);
      });
    }
  );
});

app.get("/api/barber/stats", authenticate, requireRole("barber"), (req, res) => {
  computeBarberStats(db, req.auth.sub, (error, stats) => {
    if (error) return sendDbError(res, error);
    res.json(stats);
  });
});

app.get("/api/barber/ranking", authenticate, requireRole("barber"), (_req, res) => {
  computeBarberRanking(db, (error, ranking) => {
    if (error) return sendDbError(res, error);
    res.json(ranking);
  });
});

app.get("/api/admin/barbers/ranking", authenticate, requireRole("admin"), (_req, res) => {
  computeBarberRanking(db, (error, ranking) => {
    if (error) return sendDbError(res, error);
    res.json(ranking);
  });
});

app.post("/api/barber/time-off", authenticate, requireRole("barber"), (req, res) => {
  const offDate = String(req.body?.off_date || "");
  const reason = normalizeName(req.body?.reason);

  if (!isValidDate(offDate)) {
    res.status(400).json({ error: "Fecha invalida" });
    return;
  }

  db.run(
    "INSERT INTO barber_time_off (barber_id, off_date, reason) VALUES (?, ?, ?)",
    [req.auth.sub, offDate, reason],
    function insertTimeOff(error) {
      if (error) {
        if (String(error.message || "").includes("UNIQUE")) {
          res.status(409).json({ error: "Ese dia libre ya existe" });
          return;
        }
        return sendDbError(res, error);
      }

      res.status(201).json({ id: this.lastID, off_date: offDate, reason });
    }
  );
});

app.delete("/api/barber/time-off/:id", authenticate, requireRole("barber"), (req, res) => {
  db.run(
    "DELETE FROM barber_time_off WHERE id = ? AND barber_id = ?",
    [req.params.id, req.auth.sub],
    function deleteTimeOff(error) {
      if (error) return sendDbError(res, error);
      if (this.changes === 0) {
        res.status(404).json({ error: "Dia libre no encontrado" });
        return;
      }
      res.json({ message: "Deleted" });
    }
  );
});

app.get("/api/barber/portfolio", authenticate, requireRole("barber"), (req, res) => {
  db.all(
    "SELECT id, url, caption, created_at FROM barber_portfolio WHERE barber_id = ? ORDER BY created_at DESC",
    [req.auth.sub],
    (error, rows) => {
      if (error) return sendDbError(res, error);
      res.json(rows);
    }
  );
});

app.post(
  "/api/barber/portfolio/upload",
  authenticate,
  requireRole("barber"),
  barberPortfolioUpload.single("image"),
  (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: "Falta la imagen" });
      return;
    }

    const caption = normalizeName(req.body?.caption);
    const imageUrl = req.file.supabaseUrl;

    db.run(
      "INSERT INTO barber_portfolio (barber_id, url, caption) VALUES (?, ?, ?)",
      [req.auth.sub, imageUrl, caption],
      function insertPortfolio(error) {
        if (error) {
          return sendDbError(res, error);
        }

        res.status(201).json({ id: this.lastID, url: imageUrl, caption });
      }
    );
  }
);

app.delete("/api/barber/portfolio/:id", authenticate, requireRole("barber"), (req, res) => {
  db.get(
    "SELECT url FROM barber_portfolio WHERE id = ? AND barber_id = ?",
    [req.params.id, req.auth.sub],
    (selectError, item) => {
      if (selectError) return sendDbError(res, selectError);
      if (!item) {
        res.status(404).json({ error: "Imagen no encontrada" });
        return;
      }

      db.run("DELETE FROM barber_portfolio WHERE id = ? AND barber_id = ?", [req.params.id, req.auth.sub], function remove(error) {
        if (error) return sendDbError(res, error);
        deleteManagedFile(item.url, "/barber-portfolio/", barberPortfolioUploadDir);
        res.json({ message: "Deleted" });
      });
    }
  );
});

app.patch("/api/barber/appointments/:id/status", authenticate, requireRole("barber"), (req, res) => {
  const status = String(req.body?.status || "");
  const barberAllowedStatuses = ["confirmed", "completed", "cancelled", "no_show"];

  if (!barberAllowedStatuses.includes(status)) {
    res.status(400).json({ error: "Estado no permitido" });
    return;
  }

  db.get("SELECT id, barber_id, status, payment_status, customer_phone FROM appointments WHERE id = ?", [req.params.id], (selectError, appointment) => {
    if (selectError) return sendDbError(res, selectError);
    if (!appointment || Number(appointment.barber_id) !== Number(req.auth.sub)) {
      res.status(404).json({ error: "Cita no encontrada" });
      return;
    }

    db.run("UPDATE appointments SET status = ? WHERE id = ? AND barber_id = ?", [status, req.params.id, req.auth.sub], function update(error) {
      if (error) return sendDbError(res, error);

      const wasCompletedAndVerified = appointment.status === "completed" && appointment.payment_status === "verified";
      const isCompletedAndVerified = status === "completed" && appointment.payment_status === "verified";

      if (isCompletedAndVerified && !wasCompletedAndVerified) {
        db.run(
          "UPDATE clients SET loyalty_points = loyalty_points + 10 WHERE phone = ?",
          [appointment.customer_phone],
          (pointsErr) => {
            if (pointsErr) {
              console.error("Failed to update loyalty points for client:", pointsErr);
            }
          }
        );
      }

      res.json({ message: "Updated", status });
    });
  });
});

app.get("/api/admin/barbers", authenticate, requireRole("admin"), (_req, res) => {
  db.all(
    `SELECT ${barberAdminFields}
     FROM profiles
     WHERE role = 'barber'
     ORDER BY full_name ASC`,
    [],
    (error, rows) => {
      if (error) return sendDbError(res, error);
      res.json(rows.map((row) => formatBarberRow(row)));
    }
  );
});

app.post("/api/admin/barbers/upload", authenticate, requireRole("admin"), barberUpload.single("image"), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "Missing image file" });
    return;
  }

  res.status(201).json({ url: req.file.supabaseUrl });
});

app.get("/api/admin/clients", authenticate, requireRole("admin"), (_req, res) => {
  db.all(
    `SELECT id, name, phone, email, age, hair_type, favorite_style, last_visit, notes, avatar_url, loyalty_points, created_at
     FROM clients
     ORDER BY name ASC`,
    [],
    (error, rows) => {
      if (error) return sendDbError(res, error);
      res.json(rows);
    }
  );
});

app.post("/api/admin/clients/upload", authenticate, requireRole("admin"), clientUpload.single("image"), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "Missing image file" });
    return;
  }

  res.status(201).json({ url: req.file.supabaseUrl });
});

app.post("/api/admin/clients", authenticate, requireRole("admin"), (req, res) => {
  const name = normalizeName(req.body?.name);
  const phone = normalizePhone(req.body?.phone);
  const email = normalizeEmail(req.body?.email);
  const age = req.body?.age ? Number(req.body.age) : null;
  const hairType = normalizeName(req.body?.hair_type);
  const favoriteStyle = normalizeName(req.body?.favorite_style);
  const lastVisit = String(req.body?.last_visit || "");
  const notes = normalizeName(req.body?.notes);
  const avatarUrl = String(req.body?.avatar_url || "").trim();
  const loyaltyPoints = Number(req.body?.loyalty_points || 0);

  if (!name || !phone || (age !== null && (!Number.isInteger(age) || age < 0 || age > 120)) || !Number.isInteger(loyaltyPoints) || loyaltyPoints < 0) {
    if (avatarUrl.startsWith("/clients/")) deleteManagedFile(avatarUrl, "/clients/", clientsUploadDir);
    res.status(400).json({ error: "Invalid client payload" });
    return;
  }

  db.run(
    `INSERT INTO clients (name, phone, email, age, hair_type, favorite_style, last_visit, notes, avatar_url, loyalty_points)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, phone, email, age, hairType, favoriteStyle, lastVisit || null, notes, avatarUrl, loyaltyPoints],
    function insertClient(error) {
      if (error) {
        if (avatarUrl.startsWith("/clients/")) deleteManagedFile(avatarUrl, "/clients/", clientsUploadDir);
        if (String(error.message || "").includes("UNIQUE")) {
          res.status(409).json({ error: "Client phone already exists" });
          return;
        }
        return sendDbError(res, error);
      }

      res.status(201).json({ id: this.lastID });
    }
  );
});

app.put("/api/admin/clients/:id", authenticate, requireRole("admin"), (req, res) => {
  const name = normalizeName(req.body?.name);
  const phone = normalizePhone(req.body?.phone);
  const email = normalizeEmail(req.body?.email);
  const age = req.body?.age ? Number(req.body.age) : null;
  const hairType = normalizeName(req.body?.hair_type);
  const favoriteStyle = normalizeName(req.body?.favorite_style);
  const lastVisit = String(req.body?.last_visit || "");
  const notes = normalizeName(req.body?.notes);
  const avatarUrl = String(req.body?.avatar_url || "").trim();
  const loyaltyPoints = Number(req.body?.loyalty_points || 0);

  if (!name || !phone || (age !== null && (!Number.isInteger(age) || age < 0 || age > 120)) || !Number.isInteger(loyaltyPoints) || loyaltyPoints < 0) {
    res.status(400).json({ error: "Invalid client payload" });
    return;
  }

  db.get("SELECT avatar_url FROM clients WHERE id = ?", [req.params.id], (selectError, existingClient) => {
    if (selectError) return sendDbError(res, selectError);
    if (!existingClient) {
      if (avatarUrl.startsWith("/clients/")) deleteManagedFile(avatarUrl, "/clients/", clientsUploadDir);
      res.status(404).json({ error: "Client not found" });
      return;
    }

    db.run(
      `UPDATE clients
       SET name = ?, phone = ?, email = ?, age = ?, hair_type = ?, favorite_style = ?, last_visit = ?, notes = ?, avatar_url = ?, loyalty_points = ?
       WHERE id = ?`,
      [name, phone, email, age, hairType, favoriteStyle, lastVisit || null, notes, avatarUrl, loyaltyPoints, req.params.id],
      function updateClient(error) {
        if (error) {
          if (avatarUrl !== existingClient.avatar_url && avatarUrl.startsWith("/clients/")) {
            deleteManagedFile(avatarUrl, "/clients/", clientsUploadDir);
          }
          if (String(error.message || "").includes("UNIQUE")) {
            res.status(409).json({ error: "Client phone already exists" });
            return;
          }
          return sendDbError(res, error);
        }

        if (avatarUrl !== existingClient.avatar_url) {
          deleteManagedFile(existingClient.avatar_url, "/clients/", clientsUploadDir);
        }

        res.json({ message: "Updated" });
      }
    );
  });
});

app.delete("/api/admin/clients/:id", authenticate, requireRole("admin"), (req, res) => {
  db.get("SELECT avatar_url FROM clients WHERE id = ?", [req.params.id], (selectError, client) => {
    if (selectError) return sendDbError(res, selectError);
    if (!client) {
      res.status(404).json({ error: "Client not found" });
      return;
    }

    db.run("DELETE FROM clients WHERE id = ?", [req.params.id], function deleteClient(error) {
      if (error) return sendDbError(res, error);
      deleteManagedFile(client.avatar_url, "/clients/", clientsUploadDir);
      res.json({ message: "Deleted" });
    });
  });
});

app.post("/api/admin/gallery/upload", authenticate, requireRole("admin"), galleryUpload.single("image"), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "Missing image file" });
    return;
  }

  const imageUrl = req.file.supabaseUrl;
  db.run("INSERT INTO gallery (url) VALUES (?)", [imageUrl], function insertGallery(error) {
    if (error) {
      return sendDbError(res, error);
    }

    res.status(201).json({ id: this.lastID, url: imageUrl });
  });
});

app.post("/api/admin/services/upload", authenticate, requireRole("admin"), servicesUpload.single("image"), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "Missing image file" });
    return;
  }

  const imageUrl = req.file.supabaseUrl;
  res.status(201).json({ url: imageUrl });
});

app.post("/api/admin/services", authenticate, requireRole("admin"), (req, res) => {
  const name = normalizeName(req.body?.name);
  const price = Number(req.body?.price);
  const durationMinutes = Number(req.body?.duration_minutes);
  const imageUrl = req.body?.image_url ? String(req.body.image_url) : null;

  if (!name || !Number.isFinite(price) || price <= 0 || !Number.isInteger(durationMinutes) || durationMinutes <= 0) {
    res.status(400).json({ error: "Invalid service payload" });
    return;
  }

  db.run(
    "INSERT INTO services (name, price, duration_minutes, image_url) VALUES (?, ?, ?, ?)",
    [name, price, durationMinutes, imageUrl],
    function insertService(error) {
      if (error) return sendDbError(res, error);
      res.status(201).json({ id: this.lastID });
    }
  );
});

app.put("/api/admin/services/:id", authenticate, requireRole("admin"), (req, res) => {
  const name = normalizeName(req.body?.name);
  const price = Number(req.body?.price);
  const durationMinutes = Number(req.body?.duration_minutes);
  const imageUrl = req.body?.image_url ? String(req.body.image_url) : null;

  if (!name || !Number.isFinite(price) || price <= 0 || !Number.isInteger(durationMinutes) || durationMinutes <= 0) {
    res.status(400).json({ error: "Invalid service payload" });
    return;
  }

  // Get the old image_url first to delete it if changing
  db.get("SELECT image_url FROM services WHERE id = ?", [req.params.id], (selectError, row) => {
    if (selectError) return sendDbError(res, selectError);
    if (!row) {
      res.status(404).json({ error: "Service not found" });
      return;
    }

    const oldImageUrl = row.image_url;

    db.run(
      "UPDATE services SET name = ?, price = ?, duration_minutes = ?, image_url = ? WHERE id = ?",
      [name, price, durationMinutes, imageUrl, req.params.id],
      function updateService(error) {
        if (error) return sendDbError(res, error);
        if (this.changes === 0) {
          res.status(404).json({ error: "Service not found" });
          return;
        }

        // If the image changed, delete the old file
        if (oldImageUrl && oldImageUrl !== imageUrl) {
          deleteManagedFile(oldImageUrl, "/services/", servicesUploadDir);
        }

        res.json({ message: "Updated" });
      }
    );
  });
});

app.delete("/api/admin/services/:id", authenticate, requireRole("admin"), (req, res) => {
  db.get("SELECT COUNT(*) AS count FROM appointments WHERE service_id = ?", [req.params.id], (referenceError, row) => {
    if (referenceError) return sendDbError(res, referenceError);
    if (row.count > 0) {
      res.status(409).json({ error: "This service already has related appointments" });
      return;
    }

    // Get the image_url first
    db.get("SELECT image_url FROM services WHERE id = ?", [req.params.id], (selectError, serviceRow) => {
      if (selectError) return sendDbError(res, selectError);
      if (!serviceRow) {
        res.status(404).json({ error: "Service not found" });
        return;
      }

      const imageUrl = serviceRow.image_url;

      db.run("DELETE FROM services WHERE id = ?", [req.params.id], function deleteService(error) {
        if (error) return sendDbError(res, error);
        if (this.changes === 0) {
          res.status(404).json({ error: "Service not found" });
          return;
        }

        if (imageUrl) {
          deleteManagedFile(imageUrl, "/services/", servicesUploadDir);
        }

        res.json({ message: "Deleted" });
      });
    });
  });
});

app.post("/api/admin/barbers", authenticate, requireRole("admin"), (req, res) => {
  const fullName = normalizeName(req.body?.full_name);
  const username = normalizeUsername(req.body?.username);
  const description = normalizeName(req.body?.description);
  const password = String(req.body?.password || "");
  const avatarUrl = String(req.body?.avatar_url || "").trim();
  const specialties = JSON.stringify(normalizeSpecialties(req.body?.specialties));
  const commissionRate = Number(req.body?.commission_rate ?? 15);
  const workSchedule = JSON.stringify(normalizeWorkSchedule(req.body?.work_schedule));

  if (!fullName || !username || password.length < 4 || !Number.isFinite(commissionRate) || commissionRate < 0 || commissionRate > 100) {
    if (avatarUrl.startsWith("/barbers/")) deleteManagedFile(avatarUrl, "/barbers/", barberUploadDir);
    res.status(400).json({ error: "Nombre, usuario, contraseña y comisión válidos son requeridos" });
    return;
  }

  db.run(
    `INSERT INTO profiles (full_name, username, role, avatar_url, description, password_hash, specialties, commission_rate, work_schedule)
     VALUES (?, ?, 'barber', ?, ?, ?, ?, ?, ?)`,
    [fullName, username, avatarUrl, description, hashPassword(password), specialties, commissionRate, workSchedule],
    function insertBarber(error) {
      if (error) {
        if (avatarUrl.startsWith("/barbers/")) deleteManagedFile(avatarUrl, "/barbers/", barberUploadDir);
        if (String(error.message || "").includes("UNIQUE")) {
          res.status(409).json({ error: "Username already exists" });
          return;
        }
        return sendDbError(res, error);
      }

      res.status(201).json({ id: this.lastID });
    }
  );
});

app.put("/api/admin/barbers/:id", authenticate, requireRole("admin"), (req, res) => {
  const fullName = normalizeName(req.body?.full_name);
  const username = normalizeUsername(req.body?.username);
  const description = normalizeName(req.body?.description);
  const password = String(req.body?.password || "");
  const avatarUrl = String(req.body?.avatar_url || "").trim();
  const specialties = JSON.stringify(normalizeSpecialties(req.body?.specialties));
  const commissionRate = Number(req.body?.commission_rate ?? 15);
  const workSchedule = JSON.stringify(normalizeWorkSchedule(req.body?.work_schedule));

  if (!fullName || !username || !Number.isFinite(commissionRate) || commissionRate < 0 || commissionRate > 100) {
    res.status(400).json({ error: "Nombre, usuario y comisión válidos son requeridos" });
    return;
  }

  db.get("SELECT avatar_url, password_hash FROM profiles WHERE id = ? AND role = 'barber'", [req.params.id], (selectError, existingBarber) => {
    if (selectError) return sendDbError(res, selectError);
    if (!existingBarber) {
      if (avatarUrl.startsWith("/barbers/")) deleteManagedFile(avatarUrl, "/barbers/", barberUploadDir);
      res.status(404).json({ error: "Barber not found" });
      return;
    }

    db.run(
      `UPDATE profiles
       SET full_name = ?, username = ?, avatar_url = ?, description = ?, password_hash = ?, specialties = ?, commission_rate = ?, work_schedule = ?
       WHERE id = ? AND role = 'barber'`,
      [
        fullName,
        username,
        avatarUrl,
        description,
        password ? hashPassword(password) : existingBarber.password_hash,
        specialties,
        commissionRate,
        workSchedule,
        req.params.id,
      ],
      function updateBarber(error) {
        if (error) {
          if (avatarUrl !== existingBarber.avatar_url && avatarUrl.startsWith("/barbers/")) {
            deleteManagedFile(avatarUrl, "/barbers/", barberUploadDir);
          }

          if (String(error.message || "").includes("UNIQUE")) {
            res.status(409).json({ error: "Username already exists" });
            return;
          }

          return sendDbError(res, error);
        }

        if (avatarUrl !== existingBarber.avatar_url) {
          deleteManagedFile(existingBarber.avatar_url, "/barbers/", barberUploadDir);
        }

        res.json({ message: "Updated" });
      }
    );
  });
});

app.delete("/api/admin/barbers/:id", authenticate, requireRole("admin"), (req, res) => {
  db.get("SELECT avatar_url FROM profiles WHERE id = ? AND role = 'barber'", [req.params.id], (selectError, barber) => {
    if (selectError) return sendDbError(res, selectError);
    if (!barber) {
      res.status(404).json({ error: "Barber not found" });
      return;
    }

    db.get("SELECT COUNT(*) AS count FROM appointments WHERE barber_id = ?", [req.params.id], (countError, row) => {
      if (countError) return sendDbError(res, countError);
      if (row.count > 0) {
        res.status(409).json({ error: "This barber already has related appointments" });
        return;
      }

      db.run("DELETE FROM profiles WHERE id = ? AND role = 'barber'", [req.params.id], function deleteBarber(error) {
        if (error) return sendDbError(res, error);
        deleteManagedFile(barber.avatar_url, "/barbers/", barberUploadDir);
        res.json({ message: "Deleted" });
      });
    });
  });
});

app.delete("/api/admin/gallery/:id", authenticate, requireRole("admin"), (req, res) => {
  db.get("SELECT url FROM gallery WHERE id = ?", [req.params.id], (selectError, image) => {
    if (selectError) return sendDbError(res, selectError);
    if (!image) {
      res.status(404).json({ error: "Image not found" });
      return;
    }

    db.run("DELETE FROM gallery WHERE id = ?", [req.params.id], function deleteImage(error) {
      if (error) return sendDbError(res, error);
      deleteManagedFile(image.url, "/gallery/", galleryUploadDir);
      res.json({ message: "Deleted" });
    });
  });
});

app.put("/api/admin/appointments/:id", authenticate, requireRole("admin"), (req, res) => {
  const customerName = normalizeName(req.body?.customer_name);
  const customerPhone = normalizePhone(req.body?.customer_phone);
  const appointmentDate = String(req.body?.appointment_date || "");
  const startTime = String(req.body?.start_time || "");
  const serviceId = Number(req.body?.service_id || 0);
  const barberId = Number(req.body?.barber_id || 0);
  const status = String(req.body?.status || "pending");
  const paymentStatus = String(req.body?.payment_status || "pending_review");
  const notes = normalizeName(req.body?.notes);
  const paymentMethod = String(req.body?.payment_method || "nequi").trim().toLowerCase();
  const paymentReference = normalizeName(req.body?.payment_reference);
  const paymentScreenshot = String(req.body?.payment_screenshot || "");

  if (
    !customerName ||
    !customerPhone ||
    !isValidDate(appointmentDate) ||
    !isValidTime(startTime) ||
    !serviceId ||
    !barberId ||
    !allowedStatuses.includes(status) ||
    !allowedPaymentStatuses.includes(paymentStatus)
  ) {
    res.status(400).json({ error: "Invalid appointment payload" });
    return;
  }

  db.get("SELECT status, payment_status, customer_phone FROM appointments WHERE id = ?", [req.params.id], (selectErr, appointment) => {
    if (selectErr) return sendDbError(res, selectErr);
    if (!appointment) {
      res.status(404).json({ error: "Appointment not found" });
      return;
    }

    findConflictingAppointment(
      {
        appointment_date: appointmentDate,
        start_time: startTime,
        barber_id: barberId,
        excludeId: req.params.id,
      },
      (conflictError, conflict) => {
        if (conflictError) return sendDbError(res, conflictError);
        if (conflict) {
          res.status(409).json({ error: "Selected time is already booked for this barber" });
          return;
        }

        db.run(
          `UPDATE appointments
           SET customer_name = ?, customer_phone = ?, service_id = ?, barber_id = ?, appointment_date = ?, start_time = ?,
               status = ?, payment_method = ?, payment_reference = ?, payment_screenshot = ?, payment_status = ?, notes = ?
           WHERE id = ?`,
          [
            customerName,
            customerPhone,
            serviceId,
            barberId,
            appointmentDate,
            startTime,
            status,
            paymentMethod,
            paymentReference,
            paymentScreenshot,
            paymentStatus,
            notes,
            req.params.id,
          ],
          function updateAppointment(error) {
            if (error) return sendDbError(res, error);
            if (this.changes === 0) {
              res.status(404).json({ error: "Appointment not found" });
              return;
            }

            const wasCompletedAndVerified = appointment.status === "completed" && appointment.payment_status === "verified";
            const isCompletedAndVerified = status === "completed" && paymentStatus === "verified";

            if (isCompletedAndVerified && !wasCompletedAndVerified) {
              db.run(
                "UPDATE clients SET loyalty_points = loyalty_points + 10 WHERE phone = ?",
                [customerPhone],
                (pointsErr) => {
                  if (pointsErr) {
                    console.error("Failed to update loyalty points for client:", pointsErr);
                  }
                }
              );
            }

            res.json({ message: "Updated" });
          }
        );
      }
    );
  });
});

app.patch("/api/admin/appointments/:id/status", authenticate, requireRole("admin"), (req, res) => {
  const status = String(req.body?.status || "");
  const paymentStatus = String(req.body?.payment_status || "");

  if (status && !allowedStatuses.includes(status)) {
    res.status(400).json({ error: "Invalid appointment status" });
    return;
  }

  if (paymentStatus && !allowedPaymentStatuses.includes(paymentStatus)) {
    res.status(400).json({ error: "Invalid payment status" });
    return;
  }

  if (!status && !paymentStatus) {
    res.status(400).json({ error: "Nothing to update" });
    return;
  }

  const fields = [];
  const values = [];

  if (status) {
    fields.push("status = ?");
    values.push(status);
  }

  if (paymentStatus) {
    fields.push("payment_status = ?");
    values.push(paymentStatus);
  }

  values.push(req.params.id);

  db.get("SELECT status, payment_status, customer_phone FROM appointments WHERE id = ?", [req.params.id], (selectErr, appointment) => {
    if (selectErr) return sendDbError(res, selectErr);
    if (!appointment) {
      res.status(404).json({ error: "Appointment not found" });
      return;
    }

    const targetStatus = status || appointment.status;
    const targetPaymentStatus = paymentStatus || appointment.payment_status;

    db.run(`UPDATE appointments SET ${fields.join(", ")} WHERE id = ?`, values, function updateStatus(error) {
      if (error) return sendDbError(res, error);
      if (this.changes === 0) {
        res.status(404).json({ error: "Appointment not found" });
        return;
      }

      const wasCompletedAndVerified = appointment.status === "completed" && appointment.payment_status === "verified";
      const isCompletedAndVerified = targetStatus === "completed" && targetPaymentStatus === "verified";

      if (isCompletedAndVerified && !wasCompletedAndVerified) {
        db.run(
          "UPDATE clients SET loyalty_points = loyalty_points + 10 WHERE phone = ?",
          [appointment.customer_phone],
          (pointsErr) => {
            if (pointsErr) {
              console.error("Failed to update loyalty points for client:", pointsErr);
            }
          }
        );
      }

      res.json({ message: "Updated" });
    });
  });
});

app.delete("/api/admin/appointments/:id", authenticate, requireRole("admin"), (req, res) => {
  db.run("DELETE FROM appointment_change_requests WHERE appointment_id = ?", [req.params.id], (err) => {
    if (err) return sendDbError(res, err);

    db.run("DELETE FROM appointments WHERE id = ?", [req.params.id], function deleteAppointment(error) {
      if (error) return sendDbError(res, error);
      if (this.changes === 0) {
        res.status(404).json({ error: "Appointment not found" });
        return;
      }
      res.json({ message: "Deleted" });
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// PANEL DE USUARIO – RUTAS DE CLIENTE
// ═══════════════════════════════════════════════════════════════════════════

// Registro de nuevo cliente
app.post("/api/auth/client/register", authLimiter, (req, res) => {
  const name = normalizeName(req.body?.name);
  const phone = normalizePhone(req.body?.phone);
  const pin = String(req.body?.pin || "").trim();

  if (!name || name.length < 2) return res.status(400).json({ error: "Nombre requerido (mínimo 2 caracteres)" });
  if (!phone || phone.replace(/\D/g, "").length < 7) return res.status(400).json({ error: "Teléfono inválido" });
  if (!/^\d{4}$/.test(pin)) return res.status(400).json({ error: "El PIN debe ser exactamente 4 dígitos" });

  db.get("SELECT id FROM client_users WHERE phone = ?", [phone], (err, existing) => {
    if (err) return sendDbError(res, err);
    if (existing) return res.status(409).json({ error: "Ya existe una cuenta con ese teléfono. Inicia sesión." });

    db.run(
      "INSERT INTO client_users (name, phone, pin_hash) VALUES (?, ?, ?)",
      [name, phone, hashPin(pin)],
      function (insertErr) {
        if (insertErr) return sendDbError(res, insertErr);
        const newClient = { id: this.lastID, name, phone };
        res.status(201).json({
          token: createClientToken(newClient),
          user: { id: newClient.id, name, phone },
        });
      }
    );
  });
});

// Login de cliente
app.post("/api/auth/client/login", authLimiter, (req, res) => {
  const phone = normalizePhone(req.body?.phone);
  const pin = String(req.body?.pin || "").trim();

  if (!phone || !pin) return res.status(400).json({ error: "Teléfono y PIN son requeridos" });

  db.get("SELECT * FROM client_users WHERE phone = ?", [phone], (err, client) => {
    if (err) return sendDbError(res, err);
    if (!client || !comparePin(pin, client.pin_hash)) {
      return res.status(401).json({ error: "Teléfono o PIN incorrecto" });
    }
    res.json({
      token: createClientToken(client),
      user: { id: client.id, name: client.name, phone: client.phone },
    });
  });
});

// Obtener perfil de cliente y puntos de fidelidad
app.get("/api/client/profile", authenticateClient, (req, res) => {
  const phone = req.client.phone;
  db.get("SELECT loyalty_points FROM clients WHERE phone = ?", [phone], (err, row) => {
    if (err) return sendDbError(res, err);
    const points = row ? row.loyalty_points : 0;
    res.json({
      id: req.client.sub,
      name: req.client.name,
      phone: req.client.phone,
      loyalty_points: points
    });
  });
});

// Citas del cliente autenticado (busca por teléfono)
app.get("/api/client/appointments", authenticateClient, (req, res) => {
  const phone = req.client.phone;
  db.all(
    `${appointmentSelect} WHERE a.customer_phone = ? ORDER BY a.appointment_date DESC, a.start_time DESC`,
    [phone],
    (err, rows) => {
      if (err) return sendDbError(res, err);
      res.json(rows);
    }
  );
});

// Notificaciones del cliente
app.get("/api/client/notifications", authenticateClient, (req, res) => {
  db.all(
    "SELECT * FROM user_notifications WHERE client_user_id = ? ORDER BY created_at DESC LIMIT 50",
    [req.client.sub],
    (err, rows) => {
      if (err) return sendDbError(res, err);
      res.json(rows);
    }
  );
});

// Marcar todas las notificaciones como leídas
app.patch("/api/client/notifications/read-all", authenticateClient, (req, res) => {
  db.run(
    "UPDATE user_notifications SET is_read = 1 WHERE client_user_id = ?",
    [req.client.sub],
    function (err) {
      if (err) return sendDbError(res, err);
      res.json({ ok: true });
    }
  );
});

// Marcar una notificación como leída
app.patch("/api/client/notifications/:id/read", authenticateClient, (req, res) => {
  db.run(
    "UPDATE user_notifications SET is_read = 1 WHERE id = ? AND client_user_id = ?",
    [req.params.id, req.client.sub],
    function (err) {
      if (err) return sendDbError(res, err);
      res.json({ ok: true });
    }
  );
});

// Crear solicitud de cambio de cita
app.post("/api/client/change-requests", authenticateClient, (req, res) => {
  const appointmentId = Number(req.body?.appointment_id);
  const requestedDate = String(req.body?.requested_date || "");
  const requestedTime = String(req.body?.requested_time || "");
  const reason = normalizeName(req.body?.reason || "");
  const clientId = Number(req.client.sub);

  if (!appointmentId || !isValidDate(requestedDate) || !isValidTime(requestedTime)) {
    return res.status(400).json({ error: "Datos inválidos para la solicitud" });
  }

  // Verificar que la cita pertenezca al cliente
  db.get(
    "SELECT a.id FROM appointments a JOIN client_users cu ON cu.phone = a.customer_phone WHERE a.id = ? AND cu.id = ?",
    [appointmentId, clientId],
    (err, appt) => {
      if (err) return sendDbError(res, err);
      if (!appt) return res.status(403).json({ error: "No tienes acceso a esta cita" });

      db.get(
        "SELECT id FROM appointment_change_requests WHERE appointment_id = ? AND status = 'pending'",
        [appointmentId],
        (err2, existing) => {
          if (err2) return sendDbError(res, err2);
          if (existing) return res.status(409).json({ error: "Ya tienes una solicitud pendiente para esta cita" });

          db.run(
            "INSERT INTO appointment_change_requests (appointment_id, client_user_id, requested_date, requested_time, reason) VALUES (?, ?, ?, ?, ?)",
            [appointmentId, clientId, requestedDate, requestedTime, reason || null],
            function (insertErr) {
              if (insertErr) return sendDbError(res, insertErr);
              res.status(201).json({ id: this.lastID, message: "Solicitud enviada. El admin la revisará pronto." });
            }
          );
        }
      );
    }
  );
});

// Ver solicitudes propias del cliente
app.get("/api/client/change-requests", authenticateClient, (req, res) => {
  db.all(
    `SELECT cr.*, a.appointment_date AS original_date, a.start_time AS original_time,
            s.name AS service_name, p.full_name AS barber_name
     FROM appointment_change_requests cr
     JOIN appointments a ON a.id = cr.appointment_id
     LEFT JOIN services s ON s.id = a.service_id
     LEFT JOIN profiles p ON p.id = a.barber_id
     WHERE cr.client_user_id = ?
     ORDER BY cr.created_at DESC`,
    [req.client.sub],
    (err, rows) => {
      if (err) return sendDbError(res, err);
      res.json(rows);
    }
  );
});

// ── Admin: ver todas las solicitudes de cambio ───────────────────────────────
app.get("/api/admin/change-requests", authenticate, requireRole("admin"), (req, res) => {
  db.all(
    `SELECT cr.*, cu.name AS client_name, cu.phone AS client_phone,
            a.appointment_date AS original_date, a.start_time AS original_time,
            s.name AS service_name, p.full_name AS barber_name
     FROM appointment_change_requests cr
     JOIN client_users cu ON cu.id = cr.client_user_id
     JOIN appointments a ON a.id = cr.appointment_id
     LEFT JOIN services s ON s.id = a.service_id
     LEFT JOIN profiles p ON p.id = a.barber_id
     ORDER BY cr.created_at DESC`,
    [],
    (err, rows) => {
      if (err) return sendDbError(res, err);
      res.json(rows);
    }
  );
});

// Admin: aprobar o rechazar solicitud de cambio
app.patch("/api/admin/change-requests/:id", authenticate, requireRole("admin"), (req, res) => {
  const requestId = Number(req.params.id);
  const action = String(req.body?.action || ""); // 'approve' | 'reject'
  const adminNotes = normalizeName(req.body?.admin_notes || "");

  if (!requestId || !["approve", "reject"].includes(action)) {
    return res.status(400).json({ error: "Acción inválida. Use 'approve' o 'reject'" });
  }

  db.get(
    `SELECT cr.*, a.customer_phone FROM appointment_change_requests cr
     JOIN appointments a ON a.id = cr.appointment_id
     WHERE cr.id = ? AND cr.status = 'pending'`,
    [requestId],
    (err, reqRow) => {
      if (err) return sendDbError(res, err);
      if (!reqRow) return res.status(404).json({ error: "Solicitud no encontrada o ya procesada" });

      const newStatus = action === "approve" ? "approved" : "rejected";

      const finalize = () => {
        db.run(
          "UPDATE appointment_change_requests SET status = ?, admin_notes = ? WHERE id = ?",
          [newStatus, adminNotes || null, requestId],
          (updateErr) => {
            if (updateErr) return sendDbError(res, updateErr);

            const notifMsg = action === "approve"
              ? `✅ Tu solicitud de cambio fue aprobada. Tu cita fue reprogramada al ${reqRow.requested_date} a las ${reqRow.requested_time}.${adminNotes ? " Nota: " + adminNotes : ""}`
              : `❌ Tu solicitud de cambio fue rechazada.${adminNotes ? " Motivo: " + adminNotes : ""}`;

            db.run(
              "INSERT INTO user_notifications (client_user_id, type, message) VALUES (?, ?, ?)",
              [reqRow.client_user_id, action === "approve" ? "change_approved" : "change_rejected", notifMsg],
              () => {}
            );

            res.json({ ok: true, status: newStatus });
          }
        );
      };

      if (action === "approve") {
        db.run(
          "UPDATE appointments SET appointment_date = ?, start_time = ? WHERE id = ?",
          [reqRow.requested_date, reqRow.requested_time, reqRow.appointment_id],
          (apptErr) => {
            if (apptErr) return sendDbError(res, apptErr);
            finalize();
          }
        );
      } else {
        finalize();
      }
    }
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// FIN RUTAS DE CLIENTE
// ═══════════════════════════════════════════════════════════════════════════

app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError) {
    res.status(400).json({ error: error.message });
    return;
  }

  if (error?.message === "Origin not allowed") {
    res.status(403).json({ error: error.message });
    return;
  }

  res.status(500).json({ error: error?.message || "Unexpected server error" });
});

app.listen(config.port, () => {
  console.log(`Backend server running on http://localhost:${config.port}`);
});

module.exports = app;
