import { useRouteError, isRouteErrorResponse } from "react-router";
import { AlertOctagon, RotateCcw, Home } from "lucide-react";

export function RouteErrorBoundary() {
  const error = useRouteError();
  console.error("Route Error:", error);

  let errorMessage = "Ocurrió un error inesperado en la interfaz.";
  let errorDetail = "";

  if (isRouteErrorResponse(error)) {
    errorMessage = `${error.status} - ${error.statusText}`;
    errorDetail = error.data?.message || JSON.stringify(error.data) || "";
  } else if (error instanceof Error) {
    errorMessage = error.message;
    errorDetail = error.stack || "";
  } else if (typeof error === "string") {
    errorMessage = error;
  }

  const handleReload = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = "/";
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#06060a] bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(120,119,198,0.12),rgba(255,255,255,0))] text-white p-6 font-sans">
      <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[100px] pointer-events-none"></div>
      
      <div className="relative max-w-lg w-full overflow-hidden rounded-[2rem] border border-white/10 bg-[#0d0d15]/80 p-8 text-center shadow-[0_30px_90px_-40px_rgba(139,92,246,0.3)] backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-500">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-red-500/10 blur-3xl"></div>
        
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.15)]">
          <AlertOctagon size={32} className="animate-pulse" />
        </div>

        <h1 className="text-2xl font-black tracking-tight text-white mb-2">
          ¡Ups! Algo no salió como esperábamos
        </h1>
        
        <p className="text-sm text-white/60 mb-6 leading-relaxed">
          La aplicación detectó un conflicto visual o de datos (a veces causado por extensiones del navegador o traductores automáticos).
        </p>

        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 mb-8 text-left">
          <p className="text-xs font-bold uppercase tracking-widest text-red-400 mb-1.5">Detalle técnico</p>
          <p className="font-mono text-xs text-white/50 break-words leading-normal max-h-24 overflow-y-auto">
            {errorMessage}
            {errorDetail && <span className="block mt-1 opacity-60 text-[10px]">{errorDetail.substring(0, 150)}...</span>}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleReload}
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-purple-600 px-6 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all cursor-pointer"
          >
            <RotateCcw size={16} />
            Recargar Aplicación
          </button>
          
          <button
            onClick={handleGoHome}
            className="flex h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 text-sm font-semibold uppercase tracking-wider text-white/80 hover:bg-white/10 hover:text-white active:scale-95 transition-all cursor-pointer"
          >
            <Home size={16} />
            Ir al Inicio
          </button>
        </div>
      </div>
    </div>
  );
}
