const DEFAULT_WORK_SCHEDULE = {
  days: ["mon", "tue", "wed", "thu", "fri", "sat"],
  slots: ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00", "18:00"],
};

const parseJsonField = (value, fallback) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const normalizeSpecialties = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .slice(0, 12);
};

const normalizeWorkSchedule = (value) => {
  const schedule = value && typeof value === "object" ? value : DEFAULT_WORK_SCHEDULE;
  const days = Array.isArray(schedule.days)
    ? schedule.days.map((day) => String(day).trim().toLowerCase()).filter(Boolean)
    : DEFAULT_WORK_SCHEDULE.days;
  const slots = Array.isArray(schedule.slots)
    ? schedule.slots.filter((slot) => DEFAULT_WORK_SCHEDULE.slots.includes(String(slot)))
    : DEFAULT_WORK_SCHEDULE.slots;

  return {
    days: days.length ? days : DEFAULT_WORK_SCHEDULE.days,
    slots: slots.length ? slots : DEFAULT_WORK_SCHEDULE.slots,
  };
};

const formatBarberRow = (row) => {
  if (!row) return null;

  const commissionRate = Number.isFinite(Number(row.commission_rate)) ? Number(row.commission_rate) : 15;

  return {
    id: row.id,
    full_name: row.full_name,
    username: row.username,
    avatar_url: row.avatar_url || "",
    description: row.description || "",
    specialties: normalizeSpecialties(parseJsonField(row.specialties, [])),
    commission_rate: commissionRate,
    work_schedule: normalizeWorkSchedule(parseJsonField(row.work_schedule, DEFAULT_WORK_SCHEDULE)),
    created_at: row.created_at,
  };
};

const computeBarberStats = (db, barberId, callback) => {
  db.get(
    `SELECT commission_rate FROM profiles WHERE id = ? AND role = 'barber'`,
    [barberId],
    (profileError, profile) => {
      if (profileError) return callback(profileError);
      if (!profile) return callback(new Error("Barber not found"));

      const commissionRate = Number.isFinite(Number(profile.commission_rate)) ? Number(profile.commission_rate) : 15;

      db.get(
        `SELECT
          COUNT(*) AS total_appointments,
          SUM(CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END) AS completed_appointments,
          SUM(CASE WHEN a.status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed_appointments,
          SUM(CASE WHEN a.status = 'pending' THEN 1 ELSE 0 END) AS pending_appointments,
          SUM(CASE WHEN a.status = 'cancelled' OR a.status = 'no_show' THEN 1 ELSE 0 END) AS cancelled_appointments,
          COUNT(DISTINCT CASE WHEN a.status IN ('completed', 'confirmed') THEN a.customer_phone END) AS clients_served,
          COALESCE(SUM(CASE WHEN a.status = 'completed' AND a.payment_status = 'verified' THEN COALESCE(s.price, 0) ELSE 0 END), 0) AS verified_revenue,
          COALESCE(SUM(CASE WHEN a.appointment_date = to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD') THEN 1 ELSE 0 END), 0) AS today_appointments,
          COALESCE(SUM(CASE WHEN a.status = 'completed' AND a.payment_status = 'verified' AND a.appointment_date = to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD') THEN COALESCE(s.price, 0) ELSE 0 END), 0) AS revenue_today,
          COALESCE(SUM(CASE WHEN a.status = 'completed' AND a.payment_status = 'verified' AND to_char(a.appointment_date::date, 'IW') = to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'IW') AND to_char(a.appointment_date::date, 'YYYY') = to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY') THEN COALESCE(s.price, 0) ELSE 0 END), 0) AS revenue_week,
          COALESCE(SUM(CASE WHEN a.status = 'completed' AND a.payment_status = 'verified' AND to_char(a.appointment_date::date, 'MM') = to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'MM') AND to_char(a.appointment_date::date, 'YYYY') = to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY') THEN COALESCE(s.price, 0) ELSE 0 END), 0) AS revenue_month
        FROM appointments a
        LEFT JOIN services s ON s.id = a.service_id
        WHERE a.barber_id = ?`,
        [barberId],
        (statsError, stats) => {
          if (statsError) return callback(statsError);

          const verifiedRevenue = Number(stats.verified_revenue || 0);
          const commissionEarned = Math.round(verifiedRevenue * (commissionRate / 100));

          const revenueToday = Number(stats.revenue_today || 0);
          const revenueWeek = Number(stats.revenue_week || 0);
          const revenueMonth = Number(stats.revenue_month || 0);

          const commissionToday = Math.round(revenueToday * (commissionRate / 100));
          const commissionWeek = Math.round(revenueWeek * (commissionRate / 100));
          const commissionMonth = Math.round(revenueMonth * (commissionRate / 100));

          callback(null, {
            total_appointments: Number(stats.total_appointments || 0),
            completed_appointments: Number(stats.completed_appointments || 0),
            confirmed_appointments: Number(stats.confirmed_appointments || 0),
            pending_appointments: Number(stats.pending_appointments || 0),
            cancelled_appointments: Number(stats.cancelled_appointments || 0),
            clients_served: Number(stats.clients_served || 0),
            verified_revenue: verifiedRevenue,
            commission_rate: commissionRate,
            commission_earned: commissionEarned,
            today_appointments: Number(stats.today_appointments || 0),
            revenue_today: revenueToday,
            revenue_week: revenueWeek,
            revenue_month: revenueMonth,
            commission_today: commissionToday,
            commission_week: commissionWeek,
            commission_month: commissionMonth,
            completion_rate:
              Number(stats.total_appointments || 0) > 0
                ? Math.round((Number(stats.completed_appointments || 0) / Number(stats.total_appointments)) * 100)
                : 0,
          });
        }
      );
    }
  );
};

