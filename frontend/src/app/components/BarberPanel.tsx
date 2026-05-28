import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import {
  Award,
  Briefcase,
  Calendar,
  Camera,
  Clock,
  DollarSign,
  ImagePlus,
  LayoutDashboard,
  LogOut,
  Medal,
  Phone,
  Save,
  Scissors,
  Sparkles,
  Star,
  Trash2,
  TrendingUp,
  User,
  Users,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch, isConnectionError, resolveAssetUrl, waitForBackend } from "../lib/api";
import {
  DEFAULT_WORK_SCHEDULE,
  SUGGESTED_SPECIALTIES,
  WEEK_DAYS,
  type BarberPortfolioItem,
  type BarberProfileBundle,
  type BarberRankingItem,
  type BarberTimeOff,
  type BarberWorkSchedule,
} from "../lib/barber";
import { clearAuthSession, getBarberSession } from "../lib/storage";
import type { Booking } from "./BookingPage";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";

type BarberTab = "resumen" | "perfil" | "agenda" | "horario" | "portafolio" | "estadisticas";

const tabs: Array<{ id: BarberTab; label: string; icon: ReactNode }> = [
  { id: "resumen", label: "Resumen", icon: <LayoutDashboard className="h-4 w-4" /> },
  { id: "perfil", label: "Perfil", icon: <User className="h-4 w-4" /> },
  { id: "agenda", label: "Agenda", icon: <Calendar className="h-4 w-4" /> },
  { id: "horario", label: "Horario", icon: <Clock className="h-4 w-4" /> },
  { id: "portafolio", label: "Portafolio", icon: <Camera className="h-4 w-4" /> },
  { id: "estadisticas", label: "Estadísticas", icon: <TrendingUp className="h-4 w-4" /> },
];

const statusLabels: Record<Booking["status"], string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  completed: "Completada",
  cancelled: "Cancelada",
  no_show: "No asistió",
};

const paymentLabels: Record<Booking["payment_status"], string> = {
  pending_review: "En revisión",
  verified: "Verificado",
  rejected: "Rechazado",
};

const statusClassName: Record<Booking["status"], string> = {
  pending: "bg-amber-500/20 text-amber-300",
  confirmed: "bg-emerald-500/20 text-emerald-300",
  completed: "bg-blue-500/20 text-blue-300",
  cancelled: "bg-red-500/20 text-red-400",
  no_show: "bg-zinc-500/20 text-zinc-300",
};

const paymentClassName: Record<Booking["payment_status"], string> = {
  pending_review: "bg-amber-500/20 text-amber-300",
  verified: "bg-emerald-500/20 text-emerald-300",
  rejected: "bg-rose-500/20 text-rose-300",
};

const getTodayLocalDate = () => {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().split("T")[0];
};

const toDisplayName = (value: string) =>
  value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");

