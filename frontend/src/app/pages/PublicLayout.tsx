import { Outlet, useNavigate, useLocation } from "react-router";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { Button } from "../components/ui/button";
import { Scissors, UserCog } from "lucide-react";
import { getClientSession } from "../lib/clientStorage";

export function PublicLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div className="relative min-h-screen bg-[#06060a] font-sans text-white selection:bg-primary/30 scroll-smooth overflow-x-hidden">
      {/* Visual background layers */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.1),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(99,102,241,0.08),transparent_50%)]"></div>
      <div className="fixed inset-0 -z-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none"></div>
      <div className="fixed top-0 left-1/4 -z-10 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-0 right-1/4 -z-10 h-[400px] w-[400px] rounded-full bg-secondary/5 blur-[100px] pointer-events-none"></div>

      <Navbar />
      
      <main className="relative pt-16">
        <Outlet />
      </main>

      <Footer />

      {/* Floating Buttons */}
      {!(getClientSession() || pathname === "/reserva") && (
        <div className="fixed bottom-6 right-4 z-50 flex flex-col gap-3 sm:right-6">
          <Button
            size="icon"
            className="h-10 w-10 rounded-full border border-white/10 bg-secondary/80 text-white backdrop-blur-md transition-all hover:bg-secondary hover:scale-110 sm:h-12 sm:w-12 shadow-[0_0_20px_rgba(0,0,0,0.5)] cursor-pointer"
            onClick={() => navigate("/barber/login")}
            title="Acceso Barbero"
          >
            <Scissors className="h-5 w-5 sm:h-6 sm:w-6" />
          </Button>

          <Button
            size="icon"
            className="h-10 w-10 rounded-full border border-white/10 bg-primary/80 text-white backdrop-blur-md transition-all hover:bg-primary hover:scale-110 sm:h-12 sm:w-12 shadow-[0_0_20px_rgba(139,92,246,0.3)] cursor-pointer"
            onClick={() => navigate("/admin/login")}
            title="Acceso Administrador"
          >
            <UserCog className="h-5 w-5 sm:h-6 sm:w-6" />
          </Button>
        </div>
      )}
    </div>
  );
}
