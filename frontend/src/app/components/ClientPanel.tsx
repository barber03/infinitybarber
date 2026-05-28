import { useEffect, useState, useMemo, type ReactNode } from "react";
import { useNavigate, Link } from "react-router";
import { toast } from "sonner";
import {
  Calendar, Bell, HelpCircle, Scissors, Bot, Users,
  LogOut, Menu, X, CheckCircle2, Clock, XCircle,
  AlertCircle, ChevronRight, Plus, Phone, Sparkles,
  CalendarCheck, Send, RefreshCw, Award
} from "lucide-react";
import { apiFetch, resolveAssetUrl } from "../lib/api";
import { getClientSession, clearClientSession } from "../lib/clientStorage";
import type { ClientSession } from "../lib/clientStorage";
import type { Booking } from "./BookingPage";
import FaceAnalyzer from "./FaceAnalyzer";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Notification {
  id: number;
  type: string;
  message: string;
  is_read: number;
  created_at: string;
}

interface ChangeRequest {
  id: number;
  appointment_id: number;
  requested_date: string;
  requested_time: string;
  reason: string | null;
  status: "pending" | "approved" | "rejected";
  admin_notes: string | null;
  created_at: string;
  original_date: string;
  original_time: string;
  service_name: string;
  barber_name: string;
}

type Section =
  | "agendar"
  | "mis-citas"
  | "notificaciones"
  | "ayuda"
  | "servicios"
  | "ia-barber"
  | "barberos";

const STATUS_LABELS: Record<string, { label: string; color: string; icon: ReactNode }> = {
  pending: { label: "Pendiente", color: "text-amber-400 bg-amber-400/10 border-amber-400/30", icon: <Clock className="h-3.5 w-3.5" /> },
  confirmed: { label: "Confirmada", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  completed: { label: "Completada", color: "text-blue-400 bg-blue-400/10 border-blue-400/30", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  cancelled: { label: "Cancelada", color: "text-red-400 bg-red-400/10 border-red-400/30", icon: <XCircle className="h-3.5 w-3.5" /> },
  no_show: { label: "No asistió", color: "text-zinc-400 bg-zinc-400/10 border-zinc-400/30", icon: <AlertCircle className="h-3.5 w-3.5" /> },
};

const REQ_STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: "En revisión", color: "text-amber-400" },
  approved: { label: "Aprobado", color: "text-emerald-400" },
  rejected: { label: "Rechazado", color: "text-red-400" },
};

const navItems: { id: Section; label: string; icon: ReactNode }[] = [
  { id: "mis-citas", label: "Mis Citas", icon: <CalendarCheck className="h-4 w-4" /> },
  { id: "agendar", label: "Agendar Cita", icon: <Plus className="h-4 w-4" /> },
  { id: "notificaciones", label: "Notificaciones", icon: <Bell className="h-4 w-4" /> },
  { id: "ayuda", label: "Centro de Ayuda", icon: <HelpCircle className="h-4 w-4" /> },
  { id: "servicios", label: "Servicios", icon: <Scissors className="h-4 w-4" /> },
  { id: "ia-barber", label: "Recomendador IA", icon: <Sparkles className="h-4 w-4" /> },
  { id: "barberos", label: "Equipo", icon: <Users className="h-4 w-4" /> },
];

const DEFAULT_TIMES = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
const NEQUI_QR = "/nequi-qr.jpeg";

