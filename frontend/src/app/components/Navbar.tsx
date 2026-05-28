import { useEffect, useState } from "react";
import { Menu, Scissors, X, User } from "lucide-react";
import { Link, useLocation } from "react-router";
import { getClientSession } from "../lib/clientStorage";

const NAV_ITEMS = [
  { label: "Servicios", path: "/servicios" },
  { label: "Equipo", path: "/equipo" },
  { label: "Galeria", path: "/galeria" },
  { label: "Recomendador IA", path: "/ia-barber" },
  { label: "Contacto", path: "#contacto" },
];

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const clientSession = getClientSession();

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToSection = (id: string) => {
    setIsMobileMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-black/60 shadow-2xl backdrop-blur-xl transition-all">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-20 items-center justify-between gap-3 py-2">
          <Link to="/" className="group flex items-center gap-3 text-left transition-transform hover:scale-105" onClick={handleLinkClick}>
             <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary shadow-[0_0_15px_rgba(139,92,246,0.4)]">
                <Scissors className="h-6 w-6 text-primary-foreground transition-transform group-hover:rotate-12" />
             </div>
            <span className="bg-gradient-to-r from-white via-white to-primary/60 bg-clip-text text-xl font-black tracking-[0.25em] text-transparent sm:text-2xl">
              INFINITY
            </span>
          </Link>
 
          <div className="hidden md:block">
            <div className="flex items-center space-x-10 text-xs font-black uppercase tracking-[0.2em]">
              {NAV_ITEMS.map((item) => (
                item.path.startsWith("#") ? (
                  <button
                    key={item.label}
                    onClick={() => scrollToSection(item.path.substring(1))}
                    className="text-white/40 transition-all hover:text-primary hover:tracking-[0.25em] cursor-pointer"
                  >
                    {item.label}
                  </button>
                ) : (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={handleLinkClick}
                    className={`${pathname === item.path ? "text-primary tracking-[0.25em]" : "text-white/40"} transition-all hover:text-primary hover:tracking-[0.25em] cursor-pointer`}
                  >
                    {item.label}
                  </Link>
                )
              ))}
              {/* Mi Cuenta */}
              <Link
                to="/mi-cuenta"
                onClick={handleLinkClick}
                className={`flex items-center gap-1.5 transition-all hover:text-primary hover:tracking-[0.25em] cursor-pointer ${
                  pathname.startsWith("/mi-cuenta") ? "text-primary" : "text-white/40"
                }`}
              >
                {clientSession ? (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-[10px] font-black">
                    {clientSession.user.name[0]?.toUpperCase()}
                  </span>
                ) : (
                  <User className="h-3.5 w-3.5" />
                )}
                Mi Cuenta
              </Link>
              <Link
                to={clientSession ? "/reserva" : "/mi-cuenta/login"}
                onClick={handleLinkClick}
                className="rounded-2xl bg-gradient-to-r from-primary to-secondary px-8 py-3 text-primary-foreground shadow-[0_10px_20px_-5px_rgba(99,102,241,0.4)] transition-all hover:scale-105 hover:shadow-[0_15px_30px_-5px_rgba(139,92,246,0.5)] active:scale-95 cursor-pointer"
              >
                Reservar
              </Link>
            </div>
          </div>
 
          <div className="flex items-center gap-3 md:hidden">
            <Link
              to={clientSession ? "/reserva" : "/mi-cuenta/login"}
              onClick={handleLinkClick}
              className="rounded-full bg-gradient-to-r from-primary to-secondary px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-primary-foreground shadow-lg active:scale-95 cursor-pointer"
            >
              Cita
            </Link>
            <button
              type="button"
              aria-label={isMobileMenuOpen ? "Cerrar menu" : "Abrir menu"}
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen((current) => !current)}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/5 bg-white/5 text-white/60 transition-all hover:border-primary/40 hover:text-primary active:scale-90 cursor-pointer"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
 
      {isMobileMenuOpen && (
        <div className="animate-in slide-in-from-top-4 border-t border-white/5 bg-black/95 px-6 pb-8 pt-6 backdrop-blur-3xl md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-3">
            {NAV_ITEMS.map((item) => (
              item.path.startsWith("#") ? (
                <button
                  key={item.label}
                  onClick={() => scrollToSection(item.path.substring(1))}
                  className="rounded-2xl border border-white/5 bg-white/5 px-6 py-4 text-left text-[11px] font-black uppercase tracking-[0.3em] text-white/60 transition-all hover:bg-primary/20 hover:text-white cursor-pointer"
                >
                  {item.label}
                </button>
              ) : (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={handleLinkClick}
                  className={`rounded-2xl border border-white/5 ${pathname === item.path ? "bg-primary/20 text-white border-primary/40" : "bg-white/5 text-white/60"} px-6 py-4 text-left text-[11px] font-black uppercase tracking-[0.3em] transition-all hover:bg-primary/20 hover:text-white cursor-pointer`}
                >
                  {item.label}
                </Link>
              )
            ))}
            <Link
              to="/mi-cuenta"
              onClick={handleLinkClick}
              className={`rounded-2xl border ${pathname.startsWith("/mi-cuenta") ? "bg-primary/20 text-white border-primary/40" : "border-white/5 bg-white/5 text-white/60"} px-6 py-4 text-left text-[11px] font-black uppercase tracking-[0.3em] transition-all hover:bg-primary/20 hover:text-white flex items-center gap-2 cursor-pointer`}
            >
              <User className="h-4 w-4" />
              Mi Cuenta {clientSession && `(${clientSession.user.name.split(" ")[0]})`}
            </Link>
            <Link
              to={clientSession ? "/reserva" : "/mi-cuenta/login"}
              onClick={handleLinkClick}
              className="mt-4 rounded-2xl bg-gradient-to-r from-primary to-secondary px-6 py-5 text-center text-[11px] font-black uppercase tracking-[0.3em] text-primary-foreground shadow-xl active:scale-95 cursor-pointer"
            >
              {clientSession ? "Ir a la reserva" : "Inicia sesión para reservar"}
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
