import { useEffect, useState } from "react";
import { ArrowUpRight, Camera, Images, Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./ui/dialog";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { apiFetch, resolveAssetUrl } from "../lib/api";

interface GalleryImage {
  id: number;
  url: string;
}

export function Gallery() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  useEffect(() => {
    apiFetch<GalleryImage[]>("/api/gallery")
      .then((data) => setImages(data))
      .catch((e) => console.error(e));
  }, []);

  if (images.length === 0) return null;

  return (
    <section id="galeria" className="relative overflow-hidden bg-[#06060a] py-20 sm:py-24">
      {/* Visual background layers */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.08),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(139,92,246,0.06),transparent_40%)]"></div>

      <div className="container relative z-10 mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-5 py-2 text-xs font-black uppercase tracking-[0.25em] text-primary transition-all hover:bg-primary/20">
            <Camera className="h-4 w-4" />
            Portafolio Visual
          </div>
          <h2 className="mb-6 text-4xl font-black tracking-tight text-white sm:text-5xl md:text-6xl">
            Galería de <span className="bg-gradient-to-r from-primary via-secondary to-white bg-clip-text text-transparent">Resultados</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-white/50 sm:text-xl">
            Explora cortes reales con acabados quirúrgicos que definen la estética de Infinity Barber.
          </p>
        </div>
 
        <div className="mx-auto mt-14 flex max-w-6xl flex-col items-start justify-between gap-6 overflow-hidden rounded-[2rem] border border-white/5 bg-[#0d0d14]/40 p-6 backdrop-blur-3xl sm:flex-row sm:items-center shadow-[0_40px_100px_-30px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 drop-shadow-[0_0_10px_rgba(99,102,241,0.3)]">
              <Images className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Curaduría visual</p>
              <p className="text-sm font-bold text-white/80">Haz clic para ampliar la experiencia</p>
            </div>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-6 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/60">
            {images.length} piezas maestras
          </div>
        </div>
 
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {images.map((img, index) => {
            const imageUrl = resolveAssetUrl(img.url);
            const order = String(index + 1).padStart(2, "0");
 
            return (
              <button
                key={img.id}
                type="button"
                onClick={() => setSelectedImage(img)}
                className={[
                  "group relative aspect-[4/5] overflow-hidden rounded-[2.5rem] border border-white/5 bg-[#0d0d12]/50 text-left shadow-2xl transition-all duration-700",
                  "hover:-translate-y-4 hover:border-primary/40 hover:shadow-[0_40px_80px_-20px_rgba(99,102,241,0.25)]",
                  "focus:outline-none focus:ring-2 focus:ring-primary/60 focus:ring-offset-8 focus:ring-offset-[#06060a]",
                ].join(" ")}
              >
                <ImageWithFallback
                  src={imageUrl}
                  alt={`Trabajo ${index + 1}`}
                  className="h-full w-full object-cover transition-all duration-1000 group-hover:scale-110 group-hover:grayscale-[0.2]"
                />
 
                <div className="absolute inset-0 bg-gradient-to-t from-[#06060a] via-black/20 to-transparent"></div>
                <div className="absolute inset-0 bg-primary/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
 
                <div className="absolute left-6 top-6 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[9px] font-black uppercase tracking-[0.3em] text-white/80 backdrop-blur-md">
                   PRO-{order}
                </div>
 
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Infinity Barber</p>
                      <p className="mt-2 text-xl font-black text-white group-hover:text-primary transition-colors">Elite Work</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/40 bg-primary/20 text-primary transition-all duration-500 group-hover:rotate-45 group-hover:scale-110">
                      <ArrowUpRight className="h-5 w-5" />
                    </div>
                  </div>
 
                  <div className="mt-6 flex h-10 items-center justify-center gap-2 rounded-xl bg-white/[0.03] border border-white/10 text-[9px] font-black uppercase tracking-[0.2em] text-white/40 transition-all group-hover:bg-primary/20 group-hover:border-primary/40 group-hover:text-white">
                    <Search className="h-3.5 w-3.5" />
                    Expandir Vista
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
 
      <Dialog open={Boolean(selectedImage)} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-4xl border-none bg-transparent p-0 shadow-none sm:p-0">
          {selectedImage && (
            <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#06060a]/98 shadow-[0_50px_100px_-30px_rgba(0,0,0,0.8)] backdrop-blur-3xl">
              <div className="absolute inset-x-0 top-0 z-20 p-8 flex justify-between items-start">
                 <div>
                    <DialogTitle className="text-3xl font-black tracking-tight text-white">Elite Portfolio</DialogTitle>
                    <DialogDescription className="mt-2 text-sm text-white/40 font-bold uppercase tracking-[0.2em]">Resultado Final · Infinity Barber</DialogDescription>
                 </div>
              </div>
              <ImageWithFallback
                src={resolveAssetUrl(selectedImage.url)}
                alt="Detalle Infinity Barber"
                className="max-h-[85vh] w-full object-cover rounded-[2.5rem]"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
