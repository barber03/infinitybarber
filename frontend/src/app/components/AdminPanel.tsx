import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Briefcase,
  Calendar,
  CreditCard,
  HelpCircle,
  Images,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Save,
  Scissors,
  Trash2,
  Upload,
  User,
  Users,
  Sparkles,
  Menu,
  X,
  ChevronRight,
  Bell,
  Camera,
  CheckCircle2,
  Clock,
  Filter,
  Mail,
  Phone,
  RefreshCw,
  Star,
  TrendingUp,
  Search,
  UserPlus,
  Wallet,
  XCircle,
  Terminal,
  Activity,
  Database,
  Shield
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch, resolveAssetUrl } from "../lib/api";
import { clearAuthSession, getAuthSession } from "../lib/storage";
import type { Booking } from "./BookingPage";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";

interface ServiceItem {
  id: number;
  name: string;
  price: number;
  duration_minutes: number;
  image_url?: string;
}

interface BarberItem {
  id: number;
  full_name: string;
  username: string;
  avatar_url?: string;
  description?: string;
  specialties?: string[];
  commission_rate?: number;
  work_schedule?: { days: string[]; slots: string[] };
  created_at?: string;
}

interface GalleryItem {
  id: number;
  url: string;
}

interface ClientItem {
  id: number;
  name: string;
  phone: string;
  email?: string;
  age?: number | null;
  hair_type?: string;
  favorite_style?: string;
  last_visit?: string;
  notes?: string;
  avatar_url?: string;
  loyalty_points: number;
  created_at?: string;
}

type AdminTab = "dashboard" | "reservas" | "clientes" | "servicios" | "equipo" | "galeria" | "solicitudes" | "control";

const tabs: Array<{ id: AdminTab; label: string; icon: ReactNode }> = [
  { id: "dashboard", label: "Tablero Principal", icon: <LayoutDashboard className="h-5 w-5" /> },
  { id: "reservas", label: "Citas y Reservas", icon: <Calendar className="h-5 w-5" /> },
  { id: "clientes", label: "Clientes", icon: <User className="h-5 w-5" /> },
  { id: "servicios", label: "Servicios", icon: <Briefcase className="h-5 w-5" /> },
  { id: "equipo", label: "Equipo", icon: <Users className="h-5 w-5" /> },
  { id: "galeria", label: "Galería", icon: <Images className="h-5 w-5" /> },
  { id: "solicitudes", label: "Solicitudes", icon: <HelpCircle className="h-5 w-5" /> },
  { id: "control", label: "Consola de Control", icon: <Shield className="h-5 w-5" /> },
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

const emptyBookingForm = {
  id: "",
  customer_name: "",
  customer_phone: "",
  appointment_date: "",
  start_time: "",
  service_id: "",
  barber_id: "",
  status: "pending" as Booking["status"],
  payment_method: "nequi",
  payment_status: "pending_review" as Booking["payment_status"],
  payment_reference: "",
  payment_screenshot: "",
  notes: "",
};

const emptyServiceForm = { name: "", price: "", duration_minutes: "", image_url: "" };
const emptyBarberForm = {
  id: "",
  full_name: "",
  username: "",
  description: "",
  password: "",
  avatar_url: "",
  specialties: "",
  commission_rate: "15",
};
const emptyClientForm = {
  id: "",
  name: "",
  phone: "",
  email: "",
  age: "",
  hair_type: "",
  favorite_style: "",
  last_visit: "",
  notes: "",
  avatar_url: "",
  loyalty_points: "0",
};
const ADMIN_AVATAR_KEY = "infinityAdminAvatar";

const statusOptions: Booking["status"][] = ["pending", "confirmed", "completed", "cancelled", "no_show"];
const paymentOptions: Booking["payment_status"][] = ["pending_review", "verified", "rejected"];
const availableTimes = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
const chartColors = ["#8b5cf6", "#06b6d4", "#22c55e", "#f97316", "#ef4444"];
const monthLabels = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const normalizeWhatsappPhone = (value: string) => {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("57")) return digits;
  return `57${digits}`;
};

