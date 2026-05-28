import { useEffect, useState } from "react";
import { ArrowRight, Clock, Scissors, Sparkles, Zap } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { apiFetch, resolveAssetUrl } from "../lib/api";
import { useNavigate } from "react-router";

interface Service {
  id: number;
  name: string;
  price: number;
  duration_minutes: number;
  image_url?: string;
}

const SERVICES_BACKGROUND_IMAGE =
  "/gallery/1774990153881-whatsapp-image-2026-03-31-at-2-59-42-pm-3.jpeg";

const HEXAGON_CLIP_PATH = "polygon(25% 6.7%, 75% 6.7%, 100% 50%, 75% 93.3%, 25% 93.3%, 0% 50%)";

const getServiceAccent = (index: number) => {
  const accents = [
    "from-primary/30 via-primary/10 to-transparent",
    "from-secondary/30 via-secondary/10 to-transparent",
    "from-primary/24 via-secondary/12 to-transparent",
    "from-secondary/24 via-primary/12 to-transparent",
  ];

  return accents[index % accents.length];
};

const getServiceTag = (duration: number) => {
  if (duration <= 30) return "Rapido";
  if (duration <= 50) return "Popular";
  return "Premium";
};

const buildServiceCopy = (service: Service | undefined) => {
  if (!service) {
    return "Explora opciones pensadas para mantener tu estilo fresco, preciso y listo para cualquier ocasion.";
  }

  if (service.duration_minutes <= 30) {
    return "Ideal para quienes buscan verse impecables sin perder tiempo. Un servicio agil y bien ejecutado.";
  }

  if (service.duration_minutes <= 50) {
    return "Una sesion equilibrada para renovar tu look con detalle, tecnica y una experiencia comoda.";
  }

  return "Pensado para clientes que quieren una atencion mas completa, acabados finos y un resultado con mas presencia.";
};

const getServiceHighlights = (service: Service | undefined) => {
  if (!service) {
    return ["Detalle fino", "Asesoria visual"];
  }

  if (service.duration_minutes <= 30) {
    return ["Salida rapida", "Acabado limpio"];
  }

  if (service.duration_minutes <= 50) {
    return ["Look balanceado", "Definicion precisa"];
  }

  return ["Experiencia completa", "Presencia premium"];
};