export function BarberPanel() {
  const [activeTab, setActiveTab] = useState<BarberTab>("resumen");
  const [bundle, setBundle] = useState<BarberProfileBundle | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [ranking, setRanking] = useState<BarberRankingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({
    description: "",
    specialtiesText: "",
    workDays: [...DEFAULT_WORK_SCHEDULE.days] as string[],
  });
  const [timeOffDate, setTimeOffDate] = useState("");
  const [timeOffReason, setTimeOffReason] = useState("");
  const [portfolioCaption, setPortfolioCaption] = useState("");
  const [portfolioFile, setPortfolioFile] = useState<File | null>(null);
  const [agendaFilter, setAgendaFilter] = useState<"hoy" | "proximas" | "todas">("hoy");
  const [serverOffline, setServerOffline] = useState(false);
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;
  const barberSession = getBarberSession();

  const loadAll = useCallback(async () => {
    const [profileData, appointmentData] = await Promise.all([
      apiFetch<BarberProfileBundle>("/api/barber/profile"),
      apiFetch<Booking[]>("/api/barber/appointments"),
    ]);
    setBundle(profileData);
    setBookings(appointmentData);
    setProfileForm({
      description: profileData.profile.description,
      specialtiesText: profileData.profile.specialties.join(", "),
      workDays: [...profileData.profile.work_schedule.days],
    });

    try {
      const rankingData = await apiFetch<BarberRankingItem[]>("/api/barber/ranking");
      setRanking(rankingData);
    } catch {
      setRanking([]);
    }
  }, []);

  const loadAllRef = useRef(loadAll);
  loadAllRef.current = loadAll;

  const bootstrap = useCallback(async () => {
    setIsLoading(true);
    setServerOffline(false);

    const ready = await waitForBackend(3, 350);
    if (!ready) {
      setServerOffline(true);
      setIsLoading(false);
      return;
    }

    try {
      await loadAllRef.current();
      setServerOffline(false);
    } catch (error) {
      if (isConnectionError(error)) {
        setServerOffline(true);
        toast.error("El servidor no respondió. Pulsa «Reintentar» o reinicia npm start.");
      } else {
        toast.error(error instanceof Error ? error.message : "No se pudo cargar el panel.");
        const message = error instanceof Error ? error.message.toLowerCase() : "";
        if (message.includes("token") || message.includes("401") || message.includes("autentic")) {
          clearAuthSession();
          navigateRef.current("/barber/login", { replace: true });
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const bootstrapOnce = useRef(false);

  useEffect(() => {
    if (bootstrapOnce.current) return;
    bootstrapOnce.current = true;
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const todayKey = getTodayLocalDate();
  const sortedBookings = useMemo(
    () =>
      [...bookings].sort((a, b) => {
        const dateCompare = a.appointment_date.localeCompare(b.appointment_date);
        if (dateCompare !== 0) return dateCompare;
        return a.start_time.localeCompare(b.start_time);
      }),
    [bookings]
  );

  const filteredAgenda = useMemo(() => {
    if (agendaFilter === "hoy") return sortedBookings.filter((b) => b.appointment_date === todayKey);
    if (agendaFilter === "proximas") return sortedBookings.filter((b) => b.appointment_date >= todayKey);
    return sortedBookings;
  }, [agendaFilter, sortedBookings, todayKey]);

  const myRank = ranking.find((item) => item.id === barberSession?.id);
  const stats = bundle?.stats;

  const handleLogout = () => {
    clearAuthSession();
    toast.success("Sesión de barbero cerrada.");
    navigate("/barber/login");
  };

  const saveProfile = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!bundle) return;
    setIsSaving(true);
    try {
      const specialties = profileForm.specialtiesText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const updated = await apiFetch<BarberProfileBundle>("/api/barber/profile", {
        method: "PATCH",
        body: JSON.stringify({
          description: profileForm.description,
          specialties,
          work_schedule: {
            days: profileForm.workDays,
            slots: bundle.profile.work_schedule.slots,
          },
        }),
      });
      setBundle(updated);
      toast.success("Perfil actualizado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el perfil.");
    } finally {
      setIsSaving(false);
    }
  };

  const addTimeOff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!timeOffDate) {
      toast.error("Selecciona una fecha.");
      return;
    }
    try {
      await apiFetch("/api/barber/time-off", {
        method: "POST",
        body: JSON.stringify({ off_date: timeOffDate, reason: timeOffReason }),
      });
      setTimeOffDate("");
      setTimeOffReason("");
      toast.success("Día libre registrado.");
      await loadAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo registrar el día libre.");
    }
  };

  const removeTimeOff = async (id: number) => {
    try {
      await apiFetch(`/api/barber/time-off/${id}`, { method: "DELETE" });
      toast.success("Día libre eliminado.");
      await loadAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar.");
    }
  };

  const uploadPortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portfolioFile) {
      toast.error("Selecciona una imagen.");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("image", portfolioFile);
      formData.append("caption", portfolioCaption);
      await apiFetch("/api/barber/portfolio/upload", { method: "POST", body: formData });
      setPortfolioFile(null);
      setPortfolioCaption("");
      toast.success("Corte agregado al portafolio.");
      await loadAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo subir la imagen.");
    }
  };

  const deletePortfolio = async (id: number) => {
    try {
      await apiFetch(`/api/barber/portfolio/${id}`, { method: "DELETE" });
      toast.success("Imagen eliminada.");
      await loadAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar.");
    }
  };

  const updateAppointmentStatus = async (id: number, status: Booking["status"]) => {
    try {
      await apiFetch(`/api/barber/appointments/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      toast.success("Estado de la cita actualizado.");
      const appointmentData = await apiFetch<Booking[]>("/api/barber/appointments");
      setBookings(appointmentData);
      const profileData = await apiFetch<BarberProfileBundle>("/api/barber/profile");
      setBundle(profileData);
      const rankingData = await apiFetch<BarberRankingItem[]>("/api/barber/ranking");
      setRanking(rankingData);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar la cita.");
    }
  };

  const toggleWorkDay = (day: string) => {
    setProfileForm((prev) => ({
      ...prev,
      workDays: prev.workDays.includes(day) ? prev.workDays.filter((d) => d !== day) : [...prev.workDays, day],
    }));
  };

  if (!barberSession) return null;

  return (
    <div className="min-h-screen bg-[#06060a] bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(120,119,198,0.12),transparent)] p-4 text-foreground md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="admin-panel-glow admin-light-sweep relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(18,18,30,0.95),rgba(8,8,14,0.98))] p-6 shadow-[0_30px_90px_-50px_rgba(139,92,246,0.85)]">
          <div className="admin-hero-orb absolute right-6 top-6 h-28 w-28 rounded-full bg-primary/20 blur-3xl" />
          <div className="admin-hero-orb-delay absolute bottom-0 left-1/4 h-20 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <img
                src={resolveAssetUrl(bundle?.profile.avatar_url) || "https://api.dicebear.com/7.x/avataaars/svg?seed=Barber"}
                alt={barberSession.full_name}
                className="h-20 w-20 rounded-2xl border-2 border-primary/30 object-cover shadow-[0_0_30px_rgba(99,102,241,0.35)]"
              />
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
                  <Scissors className="h-3.5 w-3.5" />
                  Panel de barbero
                </div>
                <h1 className="text-3xl font-black text-white md:text-4xl">{barberSession.full_name}</h1>
                <p className="mt-1 text-sm text-white/50">@{barberSession.username}</p>
                {myRank && (
                  <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-amber-300">
                    <Medal className="h-4 w-4" />
                    Puesto #{myRank.rank} en el ranking del equipo
                  </p>
                )}
              </div>
            </div>
            <Button onClick={handleLogout} variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10">
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesión
            </Button>
          </div>
        </header>

        <nav className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-primary/20 text-white shadow-[0_0_20px_rgba(99,102,241,0.2)] ring-1 ring-primary/40"
                  : "text-white/55 hover:bg-white/5 hover:text-white"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        {serverOffline ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-8 text-center">
            <p className="max-w-md text-sm text-amber-100/90">
              No hay conexión con el backend (puerto 3000). Suele pasar si <code className="text-amber-200">npm start</code> no levantó el API por puerto ocupado.
            </p>
            <Button onClick={bootstrap} className="bg-primary hover:bg-primary/90">
              Reintentar conexión
            </Button>
          </div>
        ) : isLoading ? (
          <div className="flex min-h-[320px] items-center justify-center">
            <p className="animate-pulse text-sm font-semibold uppercase tracking-widest text-white/40">Cargando panel...</p>
          </div>
        ) : !bundle ? (
          <p className="text-center text-white/50">No se pudo cargar tu perfil.</p>
        ) : (
          <>
            {activeTab === "resumen" && (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <KpiCard glow="#22c55e" icon={<Calendar className="h-5 w-5" />} label="Citas hoy" value={String(stats?.today_appointments ?? 0)} />
                  <KpiCard glow="#6366f1" icon={<Users className="h-5 w-5" />} label="Clientes atendidos" value={String(stats?.clients_served ?? 0)} />
                  <KpiCard glow="#f97316" icon={<DollarSign className="h-5 w-5" />} label="Comisión ganada" value={`$${(stats?.commission_earned ?? 0).toLocaleString()}`} />
                  <KpiCard glow="#a855f7" icon={<Award className="h-5 w-5" />} label="Citas completadas" value={String(stats?.completed_appointments ?? 0)} />
                </div>

                {stats && (
                  <PanelCard title="Ingresos y Comisiones Recientes" icon={<Wallet className="h-5 w-5 text-emerald-400" />}>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-2 transition-all hover:border-emerald-500/30 hover:bg-white/[0.04] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 h-16 w-16 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-colors" />
                        <p className="text-xs text-white/45 uppercase font-bold tracking-wider">Hoy</p>
                        <div>
                          <p className="text-xs text-white/40">Total Servicios: <span className="font-semibold text-white/80">${(stats.revenue_today ?? 0).toLocaleString()}</span></p>
                          <p className="text-3xl font-black text-emerald-400 mt-2">${(stats.commission_today ?? 0).toLocaleString()}</p>
                          <p className="text-[9px] text-white/30 uppercase font-bold mt-1 tracking-wider">Comisión ({stats.commission_rate}%)</p>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-2 transition-all hover:border-emerald-500/30 hover:bg-white/[0.04] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 h-16 w-16 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-colors" />
                        <p className="text-xs text-white/45 uppercase font-bold tracking-wider">Esta Semana</p>
                        <div>
                          <p className="text-xs text-white/40">Total Servicios: <span className="font-semibold text-white/80">${(stats.revenue_week ?? 0).toLocaleString()}</span></p>
                          <p className="text-3xl font-black text-emerald-400 mt-2">${(stats.commission_week ?? 0).toLocaleString()}</p>
                          <p className="text-[9px] text-white/30 uppercase font-bold mt-1 tracking-wider">Comisión ({stats.commission_rate}%)</p>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-2 transition-all hover:border-emerald-500/30 hover:bg-white/[0.04] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 h-16 w-16 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-colors" />
                        <p className="text-xs text-white/45 uppercase font-bold tracking-wider">Este Mes</p>
                        <div>
                          <p className="text-xs text-white/40">Total Servicios: <span className="font-semibold text-white/80">${(stats.revenue_month ?? 0).toLocaleString()}</span></p>
                          <p className="text-3xl font-black text-emerald-400 mt-2">${(stats.commission_month ?? 0).toLocaleString()}</p>
                          <p className="text-[9px] text-white/30 uppercase font-bold mt-1 tracking-wider">Comisión ({stats.commission_rate}%)</p>
                        </div>
                      </div>
                    </div>
                  </PanelCard>
                )}

                <div className="grid gap-6 lg:grid-cols-2">
                  <PanelCard title="Tus especialidades" icon={<Star className="h-5 w-5 text-primary" />}>
                    <div className="flex flex-wrap gap-2">
                      {bundle.profile.specialties.length ? (
                        bundle.profile.specialties.map((item) => (
                          <span key={item} className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                            {item}
                          </span>
                        ))
                      ) : (
                        <p className="text-sm text-white/45">Aún no has definido especialidades. Configúralas en Perfil.</p>
                      )}
                    </div>
                  </PanelCard>

                  <PanelCard title="Ranking del equipo" icon={<Medal className="h-5 w-5 text-amber-400" />}>
                    <div className="space-y-3">
                      {ranking.slice(0, 5).map((item) => (
                        <div
                          key={item.id}
                          className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                            item.id === barberSession.id ? "border-primary/35 bg-primary/10" : "border-white/5 bg-white/[0.03]"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-sm font-black text-white">#{item.rank}</span>
                            <div>
                              <p className="font-bold text-white">{item.full_name}</p>
                              <p className="text-xs text-white/45">{item.completed_appointments} completadas · {item.clients_served} clientes</p>
                            </div>
                          </div>
                          <span className="text-sm font-black text-emerald-400">${item.commission_earned.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </PanelCard>
                </div>
              </div>
            )}

            {activeTab === "perfil" && (
              <PanelCard title="Mi perfil profesional" icon={<User className="h-5 w-5 text-primary" />}>
                <form onSubmit={saveProfile} className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase text-white/45">Nombre</Label>
                      <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 font-semibold text-white">{bundle.profile.full_name}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase text-white/45">Usuario</Label>
                      <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 font-semibold text-white">@{bundle.profile.username}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase text-white/45">Biografía</Label>
                    <textarea
                      value={profileForm.description}
                      onChange={(e) => setProfileForm((p) => ({ ...p, description: e.target.value }))}
                      rows={4}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/40"
                      placeholder="Cuéntale a tus clientes tu estilo y experiencia..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase text-white/45">Especialidades (separadas por coma)</Label>
                    <input
                      value={profileForm.specialtiesText}
                      onChange={(e) => setProfileForm((p) => ({ ...p, specialtiesText: e.target.value }))}
                      className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-white focus:border-primary/50 focus:outline-none"
                      placeholder="Fade, Barba, Clásico..."
                    />
                    <div className="flex flex-wrap gap-2">
                      {SUGGESTED_SPECIALTIES.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => {
                            const current = profileForm.specialtiesText.split(",").map((s) => s.trim()).filter(Boolean);
                            if (current.includes(item)) return;
                            setProfileForm((p) => ({
                              ...p,
                              specialtiesText: [...current, item].join(", "),
                            }));
                          }}
                          className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/60 hover:border-primary/30 hover:text-white"
                        >
                          + {item}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200/90">
                    Comisión configurada por administración: <strong>{bundle.profile.commission_rate}%</strong> sobre ingresos verificados completados.
                  </div>
                  <Button type="submit" disabled={isSaving} className="bg-primary hover:bg-primary/90">
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? "Guardando..." : "Guardar perfil"}
                  </Button>
                </form>
              </PanelCard>
            )}

            {activeTab === "agenda" && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {(["hoy", "proximas", "todas"] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setAgendaFilter(filter)}
                      className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider ${
                        agendaFilter === filter ? "bg-primary text-white" : "bg-white/5 text-white/50"
                      }`}
                    >
                      {filter === "hoy" ? "Hoy" : filter === "proximas" ? "Próximas" : "Todas"}
                    </button>
                  ))}
                </div>
                <div className="space-y-4">
                  {filteredAgenda.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-white/45">No hay citas en este filtro.</p>
                  ) : (
                    filteredAgenda.map((booking) => (
                      <AgendaCard key={booking.id} booking={booking} onStatusChange={updateAppointmentStatus} />
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === "horario" && (
              <div className="grid gap-6 lg:grid-cols-2">
                <PanelCard title="Horario laboral" icon={<Clock className="h-5 w-5 text-primary" />}>
                  <p className="mb-4 text-sm text-white/50">Marca los días en los que trabajas. Los horarios disponibles se gestionan con administración.</p>
                  <div className="mb-4 flex flex-wrap gap-2">
                    {WEEK_DAYS.map((day) => (
                      <button
                        key={day.key}
                        type="button"
                        onClick={() => toggleWorkDay(day.key)}
                        className={`rounded-xl px-4 py-2 text-sm font-bold ${
                          profileForm.workDays.includes(day.key)
                            ? "bg-primary text-white shadow-[0_0_16px_rgba(99,102,241,0.4)]"
                            : "bg-white/5 text-white/45"
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs font-semibold uppercase text-white/40">Franjas activas</p>
                    <p className="mt-2 text-sm text-white/70">{bundle.profile.work_schedule.slots.join(" · ")}</p>
                  </div>
                  <Button onClick={saveProfile} disabled={isSaving} className="mt-4 bg-primary">
                    <Save className="mr-2 h-4 w-4" />
                    Guardar horario
                  </Button>
                </PanelCard>

                <PanelCard title="Días libres" icon={<Calendar className="h-5 w-5 text-rose-400" />}>
                  <form onSubmit={addTimeOff} className="mb-4 grid gap-3 sm:grid-cols-2">
                    <input
                      type="date"
                      value={timeOffDate}
                      onChange={(e) => setTimeOffDate(e.target.value)}
                      className="h-11 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-white"
                    />
                    <input
                      value={timeOffReason}
                      onChange={(e) => setTimeOffReason(e.target.value)}
                      placeholder="Motivo (opcional)"
                      className="h-11 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-white"
                    />
                    <Button type="submit" className="sm:col-span-2 bg-rose-600 hover:bg-rose-500">
                      Agregar día libre
                    </Button>
                  </form>
                  <TimeOffList items={bundle.time_off} onRemove={removeTimeOff} />
                </PanelCard>
              </div>
            )}

            {activeTab === "portafolio" && (
              <div className="space-y-6">
                <PanelCard title="Subir corte al portafolio" icon={<ImagePlus className="h-5 w-5 text-primary" />}>
                  <form onSubmit={uploadPortfolio} className="flex flex-col gap-4 md:flex-row md:items-end">
                    <input type="file" accept="image/*" onChange={(e) => setPortfolioFile(e.target.files?.[0] ?? null)} className="text-sm text-white/70" />
                    <input
                      value={portfolioCaption}
                      onChange={(e) => setPortfolioCaption(e.target.value)}
                      placeholder="Descripción del corte"
                      className="h-11 flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-white"
                    />
                    <Button type="submit" className="bg-primary">
                      <UploadIcon />
                      Subir foto
                    </Button>
                  </form>
                </PanelCard>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {bundle.portfolio.map((item) => (
                    <PortfolioCard key={item.id} item={item} onDelete={() => deletePortfolio(item.id)} />
                  ))}
                  {bundle.portfolio.length === 0 && (
                    <p className="col-span-full rounded-2xl border border-dashed border-white/10 p-12 text-center text-white/45">
                      Tu portafolio está vacío. Sube fotos de tus mejores cortes.
                    </p>
                  )}
                </div>
              </div>
            )}

            {activeTab === "estadisticas" && stats && (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <KpiCard glow="#06b6d4" icon={<Briefcase className="h-5 w-5" />} label="Total citas" value={String(stats.total_appointments)} />
                  <KpiCard glow="#22c55e" icon={<Sparkles className="h-5 w-5" />} label="Tasa de completado" value={`${stats.completion_rate}%`} />
                  <KpiCard glow="#f97316" icon={<Wallet className="h-5 w-5" />} label="Ingresos verificados" value={`$${(stats.verified_revenue ?? 0).toLocaleString()}`} />
                  <KpiCard glow="#a855f7" icon={<DollarSign className="h-5 w-5" />} label={`Comisión (${stats.commission_rate}%)`} value={`$${(stats.commission_earned ?? 0).toLocaleString()}`} />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <StatBlock label="Pendientes" value={stats.pending_appointments} />
                  <StatBlock label="Confirmadas" value={stats.confirmed_appointments} />
                  <StatBlock label="Canceladas / no asistió" value={stats.cancelled_appointments} />
                </div>

                 <PanelCard title="Liquidación de Comisiones Recientes" icon={<Wallet className="h-5 w-5 text-emerald-400" />}>
                  <div className="grid gap-6 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-2">
                      <p className="text-xs text-white/40 uppercase font-semibold">Hoy</p>
                      <div>
                        <p className="text-sm font-medium text-white/60">Servicios: <span className="text-white">${(stats.revenue_today ?? 0).toLocaleString()}</span></p>
                        <p className="text-2xl font-black text-emerald-400 mt-1">${(stats.commission_today ?? 0).toLocaleString()}</p>
                        <p className="text-[10px] text-white/30 uppercase font-bold">Comisión ({stats.commission_rate}%)</p>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-2">
                      <p className="text-xs text-white/40 uppercase font-semibold">Esta Semana</p>
                      <div>
                        <p className="text-sm font-medium text-white/60">Servicios: <span className="text-white">${(stats.revenue_week ?? 0).toLocaleString()}</span></p>
                        <p className="text-2xl font-black text-emerald-400 mt-1">${(stats.commission_week ?? 0).toLocaleString()}</p>
                        <p className="text-[10px] text-white/30 uppercase font-bold">Comisión ({stats.commission_rate}%)</p>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-2">
                      <p className="text-xs text-white/40 uppercase font-semibold">Este Mes</p>
                      <div>
                        <p className="text-sm font-medium text-white/60">Servicios: <span className="text-white">${(stats.revenue_month ?? 0).toLocaleString()}</span></p>
                        <p className="text-2xl font-black text-emerald-400 mt-1">${(stats.commission_month ?? 0).toLocaleString()}</p>
                        <p className="text-[10px] text-white/30 uppercase font-bold">Comisión ({stats.commission_rate}%)</p>
                      </div>
                    </div>
                  </div>
                </PanelCard>

                <PanelCard title="Ranking completo del equipo" icon={<Medal className="h-5 w-5 text-amber-400" />}>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-white/40">
                          <th className="px-3 py-2">#</th>
                          <th className="px-3 py-2">Barbero</th>
                          <th className="px-3 py-2">Completadas</th>
                          <th className="px-3 py-2">Clientes</th>
                          <th className="px-3 py-2">Comisión</th>
                          <th className="px-3 py-2">Puntos</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ranking.map((item) => (
                          <tr key={item.id} className={`border-b border-white/5 ${item.id === barberSession.id ? "bg-primary/10" : ""}`}>
                            <td className="px-3 py-3 font-black text-white">{item.rank}</td>
                            <td className="px-3 py-3 font-semibold text-white">{item.full_name}</td>
                            <td className="px-3 py-3 text-white/70">{item.completed_appointments}</td>
                            <td className="px-3 py-3 text-white/70">{item.clients_served}</td>
                            <td className="px-3 py-3 font-bold text-emerald-400">${item.commission_earned.toLocaleString()}</td>
                            <td className="px-3 py-3 text-white/55">{item.score}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </PanelCard>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function KpiCard({ glow, icon, label, value }: { glow: string; icon: ReactNode; label: string; value: string }) {
  return (
    <div className="admin-metric-glow rounded-2xl border border-white/10 bg-[#0f0f19]/90 p-5" style={{ ["--admin-glow" as string]: glow }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-white/40">{label}</p>
          <p className="mt-2 text-2xl font-black text-white">{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">{icon}</div>
      </div>
    </div>
  );
}

function PanelCard({ children, icon, title }: { children: ReactNode; icon: ReactNode; title: string }) {
  return (
    <Card className="admin-panel-glow border-white/10 bg-[#0e0e18]/90">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-black text-white">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function StatBlock({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center">
      <p className="text-xs font-semibold uppercase text-white/40">{label}</p>
      <p className="mt-2 text-3xl font-black text-white">{value}</p>
    </div>
  );
}

function TimeOffList({ items, onRemove }: { items: BarberTimeOff[]; onRemove: (id: number) => void }) {
  if (!items.length) return <p className="text-sm text-white/45">No tienes días libres registrados.</p>;
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <div>
            <p className="font-semibold text-white">{item.off_date}</p>
            {item.reason && <p className="text-xs text-white/45">{item.reason}</p>}
          </div>
          <button onClick={() => onRemove(item.id)} className="rounded-lg p-2 text-red-400 hover:bg-red-500/10">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

function PortfolioCard({ item, onDelete }: { item: BarberPortfolioItem; onDelete: () => void }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
      <img src={resolveAssetUrl(item.url)} alt={item.caption || "Corte"} className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-105" />
      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/85 via-black/20 to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100">
        <p className="text-sm font-semibold text-white">{item.caption || "Sin descripción"}</p>
        <button onClick={onDelete} className="mt-2 self-end rounded-full bg-red-500/80 p-2 text-white">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function AgendaCard({ booking, onStatusChange }: { booking: Booking; onStatusChange: (id: number, status: Booking["status"]) => void }) {
  return (
    <div className="admin-metric-glow rounded-2xl border border-white/10 bg-white/[0.03] p-5" style={{ ["--admin-glow" as string]: "#6366f1" }}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase text-white/45">
            {booking.appointment_date} · {booking.start_time}
          </p>
          <h3 className="mt-1 text-lg font-black text-white">{toDisplayName(booking.customer_name)}</h3>
          <p className="text-sm text-white/55">{booking.service_name}</p>
        </div>
        <div className="flex flex-col gap-2">
          <Badge className={statusClassName[booking.status]}>{statusLabels[booking.status]}</Badge>
          <Badge className={paymentClassName[booking.payment_status]}>{paymentLabels[booking.payment_status]}</Badge>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-sm text-white/50">
        <span className="flex items-center gap-1"><Phone className="h-4 w-4 text-primary" /> {booking.customer_phone}</span>
        <span className="flex items-center gap-1"><Clock className="h-4 w-4 text-primary" /> {booking.duration_minutes || 0} min</span>
        <span className="flex items-center gap-1"><Wallet className="h-4 w-4 text-primary" /> {booking.payment_reference || "Sin ref."}</span>
      </div>
      {!["completed", "cancelled", "no_show"].includes(booking.status) && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-white/5 pt-4">
          <Button size="sm" variant="outline" className="border-emerald-500/30 text-emerald-300" onClick={() => onStatusChange(booking.id, "confirmed")}>
            Confirmar
          </Button>
          <Button size="sm" variant="outline" className="border-blue-500/30 text-blue-300" onClick={() => onStatusChange(booking.id, "completed")}>
            Completar
          </Button>
          <Button size="sm" variant="outline" className="border-zinc-500/30 text-zinc-300" onClick={() => onStatusChange(booking.id, "no_show")}>
            No asistió
          </Button>
        </div>
      )}
    </div>
  );
}

function UploadIcon() {
  return <ImagePlus className="mr-2 h-4 w-4" />;
}


