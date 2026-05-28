import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Calendar, CheckCircle2, Clock, CreditCard, Phone, Scissors, ShieldCheck, Sparkles, User, UploadCloud } from "lucide-react";
import { useNavigate, useLocation } from "react-router";
import { toast } from "sonner";
import { apiFetch } from "../lib/api";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Footer } from "./Footer";

export interface Booking {
  id: number;
  customer_name: string;
  customer_phone: string;
  appointment_date: string;
  start_time: string;
  service_id: number;
  barber_id: number;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
  payment_method: string;
  payment_reference: string;
  payment_screenshot?: string;
  payment_status: "pending_review" | "verified" | "rejected";
  notes?: string;
  created_at: string;
  service_name?: string;
  barber_name?: string;
  service_price?: number;
  duration_minutes?: number;
}

interface ServiceOption {
  id: number;
  name: string;
  price: number;
  duration_minutes: number;
}

interface BarberOption {
  id: number;
  full_name: string;
  description?: string;
}

interface AvailabilityResponse {
  booked_times: string[];
  available_times: string[];
}

const BOOKING_STEPS = ["Datos", "Servicio", "Fecha", "Pago"];
const DEFAULT_TIMES = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
const NEQUI_QR_IMAGE = "/nequi-qr.jpeg";

const formatBookingDate = (value: string) => {
  if (!value) return "";

  return new Intl.DateTimeFormat("es-CO", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(`${value}T00:00:00`));
};

const getNextDates = (count = 7) => {
  const dates: string[] = [];

  for (let index = 0; index < count; index += 1) {
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + index);
    dates.push(currentDate.toISOString().split("T")[0]);
  }

  return dates;
};