const computeBarberRanking = (db, callback) => {
  const sql = `
    SELECT
      p.id,
      p.full_name,
      p.avatar_url,
      p.commission_rate,
      COALESCE(COUNT(a.id), 0) AS total_appointments,
      COALESCE(SUM(CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END), 0) AS completed_appointments,
      COALESCE(SUM(CASE WHEN a.status = 'confirmed' THEN 1 ELSE 0 END), 0) AS confirmed_appointments,
      COALESCE(SUM(CASE WHEN a.status = 'pending' THEN 1 ELSE 0 END), 0) AS pending_appointments,
      COALESCE(SUM(CASE WHEN a.status = 'cancelled' OR a.status = 'no_show' THEN 1 ELSE 0 END), 0) AS cancelled_appointments,
      COALESCE(COUNT(DISTINCT CASE WHEN a.status IN ('completed', 'confirmed') THEN a.customer_phone END), 0) AS clients_served,
      COALESCE(SUM(CASE WHEN a.status = 'completed' AND a.payment_status = 'verified' THEN COALESCE(s.price, 0) ELSE 0 END), 0) AS verified_revenue,
      COALESCE(SUM(CASE WHEN a.appointment_date = to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD') THEN 1 ELSE 0 END), 0) AS today_appointments,
      COALESCE(SUM(CASE WHEN a.status = 'completed' AND a.payment_status = 'verified' AND a.appointment_date = to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD') THEN COALESCE(s.price, 0) ELSE 0 END), 0) AS revenue_today,
      COALESCE(SUM(CASE WHEN a.status = 'completed' AND a.payment_status = 'verified' AND to_char(a.appointment_date::date, 'IW') = to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'IW') AND to_char(a.appointment_date::date, 'YYYY') = to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY') THEN COALESCE(s.price, 0) ELSE 0 END), 0) AS revenue_week,
      COALESCE(SUM(CASE WHEN a.status = 'completed' AND a.payment_status = 'verified' AND to_char(a.appointment_date::date, 'MM') = to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'MM') AND to_char(a.appointment_date::date, 'YYYY') = to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY') THEN COALESCE(s.price, 0) ELSE 0 END), 0) AS revenue_month
    FROM profiles p
    LEFT JOIN appointments a ON a.barber_id = p.id
    LEFT JOIN services s ON s.id = a.service_id
    WHERE p.role = 'barber'
    GROUP BY p.id, p.full_name, p.avatar_url, p.commission_rate
  `;

  db.all(sql, [], (error, rows) => {
    if (error) return callback(error);

    const ranking = rows.map((row) => {
      const commissionRate = Number.isFinite(Number(row.commission_rate)) ? Number(row.commission_rate) : 15;
      const verifiedRevenue = Number(row.verified_revenue || 0);
      const commissionEarned = Math.round(verifiedRevenue * (commissionRate / 100));

      const revenueToday = Number(row.revenue_today || 0);
      const revenueWeek = Number(row.revenue_week || 0);
      const revenueMonth = Number(row.revenue_month || 0);

      const commissionToday = Math.round(revenueToday * (commissionRate / 100));
      const commissionWeek = Math.round(revenueWeek * (commissionRate / 100));
      const commissionMonth = Math.round(revenueMonth * (commissionRate / 100));

      const completedAppointments = Number(row.completed_appointments || 0);
      const clientsServed = Number(row.clients_served || 0);
      const totalAppointments = Number(row.total_appointments || 0);

      const score =
        completedAppointments * 3 +
        clientsServed * 2 +
        Math.round(verifiedRevenue / 1000);

      return {
        id: row.id,
        full_name: row.full_name,
        avatar_url: row.avatar_url || "",
        total_appointments: totalAppointments,
        completed_appointments: completedAppointments,
        confirmed_appointments: Number(row.confirmed_appointments || 0),
        pending_appointments: Number(row.pending_appointments || 0),
        cancelled_appointments: Number(row.cancelled_appointments || 0),
        clients_served: clientsServed,
        verified_revenue: verifiedRevenue,
        commission_rate: commissionRate,
        commission_earned: commissionEarned,
        today_appointments: Number(row.today_appointments || 0),
        revenue_today: revenueToday,
        revenue_week: revenueWeek,
        revenue_month: revenueMonth,
        commission_today: commissionToday,
        commission_week: commissionWeek,
        commission_month: commissionMonth,
        completion_rate: totalAppointments > 0 ? Math.round((completedAppointments / totalAppointments) * 100) : 0,
        score,
      };
    });

    ranking.sort((a, b) => b.score - a.score || b.completed_appointments - a.completed_appointments);

    callback(
      null,
      ranking.map((item, index) => ({
        rank: index + 1,
        ...item,
      }))
    );
  });
};

module.exports = {
  DEFAULT_WORK_SCHEDULE,
  parseJsonField,
  normalizeSpecialties,
  normalizeWorkSchedule,
  formatBarberRow,
  computeBarberStats,
  computeBarberRanking,
};