export function ServicesList() {
  const [services, setServices] = useState<Service[]>([]);
  const [activeServiceId, setActiveServiceId] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    apiFetch<Service[]>("/api/services")
      .then((data: Service[]) => {
        setServices(data);
        if (data.length > 0) {
          setActiveServiceId(data[0].id);
        }
      })
      .catch((e) => console.error(e));
  }, []);

  const activeService = services.find((service) => service.id === activeServiceId) ?? services[0];

  const scrollToBooking = () => {
    navigate("/reserva");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <section id="servicios" className="relative overflow-hidden bg-[#040404] py-20 sm:py-24">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-18 saturate-[0.75]"
        style={{ backgroundImage: `url('${SERVICES_BACKGROUND_IMAGE}')` }}
      />
      <div
        className="absolute inset-0 opacity-95"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(3,3,8,0.82) 0%, rgba(4,4,10,0.92) 36%, rgba(4,4,8,0.98) 100%), linear-gradient(90deg, rgba(4,4,8,0.94) 0%, rgba(8,8,18,0.66) 38%, rgba(4,4,8,0.88) 100%), radial-gradient(circle at 18% 18%, rgba(99,102,241,0.18), transparent 24%), radial-gradient(circle at 78% 22%, rgba(139,92,246,0.18), transparent 30%), radial-gradient(circle at 50% 100%, rgba(99,102,241,0.14), transparent 44%)",
        }}
      />
      <div className="absolute inset-y-0 left-0 w-[32%] bg-[linear-gradient(90deg,rgba(0,0,0,0.78),transparent)]" />
      <div className="absolute inset-y-0 right-0 w-[26%] bg-[linear-gradient(270deg,rgba(0,0,0,0.72),transparent)]" />
      <div className="absolute inset-0 backdrop-blur-[1.5px]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:120px_120px] opacity-20" />
      <div className="absolute right-0 top-24 h-80 w-80 rounded-full bg-primary/16 blur-[140px]" />
      <div className="absolute left-1/2 top-28 h-96 w-[34rem] -translate-x-1/2 rounded-full bg-secondary/10 blur-[160px]" />
      <div className="absolute bottom-0 left-0 right-0 h-56 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.72))]" />
      <div className="absolute left-[6%] top-20 hidden lg:block">
        <div
          className="h-[18rem] w-[15.5rem] border border-primary/18 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.01))] shadow-[0_30px_90px_rgba(0,0,0,0.4)] backdrop-blur-sm"
          style={{ clipPath: HEXAGON_CLIP_PATH }}
        />
        <div
          className="absolute left-10 top-14 h-[12rem] w-[10.5rem] border border-white/8 bg-[linear-gradient(180deg,rgba(99,102,241,0.2),rgba(255,255,255,0.02))]"
          style={{ clipPath: HEXAGON_CLIP_PATH }}
        />
      </div>
      <div className="absolute right-[9%] top-24 hidden lg:block">
        <div
          className="h-[10rem] w-[8.8rem] border border-secondary/18 bg-secondary/10 shadow-[0_0_60px_rgba(139,92,246,0.12)]"
          style={{ clipPath: HEXAGON_CLIP_PATH }}
        />
      </div>
      <div className="absolute left-1/2 top-16 hidden -translate-x-1/2 lg:block">
        <div className="grid grid-cols-5 gap-4 opacity-55">
          {Array.from({ length: 10 }).map((_, index) => (
            <div
              key={index}
              className={[
                "h-14 w-12 border backdrop-blur-sm",
                index % 3 === 0 ? "border-primary/25 bg-primary/10" : "border-white/8 bg-white/[0.03]",
              ].join(" ")}
              style={{
                clipPath: HEXAGON_CLIP_PATH,
                transform: index >= 5 ? "translateX(1.75rem)" : undefined,
              }}
            />
          ))}
        </div>
      </div>

      <div className="container relative z-10 mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary shadow-[0_0_30px_rgba(99,102,241,0.12)]">
            <Sparkles className="h-4 w-4" />
            Experiencia personalizada
          </div>
          <h2 className="mb-6 text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl">
            Nuestros <span className="bg-gradient-to-r from-white via-primary to-secondary bg-clip-text text-transparent">Servicios</span>
          </h2>
          <p className="mx-auto max-w-2xl text-base text-white/68 sm:text-lg md:text-xl">
            Pasa el cursor o toca una tarjeta para descubrir una opcion distinta y reservar la que mejor encaja contigo.
          </p>
        </div>

        {activeService && (
          <div className="relative mx-auto mt-12 max-w-6xl overflow-hidden rounded-[1.75rem] border border-white/10 bg-[linear-gradient(135deg,rgba(12,12,18,0.88),rgba(22,22,36,0.82))] p-5 shadow-[0_25px_90px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:mt-14 sm:rounded-[2rem] sm:p-6 md:p-8">
            <div className="absolute inset-y-0 right-0 hidden w-[28%] lg:block">
              <div
                className="absolute right-10 top-8 h-40 w-36 border border-primary/20 bg-primary/10"
                style={{ clipPath: HEXAGON_CLIP_PATH }}
              />
              <div
                className="absolute right-28 top-28 h-28 w-24 border border-white/8 bg-white/[0.03]"
                style={{ clipPath: HEXAGON_CLIP_PATH }}
              />
              <div
                className="absolute right-12 top-44 h-48 w-44 border border-secondary/18 bg-[linear-gradient(180deg,rgba(139,92,246,0.14),rgba(99,102,241,0.06))]"
                style={{ clipPath: HEXAGON_CLIP_PATH }}
              />
            </div>
            <div className="grid items-center gap-6 sm:gap-8 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-primary">
                  <Scissors className="h-4 w-4" />
                  Servicio destacado
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight text-white sm:text-3xl md:text-4xl">
                    {activeService.name}
                  </h3>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-white/68 sm:text-base md:text-lg">
                    {buildServiceCopy(activeService)}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-1">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">Precio</p>
                  <p className="mt-2 text-3xl font-black text-primary">${activeService.price.toFixed(2)}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">Duracion</p>
                  <p className="mt-2 flex items-center gap-2 text-xl font-bold text-white">
                    <Clock className="h-5 w-5 text-primary" />
                    {activeService.duration_minutes} min
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">Perfil</p>
                  <p className="mt-2 text-xl font-bold text-white">{getServiceTag(activeService.duration_minutes)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="relative mt-8 sm:mt-10">
          <div className="absolute inset-0 hidden lg:block">
            <div className="absolute inset-x-12 inset-y-4 rounded-[2.5rem] bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.16),transparent_48%)] blur-3xl" />
            <div className="absolute left-[8%] top-[15%] h-px w-[28%] bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-70" />
            <div className="absolute right-[8%] top-[15%] h-px w-[28%] bg-gradient-to-r from-transparent via-secondary/35 to-transparent opacity-70" />
            <div className="absolute left-1/2 top-[8%] h-24 w-px -translate-x-1/2 bg-gradient-to-b from-primary/0 via-primary/35 to-transparent opacity-80" />
            <div className="absolute inset-x-0 top-8 bottom-0 flex items-center justify-center opacity-70">
              <div className="grid grid-cols-8 gap-4">
                {Array.from({ length: 32 }).map((_, index) => (
                  <div
                    key={index}
                    className={[
                      "h-[4.5rem] w-[3.9rem] border shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
                      index % 4 === 0
                        ? "border-primary/16 bg-primary/[0.06]"
                        : index % 4 === 1
                          ? "border-secondary/14 bg-secondary/[0.05]"
                          : "border-white/[0.05] bg-white/[0.02]",
                    ].join(" ")}
                    style={{
                      clipPath: HEXAGON_CLIP_PATH,
                      transform: index >= 8 && index < 16 || index >= 24 ? "translateX(2rem)" : undefined,
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="absolute inset-x-[18%] bottom-10 hidden h-20 rounded-full bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.14),transparent_65%)] blur-2xl xl:block" />
            <div className="absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(180deg,transparent,rgba(4,4,8,0.95))]" />
          </div>

          <div className="relative grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {services.map((service, index) => {
            const isActive = service.id === activeService?.id;
            const highlights = getServiceHighlights(service);

            return (
              <Card
                key={service.id}
                onMouseEnter={() => setActiveServiceId(service.id)}
                onFocus={() => setActiveServiceId(service.id)}
                onClick={() => setActiveServiceId(service.id)}
                className={[
                  "group relative cursor-pointer overflow-hidden rounded-[2rem] border bg-[#0d0d12]/40 backdrop-blur-xl transition-all duration-500",
                  "hover:-translate-y-4 hover:border-primary/40 hover:shadow-[0_40px_80px_-20px_rgba(99,102,241,0.25)]",
                  isActive ? "border-primary/50 shadow-[0_40px_80px_-20px_rgba(99,102,241,0.3)] ring-1 ring-primary/20" : "border-white/5",
                ].join(" ")}
                tabIndex={0}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${getServiceAccent(index)} opacity-0 transition-opacity duration-500 group-hover:opacity-100`}></div>
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                
                <CardHeader className="relative z-10 pb-4">
                  <div className="mb-6 mt-8 flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-black/40 shadow-xl transition-all duration-500 overflow-hidden group-hover:scale-110 group-hover:rotate-3 group-hover:border-primary/40">
                    {service.image_url ? (
                      <img src={resolveAssetUrl(service.image_url)} alt={service.name} className="h-full w-full object-cover" />
                    ) : (
                      <Scissors className="h-8 w-8 text-primary drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                    )}
                  </div>
                  <CardTitle className="text-2xl font-black leading-tight text-white group-hover:text-primary transition-colors">
                    {service.name}
                  </CardTitle>
                  <CardDescription className="mt-4 flex items-center gap-2 text-sm font-bold text-white/40 group-hover:text-white/60 transition-colors">
                    <Clock className="h-4 w-4 text-primary" />
                    {service.duration_minutes} min
                  </CardDescription>
                </CardHeader>
 
                <CardContent className="relative z-10 space-y-6">
                  <div className="flex flex-wrap gap-2">
                    {highlights.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-white/5 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/50 group-hover:border-primary/20 group-hover:text-white/80 transition-all"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
 
                  <div className="rounded-2xl border border-white/5 bg-black/20 p-4 transition-colors group-hover:bg-black/40">
                    <p className="text-sm leading-7 text-white/50 group-hover:text-white/70 transition-colors">
                      {buildServiceCopy(service)}
                    </p>
                  </div>
 
                  <div className="flex items-end justify-between gap-4 pt-2">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/30">Valor</p>
                      <p className="mt-1 text-3xl font-black text-white sm:text-4xl group-hover:scale-105 transition-transform origin-left">
                        ${service.price.toFixed(2)}
                      </p>
                    </div>
                    <div className={`rounded-full border px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${isActive ? "border-primary/40 bg-primary/20 text-primary" : "border-white/10 bg-white/5 text-white/40"}`}>
                      {isActive ? "Seleccionado" : "Ver mas"}
                    </div>
                  </div>
 
                  <Button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      scrollToBooking();
                    }}
                    className={`h-16 w-full justify-between rounded-2xl px-6 text-xs font-black uppercase tracking-[0.25em] transition-all duration-300 ${isActive ? "bg-gradient-to-r from-primary to-secondary text-white shadow-[0_15px_30px_-10px_rgba(99,102,241,0.4)]" : "bg-white/5 text-white hover:bg-primary/20 hover:border-primary/30"}`}
                  >
                    Agendar Cita
                    <ArrowRight className={`h-5 w-5 transition-transform ${isActive ? "translate-x-2" : "group-hover:translate-x-2"}`} />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
          </div>
        </div>
      </div>

      {/* Visual Bridge to Footer */}
      <div className="relative h-64 mt-20 overflow-hidden pointer-events-none">
         <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#06060a]/80 to-[#0a0a0e]"></div>
         <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"></div>
         <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-[100px]"></div>
         <p className="absolute bottom-10 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-[0.4em] text-white/20 whitespace-nowrap">
            ESTILO SIN LIMITES · INFINITY BARBER
         </p>
      </div>
    </section>
  );
}
