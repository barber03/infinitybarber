import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";
import { Scissors, ShieldCheck, UserRound, Sparkles, ChevronRight, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "../lib/api";
import { setAuthSession } from "../lib/storage";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

interface BarberProfile {
  id: number;
  full_name: string;
  description?: string;
}

interface LoginResponse {
  token: string;
  user: {
    id: number;
    full_name: string;
    username: string;
    role: "barber";
  };
}

export function BarberLogin() {
  const [barbers, setBarbers] = useState<BarberProfile[]>([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    apiFetch<BarberProfile[]>("/api/barbers")
      .then((data) => {
        if (active) setBarbers(data);
      })
      .catch(() => {
        if (active) toast.error("No se pudo cargar el equipo.");
      });

    return () => {
      active = false;
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      const response = await apiFetch<LoginResponse>("/api/auth/barber/login", {
        method: "POST",
        body: JSON.stringify({
          username,
          password,
        }),
      });

      setAuthSession(response);
      toast.success(`Bienvenido, ${response.user.full_name}.`);
      navigate("/barber");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo iniciar sesion.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#06060a_0%,#0c0c16_50%,#060608_100%)] p-4 font-sans overflow-x-hidden relative">
      {/* Background grids */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.05),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.05),transparent_40%)] pointer-events-none -z-10"></div>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.015] pointer-events-none -z-10"></div>

      {/* Floating Card Container */}
      <div className="relative w-full max-w-xl">
        {/* Glow orb behind the card */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[350px] w-[350px] rounded-full bg-primary/10 blur-[110px] pointer-events-none -z-10 animate-pulse"></div>

        <Card className="w-full border-white/10 bg-[linear-gradient(135deg,rgba(18,18,30,0.82),rgba(10,10,18,0.92))] backdrop-blur-2xl shadow-[0_20px_50px_-15px_rgba(139,92,246,0.25)] login-card-float">
          <CardHeader className="space-y-4 p-8 text-center">
            <div className="mx-auto flex h-18 w-18 items-center justify-center rounded-[1.6rem] border border-primary/20 bg-primary/10 shadow-[0_0_30px_rgba(99,102,241,0.15)]">
              <Scissors className="h-8 w-8 text-primary animate-pulse" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary mb-3 shadow-md">
                <Sparkles className="h-3.5 w-3.5" />
                Equipo de Barberos
              </div>
              <CardTitle className="bg-gradient-to-r from-white via-primary to-secondary bg-clip-text text-3xl font-black text-transparent uppercase tracking-tight">
                Panel de barbero
              </CardTitle>
              <CardDescription className="mt-2 text-sm text-white/60 leading-relaxed">
                Inicia con tu usuario personal asignado para ver y gestionar tu agenda de hoy.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 p-8 pt-0">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">Equipo de Guardia</p>
              <p className="mt-2 text-xs font-bold text-white/70 leading-relaxed">
                {barbers.map((barber) => barber.full_name).join(" · ") || "Sin barberos cargados..."}
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5" autoComplete="off">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/50">
                  <UserRound className="h-3.5 w-3.5 text-primary" />
                  Usuario de Acceso
                </label>
                <input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder=""
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 focus:shadow-[0_0_12px_rgba(139,92,246,0.15)] transition-all"
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/50">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder=""
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 focus:shadow-[0_0_12px_rgba(139,92,246,0.15)] transition-all"
                  autoComplete="new-password"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="h-13 w-full bg-gradient-to-r from-primary to-secondary text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-[0_8px_25px_-5px_rgba(99,102,241,0.35)] hover:shadow-[0_12px_30px_-5px_rgba(99,102,241,0.5)] transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:scale-100 disabled:shadow-none flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Entrar al panel
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/5 pt-4 text-xs font-semibold text-muted-foreground">
              <button onClick={() => navigate("/admin/login")} className="hover:text-primary hover:underline transition-colors cursor-pointer bg-transparent border-none">
                Acceso Administrador
              </button>
              <Link to="/" className="hover:text-white transition-colors">
                ← Volver al Inicio
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
