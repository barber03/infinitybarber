export interface BarberWorkSchedule {
  days: string[];
  slots: string[];
}

export interface BarberProfile {
  id: number;
  full_name: string;
  username: string;
  avatar_url: string;
  description: string;
  specialties: string[];
  commission_rate: number;
  work_schedule: BarberWorkSchedule;
  created_at?: string;
}

export interface BarberTimeOff {
  id: number;
  off_date: string;
  reason?: string;
  created_at?: string;
}

export interface BarberPortfolioItem {
  id: number;
  url: string;
  caption?: string;
  created_at?: string;
}

export interface BarberStats {
  total_appointments: number;
  completed_appointments: number;
  confirmed_appointments: number;
  pending_appointments: number;
  cancelled_appointments: number;
  clients_served: number;
  verified_revenue: number;
  commission_rate: number;
  commission_earned: number;
  today_appointments: number;
  completion_rate: number;
  revenue_today: number;
  revenue_week: number;
  revenue_month: number;
  commission_today: number;
  commission_week: number;
  commission_month: number;
}

export interface BarberRankingItem extends BarberStats {
  rank: number;
  id: number;
  full_name: string;
  avatar_url: string;
  score: number;
}

export interface BarberProfileBundle {
  profile: BarberProfile;
  time_off: BarberTimeOff[];
  portfolio: BarberPortfolioItem[];
  stats: BarberStats;
}

export const WEEK_DAYS = [
  { key: "mon", label: "Lun" },
  { key: "tue", label: "Mar" },
  { key: "wed", label: "Mié" },
  { key: "thu", label: "Jue" },
  { key: "fri", label: "Vie" },
  { key: "sat", label: "Sáb" },
  { key: "sun", label: "Dom" },
] as const;

export const DEFAULT_WORK_SCHEDULE: BarberWorkSchedule = {
  days: ["mon", "tue", "wed", "thu", "fri", "sat"],
  slots: ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00", "18:00"],
};

export const SUGGESTED_SPECIALTIES = [
  "Fade",
  "Degradado",
  "Barba",
  "Perfilado",
  "Clásico",
  "Niños",
  "Diseño",
  "Color",
  "Premium",
];