const buildWhatsappConfirmationUrl = (booking: Booking) => {
  const phone = normalizeWhatsappPhone(booking.customer_phone);
  if (!phone) return "";

  const message = [
    `Hola ${booking.customer_name}, tu cita en Infinity Barber ha sido confirmada.`,
    `Servicio: ${booking.service_name || "Servicio seleccionado"}.`,
    `Barbero: ${booking.barber_name || "Equipo Infinity Barber"}.`,
    `Fecha: ${booking.appointment_date}.`,
    `Hora: ${booking.start_time}.`,
    "Te esperamos. Si necesitas cambiar tu cita, escribenos por este medio.",
  ].join(" ");

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
};

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [barbers, setBarbers] = useState<BarberItem[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [changeRequests, setChangeRequests] = useState<Array<{
    id: number;
    appointment_id: number;
    client_name: string;
    client_phone: string;
    original_date: string;
    original_time: string;
    requested_date: string;
    requested_time: string;
    service_name: string;
    barber_name: string;
    reason: string | null;
    status: "pending" | "approved" | "rejected";
    admin_notes: string | null;
    created_at: string;
  }>>([]);
  const [barberStats, setBarberStats] = useState<any[]>([]);
  const [bookingForm, setBookingForm] = useState(emptyBookingForm);
  const [serviceForm, setServiceForm] = useState(emptyServiceForm);
  const [barberForm, setBarberForm] = useState(emptyBarberForm);
  const [clientForm, setClientForm] = useState(emptyClientForm);
  const [barberFile, setBarberFile] = useState<File | null>(null);
  const [galleryFile, setGalleryFile] = useState<File | null>(null);
  const [clientFile, setClientFile] = useState<File | null>(null);
  const [serviceFile, setServiceFile] = useState<File | null>(null);
  const [adminAvatar, setAdminAvatar] = useState("");
  const [bookingSearch, setBookingSearch] = useState("");
  const [bookingStatusFilter, setBookingStatusFilter] = useState<"all" | Booking["status"]>("all");
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [isClientFormActive, setIsClientFormActive] = useState(false);
  const [serviceEditingId, setServiceEditingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const session = getAuthSession();

  // --- Estados de la Consola de Control y Auditoría ---
  const [activeConsoleTab, setActiveConsoleTab] = useState<"sql" | "audit" | "chats" | "system" | "backup">("sql");
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [chatSessions, setChatSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessionMessages, setSessionMessages] = useState<any[]>([]);
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [sqlQuery, setSqlQuery] = useState("SELECT * FROM profiles LIMIT 5;");
  const [sqlResult, setSqlResult] = useState<any>(null);
  const [sqlError, setSqlError] = useState<string | null>(null);
  const [isExecutingSql, setIsExecutingSql] = useState(false);
  const [isConsoleLoading, setIsConsoleLoading] = useState(false);

  // Backup states
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [isRestoring, setIsRestoring] = useState(false);

  const loadConsoleData = async (tab: "sql" | "audit" | "chats" | "system" | "backup") => {
    setIsConsoleLoading(true);
    try {
      if (tab === "audit") {
        const data = await apiFetch<any[]>("/api/admin/audit-logs");
        setAuditLogs(data);
      } else if (tab === "chats") {
        const data = await apiFetch<any[]>("/api/admin/chat-sessions");
        setChatSessions(data);
      } else if (tab === "system") {
        const data = await apiFetch<any>("/api/admin/system-info");
        setSystemInfo(data);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar la información de la consola.");
    } finally {
      setIsConsoleLoading(false);
    }
  };

  const loadChatMessages = async (sessionId: string) => {
    try {
      const data = await apiFetch<any[]>(`/api/admin/chat-sessions/${sessionId}/messages`);
      setSessionMessages(data);
      setSelectedSessionId(sessionId);
    } catch (error) {
      toast.error("Error al cargar los mensajes del chat.");
    }
  };

  const executeSqlQuery = async () => {
    if (!sqlQuery.trim()) {
      toast.error("Por favor ingresa una consulta SQL.");
      return;
    }
    setIsExecutingSql(true);
    setSqlResult(null);
    setSqlError(null);
    try {
      const result = await apiFetch<any>("/api/admin/query", {
        method: "POST",
        body: JSON.stringify({ sql: sqlQuery }),
      });
      setSqlResult(result);
      toast.success("Consulta ejecutada correctamente.");
    } catch (error) {
      setSqlError(error instanceof Error ? error.message : "Error al ejecutar la consulta SQL.");
      toast.error("Fallo al ejecutar SQL.");
    } finally {
      setIsExecutingSql(false);
    }
  };

  useEffect(() => {
    if (activeTab === "control") {
      loadConsoleData(activeConsoleTab).catch(() => {});
    }
  }, [activeTab, activeConsoleTab]);

  const loadData = async () => {
    const [bookingData, serviceData, barberData, galleryData, clientData, changeReqData, barberStatsData] = await Promise.all([
      apiFetch<Booking[]>("/api/admin/appointments"),
      apiFetch<ServiceItem[]>("/api/services"),
      apiFetch<BarberItem[]>("/api/admin/barbers"),
      apiFetch<GalleryItem[]>("/api/gallery"),
      apiFetch<ClientItem[]>("/api/admin/clients").catch((error) => {
        if (error instanceof Error && error.message.includes("Cannot GET /api/admin/clients")) {
          toast.warning("Reinicia el backend para activar la gestión de clientes.");
          return [];
        }

        throw error;
      }),
      apiFetch<typeof changeRequests>("/api/admin/change-requests").catch(() => []),
      apiFetch<any[]>("/api/admin/barbers/ranking").catch(() => []),
    ]);

    setBookings(bookingData);
    setServices(serviceData);
    setBarbers(barberData);
    setGallery(galleryData);
    setClients(clientData);
    setChangeRequests(changeReqData);
    setBarberStats(barberStatsData);
  };

  const loadOnce = useRef(false);

  useEffect(() => {
    if (loadOnce.current) return;
    loadOnce.current = true;

    loadData()
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "No se pudo cargar el panel.");
        const message = error instanceof Error ? error.message.toLowerCase() : "";
        if (message.includes("401") || message.includes("token") || message.includes("autentic")) {
          clearAuthSession();
          navigate("/admin/login", { replace: true });
        }
      })
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setAdminAvatar(window.localStorage.getItem(ADMIN_AVATAR_KEY) || "");
  }, []);

  const sortedBookings = useMemo(
    () =>
      [...bookings].sort((a, b) => {
        const dateCompare = b.appointment_date.localeCompare(a.appointment_date);
        if (dateCompare !== 0) return dateCompare;
        return b.start_time.localeCompare(a.start_time);
      }),
    [bookings]
  );

  const filteredBookings = useMemo(() => {
    const query = bookingSearch.trim().toLowerCase();

    return sortedBookings.filter((booking) => {
      const matchesStatus = bookingStatusFilter === "all" || booking.status === bookingStatusFilter;
      const matchesSearch =
        !query ||
        [
          booking.customer_name,
          booking.customer_phone,
          booking.service_name,
          booking.barber_name,
          booking.payment_reference,
          booking.appointment_date,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));

      return matchesStatus && matchesSearch;
    });
  }, [bookingSearch, bookingStatusFilter, sortedBookings]);

  const todayKey = new Date().toISOString().slice(0, 10);
  const todayBookings = bookings.filter((booking) => booking.appointment_date === todayKey);
  const weekStart = new Date(todayKey);
  weekStart.setDate(weekStart.getDate() - 6);
  const weekStartKey = weekStart.toISOString().slice(0, 10);
  const monthKey = todayKey.slice(0, 7);
  const completedBookings = bookings.filter((booking) => booking.status === "completed").length;
  const cancelledBookings = bookings.filter((booking) => booking.status === "cancelled" || booking.status === "no_show").length;
  const pendingBookings = bookings.filter((booking) => booking.status === "pending").length;
  const pendingPayments = bookings.filter((booking) => booking.payment_status === "pending_review").length;
  const confirmedBookings = bookings.filter((booking) => booking.status === "confirmed").length;
  const revenueFor = (predicate: (booking: Booking) => boolean) =>
    bookings
      .filter((booking) => booking.payment_status === "verified" && predicate(booking))
      .reduce((total, booking) => total + (booking.service_price || services.find((item) => item.id === booking.service_id)?.price || 0), 0);
  const revenueToday = revenueFor((booking) => booking.appointment_date === todayKey);
  const revenueWeek = revenueFor((booking) => booking.appointment_date >= weekStartKey && booking.appointment_date <= todayKey);
  const revenueMonth = revenueFor((booking) => booking.appointment_date.startsWith(monthKey));
  const verifiedRevenue = bookings
    .filter((booking) => booking.payment_status === "verified")
    .reduce((total, booking) => {
      return total + (booking.service_price || services.find((item) => item.id === booking.service_id)?.price || 0);
    }, 0);
  const completionRate = bookings.length ? Math.round((completedBookings / bookings.length) * 100) : 0;
  const averageTicket = bookings.length ? Math.round(verifiedRevenue / Math.max(1, bookings.filter((booking) => booking.payment_status === "verified").length)) : 0;
  const registeredCustomerPhones = new Set(clients.map((client) => client.phone));
  const customerPhonesFromBookings = new Set(bookings.map((booking) => booking.customer_phone).filter(Boolean));
  const detectedCustomers = new Set([...registeredCustomerPhones, ...customerPhonesFromBookings]).size;
  const upcomingBookings = [...bookings]
    .filter((booking) => booking.appointment_date >= todayKey && !["cancelled", "no_show"].includes(booking.status))
    .sort((a, b) => `${a.appointment_date} ${a.start_time}`.localeCompare(`${b.appointment_date} ${b.start_time}`))
    .slice(0, 6);
  const topServices = services
    .map((service) => ({
      ...service,
      sold: bookings.filter((booking) => booking.service_id === service.id && booking.status !== "cancelled").length,
      revenue: bookings
        .filter((booking) => booking.service_id === service.id && booking.payment_status === "verified")
        .reduce((total, booking) => total + (booking.service_price || service.price), 0),
    }))
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 5);
  const maxTopServiceSales = Math.max(1, ...topServices.map((service) => service.sold));
  const barberOccupancy = barbers.map((barber) => {
    const count = todayBookings.filter((booking) => booking.barber_id === barber.id && booking.status !== "cancelled").length;
    return {
      ...barber,
      count,
      percent: Math.min(100, Math.round((count / availableTimes.length) * 100)),
    };
  });
  const chartDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(todayKey);
    date.setDate(date.getDate() - (6 - index));
    const key = date.toISOString().slice(0, 10);
    return {
      key,
      label: new Intl.DateTimeFormat("es-CO", { weekday: "short" }).format(date),
      reservations: bookings.filter((booking) => booking.appointment_date === key).length,
      revenue: revenueFor((booking) => booking.appointment_date === key),
    };
  });
  const maxChartReservations = Math.max(1, ...chartDays.map((day) => day.reservations));
  const maxChartRevenue = Math.max(1, ...chartDays.map((day) => day.revenue));
  const currentYear = todayKey.slice(0, 4);
  const annualRevenueData = monthLabels.map((label, index) => {
    const month = `${currentYear}-${String(index + 1).padStart(2, "0")}`;
    const monthBookings = bookings.filter((booking) => booking.appointment_date.startsWith(month));

    return {
      month: label,
      ingresos: revenueFor((booking) => booking.appointment_date.startsWith(month)),
      reservas: monthBookings.length,
      pagos: monthBookings.filter((booking) => booking.payment_status === "verified").length,
    };
  });
  const ageGroups = [
    { name: "0-25", value: clients.filter((client) => Number(client.age || 0) > 0 && Number(client.age) <= 25).length },
    { name: "26-40", value: clients.filter((client) => Number(client.age || 0) >= 26 && Number(client.age) <= 40).length },
    { name: "41+", value: clients.filter((client) => Number(client.age || 0) >= 41).length },
  ].filter((group) => group.value > 0);
  const ageChartData = ageGroups.length ? ageGroups : [{ name: "Sin edad", value: Math.max(1, clients.length || 1) }];
  const paymentStatusData = [
    { name: "Verificados", value: bookings.filter((booking) => booking.payment_status === "verified").length },
    { name: "En revisión", value: pendingPayments },
    { name: "Rechazados", value: bookings.filter((booking) => booking.payment_status === "rejected").length },
  ].filter((item) => item.value > 0);
  const bookingStatusData = statusOptions
    .map((status) => ({ name: statusLabels[status], value: bookings.filter((booking) => booking.status === status).length }))
    .filter((item) => item.value > 0);

  // --- Cálculo de tendencias dinámicas ---
  const prev7DaysKeys = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(todayKey);
    date.setDate(date.getDate() - (index + 1));
    return date.toISOString().slice(0, 10);
  });
  
  // 1. Ganancias hoy vs promedio últimos 7 días
  const prev7DaysRevenues = prev7DaysKeys.map(key => revenueFor((booking) => booking.appointment_date === key));
  const avgRevenuePrev7 = prev7DaysRevenues.reduce((a, b) => a + b, 0) / 7;
  const revenueTrend = avgRevenuePrev7 > 0 ? ((revenueToday - avgRevenuePrev7) / avgRevenuePrev7) * 100 : 0;

  // 2. Citas hoy vs promedio últimos 7 días
  const prev7DaysBookingsCount = prev7DaysKeys.map(key => bookings.filter((booking) => booking.appointment_date === key).length);
  const avgBookingsPrev7 = prev7DaysBookingsCount.reduce((a, b) => a + b, 0) / 7;
  const bookingsTrend = avgBookingsPrev7 > 0 ? ((todayBookings.length - avgBookingsPrev7) / avgBookingsPrev7) * 100 : 0;

  // 3. Registro de clientes última semana vs semana anterior
  const clientsCreatedLast7Days = clients.filter(c => {
    if (!c.created_at) return false;
    const createdDate = c.created_at.slice(0, 10);
    return createdDate >= weekStartKey && createdDate <= todayKey;
  }).length;
  const prevWeekStart = new Date(weekStart);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);
  const prevWeekStartKey = prevWeekStart.toISOString().slice(0, 10);
  const clientsCreatedPrev7Days = clients.filter(c => {
    if (!c.created_at) return false;
    const createdDate = c.created_at.slice(0, 10);
    return createdDate >= prevWeekStartKey && createdDate < weekStartKey;
  }).length;
  const clientsTrend = clientsCreatedPrev7Days > 0 
    ? ((clientsCreatedLast7Days - clientsCreatedPrev7Days) / clientsCreatedPrev7Days) * 100 
    : (clientsCreatedLast7Days > 0 ? 100 : 0);

  // 4. Ticket promedio hoy vs promedio semanal
  const verifiedTodayBookings = todayBookings.filter(b => b.payment_status === "verified");
  const averageTicketToday = verifiedTodayBookings.length 
    ? revenueToday / verifiedTodayBookings.length 
    : 0;
  const verifiedWeekBookings = bookings.filter(b => b.payment_status === "verified" && b.appointment_date >= weekStartKey && b.appointment_date <= todayKey);
  const averageTicketWeek = verifiedWeekBookings.length 
    ? revenueWeek / verifiedWeekBookings.length 
    : 0;
  const ticketTrend = averageTicketWeek > 0 
    ? ((averageTicketToday - averageTicketWeek) / averageTicketWeek) * 100 
    : 0;

  const proKpis = [
    {
      title: "Ganancias hoy",
      value: `$${revenueToday.toLocaleString()}`,
      caption: `Promedio 7d: $${Math.round(avgRevenuePrev7).toLocaleString()}`,
      trend: revenueTrend,
      icon: <Wallet className="h-5 w-5" />,
      tone: "from-emerald-400/25 to-cyan-400/10",
      glow: "#22c55e",
    },
    {
      title: "Citas del día",
      value: todayBookings.length,
      caption: `Promedio 7d: ${avgBookingsPrev7.toFixed(1)}`,
      trend: bookingsTrend,
      icon: <Calendar className="h-5 w-5" />,
      tone: "from-sky-400/25 to-primary/10",
      glow: "#6366f1",
    },
    {
      title: "Clientes",
      value: clients.length,
      caption: `+${clientsCreatedLast7Days} esta semana`,
      trend: clientsTrend,
      icon: <Users className="h-5 w-5" />,
      tone: "from-violet-400/25 to-fuchsia-400/10",
      glow: "#a855f7",
    },
    {
      title: "Ticket promedio",
      value: `$${averageTicket.toLocaleString()}`,
      caption: `Promedio sem: $${Math.round(averageTicketWeek).toLocaleString()}`,
      trend: ticketTrend,
      icon: <TrendingUp className="h-5 w-5" />,
      tone: "from-rose-400/25 to-orange-400/10",
      glow: "#f97316",
    },
  ];
  const selectedClient = selectedClientId !== null ? (clients.find((client) => client.id === selectedClientId) || null) : null;
  const selectedClientBookings = selectedClient
    ? bookings
        .filter((booking) => booking.customer_phone === selectedClient.phone)
        .sort((a, b) => `${b.appointment_date} ${b.start_time}`.localeCompare(`${a.appointment_date} ${a.start_time}`))
    : [];
  const selectedClientPayments = selectedClientBookings.filter((booking) => booking.payment_status === "verified");
  const selectedClientSpent = selectedClientPayments.reduce((total, booking) => total + (booking.service_price || 0), 0);
  const filteredClients = clients.filter((client) => {
    const query = clientSearch.trim().toLowerCase();
    if (!query) return true;
    return [client.name, client.phone, client.email, client.hair_type, client.favorite_style]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });

  const handleLogout = () => {
    clearAuthSession();
    toast.success("Sesion cerrada.");
    navigate("/admin/login");
  };

  const downloadCSV = (filename: string, headers: string[], data: string[][]) => {
    const csvContent = "\uFEFF" + [
      headers.join(","),
      ...data.map(row => 
        row.map(val => {
          const formatted = String(val || "").replace(/"/g, '""');
          return formatted.includes(",") || formatted.includes("\n") || formatted.includes('"')
            ? `"${formatted}"`
            : formatted;
        }).join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportBookingsToCSV = () => {
    const headers = ["ID", "Cliente", "Telefono", "Fecha", "Hora", "Servicio", "Barbero", "Estado", "Metodo Pago", "Referencia", "Estado Pago", "Notas"];
    const rows = filteredBookings.map(b => [
      String(b.id),
      b.customer_name,
      b.customer_phone,
      b.appointment_date,
      b.start_time,
      b.service_name || "",
      b.barber_name || "",
      statusLabels[b.status] || b.status,
      b.payment_method || "",
      b.payment_reference || "",
      paymentLabels[b.payment_status] || b.payment_status,
      b.notes || ""
    ]);
    downloadCSV(`citas-infinitybarber-${Date.now()}.csv`, headers, rows);
    toast.success("CSV de reservas exportado correctamente.");
  };

  const exportClientsToCSV = () => {
    const headers = ["ID", "Nombre", "Telefono", "Email", "Edad", "Tipo Cabello", "Estilo Favorito", "Puntos Fidelidad", "Ultima Visita", "Notas"];
    const rows = filteredClients.map(c => [
      String(c.id),
      c.name,
      c.phone,
      c.email || "",
      c.age ? String(c.age) : "",
      c.hair_type || "",
      c.favorite_style || "",
      String(c.loyalty_points),
      c.last_visit || "",
      c.notes || ""
    ]);
    downloadCSV(`clientes-infinitybarber-${Date.now()}.csv`, headers, rows);
    toast.success("CSV de clientes exportado correctamente.");
  };

  const handleExportBackup = async () => {
    try {
      const backupData = await apiFetch<any>("/api/admin/backup/export");
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `backup-infinitybarber-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Copia de seguridad exportada correctamente.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Fallo al exportar copia de seguridad.");
    }
  };

  const handleImportBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!backupFile) {
      toast.error("Selecciona un archivo JSON de copia de seguridad.");
      return;
    }
    if (confirmText !== "RESTAURAR") {
      toast.error("Confirma escribiendo 'RESTAURAR' en el cuadro de texto.");
      return;
    }

    setIsRestoring(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const res = await apiFetch<any>("/api/admin/backup/import", {
          method: "POST",
          body: JSON.stringify(json),
        });
        toast.success(res.message || "Copia de seguridad restaurada correctamente.");
        setBackupFile(null);
        setConfirmText("");
        await loadData();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error al restaurar el respaldo.");
      } finally {
        setIsRestoring(false);
      }
    };
    reader.readAsText(backupFile);
  };

  const handleAdminAvatarChange = (file?: File) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const image = String(reader.result || "");
      setAdminAvatar(image);
      window.localStorage.setItem(ADMIN_AVATAR_KEY, image);
      toast.success("Foto de perfil actualizada.");
    };
    reader.readAsDataURL(file);
  };

  const startBookingEdit = (booking: Booking) => {
    setBookingForm({
      id: String(booking.id),
      customer_name: booking.customer_name,
      customer_phone: booking.customer_phone,
      appointment_date: booking.appointment_date,
      start_time: booking.start_time,
      service_id: String(booking.service_id),
      barber_id: String(booking.barber_id),
      status: booking.status,
      payment_method: booking.payment_method || "nequi",
      payment_status: booking.payment_status,
      payment_reference: booking.payment_reference || "",
      payment_screenshot: booking.payment_screenshot || "",
      notes: booking.notes || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.id) return;

    try {
      await apiFetch(`/api/admin/appointments/${bookingForm.id}`, {
        method: "PUT",
        body: JSON.stringify({
          customer_name: bookingForm.customer_name,
          customer_phone: bookingForm.customer_phone,
          appointment_date: bookingForm.appointment_date,
          start_time: bookingForm.start_time,
          service_id: Number(bookingForm.service_id),
          barber_id: Number(bookingForm.barber_id),
          status: bookingForm.status,
          payment_method: bookingForm.payment_method,
          payment_reference: bookingForm.payment_reference,
          payment_screenshot: bookingForm.payment_screenshot,
          payment_status: bookingForm.payment_status,
          notes: bookingForm.notes,
        }),
      });
      toast.success("Reserva actualizada.");
      setBookingForm(emptyBookingForm);
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar la reserva.");
    }
  };

  const updateBookingStatus = async (bookingId: number, status?: Booking["status"], payment_status?: Booking["payment_status"]) => {
    try {
      await apiFetch(`/api/admin/appointments/${bookingId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, payment_status }),
      });
      toast.success("Reserva actualizada.");
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar el estado.");
    }
  };

  const deleteBooking = async (bookingId: number) => {
    try {
      await apiFetch(`/api/admin/appointments/${bookingId}`, { method: "DELETE" });
      toast.success("Reserva eliminada.");
      if (String(bookingId) === bookingForm.id) setBookingForm(emptyBookingForm);
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar la reserva.");
    }
  };

  const uploadClientFile = async () => {
    if (!clientFile) return clientForm.avatar_url;

    const formData = new FormData();
    formData.append("image", clientFile);
    const response = await apiFetch<{ url: string }>("/api/admin/clients/upload", {
      method: "POST",
      body: formData,
    });
    return response.url;
  };

  const saveClient = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const avatarUrl = await uploadClientFile();
      const payload = {
        name: clientForm.name,
        phone: clientForm.phone,
        email: clientForm.email,
        age: clientForm.age ? Number(clientForm.age) : null,
        hair_type: clientForm.hair_type,
        favorite_style: clientForm.favorite_style,
        last_visit: clientForm.last_visit,
        notes: clientForm.notes,
        avatar_url: avatarUrl,
        loyalty_points: Number(clientForm.loyalty_points || 0),
      };

      if (clientForm.id) {
        await apiFetch(`/api/admin/clients/${clientForm.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        toast.success("Cliente actualizado.");
      } else {
        await apiFetch("/api/admin/clients", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Cliente registrado.");
      }

      setClientForm(emptyClientForm);
      setClientFile(null);
      setIsClientFormActive(false);
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el cliente.");
    }
  };

  const editClient = (client: ClientItem) => {
    setClientForm({
      id: String(client.id),
      name: client.name,
      phone: client.phone,
      email: client.email || "",
      age: client.age ? String(client.age) : "",
      hair_type: client.hair_type || "",
      favorite_style: client.favorite_style || "",
      last_visit: client.last_visit || "",
      notes: client.notes || "",
      avatar_url: client.avatar_url || "",
      loyalty_points: String(client.loyalty_points || 0),
    });
    setClientFile(null);
    setSelectedClientId(client.id);
    setIsClientFormActive(true);
  };

  const deleteClient = async (clientId: number) => {
    try {
      await apiFetch(`/api/admin/clients/${clientId}`, { method: "DELETE" });
      toast.success("Cliente eliminado.");
      if (String(clientId) === clientForm.id) setClientForm(emptyClientForm);
      if (selectedClientId === clientId) setSelectedClientId(null);
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar el cliente.");
    }
  };

  const handleResetPin = async (phone: string, name: string) => {
    const input = window.prompt(`Restablecer PIN para ${name}. Introduce un nuevo PIN de 4 dígitos (deja vacío para restablecer a "1234"):`);
    if (input === null) return; // cancelado

    const pin = input.trim() || "1234";
    if (!/^\d{4}$/.test(pin)) {
      toast.error("El PIN debe ser exactamente de 4 dígitos numéricos.");
      return;
    }

    try {
      await apiFetch("/api/admin/clients/reset-pin", {
        method: "POST",
        body: JSON.stringify({ phone, pin }),
      });
      toast.success(`PIN de ${name} restablecido exitosamente a "${pin}".`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo restablecer el PIN.");
    }
  };

  const uploadServiceFile = async () => {
    if (!serviceFile) return serviceForm.image_url;

    const formData = new FormData();
    formData.append("image", serviceFile);
    const response = await apiFetch<{ url: string }>("/api/admin/services/upload", {
      method: "POST",
      body: formData,
    });
    return response.url;
  };

  const saveService = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const imageUrl = await uploadServiceFile();
      const payload = {
        name: serviceForm.name,
        price: Number(serviceForm.price),
        duration_minutes: Number(serviceForm.duration_minutes),
        image_url: imageUrl,
      };

      await apiFetch(serviceEditingId ? `/api/admin/services/${serviceEditingId}` : "/api/admin/services", {
        method: serviceEditingId ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      toast.success(serviceEditingId ? "Servicio actualizado." : "Servicio creado.");
      setServiceForm(emptyServiceForm);
      setServiceEditingId(null);
      setServiceFile(null);
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el servicio.");
    }
  };

  const editService = (service: ServiceItem) => {
    setServiceEditingId(service.id);
    setServiceForm({
      name: service.name,
      price: String(service.price),
      duration_minutes: String(service.duration_minutes),
      image_url: service.image_url || "",
    });
    setServiceFile(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteService = async (serviceId: number) => {
    try {
      await apiFetch(`/api/admin/services/${serviceId}`, { method: "DELETE" });
      toast.success("Servicio eliminado.");
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar el servicio.");
    }
  };

  const editBarber = (barber: BarberItem) => {
    setBarberForm({
      id: String(barber.id),
      full_name: barber.full_name,
      username: barber.username,
      description: barber.description || "",
      password: "",
      avatar_url: barber.avatar_url || "",
      specialties: (barber.specialties || []).join(", "),
      commission_rate: String(barber.commission_rate ?? 15),
    });
    setBarberFile(null);
  };

  const uploadBarberFile = async () => {
    if (!barberFile) return barberForm.avatar_url;

    const formData = new FormData();
    formData.append("image", barberFile);
    const response = await apiFetch<{ url: string }>("/api/admin/barbers/upload", {
      method: "POST",
      body: formData,
    });
    return response.url;
  };

  const saveBarber = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const avatarUrl = await uploadBarberFile();
      const existing = barbers.find((b) => String(b.id) === String(barberForm.id));
      const payload = {
        full_name: barberForm.full_name,
        username: barberForm.username,
        description: barberForm.description,
        password: barberForm.password,
        avatar_url: avatarUrl,
        specialties: barberForm.specialties
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        commission_rate: Number(barberForm.commission_rate || 15),
        work_schedule: existing ? existing.work_schedule : undefined,
      };

      if (barberForm.id) {
        await apiFetch(`/api/admin/barbers/${barberForm.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        toast.success("Barbero actualizado.");
      } else {
        await apiFetch("/api/admin/barbers", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Barbero creado.");
      }

      setBarberForm(emptyBarberForm);
      setBarberFile(null);
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el barbero.");
    }
  };

  const deleteBarber = async (barberId: number) => {
    try {
      await apiFetch(`/api/admin/barbers/${barberId}`, { method: "DELETE" });
      toast.success("Barbero eliminado.");
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar el barbero.");
    }
  };

  const uploadGalleryImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!galleryFile) {
      toast.error("Selecciona una imagen.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("image", galleryFile);
      await apiFetch("/api/admin/gallery/upload", {
        method: "POST",
        body: formData,
      });
      toast.success("Imagen subida.");
      setGalleryFile(null);
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo subir la imagen.");
    }
  };

  const deleteGalleryImage = async (imageId: number) => {
    try {
      await apiFetch(`/api/admin/gallery/${imageId}`, { method: "DELETE" });
      toast.success("Imagen eliminada.");
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar la imagen.");
    }
  };

  const handleChangeRequestAction = async (id: number, action: "approve" | "reject", notes: string) => {
    try {
      const res = await apiFetch<{ ok: boolean; status: string }>(`/api/admin/change-requests/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ action, admin_notes: notes }),
      });
      if (res.ok) {
        toast.success(`Solicitud ${action === "approve" ? "aprobada" : "rechazada"} con éxito`);
        await loadData();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al procesar la solicitud");
    }
  };

  return (
    <div className="flex min-h-screen bg-[#06060a] bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(120,119,198,0.1),rgba(255,255,255,0))] text-foreground font-sans selection:bg-primary/30">
      
      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-50 h-screen w-72 transform border-r border-white/5 bg-[#0a0a0f]/95 backdrop-blur-2xl transition-transform duration-300 ease-in-out lg:sticky lg:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-full flex-col overflow-y-auto">
          <div className="flex items-center justify-between px-6 py-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-600 shadow-lg shadow-primary/20 hover:scale-110 transition-transform duration-300">
                <Scissors className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white">Infinity</h1>
                <p className="text-[10px] font-medium uppercase tracking-widest text-white/50">Panel de administración</p>
              </div>
            </div>
            <button className="text-white/50 hover:text-white lg:hidden" onClick={() => setIsSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="group mx-4 mb-6 rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:bg-white/[0.04]">
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 overflow-hidden rounded-full border border-white/10 bg-white/5 transition-transform duration-300 group-hover:scale-105">
                <img src={adminAvatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin"} alt="Admin" className="h-full w-full object-cover" />
                <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/55 opacity-0 transition-opacity hover:opacity-100" title="Cambiar foto">
                  <Camera className="h-4 w-4 text-white" />
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleAdminAvatarChange(e.target.files?.[0])} />
                </label>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white transition-colors">Hola, {session?.user?.username || "Admin"}</p>
                <p className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  En línea
                </p>
                <label className="mt-2 inline-flex cursor-pointer items-center gap-1.5 text-[11px] font-semibold text-primary transition-colors hover:text-white">
                  <Camera className="h-3 w-3" />
                  Cambiar foto
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleAdminAvatarChange(e.target.files?.[0])} />
                </label>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-2 px-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setIsSidebarOpen(false);
                }}
                className={`group relative flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-sm font-medium transition-all duration-300 overflow-hidden ${
                  activeTab === tab.id
                    ? "bg-primary/20 text-white shadow-[0_0_20px_rgba(99,102,241,0.15)] ring-1 ring-primary/50"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                {activeTab === tab.id && <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent opacity-50"></div>}
                <div className="relative flex items-center gap-3 z-10">
                  <div className={`transition-all duration-300 ${activeTab === tab.id ? "scale-110 text-primary drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]" : "group-hover:scale-110 group-hover:text-white"}`}>
                    {tab.icon}
                  </div>
                  <span className="tracking-wide">{tab.label}</span>
                </div>
                {activeTab === tab.id && <ChevronRight className="relative h-4 w-4 text-primary z-10" />}
              </button>
            ))}
          </nav>

          <div className="p-4 mt-auto">
            <Button 
               variant="ghost" 
               className="mt-3 w-full justify-start gap-3 text-red-500/70 hover:bg-red-500/10 hover:text-red-400 transition-all duration-300 rounded-xl"
               onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full flex flex-col min-h-screen">
        {/* Top Header (Mobile & Desktop) */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/5 bg-[#0a0a0f]/80 px-6 py-4 backdrop-blur-md">
          <div className="flex items-center gap-4 lg:hidden">
            <button className="text-white/70 hover:text-white transition-colors" onClick={() => setIsSidebarOpen(true)}>
              <Menu className="h-6 w-6" />
            </button>
            <h2 className="font-semibold text-white">{tabs.find((t) => t.id === activeTab)?.label}</h2>
          </div>
          <div className="hidden lg:block">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              {tabs.find(t => t.id === activeTab)?.label}
              <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_12px_rgba(99,102,241,0.8)] animate-pulse"></div>
            </h2>
          </div>
          <div className="flex items-center gap-4">
             <button title="Actualizar datos" onClick={() => {
                setIsLoading(true);
                loadData()
                  .then(() => toast.success("Panel actualizado."))
                  .catch((error) => toast.error(error instanceof Error ? error.message : "No se pudo actualizar."))
                  .finally(() => setIsLoading(false));
             }} className="hidden h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/10 hover:text-white active:scale-95 sm:flex">
                <RefreshCw className="h-5 w-5" />
             </button>
             <button title="Click para scrollear a citas pendientes" onClick={() => {
                const list = document.getElementById("reservas-list");
                if (list) list.scrollIntoView({ behavior: "smooth" });
             }} className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition-all duration-300 hover:bg-white/10 hover:text-white hover:scale-105 active:scale-95 cursor-pointer">
                <Bell className="h-5 w-5" />
                {pendingBookings > 0 && (
                   <span className="absolute right-2.5 top-2.5 flex h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,1)] ring-2 ring-[#0a0a0f] animate-pulse"></span>
                )}
             </button>
             <div className="hidden h-11 w-11 items-center justify-center rounded-full border border-primary/20 bg-primary/10 transition-transform hover:rotate-12 duration-300 lg:flex">
                <Sparkles className="h-5 w-5 text-primary drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
             </div>
             <img src={adminAvatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin"} alt="Admin" className="hidden h-11 w-11 rounded-full border border-white/10 object-cover lg:block" />
          </div>
        </header>

        <div className="flex-1 p-6 lg:p-8">
          
          {isLoading ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
              <div className="relative h-20 w-20">
                 <div className="absolute inset-0 rounded-full border-4 border-white/5"></div>
                 <div className="absolute inset-0 animate-spin rounded-full border-t-4 border-l-4 border-primary shadow-[0_0_20px_rgba(99,102,241,0.5)]"></div>
              </div>
              <p className="text-sm font-medium text-white/50 tracking-widest animate-pulse">CARGANDO...</p>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 mx-auto max-w-6xl">
              {activeTab === "dashboard" && (
                <div className="space-y-10">
                  
                  {/* Hero Summary Banner */}
                  <div className="admin-light-sweep admin-panel-glow relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(19,19,32,0.96),rgba(7,7,12,0.98))] p-6 shadow-[0_30px_90px_-50px_rgba(139,92,246,0.9)]">
                    <div className="admin-hero-orb absolute right-8 top-8 h-32 w-32 rounded-full bg-primary/25 blur-3xl" />
                    <div className="admin-hero-orb-delay absolute bottom-2 left-1/4 h-28 w-72 rounded-full bg-cyan-400/15 blur-3xl" />
                    <div className="absolute -bottom-6 left-1/2 h-20 w-[70%] -translate-x-1/2 rounded-full bg-gradient-to-r from-transparent via-primary/40 to-transparent blur-2xl" />
                    <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                      <div>
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary shadow-[0_0_20px_rgba(99,102,241,0.25)]">
                          <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                          Panel Inteligente
                        </div>
                        <h3 className="max-w-2xl bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-3xl font-black text-transparent md:text-4xl">
                          Centro de Control Infinity Barber
                        </h3>
                        <p className="mt-2 max-w-2xl text-sm text-white/50">
                          Resumen ejecutivo en tiempo real de ingresos, reservas, fidelización y ocupación del equipo.
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-white/55">
                          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">{completionRate}% completadas</span>
                          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">{pendingPayments} pagos en revisión</span>
                          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">{pendingBookings} citas pendientes</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur-xl">
                        <HeroMiniStat label="Hoy" value={`$${revenueToday.toLocaleString()}`} glow="#22c55e" delay={0} />
                        <HeroMiniStat label="Semana" value={`$${revenueWeek.toLocaleString()}`} glow="#6366f1" delay={150} />
                        <HeroMiniStat label="Mes" value={`$${revenueMonth.toLocaleString()}`} glow="#06b6d4" delay={300} />
                      </div>
                    </div>
                  </div>

                  {/* 4 Analytics Metrics */}
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {proKpis.map((kpi, index) => (
                      <ProMetricCard key={kpi.title} {...kpi} delay={index * 80} />
                    ))}
                  </div>

                  {/* Charts Grid - Level 1 */}
                  <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                    <ProChartPanel title="Actividad de los últimos 7 días" action="En vivo" glow="#06b6d4">
                      <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={chartDays} margin={{ top: 10, right: -10, left: -10, bottom: 0 }}>
                            <defs>
                              <linearGradient id="glowRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#22c55e" stopOpacity={0.0} />
                              </linearGradient>
                              <linearGradient id="glowReservationsGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }} />
                            <YAxis yAxisId="left" tickLine={false} axisLine={false} tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} tickFormatter={(value) => `$${value >= 1000 ? (value / 1000) + 'K' : value}`} />
                            <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} />
                            <Tooltip content={<ProMultiTooltip />} />
                            <Bar yAxisId="right" dataKey="reservations" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={24} />
                            <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={3} fill="url(#glowRevenueGradient)" dot={{ r: 4, fill: "#ffffff", stroke: "#22c55e", strokeWidth: 2 }} activeDot={{ r: 6, fill: "#0b0b14", stroke: "#22c55e", strokeWidth: 2 }} />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </ProChartPanel>

                    <ProChartPanel title="Ingresos Anuales" action="Año" glow="#a855f7">
                      <div className="h-60">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={annualRevenueData} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.42} />
                                <stop offset="95%" stopColor="#a855f7" stopOpacity={0.02} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                            <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 12 }} />
                            <YAxis tickLine={false} axisLine={false} tick={{ fill: "rgba(255,255,255,0.38)", fontSize: 12 }} tickFormatter={(value) => `$${Number(value) / 1000}K`} />
                            <Tooltip content={<ProTooltip label="Ingresos" formatter={(value: any) => `$${Number(value).toLocaleString()}`} />} />
                            <Area type="monotone" dataKey="ingresos" stroke="#a855f7" strokeWidth={3} fill="url(#revenueGradient)" dot={{ r: 4, fill: "#ffffff", stroke: "#a855f7", strokeWidth: 2 }} activeDot={{ r: 7, fill: "#0b0b14", stroke: "#a855f7", strokeWidth: 3 }} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </ProChartPanel>
                  </div>

                  {/* Charts Grid - Level 2 */}
                  <div className="grid gap-6 xl:grid-cols-3">
                    <ProChartPanel title="Reservas por Mes" action="Año" glow="#06b6d4">
                      <div className="h-60">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={annualRevenueData} margin={{ top: 14, right: 8, left: -18, bottom: 0 }}>
                            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                            <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }} />
                            <YAxis tickLine={false} axisLine={false} tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} />
                            <Tooltip content={<ProTooltip label="Reservas" />} />
                            <Bar dataKey="reservas" radius={[10, 10, 4, 4]} fill="#06b6d4" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </ProChartPanel>

                    <ProChartPanel title="Edad de Clientes" action="Distribución" glow="#22c55e">
                      <div className="relative h-60">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={ageChartData} innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value" stroke="rgba(255,255,255,0.06)" strokeWidth={4}>
                              {ageChartData.map((entry, index) => (
                                <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                              ))}
                            </Pie>
                            <Tooltip content={<ProTooltip label="Clientes" />} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <p className="text-2xl font-black text-white">100%</p>
                            <p className="text-[10px] font-semibold uppercase text-white/40">Clientes</p>
                          </div>
                        </div>
                      </div>
                    </ProChartPanel>

                    <ProChartPanel title="Estado de Pagos" action="Distribución" glow="#f97316">
                      <div className="relative h-60">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={paymentStatusData} innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value" stroke="rgba(255,255,255,0.06)" strokeWidth={4}>
                              {paymentStatusData.map((entry, index) => (
                                <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                              ))}
                            </Pie>
                            <Tooltip content={<ProTooltip label="Pagos" />} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <p className="text-2xl font-black text-white">{bookings.length}</p>
                            <p className="text-[10px] font-semibold uppercase text-white/35">Total</p>
                          </div>
                        </div>
                      </div>
                    </ProChartPanel>
                  </div>

                  {/* Summary Lists Grid */}
                  <div className="grid gap-6 xl:grid-cols-[1fr_1fr_1.2fr]">
                    <ProChartPanel title="Servicios más Vendidos" action="Top 5" glow="#ec4899">
                      <div className="space-y-3">
                        {topServices.map((service, index) => (
                          <div key={service.id} className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3 transition-all hover:-translate-y-0.5 hover:bg-white/[0.05]">
                            <div className="mb-2 flex items-center justify-between gap-3">
                              <div className="flex min-w-0 items-center gap-2">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[10px] font-black text-white" style={{ backgroundColor: chartColors[index % chartColors.length] }}>{index + 1}</span>
                                <p className="truncate text-xs font-bold text-white">{service.name}</p>
                              </div>
                              <span className="text-[10px] font-bold text-white/55">{service.sold} ventas</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-white/10">
                              <div className="h-full rounded-full" style={{ width: `${(service.sold / maxTopServiceSales) * 100}%`, background: `linear-gradient(90deg, ${chartColors[index % chartColors.length]}, #ffffff99)` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </ProChartPanel>

                    <ProChartPanel title="Ocupación de Barberos" action="Hoy" glow="#22c55e">
                      <div className="space-y-3">
                        {barberOccupancy.map((barber, index) => (
                          <div key={barber.id} className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
                            <div className="mb-2 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <img src={resolveAssetUrl(barber.avatar_url) || "https://api.dicebear.com/7.x/avataaars/svg"} alt={barber.full_name} className="h-8 w-8 rounded-lg object-cover ring-2 ring-white/10" />
                                <div>
                                  <p className="text-xs font-bold text-white leading-none">{barber.full_name}</p>
                                  <p className="text-[9px] text-white/40 mt-0.5">{barber.count} citas</p>
                                </div>
                              </div>
                              <span className="rounded-lg bg-white/[0.08] px-2 py-0.5 text-[10px] font-black text-white">{barber.percent}%</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-white/10">
                              <div className="h-full rounded-full" style={{ width: `${barber.percent}%`, background: `linear-gradient(90deg, ${chartColors[index % chartColors.length]}, #22c55e)` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </ProChartPanel>

                    <ProChartPanel title="Próximas Citas" action={`${upcomingBookings.length} Activas`} glow="#6366f1">
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                        {upcomingBookings.slice(0, 4).map((booking) => (
                          <div key={booking.id} className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-left transition-all hover:border-primary/35 hover:bg-white/[0.04]">
                            <div className="mb-2 flex items-center justify-between">
                              <span className="rounded-lg bg-primary/12 px-2 py-0.5 text-[10px] font-bold text-primary">{booking.start_time}</span>
                              <StatusBadge status={booking.status} />
                            </div>
                            <p className="truncate text-xs font-bold text-white">{booking.customer_name}</p>
                            <p className="text-[10px] text-white/45 mt-0.5">{booking.service_name}</p>
                          </div>
                        ))}
                        {upcomingBookings.length === 0 && <EmptyInsight text="No hay citas próximas." />}
                      </div>
                    </ProChartPanel>
                  </div>
                </div>
              )}

              {activeTab === "reservas" && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  {/* Grid de estado rápido */}
                  <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                    <MiniStat label="Pagos por Verificar" value={pendingPayments} />
                    <MiniStat label="Citas Pendientes" value={pendingBookings} />
                    <MiniStat label="Citas Confirmadas" value={confirmedBookings} />
                    <MiniStat label="Citas Completadas" value={completedBookings} />
                  </div>

                  {/* Tabla y Filtros */}
                  <div className="space-y-6" id="reservas-list">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-primary/20"><Calendar className="h-5 w-5 text-primary" /></div>
                          Gestión de Reservas
                        </h3>
                        <p className="text-xs text-white/50 mt-1">Monitorea los comprobantes de pago de Nequi, confirma citas y ajusta horarios.</p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px_130px] lg:w-[700px]">
                        <div className="relative">
                          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                          <ModernInput
                            value={bookingSearch}
                            onChange={(e: any) => setBookingSearch(e.target.value)}
                            placeholder="Buscar cliente, barbero, servicio o referencia"
                            className="pl-10"
                          />
                        </div>
                        <div className="relative">
                          <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                          <ModernSelect value={bookingStatusFilter} onChange={(e: any) => setBookingStatusFilter(e.target.value as any)} className="pl-10">
                            <option value="all">Todos los estados</option>
                            {statusOptions.map((status) => (
                              <option key={status} value={status}>{statusLabels[status]}</option>
                            ))}
                          </ModernSelect>
                        </div>
                        <Button 
                          onClick={exportBookingsToCSV} 
                          variant="outline"
                          className="h-11 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white text-xs font-bold px-4 flex items-center gap-2 justify-center"
                        >
                          <Upload className="h-4 w-4 rotate-180" />
                          Exportar CSV
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-4">
                      {filteredBookings.map((booking, i) => (
                        <div key={booking.id} style={{animationDelay: `${i * 30}ms`}} className="group relative flex flex-col gap-4 rounded-2xl border border-white/5 bg-gradient-to-r from-white/[0.02] to-white/[0.01] p-5 transition-all duration-300 ease-out hover:bg-white/[0.04] hover:border-primary/30 hover:shadow-[0_20px_40px_-20px_rgba(99,102,241,0.25)] hover:-translate-y-0.5 md:flex-row md:items-center md:justify-between animate-in fade-in slide-in-from-bottom-2">
                          <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-primary to-purple-600 rounded-l-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                          <div className="flex flex-col gap-2 pl-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-lg font-bold text-white group-hover:text-primary transition-colors duration-300">{booking.customer_name}</h4>
                              <StatusBadge status={booking.status} />
                              <PaymentBadge status={booking.payment_status} />
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-white/50">
                              <span className="flex items-center gap-1 rounded-md bg-white/5 px-2 py-0.5"><Calendar className="h-3.5 w-3.5 text-blue-400" />{booking.appointment_date} / {booking.start_time}</span>
                              <span className="flex items-center gap-1 rounded-md bg-white/5 px-2 py-0.5"><Briefcase className="h-3.5 w-3.5 text-purple-400" />{booking.service_name}</span>
                              <span className="flex items-center gap-1 rounded-md bg-white/5 px-2 py-0.5"><Scissors className="h-3.5 w-3.5 text-emerald-400" />{booking.barber_name}</span>
                              <span className="flex items-center gap-1 rounded-md bg-white/5 px-2 py-0.5 capitalize"><CreditCard className="h-3.5 w-3.5 text-indigo-400" />{booking.payment_method}</span>
                              <span>Ref: <strong className="text-white/80 font-mono">{booking.payment_reference || "N/A"}</strong></span>
                              {booking.payment_screenshot && (
                                 <a href={resolveAssetUrl(booking.payment_screenshot)} target="_blank" rel="noreferrer" className="text-primary hover:underline hover:text-white transition-colors text-xs font-bold">Ver Comprobante</a>
                               )}
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 pl-1">
                            {buildWhatsappConfirmationUrl(booking) && (
                               <a href={buildWhatsappConfirmationUrl(booking)} target="_blank" rel="noreferrer" className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#25D366]/10 text-[#25D366] transition-all hover:bg-[#25D366] hover:text-white hover:scale-105" title="Notificar WhatsApp">
                                  <MessageCircle className="h-4.5 w-4.5" />
                                </a>
                            )}
                            <button onClick={() => updateBookingStatus(booking.id, "confirmed", "verified")} className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-all hover:bg-primary hover:text-white hover:scale-105" title="Aprobar e ingresar puntos">
                               <Sparkles className="h-4.5 w-4.5" />
                            </button>
                            <button onClick={() => updateBookingStatus(booking.id, "cancelled", booking.payment_status)} className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10 text-red-400 transition-all hover:bg-red-500 hover:text-white hover:scale-105" title="Cancelar cita">
                               <XCircle className="h-4.5 w-4.5" />
                            </button>
                            <Button size="sm" variant="ghost" onClick={() => startBookingEdit(booking)} className="h-9 rounded-lg border border-white/10 bg-white/5 px-4 text-xs font-semibold text-white transition-all hover:bg-white hover:text-black hover:scale-105">Editar</Button>
                            <button onClick={() => deleteBooking(booking.id)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-500/20 text-red-500 transition-all hover:bg-red-500 hover:text-white hover:border-transparent hover:scale-105" title="Eliminar registro">
                               <Trash2 className="h-4.5 w-4.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {filteredBookings.length === 0 && (
                        <div className="rounded-2xl border border-white/5 border-dashed p-12 text-center">
                          <p className="text-white/40">No hay reservas que coincidan con los filtros.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* EDIT MODAL OVERLAY */}
                  {bookingForm.id && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                      <div className="relative w-full max-w-2xl overflow-y-auto max-h-[90vh] rounded-[2rem] border border-primary/20 bg-gradient-to-br from-[#16162a] to-[#0b0b14] p-6 shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="absolute top-4 right-4 z-10">
                          <button onClick={() => setBookingForm(emptyBookingForm)} className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-white hover:bg-white/10 hover:text-red-400 transition-all cursor-pointer">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="border-b border-white/10 pb-4 mb-4">
                          <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                            Modificar Cita: <span className="text-primary">{bookingForm.customer_name}</span>
                          </h3>
                        </div>
                        <form onSubmit={saveBooking} className="space-y-4">
                          <div className="grid gap-4 md:grid-cols-2">
                            <Field label="Cliente"><ModernInput value={bookingForm.customer_name} onChange={(e: any) => setBookingForm({ ...bookingForm, customer_name: e.target.value })} /></Field>
                            <Field label="Teléfono (WhatsApp)"><ModernInput placeholder="Ej: 3001234567" value={bookingForm.customer_phone} onChange={(e: any) => setBookingForm({ ...bookingForm, customer_phone: e.target.value })} className="font-mono" /></Field>
                          </div>
                          <div className="grid gap-4 md:grid-cols-2">
                            <Field label="Servicio">
                              <ModernSelect value={bookingForm.service_id} onChange={(e: any) => setBookingForm({ ...bookingForm, service_id: e.target.value })}>
                                <option value="">Seleccione...</option>
                                {services.map((s) => <option key={s.id} value={s.id}>{s.name} (${s.price})</option>)}
                              </ModernSelect>
                            </Field>
                            <Field label="Barbero">
                              <ModernSelect value={bookingForm.barber_id} onChange={(e: any) => setBookingForm({ ...bookingForm, barber_id: e.target.value })}>
                                <option value="">Seleccione...</option>
                                {barbers.map((b) => <option key={b.id} value={b.id}>{b.full_name}</option>)}
                              </ModernSelect>
                            </Field>
                          </div>
                          <div className="grid gap-4 md:grid-cols-4">
                            <Field label="Fecha"><ModernInput type="date" value={bookingForm.appointment_date} onChange={(e: any) => setBookingForm({ ...bookingForm, appointment_date: e.target.value })} /></Field>
                            <Field label="Hora">
                              <ModernSelect value={bookingForm.start_time} onChange={(e: any) => setBookingForm({ ...bookingForm, start_time: e.target.value })}>
                                <option value="">Hora</option>
                                {availableTimes.map((t) => <option key={t} value={t}>{t}</option>)}
                              </ModernSelect>
                            </Field>
                            <Field label="Estado Cita">
                              <ModernSelect value={bookingForm.status} onChange={(e: any) => setBookingForm({ ...bookingForm, status: e.target.value as any })}>
                                {statusOptions.map((o) => <option key={o} value={o}>{statusLabels[o]}</option>)}
                              </ModernSelect>
                            </Field>
                            <Field label="Estado Pago">
                              <ModernSelect value={bookingForm.payment_status} onChange={(e: any) => setBookingForm({ ...bookingForm, payment_status: e.target.value as any })}>
                                {paymentOptions.map((o) => <option key={o} value={o}>{paymentLabels[o]}</option>)}
                              </ModernSelect>
                            </Field>
                          </div>
                          <div className="grid gap-4 md:grid-cols-2">
                            <Field label="Método de Pago">
                              <ModernSelect value={bookingForm.payment_method} onChange={(e: any) => setBookingForm({ ...bookingForm, payment_method: e.target.value })}>
                                <option value="nequi">Nequi</option>
                              </ModernSelect>
                            </Field>
                            <Field label="Ref. Pago Nequi"><ModernInput placeholder="Comprobante" value={bookingForm.payment_reference} onChange={(e: any) => setBookingForm({ ...bookingForm, payment_reference: e.target.value })} className="font-mono" /></Field>
                          </div>
                          <div className="grid gap-4 md:grid-cols-2">
                            <Field label="Captura Comprobante"><ModernInput placeholder="/payments/..." value={bookingForm.payment_screenshot} onChange={(e: any) => setBookingForm({ ...bookingForm, payment_screenshot: e.target.value })} /></Field>
                            <Field label="Notas Internas"><ModernInput placeholder="Opcional" value={bookingForm.notes} onChange={(e: any) => setBookingForm({ ...bookingForm, notes: e.target.value })} /></Field>
                          </div>

                          {bookingForm.payment_screenshot && (
                            <div className="rounded-xl border border-white/10 p-3">
                               <p className="text-xs font-semibold text-white/50 mb-2">Comprobante Recibido</p>
                               <a href={resolveAssetUrl(bookingForm.payment_screenshot)} target="_blank" rel="noreferrer">
                                 <img src={resolveAssetUrl(bookingForm.payment_screenshot)} alt="Comprobante" className="max-h-48 rounded-lg object-contain border border-white/5 shadow-md" />
                               </a>
                            </div>
                          )}

                          <div className="flex items-center gap-3 pt-3 border-t border-white/5">
                            <Button type="submit" className="bg-primary hover:bg-primary/80 text-white font-bold h-10 px-6 rounded-lg text-sm"><Save className="mr-1.5 h-4 w-4" /> Guardar Cambios</Button>
                            <Button type="button" variant="outline" onClick={() => setBookingForm(emptyBookingForm)} className="border-white/10 bg-white/5 text-white hover:bg-white/10 h-10 px-6 rounded-lg text-sm font-semibold">Cancelar</Button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "clientes" && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
                    
                    {/* Columna Izquierda: Lista de clientes */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-primary/20"><Users className="h-5 w-5 text-primary" /></div>
                          Clientes
                        </h3>
                        <div className="flex gap-2">
                          <Button 
                            onClick={exportClientsToCSV} 
                            variant="outline"
                            size="sm"
                            className="border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white font-bold rounded-xl text-xs flex items-center gap-1.5 px-3 py-2"
                          >
                            <Upload className="h-3.5 w-3.5 rotate-180" />
                            Exportar
                          </Button>
                          <Button 
                            onClick={() => {
                              setClientForm(emptyClientForm);
                              setClientFile(null);
                              setIsClientFormActive(true);
                            }}
                            size="sm"
                            className="bg-primary hover:bg-primary/80 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 px-3 py-2"
                          >
                            <UserPlus className="h-4 w-4" />
                            Nuevo
                          </Button>
                        </div>
                      </div>

                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                        <ModernInput 
                          value={clientSearch} 
                          onChange={(e: any) => setClientSearch(e.target.value)} 
                          placeholder="Buscar por nombre, teléfono..." 
                          className="pl-10 h-10 text-xs" 
                        />
                      </div>

                      <div className="max-h-[600px] space-y-2.5 overflow-y-auto pr-1">
                        {filteredClients.map((client) => (
                          <button 
                            key={client.id} 
                            onClick={() => {
                              setSelectedClientId(client.id);
                              setIsClientFormActive(false);
                            }} 
                            className={`flex w-full items-center gap-3.5 rounded-2xl border p-3.5 text-left transition-all ${
                              selectedClient?.id === client.id && !isClientFormActive
                                ? "border-primary/50 bg-primary/10 shadow-[0_0_15px_rgba(99,102,241,0.15)]" 
                                : "border-white/5 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]"
                            }`}
                          >
                            <img src={resolveAssetUrl(client.avatar_url) || "https://api.dicebear.com/7.x/avataaars/svg?seed=Client"} alt={client.name} className="h-11 w-11 rounded-xl object-cover border border-white/10 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-bold text-white leading-tight">{client.name}</p>
                              <p className="flex items-center gap-1 text-[10px] text-white/40 mt-1"><Phone className="h-2.5 w-2.5" /> {client.phone}</p>
                              <div className="flex items-center justify-between mt-1.5">
                                <span className="text-[10px] font-bold text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded-md">{client.loyalty_points} pts</span>
                                <span className="text-[9px] text-white/35">{client.last_visit ? `Último: ${client.last_visit}` : 'Sin visitas'}</span>
                              </div>
                            </div>
                          </button>
                        ))}
                        {filteredClients.length === 0 && (
                          <p className="rounded-xl border border-white/5 border-dashed p-8 text-center text-xs text-white/45">No hay clientes con ese filtro.</p>
                        )}
                      </div>
                    </div>

                    {/* Columna Derecha: Formulario o Detalle */}
                    <div className="space-y-4">
                      {isClientFormActive ? (
                        <Card className="overflow-hidden border-0 bg-transparent ring-1 ring-white/10 relative">
                          <div className="absolute inset-0 bg-[#0e0e18]/80 backdrop-blur-xl -z-10"></div>
                          <CardHeader className="border-b border-white/5 py-4">
                            <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-white">
                              <Sparkles className="h-4 w-4 text-primary" />
                              {clientForm.id ? `Modificar Perfil: ${clientForm.name}` : "Registrar Nuevo Cliente"}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-6">
                            <form onSubmit={saveClient} className="space-y-5">
                              <div className="grid gap-5 md:grid-cols-[100px_1fr]">
                                <div className="flex flex-col items-center gap-2.5">
                                  <div className="h-20 w-20 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                                    <img 
                                      src={clientFile ? URL.createObjectURL(clientFile) : resolveAssetUrl(clientForm.avatar_url) || "https://api.dicebear.com/7.x/avataaars/svg?seed=Client"} 
                                      alt="Cliente" 
                                      className="h-full w-full object-cover" 
                                    />
                                  </div>
                                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] font-bold text-white/70 transition-colors hover:bg-white/10 hover:text-white">
                                    <Camera className="h-3 w-3" />
                                    Foto
                                    <input type="file" accept="image/*" className="hidden" onChange={(e: any) => setClientFile(e.target.files?.[0] ?? null)} />
                                  </label>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                  <Field label="Nombre"><ModernInput value={clientForm.name} onChange={(e: any) => setClientForm({ ...clientForm, name: e.target.value })} placeholder="Nombre completo" required /></Field>
                                  <Field label="Teléfono"><ModernInput value={clientForm.phone} onChange={(e: any) => setClientForm({ ...clientForm, phone: e.target.value })} placeholder="3001234567" required /></Field>
                                  <Field label="Correo"><ModernInput type="email" value={clientForm.email} onChange={(e: any) => setClientForm({ ...clientForm, email: e.target.value })} placeholder="cliente@email.com" /></Field>
                                  <Field label="Edad"><ModernInput type="number" min="0" max="120" value={clientForm.age} onChange={(e: any) => setClientForm({ ...clientForm, age: e.target.value })} placeholder="28" /></Field>
                                  <Field label="Tipo de cabello"><ModernInput value={clientForm.hair_type} onChange={(e: any) => setClientForm({ ...clientForm, hair_type: e.target.value })} placeholder="Ondulado, crespo, liso..." /></Field>
                                  <Field label="Estilo favorito"><ModernInput value={clientForm.favorite_style} onChange={(e: any) => setClientForm({ ...clientForm, favorite_style: e.target.value })} placeholder="Fade bajo, clásico..." /></Field>
                                  <Field label="Última visita"><ModernInput type="date" value={clientForm.last_visit} onChange={(e: any) => setClientForm({ ...clientForm, last_visit: e.target.value })} /></Field>
                                  <Field label="Puntos de fidelidad"><ModernInput type="number" min="0" value={clientForm.loyalty_points} onChange={(e: any) => setClientForm({ ...clientForm, loyalty_points: e.target.value })} /></Field>
                                </div>
                              </div>
                              <Field label="Notas de Barbería">
                                <ModernInput value={clientForm.notes} onChange={(e: any) => setClientForm({ ...clientForm, notes: e.target.value })} placeholder="Preferencias, alergias, trato, detalles importantes..." />
                              </Field>
                              <div className="flex gap-2.5 border-t border-white/5 pt-4">
                                <Button type="submit" className="bg-primary hover:bg-primary/80 text-white font-bold h-10 px-6 rounded-xl text-xs flex items-center gap-1.5">
                                  <Save className="h-4 w-4" />
                                  {clientForm.id ? "Guardar Cambios" : "Registrar"}
                                </Button>
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  onClick={() => { 
                                    setClientForm(emptyClientForm); 
                                    setClientFile(null); 
                                    setIsClientFormActive(false); 
                                  }} 
                                  className="h-10 rounded-xl border border-white/10 bg-white/5 text-white/75 hover:bg-white/10 hover:text-white text-xs font-semibold px-5"
                                >
                                  Cancelar
                                </Button>
                              </div>
                            </form>
                          </CardContent>
                        </Card>
                      ) : selectedClient ? (
                        <div className="space-y-5">
                          {/* Ficha Principal */}
                          <div className="rounded-3xl border border-white/5 bg-[#0e0e18]/80 p-5 shadow-sm space-y-5">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between border-b border-white/5 pb-4">
                              <div className="flex items-center gap-4">
                                <img src={resolveAssetUrl(selectedClient.avatar_url) || "https://api.dicebear.com/7.x/avataaars/svg?seed=Client"} alt={selectedClient.name} className="h-16 w-16 rounded-2xl object-cover border border-white/10" />
                                <div>
                                  <h3 className="text-xl font-bold text-white leading-tight">{selectedClient.name}</h3>
                                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/55">
                                    <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-primary" />{selectedClient.phone}</span>
                                    <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5 text-purple-400" />{selectedClient.email || "Sin correo"}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                                <button onClick={() => editClient(selectedClient)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/75 hover:bg-white/10 hover:text-white transition-colors" title="Editar datos">Editar</button>
                                <button onClick={() => handleResetPin(selectedClient.phone, selectedClient.name)} className="rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-xs font-bold text-primary hover:bg-primary hover:text-white transition-all" title="Restablecer PIN de acceso">PIN</button>
                                <button onClick={() => deleteClient(selectedClient.id)} className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-500 hover:text-white transition-all" title="Eliminar cliente">Eliminar</button>
                              </div>
                            </div>

                            <div className="grid gap-3 grid-cols-3">
                              <div className="rounded-xl border border-white/5 bg-white/[0.01] p-3 text-center">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Citas</p>
                                <p className="text-lg font-black text-white mt-1">{selectedClientBookings.length}</p>
                              </div>
                              <div className="rounded-xl border border-white/5 bg-white/[0.01] p-3 text-center">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Puntos</p>
                                <p className="text-lg font-black text-amber-300 mt-1">{selectedClient.loyalty_points}</p>
                              </div>
                              <div className="rounded-xl border border-white/5 bg-white/[0.01] p-3 text-center">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Total Invertido</p>
                                <p className="text-lg font-black text-emerald-400 mt-1">${selectedClientSpent.toLocaleString()}</p>
                              </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2 text-xs">
                              <ClientField label="Edad" value={selectedClient.age || "No especificada"} />
                              <ClientField label="Tipo de Cabello" value={selectedClient.hair_type || "No especificado"} />
                              <ClientField label="Estilo Favorito" value={selectedClient.favorite_style || "No especificado"} />
                              <ClientField label="Última Visita" value={selectedClient.last_visit || "Sin visitas registradas"} />
                            </div>

                            <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-4 text-xs">
                              <p className="mb-1.5 font-bold uppercase tracking-wider text-white/45 text-[10px]">Notas de Servicio</p>
                              <p className="text-white/70 italic leading-relaxed">"{selectedClient.notes || 'Ninguna nota ingresada por el barbero.'}"</p>
                            </div>
                          </div>

                          {/* Historial de Citas */}
                          <div className="rounded-3xl border border-white/5 bg-[#0e0e18]/80 p-5 shadow-sm space-y-4">
                            <h4 className="text-xs font-black uppercase tracking-widest text-white/40">Historial del Cliente</h4>
                            <div className="max-h-[300px] overflow-y-auto pr-1 space-y-2.5">
                              {selectedClientBookings.map((booking) => (
                                <div key={booking.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5 flex items-center justify-between gap-3 text-xs">
                                  <div>
                                    <p className="font-bold text-white">{booking.service_name}</p>
                                    <p className="text-white/45 mt-0.5">{booking.appointment_date} a las {booking.start_time} • {booking.barber_name}</p>
                                  </div>
                                  <div className="flex gap-1.5 shrink-0">
                                    <StatusBadge status={booking.status} />
                                    <PaymentBadge status={booking.payment_status} />
                                  </div>
                                </div>
                              ))}
                              {selectedClientBookings.length === 0 && (
                                <p className="rounded-xl border border-white/5 border-dashed p-6 text-center text-xs text-white/40 italic">Este cliente aún no tiene citas vinculadas a su teléfono.</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-3xl border border-white/5 border-dashed bg-[#0e0e18]/50 p-12 text-center flex flex-col items-center justify-center h-[350px]">
                          <Users className="h-10 w-10 text-white/20 mb-3" />
                          <p className="text-white/45 text-sm">Selecciona un cliente de la lista de la izquierda para ver su historial completo o registrar un nuevo cliente.</p>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              )}

              {activeTab === "servicios" && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                    
                    {/* Columna Izquierda: Grid de Servicios */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-primary/20"><Briefcase className="h-5 w-5 text-primary" /></div>
                          Servicios Ofrecidos
                        </h3>
                        <span className="text-xs text-white/50">{services.length} servicios registrados</span>
                      </div>
                      
                      <div className="grid gap-4 sm:grid-cols-2">
                        {services.map((service) => (
                          <div key={service.id} className="group overflow-hidden rounded-2xl border border-white/5 bg-[#0e0e18]/90 transition-all hover:border-primary/45 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5">
                            <div className="relative h-28 bg-gradient-to-br from-primary/10 to-purple-600/10">
                              <div className="absolute -bottom-6 left-5">
                                <div className="h-16 w-16 overflow-hidden rounded-xl border-2 border-[#0e0e18] bg-black shadow-md flex items-center justify-center">
                                  {service.image_url ? (
                                    <img src={resolveAssetUrl(service.image_url)} alt={service.name} className="h-full w-full object-cover" />
                                  ) : (
                                    <Briefcase className="h-7 w-7 text-white/20" />
                                  )}
                                </div>
                              </div>
                              <div className="absolute right-3 top-3 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                                 <button onClick={() => editService(service)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/60 text-white backdrop-blur-md hover:bg-primary hover:scale-105 transition-all" title="Editar servicio"><Scissors className="h-3.5 w-3.5"/></button>
                                 <button onClick={() => deleteService(service.id)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/60 text-red-400 backdrop-blur-md hover:bg-red-500 hover:text-white hover:scale-105 transition-all" title="Eliminar servicio"><Trash2 className="h-3.5 w-3.5"/></button>
                              </div>
                            </div>
                            <div className="p-5 pt-8">
                              <h4 className="text-sm font-bold text-white group-hover:text-primary transition-colors truncate">{service.name}</h4>
                              <div className="mt-2 flex items-center justify-between">
                                <span className="inline-flex h-5 items-center rounded-md bg-white/5 px-2 text-[10px] font-semibold text-white/60">{service.duration_minutes} min</span>
                                <span className="text-lg font-black text-white">${service.price.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Columna Derecha: Formulario de Servicios */}
                    <div className="space-y-4">
                      <Card className="overflow-hidden border-0 bg-transparent ring-1 ring-white/10 relative">
                        <div className="absolute inset-0 bg-[#0e0e18]/80 backdrop-blur-xl -z-10"></div>
                        <CardHeader className="border-b border-white/5 py-4">
                          <CardTitle className="text-xs font-black uppercase tracking-wider flex items-center gap-2 text-white">
                            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                            {serviceEditingId ? "Editar Servicio" : "Agregar Nuevo Servicio"}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-5">
                          <form onSubmit={saveService} className="space-y-4">
                            <div className="flex flex-col items-center gap-2.5 mb-2">
                              <div className="h-20 w-20 overflow-hidden rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center">
                                {serviceFile ? (
                                  <img src={URL.createObjectURL(serviceFile)} alt="Servicio" className="h-full w-full object-cover" />
                                ) : serviceForm.image_url ? (
                                  <img src={resolveAssetUrl(serviceForm.image_url)} alt="Servicio" className="h-full w-full object-cover" />
                                ) : (
                                  <Briefcase className="h-8 w-8 text-white/20" />
                                )}
                              </div>
                              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] font-bold text-white/70 transition-colors hover:bg-white/10 hover:text-white">
                                <Camera className="h-3 w-3" />
                                Subir Imagen
                                <input type="file" accept="image/*" className="hidden" onChange={(e: any) => setServiceFile(e.target.files?.[0] ?? null)} />
                              </label>
                            </div>

                            <Field label="Nombre del Servicio">
                              <ModernInput placeholder="Ej: Corte Degradado" value={serviceForm.name} onChange={(e: any) => setServiceForm({ ...serviceForm, name: e.target.value })} required />
                            </Field>
                            <Field label="Precio ($)">
                              <ModernInput type="number" placeholder="25000" value={serviceForm.price} onChange={(e: any) => setServiceForm({ ...serviceForm, price: e.target.value })} required />
                            </Field>
                            <Field label="Duración (Minutos)">
                              <ModernInput type="number" placeholder="45" value={serviceForm.duration_minutes} onChange={(e: any) => setServiceForm({ ...serviceForm, duration_minutes: e.target.value })} required />
                            </Field>

                            <div className="flex gap-2.5 border-t border-white/5 pt-4">
                              <Button type="submit" className="bg-primary hover:bg-primary/80 text-white font-bold h-10 px-5 rounded-xl text-xs flex items-center gap-1.5 flex-1 justify-center">
                                <Save className="h-4 w-4" />
                                {serviceEditingId ? "Actualizar" : "Agregar"}
                              </Button>
                              <Button 
                                type="button" 
                                variant="ghost" 
                                onClick={() => { 
                                  setServiceEditingId(null); 
                                  setServiceForm(emptyServiceForm); 
                                  setServiceFile(null); 
                                }} 
                                className="h-10 rounded-xl border border-white/10 bg-white/5 text-white/75 hover:bg-white/10 hover:text-white text-xs font-semibold px-4"
                              >
                                Cancelar
                              </Button>
                            </div>
                          </form>
                        </CardContent>
                      </Card>
                    </div>

                  </div>
                </div>
              )}

              {activeTab === "equipo" && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                    
                    {/* Columna Izquierda: Grid de Barberos */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-primary/20"><Users className="h-5 w-5 text-primary" /></div>
                          Equipo de Profesionales
                        </h3>
                        <span className="text-xs text-white/50">{barbers.length} barberos activos</span>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        {barbers.map((barber) => (
                          <div key={barber.id} className="group overflow-hidden rounded-2xl border border-white/5 bg-[#0e0e18]/90 transition-all hover:border-primary/45 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5">
                            <div className="relative h-24 bg-gradient-to-br from-primary/10 to-purple-600/10">
                              <div className="absolute -bottom-6 left-5">
                                <div className="h-16 w-16 overflow-hidden rounded-xl border-2 border-[#0e0e18] bg-black shadow-md">
                                  <img src={resolveAssetUrl(barber.avatar_url) || "https://api.dicebear.com/7.x/avataaars/svg"} alt={barber.full_name} className="h-full w-full object-cover" />
                                </div>
                              </div>
                              <div className="absolute right-3 top-3 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100 z-10">
                                 <button onClick={() => editBarber(barber)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/60 text-white backdrop-blur-md hover:bg-primary hover:scale-105 transition-all" title="Editar perfil"><Scissors className="h-3.5 w-3.5"/></button>
                                 <button onClick={() => deleteBarber(barber.id)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/60 text-red-400 backdrop-blur-md hover:bg-red-500 hover:text-white hover:scale-105 transition-all" title="Eliminar barbero"><Trash2 className="h-3.5 w-3.5"/></button>
                              </div>
                            </div>
                            <div className="p-5 pt-8">
                              <h4 className="text-sm font-bold text-white leading-tight">{barber.full_name}</h4>
                              <p className="text-[10px] font-bold text-primary mt-0.5">@{barber.username}</p>
                              <p className="text-xs text-white/50 mt-2 line-clamp-2 leading-relaxed">{barber.description || "Sin descripción profesional."}</p>
                              
                              {barber.specialties && barber.specialties.length > 0 && (
                                <div className="mt-2.5 flex flex-wrap gap-1">
                                  {barber.specialties.slice(0, 3).map((item) => (
                                    <span key={item} className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary">{item}</span>
                                  ))}
                                </div>
                              )}
                              
                              <p className="mt-2 text-[10px] font-semibold text-emerald-400">Comisión fija: {barber.commission_rate ?? 15}%</p>

                              {(() => {
                                const stats = barberStats.find((s) => s.id === barber.id);
                                if (!stats) return null;
                                return (
                                  <div className="mt-3.5 border-t border-white/5 pt-3.5 space-y-2.5">
                                    <div className="grid grid-cols-2 gap-2 text-[9px]">
                                      <div className="rounded-lg bg-white/5 p-2">
                                        <p className="text-white/40 uppercase font-semibold">Cortes</p>
                                        <p className="text-xs font-bold text-white mt-0.5">{stats.completed_appointments}</p>
                                      </div>
                                      <div className="rounded-lg bg-white/5 p-2">
                                        <p className="text-white/40 uppercase font-semibold">Generado</p>
                                        <p className="text-xs font-bold text-white mt-0.5">${stats.verified_revenue.toLocaleString()}</p>
                                      </div>
                                    </div>
                                    <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/10 p-2 flex items-center justify-between gap-2">
                                      <div>
                                        <p className="text-[8px] text-emerald-400/60 uppercase font-bold tracking-wide">Comisión a Pagar</p>
                                        <p className="text-xs font-black text-emerald-400 mt-0.5">${stats.commission_earned.toLocaleString()}</p>
                                      </div>
                                      <button
                                        onClick={() => {
                                          toast.success(`Liquidación de $${stats.commission_earned.toLocaleString()} registrada para ${barber.full_name}. Realiza la transferencia.`);
                                        }}
                                        className="rounded-md bg-emerald-500 text-white px-2 py-1 text-[9px] font-bold shadow-md shadow-emerald-500/10 hover:opacity-90 active:scale-95 transition-all shrink-0"
                                      >
                                        Liquidar
                                      </button>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Columna Derecha: Formulario de Barberos */}
                    <div className="space-y-4">
                      <Card className="overflow-hidden border-0 bg-transparent ring-1 ring-white/10 relative">
                        <div className="absolute inset-0 bg-[#0e0e18]/80 backdrop-blur-xl -z-10"></div>
                        <CardHeader className="border-b border-white/5 py-4">
                          <CardTitle className="text-xs font-black uppercase tracking-wider flex items-center gap-2 text-white">
                            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                            {barberForm.id ? "Editar Perfil" : "Nuevo Barbero"}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-5">
                          <form onSubmit={saveBarber} className="space-y-4">
                            <Field label="Nombre Completo">
                              <ModernInput placeholder="Ej: Carlos Méndez" value={barberForm.full_name} onChange={(e: any) => setBarberForm({ ...barberForm, full_name: e.target.value })} required />
                            </Field>
                            <Field label="Usuario (único)">
                              <ModernInput placeholder="carlosm" value={barberForm.username} onChange={(e: any) => setBarberForm({ ...barberForm, username: e.target.value })} required />
                            </Field>
                            <Field label="Contraseña">
                              <ModernInput type="password" placeholder={barberForm.id ? "Dejar vacío para conservar" : "Mín. 6 caracteres"} value={barberForm.password} onChange={(e: any) => setBarberForm({ ...barberForm, password: e.target.value })} required={!barberForm.id} />
                            </Field>
                            <Field label="Foto de Perfil">
                              <ModernInput type="file" accept="image/*" onChange={(e: any) => setBarberFile(e.target.files?.[0] ?? null)} className="pt-[8px] h-11 text-xs" />
                            </Field>
                            <Field label="Biografía">
                              <ModernInput placeholder="Experto en degradado clásico..." value={barberForm.description} onChange={(e: any) => setBarberForm({ ...barberForm, description: e.target.value })} />
                            </Field>
                            <Field label="Especialidades (comas)">
                              <ModernInput placeholder="Degradados, Barba, Clásico..." value={barberForm.specialties} onChange={(e: any) => setBarberForm({ ...barberForm, specialties: e.target.value })} />
                            </Field>
                            <Field label="Comisión (%)">
                              <ModernInput type="number" min="0" max="100" value={barberForm.commission_rate} onChange={(e: any) => setBarberForm({ ...barberForm, commission_rate: e.target.value })} required />
                            </Field>

                            <div className="flex gap-2.5 border-t border-white/5 pt-4">
                              <Button type="submit" className="bg-primary hover:bg-primary/80 text-white font-bold h-10 px-5 rounded-xl text-xs flex items-center gap-1.5 flex-1 justify-center">
                                <Save className="h-4 w-4" />
                                {barberForm.id ? "Actualizar" : "Crear"}
                              </Button>
                              <Button 
                                type="button" 
                                variant="ghost" 
                                onClick={() => { 
                                  setBarberForm(emptyBarberForm); 
                                  setBarberFile(null); 
                                }} 
                                className="h-10 rounded-xl border border-white/10 bg-white/5 text-white/75 hover:bg-white/10 hover:text-white text-xs font-semibold px-4"
                              >
                                Cancelar
                              </Button>
                            </div>
                          </form>
                        </CardContent>
                      </Card>
                    </div>

                  </div>
                </div>
              )}

              {activeTab === "galeria" && (
                <div className="space-y-8">
                  <Card className="overflow-hidden border-0 bg-transparent ring-1 ring-white/10 relative">
                    <div className="absolute inset-0 bg-[#0e0e18]/80 backdrop-blur-xl -z-10"></div>
                    <CardContent className="pt-6">
                      <form onSubmit={uploadGalleryImage} className="flex flex-col md:flex-row items-end gap-6">
                        <div className="flex-1 w-full">
                          <Field label="Selecciona una imagen para la galería">
                             <ModernInput type="file" accept="image/*" onChange={(e: any) => setGalleryFile(e.target.files?.[0] ?? null)} className="pt-[10px]" />
                          </Field>
                        </div>
                        <Button type="submit" className="h-11 rounded-xl bg-purple-600 hover:bg-purple-500 text-white px-8 shadow-lg shadow-purple-600/30 w-full md:w-auto"><Upload className="mr-2 h-4 w-4" /> Subir a galería</Button>
                      </form>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {gallery.map((image) => (
                      <div key={image.id} className="group relative aspect-[4/5] overflow-hidden rounded-2xl shadow-sm hover:shadow-xl hover:shadow-primary/20 transition-all">
                        <img src={resolveAssetUrl(image.url)} alt="Galería" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex flex-col justify-end p-4">
                          <button onClick={() => deleteGalleryImage(image.id)} className="self-end rounded-full bg-red-500/80 p-2 text-white backdrop-blur-md hover:bg-red-500 hover:scale-110 transition-all">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "solicitudes" && (
                <div className="space-y-6">
                  <DashboardPanel title="Solicitudes de Cambio de Cita" icon={<HelpCircle className="h-5 w-5 text-primary" />}>
                    <div className="space-y-4">
                      {changeRequests.map((req) => (
                        <div key={req.id} className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <h4 className="font-bold text-white text-base">{req.client_name}</h4>
                              <p className="text-xs text-white/55 flex items-center gap-1 mt-0.5">
                                <Phone className="h-3 w-3" /> {req.client_phone}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                                req.status === "approved" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" :
                                req.status === "rejected" ? "bg-red-500/15 text-red-400 border-red-500/20" :
                                "bg-amber-500/15 text-amber-400 border-amber-500/20"
                              }`}>
                                {req.status === "approved" ? "Aprobado" :
                                 req.status === "rejected" ? "Rechazado" :
                                 "Pendiente"}
                              </span>
                              <span className="text-xs text-white/45">
                                {new Date(req.created_at).toLocaleDateString("es-CO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                          </div>

                          <div className="grid gap-4 sm:grid-cols-2 text-sm bg-white/[0.01] border border-white/5 rounded-xl p-4">
                            <div>
                              <p className="text-xs text-white/40 uppercase font-semibold">Detalles de la Cita</p>
                              <p className="mt-1 font-bold text-white">{req.service_name}</p>
                              <p className="text-xs text-white/60">Con {req.barber_name}</p>
                            </div>
                            <div>
                              <p className="text-xs text-white/40 uppercase font-semibold">Horario Solicitado</p>
                              <p className="mt-1 font-bold text-primary">
                                {new Date(`${req.requested_date}T00:00:00`).toLocaleDateString("es-CO", { weekday: "short", day: "numeric", month: "short" })} a las {req.requested_time}
                              </p>
                              <p className="text-xs text-white/40">
                                Original: {new Date(`${req.original_date}T00:00:00`).toLocaleDateString("es-CO", { weekday: "short", day: "numeric", month: "short" })} a las {req.original_time}
                              </p>
                            </div>
                          </div>

                          {req.reason && (
                            <div className="text-sm bg-white/[0.01] border border-white/5 rounded-xl p-3">
                              <span className="text-xs text-white/40 uppercase font-semibold block mb-1">Motivo del Cliente</span>
                              <p className="text-white/70 italic">"{req.reason}"</p>
                            </div>
                          )}

                          {req.status === "pending" ? (
                            <div className="space-y-3 pt-2">
                              <input
                                type="text"
                                placeholder="Nota interna o motivo (opcional para aprobar, recomendado para rechazar)"
                                id={`notes-${req.id}`}
                                className="w-full h-11 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-primary/50 transition-colors"
                              />
                              <div className="flex justify-end gap-3">
                                <button
                                  onClick={() => {
                                    const notesVal = (document.getElementById(`notes-${req.id}`) as HTMLInputElement)?.value || "";
                                    handleChangeRequestAction(req.id, "reject", notesVal);
                                  }}
                                  className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-500 hover:text-white transition-all"
                                >
                                  Rechazar
                                </button>
                                <button
                                  onClick={() => {
                                    const notesVal = (document.getElementById(`notes-${req.id}`) as HTMLInputElement)?.value || "";
                                    handleChangeRequestAction(req.id, "approve", notesVal);
                                  }}
                                  className="rounded-xl bg-gradient-to-r from-primary to-violet-500 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
                                >
                                  Aprobar Cambio
                                </button>
                              </div>
                            </div>
                          ) : (
                            req.admin_notes && (
                              <div className="text-sm border-t border-white/5 pt-3">
                                <span className="text-xs text-white/40 uppercase font-semibold block mb-1">Respuesta del Administrador</span>
                                <p className="text-white/80">{req.admin_notes}</p>
                              </div>
                            )
                          )}
                        </div>
                      ))}
                      {changeRequests.length === 0 && (
                        <p className="rounded-xl border border-white/5 border-dashed p-8 text-center text-sm text-white/45">
                          No hay solicitudes de cambio de cita registradas.
                        </p>
                      )}
                    </div>
                  </DashboardPanel>
                </div>
              )}

              {activeTab === "control" && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  {/* Console Header Tabs */}
                  <div className="flex flex-wrap gap-2.5 border-b border-white/5 pb-4">
                    {[
                      { id: "sql", label: "Consola SQL", icon: <Database className="h-4.5 w-4.5" /> },
                      { id: "audit", label: "Registro de Auditoría", icon: <Activity className="h-4.5 w-4.5" /> },
                      { id: "chats", label: "Chats de IA", icon: <MessageCircle className="h-4.5 w-4.5" /> },
                      { id: "system", label: "Estado del Servidor", icon: <Terminal className="h-4.5 w-4.5" /> },
                      { id: "backup", label: "Copia de Seguridad", icon: <Save className="h-4.5 w-4.5" /> },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveConsoleTab(item.id as any);
                          setSelectedSessionId(null);
                          setSessionMessages([]);
                        }}
                        className={`flex items-center gap-2 rounded-xl px-5 py-3 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          activeConsoleTab === item.id
                            ? "bg-gradient-to-r from-primary to-purple-600 text-white shadow-lg shadow-primary/20 ring-1 ring-primary/30"
                            : "text-white/60 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        {item.icon}
                        {item.label}
                      </button>
                    ))}
                  </div>

                  {isConsoleLoading && activeConsoleTab !== "sql" && (
                    <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-3xl border border-white/10 bg-[#0e0e18]/80 backdrop-blur-xl">
                      <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-xs text-white/50 tracking-wider">EJECUTANDO DIAGNÓSTICOS...</p>
                    </div>
                  )}

                  {!isConsoleLoading && activeConsoleTab === "sql" && (
                    <DashboardPanel title="Consola de Consultas SQL Directas" icon={<Database className="h-5 w-5 text-primary" />}>
                      <div className="space-y-5">
                        <p className="text-xs text-white/50 leading-relaxed">
                          Consola de administración avanzada. Permite ejecutar consultas DDL y DML directamente en el motor PostgreSQL de Supabase. Use con extrema precaución.
                        </p>
                        
                        {/* Terminal GUI Container */}
                        <div className="relative rounded-2xl border border-white/10 bg-[#07070c] overflow-hidden shadow-2xl">
                          {/* Top bar */}
                          <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-white/[0.02] text-[10px] font-mono text-white/40">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
                              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></span>
                              <span className="w-2.5 h-2.5 rounded-full bg-green-500/80"></span>
                              <span className="ml-2 font-bold tracking-widest text-primary/80">SQL_SHELL v1.4 // SYSTEM_ROOT</span>
                            </div>
                            <span className="text-[9px] uppercase bg-primary/20 px-2 py-0.5 rounded-md text-primary font-bold">PostgreSQL Active</span>
                          </div>
                          
                          <textarea
                            value={sqlQuery}
                            onChange={(e) => setSqlQuery(e.target.value)}
                            rows={5}
                            className="w-full font-mono text-sm text-emerald-400 bg-transparent p-5 outline-none resize-y placeholder:text-white/20"
                            placeholder="SELECT * FROM profiles LIMIT 5;"
                          />
                        </div>

                        <div className="flex flex-wrap gap-2 justify-between items-center pt-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setSqlQuery("SELECT * FROM appointments ORDER BY appointment_date DESC, start_time DESC LIMIT 5;")}
                              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold text-white/70 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                            >
                              Citas Recientes
                            </button>
                            <button
                              onClick={() => setSqlQuery("SELECT * FROM clients ORDER BY loyalty_points DESC LIMIT 5;")}
                              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold text-white/70 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                            >
                              Top Clientes
                            </button>
                          </div>
                          <button
                            onClick={executeSqlQuery}
                            disabled={isExecutingSql}
                            className="rounded-xl bg-gradient-to-r from-primary to-purple-600 px-6 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-lg hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer flex items-center gap-2"
                          >
                            {isExecutingSql ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Terminal className="h-4 w-4" />}
                            EJECUTAR CONSULTA
                          </button>
                        </div>

                        {sqlError && (
                          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 space-y-2 animate-in slide-in-from-top-2">
                            <h4 className="font-bold text-red-400 flex items-center gap-2 text-sm">
                              <XCircle className="h-5 w-5" /> Error en Sintaxis / Permisos
                            </h4>
                            <p className="font-mono text-xs text-red-200/80 leading-relaxed whitespace-pre-wrap">{sqlError}</p>
                          </div>
                        )}

                        {sqlResult && (
                          <div className="space-y-3 pt-4 border-t border-white/5 animate-in fade-in duration-300">
                            <div className="flex items-center justify-between">
                              <h4 className="font-bold text-white text-sm">Resultado de la Consulta</h4>
                              <span className="text-[10px] font-semibold text-white/40 uppercase tracking-widest">{sqlResult.rows ? `${sqlResult.rows.length} filas devueltas` : "Operación de escritura"}</span>
                            </div>
                            {sqlResult.type === "write" ? (
                              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
                                <p className="text-xs font-semibold text-emerald-300">
                                  Consulta de escritura ejecutada. Filas afectadas: <span className="font-bold text-white">{sqlResult.changes}</span>. Último ID insertado: <span className="font-bold text-white">{sqlResult.lastID || "N/A"}</span>.
                                </p>
                              </div>
                            ) : (
                              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#07070c] max-h-[350px]">
                                <table className="w-full text-left text-xs border-collapse">
                                  <thead>
                                    <tr className="border-b border-white/10 bg-white/5 text-white/60 font-bold uppercase tracking-wider text-[9px] sticky top-0">
                                      {sqlResult.rows && sqlResult.rows.length > 0 ? (
                                        Object.keys(sqlResult.rows[0]).map((key) => (
                                          <th key={key} className="px-4 py-3 font-black bg-[#07070c]">{key}</th>
                                        ))
                                      ) : (
                                        <th className="px-4 py-3 font-black bg-[#07070c]">Respuesta</th>
                                      )}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {sqlResult.rows && sqlResult.rows.length > 0 ? (
                                      sqlResult.rows.map((row: any, i: number) => (
                                        <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] text-white/80 transition-colors">
                                          {Object.keys(row).map((key) => (
                                            <td key={key} className="px-4 py-3 font-mono text-[11px] max-w-xs truncate" title={String(row[key])}>
                                              {row[key] === null ? <span className="text-white/20 italic">null</span> : String(row[key])}
                                            </td>
                                          ))}
                                        </tr>
                                      ))
                                    ) : (
                                      <tr>
                                        <td className="px-4 py-6 text-center text-white/40 italic">
                                          La consulta no devolvió ninguna fila.
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </DashboardPanel>
                  )}

                  {!isConsoleLoading && activeConsoleTab === "audit" && (
                    <DashboardPanel title="Historial de Auditoría de Eventos de Seguridad" icon={<Activity className="h-5 w-5 text-primary" />}>
                      <div className="space-y-4">
                        <p className="text-xs text-white/50 leading-relaxed">
                          Registro inmutable de seguridad. Monitorea intentos de inicio de sesión fallidos, consultas sospechosas y actividades del panel administrativo.
                        </p>
                        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0e0e18]/60">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-white/10 bg-white/5 text-white/60 font-bold uppercase tracking-wider text-[9px]">
                                <th className="px-4 py-3 font-black">ID</th>
                                <th className="px-4 py-3 font-black">Acción</th>
                                <th className="px-4 py-3 font-black">Detalle</th>
                                <th className="px-4 py-3 font-black">IP Address</th>
                                <th className="px-4 py-3 font-black">Fecha y Hora</th>
                              </tr>
                            </thead>
                            <tbody>
                              {auditLogs.map((log) => (
                                <tr key={log.id} className="border-b border-white/5 hover:bg-white/[0.02] text-white/80 transition-colors">
                                  <td className="px-4 py-3 font-mono text-[10px] text-white/40">{log.id}</td>
                                  <td className="px-4 py-3">
                                    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                                      log.action.includes("FAILED") || log.action.includes("LIMIT") ? "bg-red-500/15 text-red-400 border-red-500/20" :
                                      log.action.includes("SUCCESS") ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" :
                                      "bg-sky-500/15 text-sky-400 border-sky-500/20"
                                    }`}>
                                      {log.action}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-xs font-semibold">{log.details}</td>
                                  <td className="px-4 py-3 font-mono text-[10px] text-white/60">{log.ip_address || "Sistema Interno"}</td>
                                  <td className="px-4 py-3 text-white/50">
                                    {new Date(log.created_at).toLocaleString("es-CO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                                  </td>
                                </tr>
                              ))}
                              {auditLogs.length === 0 && (
                                <tr>
                                  <td colSpan={5} className="px-4 py-8 text-center text-white/40 italic">
                                    No hay registros de auditoría disponibles.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </DashboardPanel>
                  )}

                  {!isConsoleLoading && activeConsoleTab === "chats" && (
                    <DashboardPanel title="Monitoreo de Conversaciones con IA Assistant" icon={<MessageCircle className="h-5 w-5 text-primary" />}>
                      <div className="grid gap-5 lg:grid-cols-[1fr_1.8fr] h-[580px]">
                        {/* Listado de Sesiones */}
                        <div className="border border-white/10 rounded-2xl bg-white/[0.01] overflow-y-auto p-3.5 space-y-2">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 px-1">Sesiones Activas</h4>
                          {chatSessions.map((session) => (
                            <button
                              key={session.id}
                              onClick={() => loadChatMessages(session.id)}
                              className={`w-full text-left rounded-xl p-3.5 transition-all border cursor-pointer flex flex-col gap-1.5 ${
                                selectedSessionId === session.id
                                  ? "bg-gradient-to-r from-primary/15 to-purple-600/10 border-primary/40 shadow-md"
                                  : "bg-white/[0.01] border-white/5 hover:bg-white/[0.03] hover:border-white/10"
                              }`}
                            >
                              <div className="flex justify-between items-center w-full gap-2 text-[9px]">
                                <span className="font-mono text-white/40 truncate max-w-[100px]">{session.id}</span>
                                <span className="text-white/30 shrink-0">
                                  {new Date(session.updated_at).toLocaleDateString("es-CO", { day: "numeric", month: "short" })}
                                </span>
                              </div>
                              <h5 className="font-bold text-white text-xs leading-tight">
                                {session.client_name || "Cliente Invitado"}
                              </h5>
                              {session.client_phone && (
                                <p className="text-[10px] text-white/50 flex items-center gap-1">
                                  <Phone className="h-2.5 w-2.5 text-primary" /> {session.client_phone}
                                </p>
                              )}
                            </button>
                          ))}
                          {chatSessions.length === 0 && (
                            <p className="text-center text-xs text-white/40 py-8 italic">No hay sesiones de chat guardadas.</p>
                          )}
                        </div>

                        {/* Conversación Seleccionada */}
                        <div className="border border-white/10 rounded-2xl bg-[#07070b]/60 flex flex-col h-full overflow-hidden">
                          {selectedSessionId ? (
                            <>
                              <div className="border-b border-white/5 bg-white/[0.02] p-4 flex justify-between items-center shrink-0">
                                <div>
                                  <h4 className="font-bold text-white text-xs leading-tight">
                                    {chatSessions.find((s) => s.id === selectedSessionId)?.client_name || "Cliente Invitado"}
                                  </h4>
                                  <p className="font-mono text-[9px] text-white/40 mt-0.5">ID: {selectedSessionId}</p>
                                </div>
                                <button
                                  onClick={() => loadChatMessages(selectedSessionId)}
                                  className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-white hover:bg-white/10 transition-all cursor-pointer"
                                  title="Recargar conversación"
                                >
                                  <RefreshCw className="h-3.5 w-3.5" />
                                </button>
                              </div>
                              
                              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-black/10">
                                {sessionMessages.map((msg) => (
                                  <div
                                    key={msg.id}
                                    className={`flex w-full ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                                  >
                                    <div
                                      className={`rounded-2xl px-4 py-2.5 text-xs max-w-[85%] leading-relaxed ${
                                        msg.sender === "user"
                                          ? "bg-primary text-white rounded-tr-none shadow-md"
                                          : "bg-white/5 border border-white/10 text-white/90 rounded-tl-none"
                                      }`}
                                    >
                                      <p className="whitespace-pre-wrap">{msg.message}</p>
                                      <span className="block text-[8px] text-white/40 text-right mt-1.5 font-mono">
                                        {new Date(msg.created_at).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </>
                          ) : (
                            <div className="flex h-full flex-col justify-center items-center gap-3 text-center p-8">
                              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/20">
                                <MessageCircle className="h-6 w-6" />
                              </div>
                              <div>
                                <h4 className="font-bold text-white text-xs">Conversación Vacía</h4>
                                <p className="text-white/40 text-[10px] mt-1 max-w-[200px] mx-auto leading-relaxed">
                                  Seleccione un chat activo a la izquierda para ver el historial y transcribir el flujo de mensajes.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </DashboardPanel>
                  )}

                  {!isConsoleLoading && activeConsoleTab === "system" && systemInfo && (
                    <DashboardPanel title="Consola de Diagnósticos y Variables de Entorno" icon={<Terminal className="h-5 w-5 text-primary" />}>
                      <div className="grid gap-5 md:grid-cols-2">
                        {/* Estado del Proceso */}
                        <div className="rounded-2xl border border-white/10 bg-[#0e0e18]/40 p-5 space-y-4">
                          <h4 className="font-bold text-white text-sm flex items-center gap-2">
                            <Activity className="h-4.5 w-4.5 text-emerald-400" /> Métricas del Proceso Node.js
                          </h4>
                          
                          <div className="space-y-2.5 text-xs">
                            <div className="flex justify-between border-b border-white/5 pb-2">
                              <span className="text-white/60">Tiempo Activo (Uptime)</span>
                              <span className="font-bold text-white font-mono">
                                {Math.floor(systemInfo.uptime / 3600)}h {Math.floor((systemInfo.uptime % 3600) / 60)}m {Math.floor(systemInfo.uptime % 60)}s
                              </span>
                            </div>
                            
                            {/* Heap Usado Gauge */}
                            <div className="space-y-1 pt-1">
                              <div className="flex justify-between text-[11px]">
                                <span className="text-white/60">Memoria de Heap (Heap Used)</span>
                                <span className="font-mono font-bold text-white">{Math.round(systemInfo.memory.heapUsed / (1024 * 1024))} / {Math.round(systemInfo.memory.heapTotal / (1024 * 1024))} MB</span>
                              </div>
                              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full" 
                                  style={{ width: `${Math.min(100, Math.round((systemInfo.memory.heapUsed / systemInfo.memory.heapTotal) * 100))}%` }}
                                />
                              </div>
                            </div>

                            {/* RSS Memory */}
                            <div className="flex justify-between border-b border-white/5 pb-2 pt-1">
                              <span className="text-white/60">Memoria Residente (RSS)</span>
                              <span className="font-mono text-white">{Math.round(systemInfo.memory.rss / (1024 * 1024))} MB</span>
                            </div>
                            
                            <div className="flex justify-between pt-1">
                              <span className="text-white/60">Conexión a Supabase</span>
                              <span className="font-bold text-emerald-400 flex items-center gap-1 uppercase text-[10px] tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded-md">
                                <CheckCircle2 className="h-3.5 w-3.5" /> {systemInfo.dbStatus}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Variables de Sistema */}
                        <div className="rounded-2xl border border-white/10 bg-[#0e0e18]/40 p-5 space-y-4">
                          <h4 className="font-bold text-white text-sm flex items-center gap-2">
                            <Database className="h-4.5 w-4.5 text-sky-400" /> Variables del Entorno Activo
                          </h4>
                          <div className="space-y-2.5 text-xs">
                            <div className="flex justify-between border-b border-white/5 pb-2">
                              <span className="text-white/60">Modelo de Lenguaje IA</span>
                              <span className="font-mono font-bold text-white bg-white/5 px-2 py-0.5 rounded-md text-[10px]">{systemInfo.env.AI_MODEL}</span>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-2">
                              <span className="text-white/60">Supabase Storage Bucket</span>
                              <span className="font-mono text-white">{systemInfo.env.SUPABASE_BUCKET}</span>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-2">
                              <span className="text-white/60">Entorno del Servidor</span>
                              <span className="font-bold text-white uppercase text-[10px] bg-purple-500/15 text-purple-400 px-2 py-0.5 rounded-md tracking-wider">{systemInfo.env.NODE_ENV}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/60">Puerto de Escucha</span>
                              <span className="font-mono text-white font-bold">{systemInfo.env.PORT}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </DashboardPanel>
                  )}

                  {!isConsoleLoading && activeConsoleTab === "backup" && (
                    <DashboardPanel title="Copia de Seguridad y Restauración" icon={<Database className="h-5 w-5 text-primary" />}>
                      <div className="grid gap-6 md:grid-cols-2">
                        {/* Export Card */}
                        <div className="rounded-2xl border border-white/10 bg-[#0e0e18]/40 p-5 space-y-4 flex flex-col justify-between">
                          <div className="space-y-2">
                            <h4 className="font-bold text-white text-sm flex items-center gap-2">
                              <Upload className="h-4.5 w-4.5 text-emerald-400 rotate-180" /> Exportar Base de Datos
                            </h4>
                            <p className="text-xs text-white/50 leading-relaxed">
                              Descarga una copia completa de toda la información de la barbería (clientes, citas, servicios, profesionales, galería, etc.) en un archivo en formato JSON.
                            </p>
                          </div>
                          <button
                            onClick={handleExportBackup}
                            className="w-full mt-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                          >
                            <Upload className="h-4 w-4 rotate-180" />
                            DESCARGAR RESPALDO JSON
                          </button>
                        </div>

                        {/* Import Card */}
                        <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.02] p-5 space-y-4">
                          <h4 className="font-bold text-red-400 text-sm flex items-center gap-2">
                            <Shield className="h-4.5 w-4.5 text-red-400" /> Restaurar Base de Datos
                          </h4>
                          
                          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3.5">
                            <p className="text-[11px] font-semibold text-red-300 leading-relaxed">
                              ADVERTENCIA CRÍTICA: Restaurar un respaldo reemplazará COMPLETAMENTE todas las tablas de la base de datos actual. Escribe "RESTAURAR" abajo y selecciona el archivo JSON para proceder.
                            </p>
                          </div>

                          <form onSubmit={handleImportBackup} className="space-y-4">
                            <div className="space-y-2">
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40">Archivo de Respaldo (.json)</label>
                              <div className="flex items-center gap-3">
                                <label className="flex-1 flex flex-col items-center justify-center border border-dashed border-white/15 bg-white/[0.01] hover:bg-white/[0.03] transition-colors rounded-xl px-4 py-6 cursor-pointer text-center">
                                  <Database className="h-6 w-6 text-white/30 mb-2" />
                                  <span className="text-xs text-white/70 font-semibold truncate max-w-xs">
                                    {backupFile ? backupFile.name : "Seleccionar respaldo JSON"}
                                  </span>
                                  <input
                                    type="file"
                                    accept=".json"
                                    onChange={(e) => setBackupFile(e.target.files?.[0] ?? null)}
                                    className="hidden"
                                  />
                                </label>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40">Confirmar Acción Peligrosa</label>
                              <ModernInput
                                type="text"
                                placeholder="Escribe 'RESTAURAR' para confirmar"
                                value={confirmText}
                                onChange={(e: any) => setConfirmText(e.target.value)}
                                className="font-mono text-center tracking-widest text-red-400 border-red-500/20 focus:border-red-500 focus:ring-red-500/50"
                              />
                            </div>

                            <button
                              type="submit"
                              disabled={isRestoring || confirmText !== "RESTAURAR" || !backupFile}
                              className="w-full rounded-xl bg-red-600 disabled:bg-white/5 disabled:text-white/20 disabled:cursor-not-allowed py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-red-600/10 hover:bg-red-500 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                            >
                              {isRestoring ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                              RESTAURAR BASE DE DATOS
                            </button>
                          </form>
                        </div>
                      </div>
                    </DashboardPanel>
                  )}
                </div>
              )}

            </div>
          )}
        </div>
      </main>
      <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
        <button
          onClick={() => {
            setActiveTab("reservas");
            document.getElementById("reservas-list")?.scrollIntoView({ behavior: "smooth" });
          }}
          className="group flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-primary text-white shadow-[0_18px_35px_-12px_rgba(99,102,241,0.9)] transition-all hover:-translate-y-1 hover:scale-105 active:scale-95"
          title="Ir a reservas"
        >
          <Calendar className="h-6 w-6 transition-transform group-hover:rotate-6" />
        </button>
        <button
          onClick={() => setActiveTab("equipo")}
          className="group flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-[#11111c]/95 text-white shadow-[0_18px_35px_-18px_rgba(0,0,0,0.9)] backdrop-blur-xl transition-all hover:-translate-y-1 hover:bg-white hover:text-black active:scale-95"
          title="Agregar profesional"
        >
          <UserPlus className="h-5 w-5 transition-transform group-hover:scale-110" />
        </button>
        <button
          onClick={() => setActiveTab("galeria")}
          className="group flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-[#11111c]/95 text-white shadow-[0_18px_35px_-18px_rgba(0,0,0,0.9)] backdrop-blur-xl transition-all hover:-translate-y-1 hover:bg-white hover:text-black active:scale-95"
          title="Subir imagen"
        >
          <Upload className="h-5 w-5 transition-transform group-hover:-translate-y-0.5" />
        </button>
      </div>
    </div>
  );
}

// Helper Components

function HeroMiniStat({ delay = 0, glow, label, value }: { delay?: number; glow: string; label: string; value: ReactNode }) {
  return (
    <div
      className="admin-metric-glow relative min-w-0 overflow-hidden rounded-xl bg-black/25 px-4 py-3 text-center transition-transform duration-300 hover:-translate-y-0.5"
      style={{ ["--admin-glow" as string]: glow, animationDelay: `${delay}ms` }}
    >
      <p className="text-[11px] font-bold uppercase text-white/40">{label}</p>
      <p className="mt-1 truncate text-sm font-black text-white">{value}</p>
    </div>
  );
}

function ProMetricCard({
  caption,
  delay = 0,
  glow,
  icon,
  title,
  tone,
  value,
  trend,
}: {
  caption: string;
  delay?: number;
  glow: string;
  icon: ReactNode;
  title: string;
  tone: string;
  value: ReactNode;
  trend?: number;
}) {
  return (
    <div
      className="admin-metric-glow group relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0f0f19]/90 p-5 shadow-[0_20px_60px_-45px_rgba(0,0,0,0.95)] transition-all duration-300 hover:-translate-y-1 hover:border-white/[0.16] hover:shadow-[0_26px_70px_-42px_rgba(139,92,246,0.9)]"
      style={{ ["--admin-glow" as string]: glow, animationDelay: `${delay}ms` }}
    >
      <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-br ${tone} opacity-80 transition-opacity group-hover:opacity-100`} />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-xs font-bold uppercase tracking-wider text-white/40">{title}</p>
            {trend !== undefined && (
              trend > 0 ? (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  +{trend.toFixed(1)}%
                </span>
              ) : trend < 0 ? (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-400">
                  {trend.toFixed(1)}%
                </span>
              ) : (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-bold text-white/50">
                  0.0%
                </span>
              )
            )}
          </div>
          <p className="mt-3 text-3xl font-black text-white">{value}</p>
          <p className="mt-2 text-xs font-medium text-white/45">{caption}</p>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white shadow-lg shadow-black/20 transition-transform duration-300 group-hover:scale-110 group-hover:shadow-[0_0_20px_var(--admin-glow)]">
          {icon}
        </div>
      </div>
    </div>
  );
}

function ProMultiTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const revenueItem = payload.find((p: any) => p.dataKey === "revenue");
  const reservationsItem = payload.find((p: any) => p.dataKey === "reservations");

  return (
    <div className="rounded-2xl border border-white/10 bg-[#080812]/95 px-4 py-3 shadow-2xl shadow-black/40 backdrop-blur-xl space-y-1">
      <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">{payload[0].payload.label || payload[0].payload.key}</p>
      {revenueItem && (
        <p className="text-xs font-semibold text-emerald-400 flex items-center justify-between gap-4">
          <span>Ingresos:</span>
          <span className="font-bold">${Number(revenueItem.value).toLocaleString()}</span>
        </p>
      )}
      {reservationsItem && (
        <p className="text-xs font-semibold text-indigo-400 flex items-center justify-between gap-4">
          <span>Reservas:</span>
          <span className="font-bold">{reservationsItem.value} citas</span>
        </p>
      )}
    </div>
  );
}

function ProChartPanel({ action, children, glow = "#8b5cf6", title }: { action: string; children: ReactNode; glow?: string; title: string }) {
  return (
    <div className="admin-panel-glow relative overflow-hidden rounded-[1.75rem] border border-white/[0.08] bg-[#10101b]/92 p-5 shadow-[0_25px_70px_-50px_rgba(0,0,0,0.95)] transition-all duration-300 hover:border-white/[0.14]">
      <div className="absolute right-0 top-0 h-24 w-32 rounded-full blur-3xl admin-hero-orb" style={{ backgroundColor: `${glow}22` }} />
      <div
        className="absolute -bottom-4 left-1/2 h-12 w-2/3 -translate-x-1/2 rounded-full blur-2xl admin-hero-orb-delay"
        style={{ backgroundColor: `${glow}33`, boxShadow: `0 0 40px ${glow}55` }}
      />
      <div className="relative mb-5 flex items-center justify-between gap-4">
        <h3 className="text-base font-black text-white">{title}</h3>
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold text-white/55">{action}</span>
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}

function ProTooltip({ active, formatter, label, payload }: any) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const value = formatter ? formatter(item.value) : item.value;

  return (
    <div className="rounded-2xl border border-white/10 bg-[#080812]/95 px-4 py-3 shadow-2xl shadow-black/40 backdrop-blur-xl">
      <p className="text-xs font-bold uppercase tracking-wider text-white/40">{label || item.name}</p>
      <p className="mt-1 text-lg font-black text-white">{value}</p>
    </div>
  );
}

function ChartLegend({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-xs font-bold text-white/60">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
      <span className="text-white">{value}</span>
    </span>
  );
}

function DonutListChart({ data }: { data: Array<{ name: string; value: number }> }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="grid gap-4 md:grid-cols-[180px_1fr] xl:grid-cols-1">
      <div className="relative h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} innerRadius={58} outerRadius={86} paddingAngle={4} dataKey="value" stroke="rgba(255,255,255,0.06)" strokeWidth={5}>
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
              ))}
            </Pie>
            <Tooltip content={<ProTooltip label="Total" />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-3xl font-black text-white">{total}</p>
            <p className="text-[11px] font-bold uppercase text-white/35">Total</p>
          </div>
        </div>
      </div>
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={item.name} className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.035] px-4 py-3">
            <span className="flex min-w-0 items-center gap-3 text-sm font-semibold text-white/70">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: chartColors[index % chartColors.length] }} />
              <span className="truncate capitalize">{item.name}</span>
            </span>
            <span className="text-sm font-black text-white">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyInsight({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] border-dashed bg-white/[0.025] p-8 text-center text-sm font-medium text-white/40">
      {text}
    </div>
  );
}

function DashboardPanel({ children, icon, title }: { children: ReactNode; icon: ReactNode; title: string }) {
  return (
    <div className="rounded-3xl border border-white/5 bg-[#0e0e18]/80 p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
          {icon}
        </div>
        <h3 className="text-lg font-bold text-white">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function MetricCard({ title, subtitle, value, icon, highlight, shadow }: any) {
  return (
    <div className={`relative overflow-hidden rounded-3xl border border-white/5 bg-[#0e0e18]/80 p-6 ${highlight || ''} ${shadow || 'shadow-sm'}`}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
          {icon}
        </div>
      </div>
      <div>
        <div className="text-3xl font-black text-white">{value}</div>
        <div className="mt-1 text-sm font-semibold text-white/80">{title}</div>
        <div className="mt-1 text-xs text-white/40">{subtitle}</div>
      </div>
    </div>
  )
}

function QuickActionCard({ icon, title, value, onClick }: { icon: ReactNode; title: string; value: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.03] p-5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-white/[0.06] hover:shadow-[0_18px_35px_-25px_rgba(99,102,241,0.9)]"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary transition-transform group-hover:scale-110">
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="text-xs text-white/45">Acceso administrativo rápido</p>
        </div>
      </div>
      <span className="text-2xl font-black text-white">{value}</span>
    </button>
  );
}

function MiniStat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-white/40">{label}</p>
      <p className="mt-2 text-xl font-black text-white">{value}</p>
    </div>
  );
}

function ClientField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-white/40">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white/75">{value}</p>
    </div>
  );
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold uppercase tracking-wider text-white/50">{label}</Label>
      {children}
    </div>
  );
}

function ModernInput(props: any) {
  return (
    <input 
      {...props} 
      className={`flex h-11 w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5 text-sm text-white transition-colors hover:bg-white/[0.04] focus:border-primary/50 focus:bg-white/[0.05] focus:outline-none focus:ring-1 focus:ring-primary/50 ${props.className || ''}`} 
    />
  )
}

function ModernSelect({children, ...props}: any) {
  return (
    <select 
      {...props} 
      className={`flex h-11 w-full appearance-none rounded-xl border border-white/10 bg-[#12121e] px-4 py-2.5 text-sm text-white transition-colors focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50 ${props.className || ''}`}
    >
      {children}
    </select>
  )
}

function ListIcon(props: any) {
  return ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/></svg> )
}

function StatusBadge({ status }: { status: string }) {
  const cn = status === 'confirmed' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : 
             status === 'pending' ? 'bg-amber-500/15 text-amber-400 border-amber-500/20' : 
             status === 'cancelled' ? 'bg-red-500/15 text-red-400 border-red-500/20' : 
             'bg-white/10 text-white border-white/10';
  const label = status in statusLabels ? statusLabels[status as Booking["status"]] : status.replace("_", " ");
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide ${cn}`}>
      {label}
    </span>
  )
}

function PaymentBadge({ status }: { status: string }) {
  const cn = status === 'verified' ? 'bg-purple-500/15 text-purple-400 border-purple-500/20' : 
             status === 'pending_review' ? 'bg-blue-500/15 text-blue-400 border-blue-500/20' : 
             'bg-white/10 text-white border-white/10';
  const label = status in paymentLabels ? paymentLabels[status as Booking["payment_status"]] : status.replace("_", " ");
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide ${cn}`}>
      {label}
    </span>
  )
}
