import { useEffect, useState } from "react";
import { ArrowRight, Award, BadgeCheck, Scissors, Star } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { apiFetch, resolveAssetUrl as resolveRemoteAssetUrl } from "../lib/api";
import { useNavigate } from "react-router";

interface Barber {
  id: number;
  full_name: string;
  avatar_url?: string;
  description?: string;
  specialties?: string[];
  rank?: number | null;
}

const AVATARS = [
  "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=800&q=80",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&q=80",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80",
];

const CREW_METRICS = [
  { label: "Perfil", value: "Elite" },
  { label: "Acabado", value: "Preciso" },
  { label: "Ambiente", value: "Premium" },
];

const resolveAvatarUrl = (url: string | undefined, fallback: string) => resolveRemoteAssetUrl(url) || fallback;

export function BarbersList() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    apiFetch<Barber[]>("/api/barbers")
      .then((data) => setBarbers(data))
      .catch((e) => console.error(e));
  }, []);

  const scrollToBooking = () => {
    navigate("/reserva");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <section id="equipo" className="relative overflow-hidden bg-[#06060a] py-20 sm:py-24">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.08),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(139,92,246,0.06),transparent_40%)]"></div>
      
      <div className="container relative z-10 mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-5 py-2 text-xs font-black uppercase tracking-[0.25em] text-primary transition-all hover:bg-primary/20">
            <BadgeCheck className="h-4 w-4" />
            Equipo de confianza
          </div>
          <h2 className="mb-6 text-4xl font-black tracking-tight text-white sm:text-5xl md:text-6xl">
            El <span className="bg-gradient-to-r from-primary via-secondary to-white bg-clip-text text-transparent">Escuadrón</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-white/50 sm:text-xl">
            Profesionales que elevan el estándar de Infinity Barber en cada corte, barba y detalle final.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-6xl gap-6 overflow-hidden rounded-[2.5rem] border border-white/5 bg-[#0d0d14]/40 p-6 backdrop-blur-3xl lg:grid-cols-[1fr_0.8fr] shadow-[0_40px_100px_-30px_rgba(0,0,0,0.5)]">
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-primary/30 bg-primary/10 drop-shadow-[0_0_15px_rgba(99,102,241,0.3)]">
              <Scissors className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Talento en cabina</p>
              <p className="text-xl font-black text-white">Barberos listos para transformar tu estilo</p>
              <p className="mt-1 text-sm text-white/40">Visión estética avanzada, técnica superior y disciplina en cada silla.</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {CREW_METRICS.map((metric, index) => (
              <div
                key={metric.label}
                className={`rounded-[1.75rem] border p-5 transition-all hover:bg-white/5 ${index === 0 ? "border-primary/20 bg-primary/5" : "border-white/5 bg-white/[0.02]"}`}
              >
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30">{metric.label}</p>
                <p className="mt-2 text-2xl font-black text-white">{metric.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-12 grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
          {barbers.map((barber, idx) => {
            const specialty = barber.specialties?.[0] || "Estilo premium";
            const tags = barber.specialties?.length ? barber.specialties.slice(0, 3) : ["Precisión", "Visión", "Vibe"];

            return (
              <Card
                key={barber.id}
                className="group relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-[#0d0d12]/50 shadow-2xl transition-all duration-700 hover:-translate-y-4 hover:border-primary/40 hover:shadow-[0_40px_80px_-20px_rgba(99,102,241,0.25)]"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
                
                <div className="relative aspect-[4/4.5] overflow-hidden">
                  <img
                    src={resolveAvatarUrl(barber.avatar_url, AVATARS[idx % AVATARS.length])}
                    alt={barber.full_name}
                    className="h-full w-full object-cover grayscale-[0.3] transition-all duration-1000 group-hover:scale-110 group-hover:grayscale-0"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#06060a] via-[#06060b]/20 to-transparent"></div>
                  
                  <div className="absolute left-6 top-6 flex items-center gap-2">
                    {barber.rank ? (
                      <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.3em] text-amber-300 backdrop-blur-md">
                        Top #{barber.rank}
                      </span>
                    ) : (
                      <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[9px] font-black uppercase tracking-[0.3em] text-white/80 backdrop-blur-md transition-all group-hover:border-primary/50 group-hover:text-primary">
                        INV-{String(idx + 1).padStart(2, "0")}
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Enfoque principal</p>
                      <p className="mt-2 text-xl font-black text-white sm:text-2xl drop-shadow-md">{specialty}</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/40 bg-primary/10 text-primary shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">
                      <Award className="h-5 w-5" />
                    </div>
                  </div>
                </div>

                <CardContent className="relative z-10 space-y-6 p-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-3xl font-black tracking-tight text-white group-hover:text-primary transition-colors">{barber.full_name}</h3>
                    <div className="flex text-primary">
                       {[...Array(5)].map((_, i) => <Star key={i} className="h-3 w-3 fill-current opacity-80" />)}
                    </div>
                  </div>

                  <p className="text-sm leading-8 text-white/40 group-hover:text-white/60 transition-colors">
                    {barber.description || "Maestro del detalle con un enfoque quirúrgico. Su silla es sinónimo de perfección, estilo refinado e imagen de alta presencia."}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span key={tag} className="rounded-full border border-white/5 bg-white/5 px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-white/40 group-hover:border-primary/20 group-hover:text-white/80 transition-all">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <Button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); scrollToBooking(); }}
                    className="h-16 w-full justify-between rounded-2xl bg-white/[0.03] border border-white/10 px-6 text-[11px] font-black uppercase tracking-[0.3em] text-white transition-all hover:bg-primary/20 hover:border-primary/40 hover:scale-[1.02]"
                  >
                    Separar Cita
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-2" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
