import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { toast } from "sonner";
import { Scissors, Phone, Lock, User, Eye, EyeOff, ChevronRight, Sparkles, RefreshCw } from "lucide-react";
import { apiFetch } from "../lib/api";
import { setClientSession } from "../lib/clientStorage";
import type { ClientSession } from "../lib/clientStorage";

type Mode = "login" | "register";

export function ClientLogin() {
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !pin.trim()) {
      toast.error("Completa todos los campos");
      return;
    }
    if (mode === "register" && !name.trim()) {
      toast.error("Ingresa tu nombre completo");
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      toast.error("El PIN debe ser exactamente 4 dígitos numéricos");
      return;
    }

    setLoading(true);
    try {
      const endpoint = mode === "login"
        ? "/api/auth/client/login"
        : "/api/auth/client/register";

      const body = mode === "login"
        ? { phone: phone.trim(), pin }
        : { name: name.trim(), phone: phone.trim(), pin };

      const data = await apiFetch<ClientSession>(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
      });

      setClientSession(data);
      toast.success(mode === "login" ? "¡Bienvenido de vuelta!" : "¡Cuenta creada! Bienvenido.");
      navigate("/mi-cuenta");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al procesar la solicitud");
    } finally {
      setLoading(false);
    }
  };

  const handlePinInput = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    setPin(digits);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#060608] via-[#0c0c16] to-[#060608] flex flex-col font-sans overflow-x-hidden relative">
      {/* Background grids */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.06),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.05),transparent_40%)] pointer-events-none -z-10"></div>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02] pointer-events-none -z-10"></div>

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5 relative z-10">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 transition-all duration-300 group-hover:bg-primary/20">
            <Scissors className="h-4.5 w-4.5 text-primary group-hover:rotate-12 transition-transform" />
          </div>
          <span className="text-sm font-bold text-white/70 group-hover:text-white transition-colors">
            Infinity Barber
          </span>
        </Link>
        <Link
          to="/"
          className="text-xs text-muted-foreground hover:text-white transition-colors"
        >
          ← Volver al inicio
        </Link>
      </header>

      {/* Main */}
      <div className="flex flex-1 items-center justify-center px-4 py-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Logo / Badge */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary mb-6 shadow-md shadow-primary/5">
              <Sparkles className="h-4 w-4" />
              Panel de Cliente
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              {mode === "login" ? "Inicia sesión" : "Crea tu cuenta"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {mode === "login"
                ? "Accede a tus citas y gestiona tu experiencia"
                : "Regístrate para agendar y gestionar tus citas"}
            </p>
          </div>

          {/* Form wrapper with backdrop glow & float animation */}
          <div className="relative">
            {/* Glowing orb behind login card */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[350px] w-[350px] rounded-full bg-primary/10 blur-[110px] pointer-events-none -z-10 animate-pulse"></div>
            
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 shadow-[0_20px_50px_-15px_rgba(139,92,246,0.25)] backdrop-blur-2xl login-card-float">
              
              {/* Mode toggle */}
              <div className="mb-7 flex rounded-2xl border border-white/10 bg-white/[0.04] p-1.5">
                {(["login", "register"] as Mode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={[
                      "flex-1 rounded-xl py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer",
                      mode === m
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                        : "text-muted-foreground hover:text-white",
                    ].join(" ")}
                  >
                    {m === "login" ? "Iniciar sesión" : "Registrarse"}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
                {/* Name (register only) */}
                {mode === "register" && (
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      <User className="h-3.5 w-3.5 text-primary" />
                      Nombre completo
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder=""
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 focus:shadow-[0_0_12px_rgba(139,92,246,0.15)] transition-all"
                      autoComplete="off"
                    />
                  </div>
                )}

                {/* Phone */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 text-primary" />
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder=""
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 focus:shadow-[0_0_12px_rgba(139,92,246,0.15)] transition-all"
                    autoComplete="off"
                  />
                </div>

                {/* PIN */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    <Lock className="h-3.5 w-3.5 text-primary" />
                    PIN de 4 dígitos
                  </label>
                  <div className="relative">
                    <input
                      type={showPin ? "text" : "password"}
                      value={pin}
                      onChange={(e) => handlePinInput(e.target.value)}
                      placeholder=""
                      maxLength={4}
                      inputMode="numeric"
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 pr-12 text-sm text-white placeholder:text-white/30 outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 focus:shadow-[0_0_12px_rgba(139,92,246,0.15)] transition-all tracking-[0.5em]"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors cursor-pointer"
                    >
                      {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {mode === "register" && (
                    <p className="text-[11px] leading-relaxed text-muted-foreground/60">
                      Elige 4 dígitos que recuerdes fácilmente. Los necesitarás para iniciar sesión.
                    </p>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 w-full rounded-xl bg-gradient-to-r from-primary to-violet-500 py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-[0_8px_25px_-5px_rgba(139,92,246,0.35)] hover:shadow-[0_12px_30px_-5px_rgba(139,92,246,0.5)] transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:scale-100 disabled:shadow-none flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      {mode === "login" ? "Entrar al panel" : "Crear cuenta"}
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Info toggles */}
              {mode === "login" && (
                <p className="mt-6 text-center text-xs text-muted-foreground">
                  ¿No tienes cuenta?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("register")}
                    className="text-primary hover:underline font-bold cursor-pointer"
                  >
                    Regístrate aquí
                  </button>
                </p>
              )}
              {mode === "register" && (
                <p className="mt-6 text-center text-xs text-muted-foreground">
                  ¿Ya tienes cuenta?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className="text-primary hover:underline font-bold cursor-pointer"
                  >
                    Inicia sesión
                  </button>
                </p>
              )}
            </div>
          </div>

          <p className="mt-6 text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground/40 leading-relaxed">
            Al registrarte, usa el mismo número telefónico con el que agendas tus citas.
          </p>
        </div>
      </div>
    </div>
  );
}