export function BookingPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [barberId, setBarberId] = useState("");

  const [paymentScreenshot, setPaymentScreenshot] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [barbers, setBarbers] = useState<BarberOption[]>([]);
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [availableTimes, setAvailableTimes] = useState<string[]>(DEFAULT_TIMES);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [latestBooking, setLatestBooking] = useState<Booking | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      apiFetch<ServiceOption[]>("/api/services"),
      apiFetch<BarberOption[]>("/api/barbers"),
    ])
      .then(([serviceData, barberData]) => {
        setServices(serviceData);
        setBarbers(barberData);
      })
      .catch(() => toast.error("No se pudo cargar la informacion inicial."));
  }, []);

  const location = useLocation();
  const aiServiceFromState = location.state?.aiService;

  useEffect(() => {
    if (aiServiceFromState && services.length > 0) {
      // Intentamos encontrar el servicio de IA por nombre
      const iaOption = services.find(s => s.name.toLowerCase().includes("ia:"));
      if (iaOption) {
        setServiceId(String(iaOption.id));
      } else {
        // Fallback: si no existe el servicio IA, usamos el ID 1 (Corte Clásico) para que la validación pase
        setServiceId("1");
      }
    }
  }, [services, aiServiceFromState]);

  useEffect(() => {
    if (!date || !barberId) {
      setBookedTimes([]);
      setAvailableTimes(DEFAULT_TIMES);
      return;
    }

    setIsLoadingAvailability(true);
    apiFetch<AvailabilityResponse>(`/api/availability?date=${encodeURIComponent(date)}&barber_id=${encodeURIComponent(barberId)}`)
      .then((response) => {
        setBookedTimes(response.booked_times);
        setAvailableTimes(response.available_times);
      })
      .catch(() => {
        setBookedTimes([]);
        setAvailableTimes(DEFAULT_TIMES);
        toast.error("No se pudo consultar la disponibilidad.");
      })
      .finally(() => setIsLoadingAvailability(false));
  }, [date, barberId]);

  const selectedService = useMemo(
    () => services.find((service) => service.id === Number(serviceId)),
    [serviceId, services]
  );
  const selectedBarber = useMemo(
    () => barbers.find((barber) => barber.id === Number(barberId)),
    [barberId, barbers]
  );
  const canChooseTime = Boolean(date && barberId);
  const completedSteps = [name.trim(), phone.trim(), serviceId, barberId, date, time].filter(Boolean).length;
  const upcomingDates = getNextDates();

  const resetForm = () => {
    setName("");
    setPhone("");
    setDate("");
    setTime("");
    setServiceId("");
    setBarberId("");
    setPaymentScreenshot("");
    setBookedTimes([]);
    setAvailableTimes(DEFAULT_TIMES);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await apiFetch<{ url: string }>("/api/payments/upload", {
        method: "POST",
        body: formData,
      });
      setPaymentScreenshot(res.url);
      toast.success("Comprobante subido");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al subir el comprobante");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanName = name.trim();
    const cleanPhone = phone.trim();

    if (!cleanName || !cleanPhone || !date || !time || !serviceId || !barberId) {
      toast.error("Faltan datos por completar.");
      return;
    }

    if (!paymentScreenshot) {
      toast.error("Debes subir la captura de pantalla del pago por Nequi.");
      return;
    }

    if (bookedTimes.includes(time)) {
      toast.error("Ese horario ya fue tomado. Elige otro espacio.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await apiFetch<{ id: number; message: string }>("/api/appointments", {
        method: "POST",
        body: JSON.stringify({
          customer_name: cleanName,
          customer_phone: cleanPhone,
          appointment_date: date,
          start_time: time,
          service_id: Number(serviceId),
          barber_id: Number(barberId),
          payment_method: "nequi",
          payment_screenshot: paymentScreenshot,
          ai_recommendation: aiServiceFromState || null,
        }),
      });

      setLatestBooking({
        id: response.id,
        customer_name: cleanName,
        customer_phone: cleanPhone,
        appointment_date: date,
        start_time: time,
        service_id: Number(serviceId),
        barber_id: Number(barberId),
        status: "pending",
        payment_method: "nequi",
        payment_reference: "Captura subida",
        payment_status: "pending_review",
        created_at: new Date().toISOString(),
        service_name: selectedService?.name,
        barber_name: selectedBarber?.full_name,
        service_price: selectedService?.price,
      });
      toast.success("Reserva registrada. Queda pendiente de verificacion de pago.");
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo crear la reserva.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-700">

      <section id="reserva" className="relative overflow-hidden bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#0a0a0a] py-20 sm:py-24 lg:py-32">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="absolute left-1/4 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 transform rounded-full bg-primary/20 blur-[90px] pointer-events-none sm:h-96 sm:w-96 sm:blur-[120px]"></div>
        <div className="absolute bottom-0 right-1/4 h-80 w-80 translate-x-1/4 translate-y-1/4 transform rounded-full bg-secondary/10 blur-[110px] pointer-events-none sm:h-[500px] sm:w-[500px] sm:blur-[150px]"></div>

        <div className="container relative z-10 mx-auto px-4">
          <div className="mx-auto grid max-w-7xl gap-8 xl:grid-cols-[0.78fr_1.22fr]">
            <Card className="rounded-[1.75rem] border border-primary/20 bg-card/55 shadow-[0_0_60px_rgba(139,92,246,0.12)] backdrop-blur-2xl sm:rounded-[2rem] xl:sticky xl:top-24 xl:h-fit">
              <CardHeader className="space-y-5 p-5 sm:p-8">
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                  <Sparkles className="h-4 w-4" />
                  Reserva profesional
                </div>
                <div className="space-y-3">
                  <CardTitle className="text-3xl font-extrabold leading-[1.02] tracking-tight text-white sm:text-4xl md:text-5xl">
                    Agenda tu cita
                  </CardTitle>
                  <CardDescription className="text-sm leading-7 text-muted-foreground sm:text-base md:text-lg">
                    El sistema valida disponibilidad real y deja la cita pendiente hasta que el equipo verifique tu pago.
                  </CardDescription>
                </div>

                <div className="grid gap-3">
                  {BOOKING_STEPS.map((step, index) => (
                    <div key={step} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-background/35 px-4 py-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-black ${completedSteps > index ? "border-primary/40 bg-primary text-primary-foreground" : "border-white/10 bg-white/5 text-white/65"}`}>
                        {completedSteps > index ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/75">{step}</p>
                        <p className="text-xs text-muted-foreground">
                          {index === 0 && "Completa tus datos"}
                          {index === 1 && "Escoge servicio y barbero"}
                          {index === 2 && "Consulta un espacio real"}
                          {index === 3 && "Reporta el pago para revision"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardHeader>

              <CardContent className="space-y-5 px-5 pb-5 sm:px-8 sm:pb-8">
                <div className="rounded-[1.75rem] border border-primary/20 bg-background/45 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Resumen actual</p>
                  <div className="mt-4 space-y-3">
                    <SummaryRow 
                      label="Servicio" 
                      value={aiServiceFromState || selectedService?.name || "Sin elegir"} 
                    />
                    <SummaryRow label="Barbero" value={selectedBarber?.full_name || "Sin elegir"} />
                    <SummaryRow label="Fecha" value={date ? formatBookingDate(date) : "Pendiente"} />
                    <SummaryRow label="Hora" value={time || "Pendiente"} />
                    <SummaryRow label="Metodo" value="Nequi" />
                    <SummaryRow label="Comprobante" value={paymentScreenshot ? "Subido ✓" : "Pendiente"} />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoPill icon={<ShieldCheck className="h-5 w-5 text-primary" />} title="Control real" text="La agenda se bloquea por barbero y horario." />
                  <InfoPill icon={<CheckCircle2 className="h-5 w-5 text-primary" />} title="Revision humana" text="Tu pago queda pendiente hasta validacion del admin." />
                </div>

                {latestBooking && (
                  <div className="rounded-[1.75rem] border border-primary/25 bg-primary/10 p-5 shadow-[0_0_30px_rgba(99,102,241,0.12)]">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Ultima reserva creada</p>
                    <p className="mt-2 text-xl font-black text-white">{latestBooking.service_name}</p>
                    <p className="mt-1 text-sm text-white/65">
                      {latestBooking.barber_name} · {latestBooking.appointment_date} · {latestBooking.start_time}
                    </p>
                    <p className="mt-4 text-sm text-white/70">
                      Estado: pendiente de verificacion de pago.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-[1.75rem] border border-primary/30 bg-card/60 shadow-[0_0_60px_rgba(139,92,246,0.15)] backdrop-blur-2xl sm:rounded-[2rem]">
              <CardHeader className="space-y-5 p-5 sm:p-8 md:p-10">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-primary/20 bg-background/50 shadow-[0_0_20px_rgba(139,92,246,0.2)] sm:h-16 sm:w-16">
                    <Calendar className="h-7 w-7 text-primary sm:h-8 sm:w-8" />
                  </div>
                  <div>
                    <CardTitle className="pb-1 text-3xl font-extrabold leading-[1.05] text-white sm:text-4xl md:text-5xl">
                      Reserva premium
                    </CardTitle>
                    <CardDescription className="text-sm text-muted-foreground/80 sm:text-base">
                      Agenda clara, disponibilidad en vivo y validacion administrativa del pago.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="px-4 pb-6 sm:px-6 sm:pb-8 md:px-10 md:pb-10">
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="rounded-[1.5rem] border border-white/10 bg-background/35 p-4 sm:rounded-[1.75rem] sm:p-5">
                      <SectionTitle icon={<User className="h-5 w-5 text-primary" />} step="Paso 1" title="Tus datos" />
                      <div className="space-y-4">
                        <Field label="Nombre completo" htmlFor="name">
                          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Juan Perez" className="h-12 rounded-xl border-primary/20 bg-background/70 text-base text-white placeholder:text-muted-foreground" />
                        </Field>
                        <Field label="Telefono" htmlFor="phone" icon={<Phone className="h-4 w-4 text-primary" />}>
                          <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+57 312 789 1889" className="h-12 rounded-xl border-primary/20 bg-background/70 text-base text-white placeholder:text-muted-foreground" />
                        </Field>
                      </div>
                    </div>

                    <div className="rounded-[1.5rem] border border-white/10 bg-background/35 p-4 sm:rounded-[1.75rem] sm:p-5">
                      <SectionTitle icon={<Scissors className="h-5 w-5 text-primary" />} step="Paso 2" title="Servicio y barbero" />
                      <div className="space-y-5">
                        <div className="space-y-3">
                          <Label className="text-muted-foreground">Servicio</Label>
                          {aiServiceFromState ? (
                            <div className="rounded-3xl border border-primary/30 bg-primary/5 p-6 backdrop-blur-md relative overflow-hidden">
                               <div className="absolute top-0 right-0 h-24 w-24 bg-primary/10 blur-3xl" />
                               <div className="flex items-center justify-between gap-4">
                                 <div>
                                   <div className="flex items-center gap-3 mb-2">
                                      <Sparkles className="h-5 w-5 text-primary" />
                                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">RECOMENDACIÓN IA ACTIVA</span>
                                   </div>
                                   <h4 className="text-xl font-black text-white italic">{aiServiceFromState}</h4>
                                   <p className="mt-2 text-xs text-white/50">Servicio personalizado basado en tu análisis facial.</p>
                                 </div>
                                 <div className="flex flex-col items-center justify-center rounded-2xl bg-primary px-4 py-3 text-primary-foreground shadow-lg shadow-primary/20">
                                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Precio</span>
                                    <span className="text-xl font-black">$18.00</span>
                                 </div>
                               </div>
                            </div>
                          ) : (
                            <div className="grid gap-3">
                              {services.map((service) => {
                                const isSelected = serviceId === String(service.id);
                                return (
                                  <button
                                    key={service.id}
                                    type="button"
                                    onClick={() => setServiceId(String(service.id))}
                                    className={[
                                      "rounded-2xl border px-4 py-4 text-left transition-all",
                                      isSelected
                                        ? "border-primary bg-primary/12 shadow-[0_0_25px_rgba(139,92,246,0.18)]"
                                        : "border-white/10 bg-background/50 hover:border-primary/30 hover:bg-white/5",
                                    ].join(" ")}
                                  >
                                    <div className="flex items-center justify-between gap-3">
                                      <div>
                                        <p className="text-sm font-black uppercase tracking-[0.15em] text-white">{service.name}</p>
                                        <p className="mt-1 text-xs text-muted-foreground">{service.duration_minutes} min</p>
                                      </div>
                                      <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] ${isSelected ? "bg-primary text-primary-foreground" : "bg-white/8 text-white/75"}`}>
                                        ${service.price.toFixed(2)}
                                      </span>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <div className="space-y-3">
                          <Label className="text-muted-foreground">Barbero</Label>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {barbers.map((barber) => {
                              const isSelected = barberId === String(barber.id);
                              return (
                                <button
                                  key={barber.id}
                                  type="button"
                                  onClick={() => {
                                    setBarberId(String(barber.id));
                                    setTime("");
                                  }}
                                  className={[
                                    "rounded-2xl border px-4 py-4 text-left transition-all",
                                    isSelected
                                      ? "border-primary bg-primary/12 shadow-[0_0_25px_rgba(139,92,246,0.18)]"
                                      : "border-white/10 bg-background/50 hover:border-primary/30 hover:bg-white/5",
                                  ].join(" ")}
                                >
                                  <p className="text-sm font-black uppercase tracking-[0.15em] text-white">{barber.full_name}</p>
                                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                                    {barber.description || "Especialista en estilo y detalle."}
                                  </p>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-white/10 bg-background/35 p-4 sm:rounded-[1.75rem] sm:p-5">
                    <SectionTitle icon={<Clock className="h-5 w-5 text-primary" />} step="Paso 3" title="Fecha y horario" />
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <Label className="flex items-center gap-2 text-muted-foreground"><Calendar className="w-4 h-4 text-primary" /> Fecha</Label>
                        <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4 xl:grid-cols-7">
                          {upcomingDates.map((calendarDate) => {
                            const isSelected = date === calendarDate;
                            const formattedDay = new Intl.DateTimeFormat("es-CO", { weekday: "short" }).format(new Date(`${calendarDate}T00:00:00`));
                            const formattedNumber = new Intl.DateTimeFormat("es-CO", { day: "2-digit" }).format(new Date(`${calendarDate}T00:00:00`));
                            const formattedMonth = new Intl.DateTimeFormat("es-CO", { month: "short" }).format(new Date(`${calendarDate}T00:00:00`));

                            return (
                              <button
                                key={calendarDate}
                                type="button"
                                onClick={() => {
                                  setDate(calendarDate);
                                  setTime("");
                                }}
                                className={[
                                  "rounded-2xl border px-2 py-3 text-center transition-all sm:px-3 sm:py-4",
                                  isSelected
                                    ? "border-primary bg-primary text-primary-foreground shadow-[0_0_24px_rgba(139,92,246,0.24)]"
                                    : "border-white/10 bg-background/50 text-white hover:border-primary/30 hover:bg-white/5",
                                ].join(" ")}
                              >
                                <span className="block text-[10px] font-bold uppercase tracking-[0.18em] opacity-80 sm:text-[11px]">{formattedDay}</span>
                                <span className="mt-1 block text-xl font-black sm:text-2xl">{formattedNumber}</span>
                                <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] opacity-80">{formattedMonth}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between gap-3">
                          <Label className="flex items-center gap-2 text-muted-foreground"><Clock className="w-4 h-4 text-primary" /> Horarios disponibles</Label>
                          <span className="text-xs text-muted-foreground">
                            {isLoadingAvailability ? "Consultando..." : canChooseTime ? "Disponibilidad en vivo" : "Elige fecha y barbero"}
                          </span>
                        </div>

                        <div className="rounded-2xl border border-primary/20 bg-background/30 p-4 md:p-5">
                          {!canChooseTime ? (
                            <p className="text-sm text-muted-foreground">Elige primero un barbero y una fecha para desbloquear los horarios disponibles.</p>
                          ) : (
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                              {availableTimes.map((slot) => {
                                const isBooked = bookedTimes.includes(slot);
                                const isSelected = time === slot;

                                return (
                                  <button
                                    key={slot}
                                    type="button"
                                    onClick={() => !isBooked && setTime(slot)}
                                    disabled={isBooked || isLoadingAvailability}
                                    className={[
                                      "min-h-14 rounded-xl border px-3 py-3 text-sm font-semibold transition-all sm:px-4",
                                      isBooked
                                        ? "cursor-not-allowed border-red-500/30 bg-red-500/10 text-red-200 opacity-70"
                                        : isSelected
                                          ? "border-primary bg-primary text-primary-foreground shadow-[0_0_24px_rgba(139,92,246,0.35)]"
                                          : "border-primary/20 bg-background/60 text-foreground hover:border-primary/60 hover:bg-primary/10",
                                    ].join(" ")}
                                  >
                                    <span className="block">{slot}</span>
                                    <span className="mt-1 block text-[11px] font-medium uppercase tracking-[0.18em]">
                                      {isBooked ? "Ocupado" : isSelected ? "Seleccionado" : "Libre"}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-white/10 bg-background/35 p-4 sm:rounded-[1.75rem] sm:p-5">
                    <SectionTitle icon={<CreditCard className="h-5 w-5 text-primary" />} step="Paso 4" title="Pago Nequi" />

                    <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
                      <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
                        <div className="overflow-hidden rounded-[1.25rem] border border-white/10 bg-white p-3">
                          <img src={NEQUI_QR_IMAGE} alt="QR de pago por Nequi" className="mx-auto aspect-square w-full max-w-[260px] object-contain" />
                        </div>
                        <p className="mt-3 text-center text-xs text-white/45">Escanea este QR desde tu app Nequi</p>
                      </div>

                      <div className="space-y-4">
                        <div className="rounded-[1.5rem] border border-primary/20 bg-primary/10 p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">Monto sugerido</p>
                          <p className="mt-2 text-2xl font-black text-white sm:text-3xl">
                            {aiServiceFromState ? "$18.00" : selectedService ? `$${selectedService.price.toFixed(2)}` : "Selecciona un servicio"}
                          </p>
                        </div>

                        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 text-sm text-white/60">
                          <p className="font-bold text-white mb-2">Instrucciones</p>
                          <p>1. Transfiere el monto total.</p>
                          <p>2. Adjunta una captura de la pantalla verde de Nequi.</p>
                        </div>

                        <div className="space-y-2">
                          <Label className="flex items-center gap-2 text-muted-foreground">Captura de pantalla (Comprobante)</Label>
                          <Label htmlFor="payment-screenshot" className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 bg-background/40 font-semibold text-primary/80 transition-all hover:bg-primary/10">
                            <UploadCloud size={18} />
                            {isUploading ? "Subiendo..." : paymentScreenshot ? "Captura subida ✓" : "Subir imagen..."}
                            <input id="payment-screenshot" type="file" accept="image/*" hidden onChange={handleFileUpload} />
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <Button type="submit" disabled={isSubmitting} className="h-14 w-full rounded-xl bg-gradient-to-r from-primary to-secondary text-base font-extrabold tracking-wide uppercase transition-all shadow-[0_0_30px_rgba(139,92,246,0.4)] hover:from-primary/80 hover:to-secondary/80 hover:shadow-[0_0_40px_rgba(139,92,246,0.6)] sm:text-lg">
                      {isSubmitting ? "Registrando..." : "Confirmar reserva"}
                    </Button>
                    <div className="rounded-2xl border border-white/10 bg-background/35 px-4 py-4 text-sm text-white/70">
                      La cita queda en estado pendiente hasta que tu pago sea revisado por administracion.
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-white text-right">{value}</span>
    </div>
  );
}

function InfoPill({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className="text-sm font-bold text-white">{title}</p>
          <p className="text-xs text-muted-foreground">{text}</p>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ icon, step, title }: { icon: ReactNode; step: string; title: string }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <div className="rounded-2xl border border-primary/20 bg-primary/10 p-3">{icon}</div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">{step}</p>
        <p className="text-lg font-bold text-white">{title}</p>
      </div>
    </div>
  );
}

function Field({
  children,
  htmlFor,
  icon,
  label,
}: {
  children: ReactNode;
  htmlFor: string;
  icon?: ReactNode;
  label: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor} className="flex items-center gap-2 text-muted-foreground">
        {icon}
        {label}
      </Label>
      {children}
    </div>
  );
}