function getNextDates(count = 7) {
  const dates: string[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

function fmtDate(value: string) {
  return new Intl.DateTimeFormat("es-CO", { weekday: "short", day: "numeric", month: "short" }).format(
    new Date(`${value}T00:00:00`)
  );
}

interface ServiceOpt { id: number; name: string; price: number; duration_minutes: number; image_url?: string; }
interface BarberOpt {
  id: number;
  full_name: string;
  avatar_url?: string;
  description?: string;
  specialties?: string[];
  rank?: number | null;
}
interface AvailResp { booked_times: string[]; available_times: string[] }

function AgendarSection({
  session,
  onBooked,
  initialServiceId = "",
  initialBarberId = "",
  initialAiService = "",
  onClearAiService,
}: {
  session: ClientSession;
  onBooked: () => void;
  initialServiceId?: string;
  initialBarberId?: string;
  initialAiService?: string;
  onClearAiService?: () => void;
}) {
  const [services, setServices] = useState<ServiceOpt[]>([]);
  const [barbers, setBarbers] = useState<BarberOpt[]>([]);
  const [serviceId, setServiceId] = useState(initialServiceId);
  const [barberId, setBarberId] = useState(initialBarberId);
  const [aiService, setAiService] = useState(initialAiService);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [paymentScreenshot, setPaymentScreenshot] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [availTimes, setAvailTimes] = useState<string[]>(DEFAULT_TIMES);
  const [loadingAvail, setLoadingAvail] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialServiceId) setServiceId(initialServiceId);
  }, [initialServiceId]);

  useEffect(() => {
    if (initialBarberId) setBarberId(initialBarberId);
  }, [initialBarberId]);

  useEffect(() => {
    setAiService(initialAiService);
  }, [initialAiService]);

  useEffect(() => {
    Promise.all([apiFetch<ServiceOpt[]>("/api/services"), apiFetch<BarberOpt[]>("/api/barbers")])
      .then(([s, b]) => { setServices(s); setBarbers(b); })
      .catch(() => toast.error("No se pudo cargar la información"));
  }, []);

  useEffect(() => {
    if (aiService && services.length > 0) {
      const iaOption = services.find(s => s.name.toLowerCase().includes("ia:"));
      if (iaOption) {
        setServiceId(String(iaOption.id));
      } else {
        setServiceId("1");
      }
    }
  }, [services, aiService]);

  useEffect(() => {
    if (!date || !barberId) { setBookedTimes([]); setAvailTimes(DEFAULT_TIMES); return; }
    setLoadingAvail(true);
    apiFetch<AvailResp>(`/api/availability?date=${date}&barber_id=${barberId}`)
      .then(r => { setBookedTimes(r.booked_times); setAvailTimes(r.available_times); })
      .catch(() => setAvailTimes(DEFAULT_TIMES))
      .finally(() => setLoadingAvail(false));
  }, [date, barberId]);

  const selectedService = useMemo(() => services.find(s => s.id === Number(serviceId)), [serviceId, services]);
  const selectedBarber = useMemo(() => barbers.find(b => b.id === Number(barberId)), [barberId, barbers]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const fd = new FormData();
    fd.append("image", file);
    try {
      const r = await apiFetch<{ url: string }>("/api/payments/upload", { method: "POST", body: fd });
      setPaymentScreenshot(r.url);
      toast.success("Comprobante subido correctamente.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al subir el comprobante");
    } finally { setIsUploading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceId || !barberId || !date || !time) { toast.error("Completa todos los campos"); return; }
    if (!paymentScreenshot) { toast.error("Debes subir el comprobante de pago"); return; }
    if (bookedTimes.includes(time)) { toast.error("Ese horario ya está ocupado"); return; }

    setSubmitting(true);
    try {
      await apiFetch("/api/appointments", {
        method: "POST",
        body: JSON.stringify({
          customer_name: session.user.name,
          customer_phone: session.user.phone,
          service_id: Number(serviceId),
          barber_id: Number(barberId),
          appointment_date: date,
          start_time: time,
          payment_method: "nequi",
          payment_screenshot: paymentScreenshot,
          ai_recommendation: aiService || null,
        }),
      });
      toast.success("¡Cita agendada! Queda pendiente de verificación de pago.");
      setServiceId(""); setBarberId(""); setDate(""); setTime(""); setPaymentScreenshot("");
      onBooked();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo crear la cita");
    } finally { setSubmitting(false); }
  };

  const upcomingDates = getNextDates();

  const currentStep = !serviceId ? 1 : !barberId ? 2 : !date ? 3 : !time ? 4 : !paymentScreenshot ? 5 : 6;
  const progressPercent = ((currentStep - 1) / 5) * 100;

  const currentPrice = selectedService ? selectedService.price : (aiService ? 18.00 : 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-white uppercase">Reservar Tu Cita</h2>
          <p className="mt-1 text-xs text-muted-foreground uppercase tracking-wider">
            Cliente VIP: <span className="text-primary font-black">{session.user.name}</span> · {session.user.phone}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 flex items-center gap-2 self-start sm:self-auto">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">Disponibilidad en vivo</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[0.9fr_1.1fr] lg:grid-cols-[0.8fr_1.2fr] gap-6 items-start">
        {/* Left Column: Summary and Stepper */}
        <div className="space-y-6 md:sticky md:top-24">
          {/* Stepper progress */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-5 space-y-3 shadow-lg backdrop-blur-md">
            <div className="flex justify-between items-center text-xs font-black uppercase tracking-[0.15em]">
              <span className="text-muted-foreground">Paso {currentStep > 5 ? 5 : currentStep} de 5</span>
              <span className="text-primary font-bold">{Math.round(progressPercent)}% Completado</span>
            </div>
            <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/5 p-0.5">
              <div className="h-full bg-gradient-to-r from-primary to-pink-500 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(139,92,246,0.5)]" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>

          {/* Real-time Summary Card (Ticket-style) */}
          <div className="rounded-3xl border border-primary/20 bg-[#0d0d15]/65 p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-24 h-24 bg-primary/5 rounded-bl-full pointer-events-none group-hover:bg-primary/10 transition-colors" />
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Resumen de Reserva
            </h3>
            
            <div className="mt-4 space-y-3 text-xs border-t border-white/5 pt-3">
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground uppercase tracking-wider">Servicio</span>
                <span className="font-bold text-white max-w-[150px] truncate text-right">
                  {aiService || selectedService?.name || "Sin elegir"}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground uppercase tracking-wider">Barbero</span>
                <span className="font-bold text-white truncate text-right">
                  {selectedBarber?.full_name || "Sin elegir"}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground uppercase tracking-wider">Fecha</span>
                <span className="font-bold text-white text-right">
                  {date ? fmtDate(date) : "Pendiente"}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground uppercase tracking-wider">Hora</span>
                <span className="font-bold text-white text-right">
                  {time || "Pendiente"}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground uppercase tracking-wider">Método</span>
                <span className="font-bold text-white text-right">Nequi</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground uppercase tracking-wider">Comprobante</span>
                <span className={`font-bold ${paymentScreenshot ? "text-emerald-400" : "text-amber-400"} text-right`}>
                  {paymentScreenshot ? "Subido ✓" : "Pendiente"}
                </span>
              </div>
            </div>
            
            {serviceId && (
              <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary font-bold">Total a Transferir</p>
                <p className="text-3xl font-black text-white mt-1">${currentPrice.toFixed(2)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Form Steps */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Service */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4 shadow-xl backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-24 h-24 bg-primary/5 rounded-bl-full pointer-events-none group-hover:bg-primary/10 transition-colors" />
            <p className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
              <Scissors className="h-4 w-4" />
              Paso 1: Selecciona el Servicio
            </p>
            {aiService ? (
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 backdrop-blur-md relative overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="absolute top-0 right-0 h-24 w-24 bg-primary/10 blur-3xl" />
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">RECOMENDACIÓN IA ACTIVA</span>
                    </div>
                    <h4 className="text-xl font-black text-white italic">{aiService}</h4>
                    <p className="mt-2 text-xs text-white/50">Servicio personalizado basado en tu análisis facial.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setAiService("");
                        setServiceId("");
                        if (onClearAiService) onClearAiService();
                      }}
                      className="mt-4 text-xs font-bold text-primary hover:text-white transition-colors underline cursor-pointer"
                    >
                      Ver todos los servicios
                    </button>
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-2xl bg-primary px-4 py-3 text-primary-foreground shadow-lg shadow-primary/20">
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Precio</span>
                    <span className="text-xl font-black">$18.00</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {services.map(s => {
                  const isSelected = serviceId === String(s.id);
                  return (
                    <button key={s.id} type="button" onClick={() => setServiceId(String(s.id))}
                      className={`rounded-xl border p-4 text-left transition-all duration-300 relative overflow-hidden group/item cursor-pointer hover:scale-[1.01] ${isSelected ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(99,102,241,0.2)]" : "border-white/5 bg-white/[0.01] hover:border-white/15"}`}>
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <p className={`text-sm font-black transition-colors ${isSelected ? "text-primary" : "text-white"}`}>{s.name}</p>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 font-medium"><Clock className="h-3 w-3" />{s.duration_minutes} min</p>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-black transition-all ${isSelected ? "bg-primary text-white" : "bg-white/10 text-white/80"}`}>
                          ${s.price.toFixed(2)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step 2: Barber */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4 shadow-xl backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-24 h-24 bg-primary/5 rounded-bl-full pointer-events-none group-hover:bg-primary/10 transition-colors" />
            <p className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
              <Users className="h-4 w-4" />
              Paso 2: Elige tu Barbero
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {barbers.map(b => {
                const isSelected = barberId === String(b.id);
                return (
                  <button key={b.id} type="button" onClick={() => { setBarberId(String(b.id)); setTime(""); }}
                    className={`rounded-xl border p-4 text-left transition-all duration-300 relative overflow-hidden group/item cursor-pointer hover:scale-[1.01] ${isSelected ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(99,102,241,0.2)]" : "border-white/5 bg-white/[0.01] hover:border-white/15"}`}>
                    <p className={`text-sm font-black transition-colors ${isSelected ? "text-primary" : "text-white"}`}>{b.full_name}</p>
                    <p className="text-xs text-muted-foreground mt-1 font-semibold leading-relaxed line-clamp-1">{b.description || "Especialista en acabados modernos"}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Date */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4 shadow-xl backdrop-blur-xl">
            <p className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Paso 3: Elige la Fecha
            </p>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
              {upcomingDates.map(d => {
                const isSelected = date === d;
                const dayNum = new Intl.DateTimeFormat("es-CO", { day: "2-digit" }).format(new Date(`${d}T00:00:00`));
                const dayName = new Intl.DateTimeFormat("es-CO", { weekday: "short" }).format(new Date(`${d}T00:00:00`));
                const month = new Intl.DateTimeFormat("es-CO", { month: "short" }).format(new Date(`${d}T00:00:00`));
                return (
                  <button key={d} type="button" onClick={() => { setDate(d); setTime(""); }}
                    className={`rounded-xl border px-2 py-3 text-center transition-all duration-300 cursor-pointer hover:scale-105 active:scale-95 ${isSelected ? "border-primary bg-primary text-primary-foreground shadow-[0_4px_15px_rgba(99,102,241,0.3)]" : "border-white/5 bg-white/[0.01] text-white hover:border-white/20"}`}>
                    <span className="block text-[9px] font-black uppercase opacity-75">{dayName}</span>
                    <span className="block text-lg font-black my-0.5">{dayNum}</span>
                    <span className="block text-[9px] font-black uppercase opacity-75">{month}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 4: Time */}
          {date && barberId && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4 shadow-xl backdrop-blur-xl animate-in slide-in-from-top-4 duration-300">
              <p className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Paso 4: Elige el Horario
                {loadingAvail && <RefreshCw className="h-3 w-3 animate-spin text-primary" />}
              </p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {availTimes.map(slot => {
                  const booked = bookedTimes.includes(slot);
                  const selected = time === slot;
                  return (
                    <button key={slot} type="button" onClick={() => !booked && setTime(slot)} disabled={booked}
                      className={`rounded-xl border py-3 text-xs font-bold transition-all duration-200 cursor-pointer ${booked ? "cursor-not-allowed border-red-500/10 bg-red-500/5 text-red-400/40" : selected ? "border-primary bg-primary text-primary-foreground shadow-[0_4px_12px_rgba(99,102,241,0.35)]" : "border-white/5 bg-white/[0.01] text-white hover:border-white/20"}`}>
                      <span className="block text-sm font-black">{slot}</span>
                      <span className="block text-[8px] font-black uppercase tracking-wider opacity-75 mt-0.5">{booked ? "Ocupado" : selected ? "Elegido" : "Libre"}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 5: Payment */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4 shadow-xl backdrop-blur-xl">
            <p className="text-xs font-black uppercase tracking-widest text-primary">Paso 5: Comprobante de Pago (Nequi)</p>
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex-shrink-0 flex flex-col items-center">
                <div className="relative rounded-xl border border-white/15 bg-white p-2 w-32 shadow-lg overflow-hidden group">
                  <img src={NEQUI_QR} alt="QR Nequi" className="w-full rounded-lg" />
                  <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-[scan_2s_linear_infinite]" />
                </div>
                <p className="mt-2.5 text-center text-[9px] font-black text-muted-foreground uppercase tracking-widest">Escanea el QR</p>
              </div>
              <div className="flex-1 space-y-4">
                {serviceId && (
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 shadow-inner">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary font-bold">Total a Transferir</p>
                    <p className="text-3xl font-black text-white mt-1">${currentPrice.toFixed(2)}</p>
                  </div>
                )}
                <label className="flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-primary/30 bg-primary/5 font-black text-primary hover:bg-primary/10 hover:border-primary/50 transition-all duration-300">
                  {isUploading ? <><RefreshCw className="h-4 w-4 animate-spin" />Subiendo comprobante...</> : paymentScreenshot ? <><CheckCircle2 className="h-4 w-4 text-emerald-400 animate-bounce" />¡Comprobante subido! ✓</> : <><Plus className="h-4 w-4" />Adjuntar Captura de Pago</>}
                  <input type="file" accept="image/*" hidden onChange={handleUpload} disabled={isUploading} />
                </label>
              </div>
            </div>
          </div>

          <button type="submit" disabled={submitting || !serviceId || !barberId || !date || !time || !paymentScreenshot}
            className="w-full rounded-xl bg-gradient-to-r from-primary to-violet-600 py-4 font-black uppercase tracking-widest text-white shadow-[0_8px_25px_rgba(99,102,241,0.35)] hover:shadow-[0_12px_35px_rgba(99,102,241,0.5)] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:scale-100 disabled:shadow-none transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer">
            {submitting ? <RefreshCw className="h-5 w-5 animate-spin" /> : <><CalendarCheck className="h-5 w-5" />Confirmar y Agendar Cita</>}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Mis Citas Section ─────────────────────────────────────────────────────────
function MisCitasSection({ appointments, loading, onSelectForHelp }: {
  appointments: Booking[];
  loading: boolean;
  onSelectForHelp: (a: Booking) => void;
}) {
  const upcoming = appointments.filter(a => a.appointment_date >= new Date().toISOString().split("T")[0] && a.status !== "cancelled");
  const past = appointments.filter(a => a.appointment_date < new Date().toISOString().split("T")[0] || a.status === "cancelled" || a.status === "completed");

  const AppointmentCard = ({ a }: { a: Booking }) => {
    const st = STATUS_LABELS[a.status] ?? STATUS_LABELS.pending;
    return (
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d15]/60 hover:bg-[#0d0d15]/80 hover:border-primary/30 transition-all duration-300 shadow-xl group flex flex-col sm:flex-row">
        {/* Left Side Ticket Body */}
        <div className="flex-1 p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-primary">INFINITY TICKET</p>
              <h3 className="text-xl font-black text-white mt-1 group-hover:text-primary transition-colors">{a.service_name || "Corte Personalizado"}</h3>
              <p className="text-xs text-muted-foreground mt-1.5 font-medium">{a.barber_name} · {fmtDate(a.appointment_date)} · {a.start_time}</p>
            </div>
            <span className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider ${st.color}`}>
              {st.icon}{st.label}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 text-xs border-t border-white/5 pt-3">
            <span className="font-semibold text-white/50">
              Estado de Pago: <span className={a.payment_status === "verified" ? "text-emerald-400 font-bold" : a.payment_status === "rejected" ? "text-red-400 font-bold" : "text-amber-400 font-bold"}>
                {a.payment_status === "verified" ? "Verificado" : a.payment_status === "rejected" ? "Rechazado" : "En revisión"}
              </span>
            </span>
            {(a.status === "pending" || a.status === "confirmed") && (
              <button onClick={() => onSelectForHelp(a)}
                className="flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/10 transition-all duration-200 cursor-pointer">
                <HelpCircle className="h-3.5 w-3.5" />Reagendar / Ayuda
              </button>
            )}
          </div>
        </div>
        
        {/* Ticket Dashed Divider */}
        <div className="relative flex flex-row sm:flex-col items-center justify-between py-0 px-5 sm:py-5 sm:px-0 bg-black/40">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-2 bg-[#060608] rounded-b-full hidden sm:block border-b border-white/10" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-2 bg-[#060608] rounded-t-full hidden sm:block border-t border-white/10" />
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-4 bg-[#060608] rounded-r-full sm:hidden border-r border-white/10" />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-4 bg-[#060608] rounded-l-full sm:hidden border-l border-white/10" />
          <div className="w-full sm:w-px h-px sm:h-full border-t sm:border-l border-dashed border-white/20" />
        </div>

        {/* Right Side Ticket barcode/status */}
        <div className="p-5 flex flex-col justify-center items-center bg-black/25 min-w-[130px] text-center justify-self-stretch sm:justify-self-auto">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/35">CÓDIGO CITA</span>
          <span className="text-sm font-black text-white mt-1">#00{a.id}</span>
          <div className="mt-3 flex gap-0.5 items-center opacity-30 select-none">
            <div className="w-1 h-8 bg-white" />
            <div className="w-0.5 h-8 bg-white" />
            <div className="w-1.5 h-8 bg-white" />
            <div className="w-0.5 h-8 bg-white" />
            <div className="w-1 h-8 bg-white" />
            <div className="w-0.5 h-8 bg-white" />
            <div className="w-1.5 h-8 bg-white" />
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
        <RefreshCw className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="font-medium text-sm">Cargando tus reservas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h2 className="text-2xl font-black tracking-tight text-white uppercase">Mis Citas</h2>
      {appointments.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.01] p-16 text-center">
          <Calendar className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground font-bold">Aún no tienes citas agendadas.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">¡Agenda una nueva cita para empezar!</p>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="space-y-4">
              <p className="text-xs font-black uppercase tracking-widest text-primary">Próximas citas</p>
              {upcoming.map(a => <AppointmentCard key={a.id} a={a} />)}
            </div>
          )}
          {past.length > 0 && (
            <div className="space-y-4">
              <p className="text-xs font-black uppercase tracking-widest text-white/30">Historial de visitas</p>
              {past.map(a => <AppointmentCard key={a.id} a={a} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Notificaciones Section ────────────────────────────────────────────────────
function NotificacionesSection({ notifications, onMarkAllRead }: {
  notifications: Notification[];
  onMarkAllRead: () => void;
}) {
  const unread = notifications.filter(n => !n.is_read).length;
  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-white">Notificaciones</h2>
          {unread > 0 && <p className="text-sm text-primary font-bold mt-0.5">{unread} sin leer</p>}
        </div>
        {unread > 0 && (
          <button onClick={onMarkAllRead}
            className="text-xs font-bold text-muted-foreground hover:text-white transition-colors border border-white/10 rounded-lg px-3 py-1.5 cursor-pointer">
            Marcar todas como leídas
          </button>
        )}
      </div>
      {notifications.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.01] p-16 text-center">
          <Bell className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground font-bold">No tienes notificaciones en tu bandeja.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(n => (
            <div key={n.id} className={`rounded-2xl border p-4 transition-all duration-300 ${n.is_read ? "border-white/5 bg-white/[0.01]" : "border-primary/20 bg-primary/5"}`}>
              <div className="flex items-start gap-3">
                <div className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${n.is_read ? "bg-transparent" : "bg-primary animate-ping"}`} />
                <div className="flex-1">
                  <p className={`text-sm leading-relaxed ${n.is_read ? "text-white/60" : "text-white font-semibold"}`}>{n.message}</p>
                  <p className="mt-2 text-xs text-muted-foreground/60">
                    {new Date(n.created_at).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Centro de Ayuda Section ───────────────────────────────────────────────────
function AyudaSection({ appointments, prefillAppointment, onRequestSent }: {
  appointments: Booking[];
  prefillAppointment: Booking | null;
  onRequestSent: () => void;
}) {
  const [selectedAppt, setSelectedAppt] = useState<string>(prefillAppointment ? String(prefillAppointment.id) : "");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [loadingReqs, setLoadingReqs] = useState(true);

  useEffect(() => {
    if (prefillAppointment) setSelectedAppt(String(prefillAppointment.id));
  }, [prefillAppointment]);

  useEffect(() => {
    apiFetch<ChangeRequest[]>("/api/client/change-requests")
      .then(setRequests)
      .catch(() => { })
      .finally(() => setLoadingReqs(false));
  }, []);

  const activeAppointments = appointments.filter(a => a.status === "pending" || a.status === "confirmed");
  const upcomingDates = getNextDates(14);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppt || !newDate || !newTime) { toast.error("Completa todos los campos"); return; }
    setSubmitting(true);
    try {
      await apiFetch("/api/client/change-requests", {
        method: "POST",
        body: JSON.stringify({ appointment_id: Number(selectedAppt), requested_date: newDate, requested_time: newTime, reason }),
      });
      toast.success("Solicitud enviada. El administrador la revisará pronto.");
      setSelectedAppt(""); setNewDate(""); setNewTime(""); setReason("");
      const updated = await apiFetch<ChangeRequest[]>("/api/client/change-requests");
      setRequests(updated);
      onRequestSent();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al enviar la solicitud");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-black tracking-tight text-white">Centro de Ayuda</h2>
        <p className="mt-1 text-sm text-muted-foreground">Solicita un cambio de horario para una de tus citas activas.</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-5 shadow-xl backdrop-blur-xl">
        <p className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
          <Send className="h-4 w-4" />
          Nueva Solicitud de Cambio de Fecha/Hora
        </p>
        {activeAppointments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tienes citas activas para las cuales solicitar cambios.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/50">Cita a Modificar</label>
              <select value={selectedAppt} onChange={e => setSelectedAppt(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm text-white outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 appearance-none cursor-pointer">
                <option value="" className="bg-zinc-950 text-white/60">Selecciona una de tus citas</option>
                {activeAppointments.map(a => (
                  <option key={a.id} value={String(a.id)} className="bg-zinc-950">
                    {a.service_name} · {fmtDate(a.appointment_date)} a las {a.start_time} · {a.barber_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/50">Nueva Fecha Propuesta</label>
                <select value={newDate} onChange={e => { setNewDate(e.target.value); setNewTime(""); }}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm text-white outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 appearance-none cursor-pointer">
                  <option value="" className="bg-zinc-950">Selecciona fecha</option>
                  {upcomingDates.map(d => (
                    <option key={d} value={d} className="bg-zinc-950">{fmtDate(d)}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/50">Nueva Hora Propuesta</label>
                <select value={newTime} onChange={e => setNewTime(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm text-white outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 appearance-none cursor-pointer">
                  <option value="" className="bg-zinc-950">Selecciona hora</option>
                  {DEFAULT_TIMES.map(t => <option key={t} value={t} className="bg-zinc-950">{t}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/50">Motivo del Cambio</label>
              <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Describe el motivo por el cual solicitas el cambio..."
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 resize-none" />
            </div>

            <button type="submit" disabled={submitting}
              className="w-full rounded-xl bg-gradient-to-r from-primary to-violet-600 py-3 font-bold uppercase tracking-wider text-white shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer hover:brightness-110 active:scale-95 transition-all">
              {submitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4" />Enviar Solicitud</>}
            </button>
          </form>
        )}
      </div>

      {/* Tarjeta Informativa del Sistema de Puntos */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-primary/5 via-violet-500/5 to-pink-500/5 p-6 space-y-4 shadow-xl backdrop-blur-xl animate-in fade-in duration-300">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-white uppercase tracking-wider">Programa de Puntos Club Infinity</h3>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Premio a tu lealtad en cada visita</p>
          </div>
        </div>
        
        <p className="text-sm text-white/70 leading-relaxed font-medium">
          Queremos premiar tu lealtad. Por cada cita que completes y cuyo pago sea verificado por nuestro equipo, acumularás puntos automáticamente en tu perfil. ¡Llega a los 100 puntos y reclama tu corte gratuito!
        </p>

        <div className="grid gap-3 sm:grid-cols-3 pt-2">
          <div className="rounded-xl border border-white/5 bg-white/[0.01] p-4 text-center hover:bg-white/[0.03] transition-colors">
            <div className="text-primary font-black text-lg">1 Cita Completa</div>
            <p className="text-[10px] text-muted-foreground mt-1 font-semibold uppercase">Suma 10 puntos a tu cuenta</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.01] p-4 text-center hover:bg-white/[0.03] transition-colors">
            <div className="text-violet-400 font-black text-lg">Meta 100 Puntos</div>
            <p className="text-[10px] text-muted-foreground mt-1 font-semibold uppercase">Límite para activar tu premio</p>
          </div>
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center hover:bg-primary/10 transition-colors">
            <div className="text-emerald-400 font-black text-lg">Corte Gratis</div>
            <p className="text-[10px] text-muted-foreground mt-1 font-semibold uppercase">¡Redime tu saldo acumulado!</p>
          </div>
        </div>
      </div>

      {/* Historial de solicitudes */}
      {!loadingReqs && requests.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-black uppercase tracking-widest text-white/40">Historial de solicitudes de cambio</p>
          {requests.map(r => {
            const st = REQ_STATUS[r.status] ?? REQ_STATUS.pending;
            return (
              <div key={r.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-2 shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-white">{r.service_name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Original: {fmtDate(r.original_date)} {r.original_time} → Propuesto: {fmtDate(r.requested_date)} {r.requested_time}
                    </p>
                  </div>
                  <span className={`text-xs font-black uppercase tracking-wider ${st.color}`}>{st.label}</span>
                </div>
                {r.admin_notes && (
                  <p className="text-xs text-muted-foreground border-t border-white/5 pt-2 mt-2">
                    Nota del Admin: {r.admin_notes}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Servicios Panel Section ───────────────────────────────────────────────────
const buildServiceCopy = (service: ServiceOpt) => {
  if (service.name.toLowerCase().includes("ia:")) {
    return "Recomendación de corte personalizada generada mediante nuestro asistente inteligente analizando tu rostro.";
  }
  if (service.duration_minutes <= 30) {
    return "Ideal para quienes buscan verse impecables sin perder tiempo. Un servicio ágil y bien ejecutado.";
  }
  if (service.duration_minutes <= 50) {
    return "Una sesión equilibrada para renovar tu look con detalle, técnica y una experiencia cómoda.";
  }
  return "Pensado para clientes que quieren una atención más completa, acabados finos y un resultado con más presencia.";
};

const getServiceHighlights = (service: ServiceOpt) => {
  if (service.name.toLowerCase().includes("ia:")) {
    return ["Asesoría IA", "Estilo digital"];
  }
  if (service.duration_minutes <= 30) {
    return ["Salida rápida", "Acabado limpio"];
  }
  if (service.duration_minutes <= 50) {
    return ["Look balanceado", "Definición precisa"];
  }
  return ["Experiencia completa", "Presencia premium"];
};

function ClientPanelServices({ onSelectService }: { onSelectService: (id: string) => void }) {
  const [services, setServices] = useState<ServiceOpt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<ServiceOpt[]>("/api/services")
      .then(setServices)
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20 text-muted-foreground"><RefreshCw className="h-5 w-5 animate-spin mr-2" />Cargando servicios...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-extrabold text-white">Nuestros Servicios</h2>
        <p className="mt-1 text-sm text-muted-foreground">Explora nuestros cortes, perfilados y servicios exclusivos de barbería.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {services.map((s) => {
          const highlights = getServiceHighlights(s);
          return (
            <div key={s.id} className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-5 hover:border-primary/45 hover:bg-white/[0.04] transition-all group flex flex-col justify-between shadow-lg">
              <div className="absolute top-0 right-0 h-24 w-24 bg-primary/5 rounded-bl-full -z-10 group-hover:bg-primary/10 transition-all"></div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary group-hover:scale-110 transition-transform overflow-hidden">
                    {s.image_url ? (
                      <img src={resolveAssetUrl(s.image_url)} alt={s.name} className="h-full w-full object-cover" />
                    ) : (
                      <Scissors className="h-4.5 w-4.5" />
                    )}
                  </div>
                  <h3 className="font-bold text-white text-lg leading-tight group-hover:text-primary transition-colors">{s.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                  {buildServiceCopy(s)}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {highlights.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-white/5 bg-white/5 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.2em] text-white/50 group-hover:border-primary/20 group-hover:text-white/80 transition-all"
                    >
                      {item}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-3 pt-1 text-xs">
                  <span className="flex items-center gap-1 text-white/60 bg-white/5 border border-white/5 rounded-full px-2.5 py-1 font-semibold">
                    <Clock className="h-3.5 w-3.5 text-primary" /> {s.duration_minutes} min
                  </span>
                  <span className="font-bold text-primary bg-primary/10 border border-primary/20 rounded-full px-2.5 py-1">
                    ${s.price.toFixed(2)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => onSelectService(String(s.id))}
                className="mt-5 w-full rounded-xl bg-gradient-to-r from-primary/20 to-violet-500/20 border border-primary/30 py-3 text-xs font-bold text-white uppercase tracking-wider hover:from-primary hover:to-violet-500 hover:border-primary transition-all flex items-center justify-center gap-1.5 shadow-md shadow-primary/5 cursor-pointer"
              >
                Agendar servicio <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Barberos Panel Section ────────────────────────────────────────────────────
function ClientPanelBarbers({ onSelectBarber }: { onSelectBarber: (id: string) => void }) {
  const [barbers, setBarbers] = useState<BarberOpt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<BarberOpt[]>("/api/barbers")
      .then(setBarbers)
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const BARBER_IMAGES = [
    "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=400&q=80",
    "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80",
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80",
  ];

  if (loading) return <div className="flex items-center justify-center py-20 text-muted-foreground"><RefreshCw className="h-5 w-5 animate-spin mr-2" />Cargando equipo...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-extrabold text-white">Nuestro Equipo</h2>
        <p className="mt-1 text-sm text-muted-foreground">Conoce al equipo de expertos listos para brindarte la mejor atención.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {barbers.map((b, idx) => {
          const specialty = b.specialties?.[0] || "Barbero Elite";
          const tags = b.specialties?.length ? b.specialties.slice(0, 3) : ["Precisión", "Visión", "Vibe"];
          return (
            <div key={b.id} className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-5 hover:border-primary/45 hover:bg-white/[0.04] transition-all group flex flex-col justify-between shadow-lg">
              <div className="flex gap-4 items-start">
                <img
                  src={resolveAssetUrl(b.avatar_url) || BARBER_IMAGES[idx % BARBER_IMAGES.length]}
                  alt={b.full_name}
                  className="h-16 w-16 rounded-xl object-cover border border-white/10 group-hover:scale-105 transition-transform duration-300"
                />
                <div className="space-y-1">
                  <h3 className="font-bold text-white text-lg leading-tight group-hover:text-primary transition-colors">{b.full_name}</h3>
                  <span className="inline-block text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">{specialty}</span>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1 font-medium">{b.description || "Especialista en cortes modernos, perfilado de barba y acabados de alta definición."}</p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {tags.map((tag) => (
                      <span key={tag} className="rounded-full border border-white/5 bg-white/5 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.2em] text-white/50 group-hover:border-primary/20 group-hover:text-white/80 transition-all">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={() => onSelectBarber(String(b.id))}
                className="mt-5 w-full rounded-xl bg-gradient-to-r from-primary/20 to-violet-500/20 border border-primary/30 py-3 text-xs font-bold text-white uppercase tracking-wider hover:from-primary hover:to-violet-500 hover:border-primary transition-all flex items-center justify-center gap-1.5 shadow-md shadow-primary/5 cursor-pointer"
              >
                Reservar con {b.full_name.split(" ")[0]} <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Client Panel ─────────────────────────────────────────────────────────
export function ClientPanel() {
  const session = getClientSession();
  const navigate = useNavigate();
  const [section, setSection] = useState<Section>("mis-citas");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [appointments, setAppointments] = useState<Booking[]>([]);
  const [loadingAppts, setLoadingAppts] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [prefillAppt, setPrefillAppt] = useState<Booking | null>(null);
  const [preselectedServiceId, setPreselectedServiceId] = useState("");
  const [preselectedBarberId, setPreselectedBarberId] = useState("");
  const [preselectedAiService, setPreselectedAiService] = useState("");
  const [showPointsInfo, setShowPointsInfo] = useState(false);

  // Perfil detallado del cliente
  const [profile, setProfile] = useState<{ loyalty_points: number } | null>(null);

  if (!session) { navigate("/mi-cuenta/login"); return null; }

  const fetchAppointments = () => {
    setLoadingAppts(true);
    apiFetch<Booking[]>("/api/client/appointments")
      .then(setAppointments)
      .catch((err) => toast.error(err instanceof Error ? err.message : "No se pudieron cargar las citas"))
      .finally(() => setLoadingAppts(false));
  };

  const fetchNotifications = () => {
    apiFetch<Notification[]>("/api/client/notifications")
      .then(setNotifications)
      .catch(() => { });
  };

  const fetchProfile = () => {
    apiFetch<{ loyalty_points: number }>("/api/client/profile")
      .then(setProfile)
      .catch(() => { });
  };

  useEffect(() => {
    fetchAppointments();
    fetchNotifications();
    fetchProfile();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleLogout = () => {
    clearClientSession();
    toast.success("Sesión cerrada correctamente.");
    navigate("/");
  };

  const handleMarkAllRead = async () => {
    try {
      await apiFetch("/api/client/notifications/read-all", { method: "PATCH" });
      fetchNotifications();
    } catch { toast.error("No se pudo actualizar"); }
  };

  const goToHelp = (appt: Booking) => {
    setPrefillAppt(appt);
    setSection("ayuda");
  };

  const navigate_section = (s: Section) => {
    setSection(s);
    setSidebarOpen(false);
  };

  const renderSection = () => {
    switch (section) {
      case "agendar":
        return (
          <AgendarSection
            session={session}
            initialServiceId={preselectedServiceId}
            initialBarberId={preselectedBarberId}
            initialAiService={preselectedAiService}
            onClearAiService={() => setPreselectedAiService("")}
            onBooked={() => {
              setPreselectedServiceId("");
              setPreselectedBarberId("");
              setPreselectedAiService("");
              fetchAppointments();
              fetchProfile();
              setSection("mis-citas");
            }}
          />
        );
      case "mis-citas": return <MisCitasSection appointments={appointments} loading={loadingAppts} onSelectForHelp={goToHelp} />;
      case "notificaciones": return <NotificacionesSection notifications={notifications} onMarkAllRead={handleMarkAllRead} />;
      case "ayuda": return <AyudaSection appointments={appointments} prefillAppointment={prefillAppt} onRequestSent={fetchAppointments} />;
      case "servicios":
        return (
          <ClientPanelServices
            onSelectService={(serviceId) => {
              setPreselectedAiService("");
              setPreselectedServiceId(serviceId);
              setSection("agendar");
            }}
          />
        );
      case "ia-barber":
        return (
          <div className="space-y-4 animate-in fade-in duration-500">
            <FaceAnalyzer
              onSelectAiService={(recommendation) => {
                setPreselectedAiService(recommendation);
                setSection("agendar");
              }}
            />
          </div>
        );
      case "barberos":
        return (
          <ClientPanelBarbers
            onSelectBarber={(barberId) => {
              setPreselectedBarberId(barberId);
              setSection("agendar");
            }}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#060608] flex flex-col font-sans selection:bg-primary/30">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#060608]/90 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 rounded-xl border border-white/10 text-muted-foreground hover:text-white transition-colors cursor-pointer">
              {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
            <Link to="/" className="flex items-center gap-2">
              <Scissors className="h-5 w-5 text-primary" />
              <span className="text-sm font-bold text-white hidden sm:block">Infinity Barber</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate_section("notificaciones")}
              className="relative p-2 rounded-xl border border-white/10 text-muted-foreground hover:text-white transition-colors cursor-pointer">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-black text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-black">
                {session.user.name[0]?.toUpperCase()}
              </div>
              <span className="hidden sm:block text-xs font-semibold text-white/80 max-w-[120px] truncate">{session.user.name}</span>
            </div>
            <button onClick={handleLogout} className="p-2 rounded-xl border border-white/10 text-muted-foreground hover:text-red-400 hover:border-red-400/25 transition-all cursor-pointer" title="Cerrar sesión">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar overlay on mobile */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-30 bg-black/70 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 flex-shrink-0 border-r border-white/5 bg-[#08080e] flex flex-col transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} pt-16 lg:pt-0`}>
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">

            {/* User card */}
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 shadow-inner">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary font-black text-lg">
                  {session.user.name[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white leading-tight">{session.user.name}</p>
                  <p className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1"><Phone className="h-3 w-3" />{session.user.phone}</p>
                </div>
              </div>
            </div>

            {/* VIP Loyalty Card */}
            <div 
              onClick={() => setShowPointsInfo(true)}
              className="cursor-pointer overflow-hidden rounded-2xl bg-gradient-to-br from-[#4f46e5] via-[#7c3aed] to-[#db2777] p-4 shadow-[0_8px_24px_rgba(124,58,237,0.3)] relative group border border-white/10 transition-all duration-300 hover:scale-[1.02] hover:border-white/20 active:scale-[0.98]"
              title="Haz clic para ver cómo funciona el sistema de puntos"
            >
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.08] pointer-events-none"></div>
              <div className="absolute -inset-x-20 top-0 h-full w-[calc(100%+160px)] bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none"></div>

              <div className="relative z-10 flex flex-col justify-between h-28">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/70">Infinity Club</span>
                    <h4 className="text-xs font-bold text-white mt-0.5 leading-tight flex items-center gap-1.5">
                      Tarjeta VIP
                      <span className="text-[8px] bg-white/20 px-1 py-0.2 rounded font-black text-white uppercase tracking-wider">Info</span>
                    </h4>
                  </div>
                  <Award className="h-5 w-5 text-amber-300 animate-bounce" />
                </div>
                <div className="mt-4 flex justify-between items-end">
                  <div>
                    <p className="text-[8px] font-bold uppercase tracking-wider text-white/60">Puntos Club</p>
                    <p className="text-3xl font-black text-white leading-none">
                      {profile ? profile.loyalty_points : 0} <span className="text-[10px] font-medium text-white/80">PTS</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-black uppercase text-white/60">Corte gratis</p>
                    <div className="mt-1 w-20 h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(((profile ? profile.loyalty_points : 0) / 100) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-[8px] font-semibold text-white/80 mt-1">
                      {Math.max(100 - (profile ? profile.loyalty_points : 0), 0)} pts faltan
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowPointsInfo(true)}
              className="w-full text-center text-[10px] font-bold text-muted-foreground/50 hover:text-white transition-colors cursor-pointer flex items-center justify-center gap-1 py-1"
            >
              <HelpCircle className="h-3 w-3 text-primary" /> ¿Cómo funcionan los puntos?
            </button>

            {/* Nav Menu */}
            <nav className="space-y-1">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => navigate_section(item.id)}
                  className={[
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-300 cursor-pointer",
                    section === item.id
                      ? "bg-primary/15 border border-primary/25 text-primary shadow-sm"
                      : "text-muted-foreground hover:bg-white/5 hover:text-white border border-transparent",
                  ].join(" ")}
                >
                  {item.icon}
                  {item.label}
                  {item.id === "notificaciones" && unreadCount > 0 && (
                    <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-black text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                  {section === item.id && <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-60" />}
                </button>
              ))}
            </nav>
          </div>

          {/* Logout bottom */}
          <div className="border-t border-white/5 px-3 py-4">
            <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-all cursor-pointer">
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className={[
            "mx-auto px-4 py-8 sm:px-6 lg:px-8 transition-all duration-500",
            section === "agendar" ? "max-w-5xl" : "max-w-3xl"
          ].join(" ")}>
            {section === "mis-citas" && (
              <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-r from-primary/10 via-purple-500/5 to-transparent p-6 sm:p-8 shadow-xl backdrop-blur-xl mb-6">
                <div className="absolute right-0 top-0 h-32 w-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">¡Hola, {session.user.name.split(" ")[0]}! 👋</h1>
                <p className="text-sm text-muted-foreground mt-2 max-w-xl">Bienvenido a tu panel de cliente premium en Infinity Barber. Aquí puedes agendar tus citas, hacer solicitudes de cambio de horario y llevar el control de tus visitas y puntos de fidelización.</p>
              </div>
            )}
            {renderSection()}
          </div>
        </main>
      </div>

      {showPointsInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d15] p-6 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl pointer-events-none" />
            <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-pink-500/5 blur-2xl pointer-events-none" />
            
            <button 
              onClick={() => setShowPointsInfo(false)}
              className="absolute right-4 top-4 rounded-xl border border-white/10 p-2 text-muted-foreground hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#4f46e5] to-[#db2777] text-white shadow-lg shadow-indigo-500/30">
                  <Award className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Club Infinity</h3>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Sistema de Fidelización</p>
                </div>
              </div>

              <div className="border-t border-white/5 pt-4 space-y-4">
                <div className="flex gap-3">
                  <div className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Acumula puntos</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Recibes <span className="text-primary font-bold">10 puntos</span> por cada cita completada y verificada en la barbería.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                    <Award className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Tu meta: 100 puntos</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Al llegar a los <span className="text-primary font-bold">100 puntos</span>, desbloqueas tu premio de lealtad.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Corte de Cabello Gratis</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Redime tus 100 puntos indicándole a tu barbero o al equipo para aplicar tu beneficio de corte sin costo.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 mt-2 shadow-inner">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-white/70">Tus puntos actuales:</span>
                  <span className="font-black text-primary text-base">{profile ? profile.loyalty_points : 0} PTS</span>
                </div>
                <div className="mt-2 w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(((profile ? profile.loyalty_points : 0) / 100) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground/80 text-right mt-1 font-semibold">
                  {Math.max(100 - (profile ? profile.loyalty_points : 0), 0) > 0 
                    ? `Te faltan ${Math.max(100 - (profile ? profile.loyalty_points : 0), 0)} PTS para tu corte gratis`
                    : "¡Felicidades! Tienes un corte gratis disponible."
                  }
                </p>
              </div>

              <button 
                type="button"
                onClick={() => setShowPointsInfo(false)}
                className="w-full rounded-xl bg-gradient-to-r from-primary to-violet-600 py-3.5 font-bold uppercase tracking-wider text-white shadow-lg transition-all hover:brightness-110 active:scale-95 cursor-pointer text-xs"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
