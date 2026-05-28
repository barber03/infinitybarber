import { ArrowRight, MessageCircle, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router";

const BUSINESS_WHATSAPP = "573127891889";

const HIGHLIGHTS = [
  { label: "Precision", value: "Corte fino" },
  { label: "Ambiente", value: "Premium" },
  { label: "Ciudad", value: "Valledupar" },
];

export function Hero() {
  const navigate = useNavigate();
  const scrollToReserva = () => {
    navigate("/reserva");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <section id="top" className="relative flex min-h-[100svh] items-center justify-center overflow-hidden pt-20 sm:min-h-[94vh]">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1759134198561-e2041049419c?auto=format&fit=crop&fm=jpg&q=80&w=1920')",
        }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,3,8,0.76)_0%,rgba(3,3,8,0.62)_32%,rgba(3,3,8,0.82)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.22),transparent_34%),radial-gradient(circle_at_bottom,rgba(99,102,241,0.18),transparent_30%)]" />
      <div className="absolute left-1/2 top-24 h-52 w-52 -translate-x-1/2 rounded-full bg-primary/20 blur-[130px] sm:top-28 sm:h-60 sm:w-60 sm:blur-[150px]" />

      <div className="absolute inset-x-0 top-0 h-[80vh] bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />

      <div className="container relative z-10 mx-auto px-4 pb-14 pt-10 sm:pb-0 sm:pt-0">
        <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-xs font-semibold text-white/85 backdrop-blur-md sm:mb-8 sm:px-5 sm:text-sm animate-in fade-in slide-in-from-top-4 duration-1000">
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            Infinity Barber Premium
          </div>

          <div className="relative">
             <div className="absolute -inset-x-20 top-1/2 h-64 w-[calc(100%+160px)] -translate-y-1/2 bg-primary/10 blur-[120px] opacity-50 pointer-events-none"></div>
             <h1 className="font-display-epic max-w-5xl text-[3.2rem] font-black uppercase leading-[0.88] tracking-[-0.04em] text-white sm:text-7xl md:text-8xl xl:text-[7.2rem] animate-in zoom-in-95 duration-1000">
               Donde el estilo
               <span className="block bg-gradient-to-r from-white via-primary to-secondary bg-clip-text pb-2 text-transparent sm:pb-3 drop-shadow-[0_0_30px_rgba(139,92,246,0.3)]">
                 impone respeto
               </span>
             </h1>
          </div>

          <p className="mt-8 max-w-2xl text-base leading-8 text-white/60 sm:mt-10 sm:text-xl sm:leading-9 md:text-2xl animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
            Cortes con presencia, detalle quirúrgico en cada linea y una atención diseñada para elevar tu actitud.
          </p>

          <div className="mt-10 flex w-full max-w-4xl flex-col gap-4 sm:mt-12 sm:flex-row sm:justify-center sm:gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
            <Button
              size="lg"
              onClick={scrollToReserva}
              className="group h-16 w-full rounded-full bg-gradient-to-r from-primary to-secondary px-10 text-base font-black uppercase tracking-[0.2em] text-white shadow-[0_20px_40px_-10px_rgba(99,102,241,0.5)] transition-all sm:w-auto cursor-pointer btn-alive-primary whitespace-nowrap shrink-0"
            >
              Reservar ahora
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-2 shrink-0" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/ia-barber")}
              className="h-16 w-full rounded-full border-white/10 bg-white/5 px-10 text-base font-bold text-white backdrop-blur-xl transition-all sm:w-auto cursor-pointer btn-alive-secondary whitespace-nowrap shrink-0"
            >
              <Sparkles className="mr-2 h-5 w-5 text-primary shrink-0" />
              Ver Recomendador IA
            </Button>
            <a
              href={`https://wa.me/${BUSINESS_WHATSAPP}?text=${encodeURIComponent("Hola, quiero informacion sobre servicios y horarios en Infinity Barber.")}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-16 w-full items-center justify-center gap-3 rounded-full border border-white/10 bg-white/5 px-10 text-base font-bold text-white backdrop-blur-xl transition-all sm:w-auto cursor-pointer btn-alive-secondary whitespace-nowrap shrink-0"
            >
              <MessageCircle className="h-6 w-6 text-primary shrink-0" />
              WhatsApp
            </a>
          </div>

          <div className="mt-14 grid w-full max-w-4xl gap-4 sm:mt-20 sm:grid-cols-3 sm:gap-6 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-700">
            {HIGHLIGHTS.map((item) => (
              <div
                key={item.label}
                className="group relative rounded-[1.75rem] border border-white/5 bg-white/[0.03] px-6 py-6 backdrop-blur-2xl transition-all hover:-translate-y-2 hover:border-primary/30 hover:bg-white/[0.06] sm:px-8 sm:py-8"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100 rounded-[1.75rem]"></div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/30 group-hover:text-primary transition-colors">{item.label}</p>
                <p className="mt-3 text-2xl font-black tracking-tight text-white sm:mt-4 sm:text-3xl">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 w-full rotate-180 overflow-hidden leading-none">
        <svg className="relative block h-[42px] w-[calc(118%+1.3px)] md:h-[80px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="fill-background"></path>
        </svg>
      </div>
    </section>
  );
}
