import React, { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import { useNavigate } from "react-router";
import { Loader2, Camera, RefreshCw, CheckCircle2, AlertCircle, Scissors, Sparkles, UploadCloud } from "lucide-react";
import { cn } from "./ui/utils";
import axios from "axios";
import { resolveApiUrl } from "../lib/api";
import { toast } from "sonner";

interface AnalysisResult {
  faceShape: string;
  recommendation: string;
  description: string;
}

export default function FaceAnalyzer({ onSelectAiService }: { onSelectAiService?: (recommendation: string) => void }) {
  const navigate = useNavigate();
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);

  // Estados para modo de subida de archivo
  const [activeTab, setActiveTab] = useState<"camera" | "upload">("camera");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Captura desde Cámara y Envío al Backend
  const handleCapture = useCallback(async () => {
    if (!webcamRef.current || !webcamRef.current.video) {
      console.warn("Intento de captura sin cámara");
      return;
    }

    const video = webcamRef.current.video;

    if (video.readyState < 2) {
      setError("La cámara aún se está iniciando. Espera un segundo.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      console.log("Capturando imagen de cámara...");
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        throw new Error("No se pudo capturar la imagen de la cámara.");
      }

      // Convertir a archivo binario
      const responseBlob = await fetch(imageSrc);
      const blob = await responseBlob.blob();
      const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });

      const formData = new FormData();
      formData.append("image", file);

      const url = resolveApiUrl("/api/detectar-rostro");
      const apiRes = await axios.post(url, formData);

      if (apiRes.data.success) {
        setResult({
          faceShape: apiRes.data.faceShape,
          recommendation: apiRes.data.recommendation,
          description: apiRes.data.description
        });
        toast.success(`¡Recomendación IA: ${apiRes.data.recommendation}!`);
      } else {
        throw new Error(apiRes.data.error || "Hubo un problema al analizar el rostro en el servidor.");
      }
    } catch (err) {
      console.error("Error durante el análisis facial:", err);
      setError(err instanceof Error ? err.message : "Error de procesamiento facial.");
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  // Subida de Archivo y Envío al Backend
  const handleUploadAndAnalyze = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const previewUrlStr = URL.createObjectURL(selectedFile);
      setPreviewUrl(previewUrlStr);

      // Enviar al backend
      const formData = new FormData();
      formData.append("image", selectedFile);

      const url = resolveApiUrl("/api/detectar-rostro");
      const apiRes = await axios.post(url, formData);

      if (apiRes.data.success) {
        setResult({
          faceShape: apiRes.data.faceShape,
          recommendation: apiRes.data.recommendation,
          description: apiRes.data.description
        });
        toast.success(`¡Recomendación IA: ${apiRes.data.recommendation}!`);
      } else {
        throw new Error(apiRes.data.error || "Hubo un problema al analizar la imagen en el servidor.");
      }
    } catch (err) {
      console.error("Error al subir e identificar rostro:", err);
      setError(err instanceof Error ? err.message : "Error al conectarse con el servidor.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setResult(null);
    setError(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsCameraReady(false);
  };

  // Render del contenedor de la foto subida
  const renderImageContainer = () => {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-[2rem] bg-zinc-900 border border-white/10">
        <img
          src={previewUrl || ""}
          alt="Preview"
          className="h-full w-full object-cover"
        />

        {/* Overlay de Carga del Servidor */}
        {isAnalyzing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/45 backdrop-blur-[2px] z-40">
            <div className="flex flex-col items-center gap-3 rounded-2xl bg-black/75 p-6 shadow-2xl border border-white/5">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="font-bold text-white uppercase tracking-widest text-xs">Analizando facciones...</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <div className="mb-10 text-center">
        <h1 className="flex items-center justify-center gap-3 text-4xl font-black italic tracking-tighter text-white sm:text-5xl">
          <Sparkles className="h-8 w-8 text-primary animate-pulse" />
          INFINITY <span className="text-secondary">AI ANALYZER</span>
        </h1>
        <p className="mt-4 text-balanced text-lg text-white/60">
          Usa nuestra inteligencia artificial para encontrar el estilo que mejor se adapta a tu rostro.
        </p>
      </div>

      {/* Selector de pestañas */}
      <div className="mb-8 flex justify-center">
        <div className="inline-flex rounded-2xl bg-white/5 p-1.5 border border-white/10 backdrop-blur-md">
          <button
            onClick={() => { setActiveTab("camera"); resetAnalysis(); }}
            className={cn(
              "rounded-xl px-6 py-2.5 text-xs font-black uppercase tracking-widest transition-all cursor-pointer",
              activeTab === "camera"
                ? "bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-lg"
                : "text-white/60 hover:text-white"
            )}
          >
            Cámara en Vivo
          </button>
          <button
            onClick={() => { setActiveTab("upload"); resetAnalysis(); }}
            className={cn(
              "rounded-xl px-6 py-2.5 text-xs font-black uppercase tracking-widest transition-all cursor-pointer",
              activeTab === "upload"
                ? "bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-lg"
                : "text-white/60 hover:text-white"
            )}
          >
            Subir Foto
          </button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr]">
        {/* Lado de Captura / Input */}
        <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-black/40 p-2 shadow-2xl backdrop-blur-xl">
          
          {/* Vista Cámara en Vivo (Siempre en funcionamiento) */}
          {activeTab === "camera" && (
            <div className="relative aspect-video w-full overflow-hidden rounded-[2rem] bg-zinc-900 border border-white/10">
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                onUserMedia={() => setIsCameraReady(true)}
                className="h-full w-full object-cover"
                videoConstraints={{ facingMode: "user" }}
                mirrored={true}
              />
              {!isCameraReady && (
                 <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/80 text-white/60">
                    <p>Solicitando acceso a cámara...</p>
                 </div>
              )}

              {/* Overlay de Carga del Servidor (Sin pausar el video detrás) */}
              {isAnalyzing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/45 backdrop-blur-[2px] z-40">
                  <div className="flex flex-col items-center gap-3 rounded-2xl bg-black/75 p-6 shadow-2xl border border-white/5 animate-in zoom-in-95 duration-200">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="font-bold text-white uppercase tracking-widest text-xs">Analizando facciones...</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Vista Subida de Foto */}
          {activeTab === "upload" && (
            <div className="relative w-full">
              {!previewUrl ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file && file.type.startsWith("image/")) {
                      setSelectedFile(file);
                      setPreviewUrl(URL.createObjectURL(file));
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/20 rounded-[2rem] w-full aspect-video flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-white/5 transition-all p-6 text-center group"
                >
                  <UploadCloud className="h-12 w-12 text-white/40 group-hover:text-primary group-hover:scale-110 transition-all mb-4" />
                  <p className="text-sm font-bold text-white mb-2">Arrastra tu fotografía aquí</p>
                  <p className="text-xs text-white/40 mb-4">Soporta PNG, JPG o JPEG (Máx. 5MB)</p>
                  <button className="rounded-xl bg-white/10 px-5 py-2.5 text-xs font-bold text-white hover:bg-white/20 transition-all cursor-pointer">
                    Seleccionar Archivo
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setSelectedFile(file);
                        const url = URL.createObjectURL(file);
                        setPreviewUrl(url);
                        setError(null);
                      }
                    }}
                  />
                </div>
              ) : (
                renderImageContainer()
              )}
            </div>
          )}

          {/* Botones de acción del upload */}
          {activeTab === "upload" && previewUrl && (
            <div className="mt-6 flex flex-wrap gap-4 p-4">
              <button
                type="button"
                onClick={resetAnalysis}
                className="flex-1 min-w-[120px] flex items-center justify-center gap-2 rounded-2xl bg-white/5 border border-white/10 py-4 font-bold text-white transition-all hover:bg-white/10 hover:border-white/20 cursor-pointer"
              >
                <RefreshCw className="h-5 w-5 text-white/60" />
                NUEVA FOTO
              </button>

              {!result && (
                <button
                  type="button"
                  onClick={handleUploadAndAnalyze}
                  disabled={isAnalyzing}
                  className="flex-1 min-w-[150px] flex items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground py-4 font-black uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer shadow-lg"
                >
                  <Sparkles className="h-5 w-5" />
                  ANALIZAR FOTOGRAFÍA
                </button>
              )}
            </div>
          )}

          {/* Botón de acción siempre visible de la cámara en vivo */}
          {activeTab === "camera" && (
            <div className="mt-6 flex flex-wrap gap-4 p-4">
              <button
                type="button"
                onClick={handleCapture}
                disabled={isAnalyzing}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-2xl py-4 font-black uppercase tracking-widest transition-all shadow-xl cursor-pointer",
                  isAnalyzing
                    ? "bg-white/5 text-white/20 cursor-not-allowed"
                    : "bg-primary text-primary-foreground hover:scale-[1.02] active:scale-[0.98] shadow-primary/30"
                )}
              >
                <Camera className="h-6 w-6" />
                CAPTURAR Y ANALIZAR
              </button>
            </div>
          )}
        </div>

        {/* Lado de Resultados */}
        <div className="space-y-6">
          {error && (
            <div className="flex items-start gap-3 rounded-[1.5rem] border border-red-500/20 bg-red-500/10 p-5 font-medium text-red-200">
              <AlertCircle className="h-6 w-6 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {!result && !error && (
            <div className="flex h-full flex-col justify-center gap-6 rounded-[2.5rem] border border-white/10 bg-white/5 p-8 text-center backdrop-blur-md">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10">
                 <Scissors className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-white">IA Infinity Barber App</h3>
              <p className="text-white/60 text-sm leading-relaxed">
                Ponte frente a la cámara o sube una fotografía, asegúrate de tener buena luz y presiona el botón para descubrir tu perfil facial y recibir recomendaciones personalizadas.
              </p>
            </div>
          )}

          {result && (
            <div className="animate-in fade-in slide-in-from-right-10 duration-500 flex flex-col gap-6 rounded-[2.5rem] border border-primary/20 bg-primary/5 p-8 backdrop-blur-xl">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500/20 text-green-400">
                   <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Rostro detectado</p>
                   <h2 className="text-3xl font-black text-white">{result.faceShape}</h2>
                </div>
              </div>

              <div className="space-y-4 rounded-3xl bg-white/5 p-6 border border-white/10">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Corte recomendado</p>
                <h3 className="text-xl font-bold text-white leading-tight">{result.recommendation}</h3>
                <p className="text-sm leading-relaxed text-white/60">
                  {result.description}
                </p>
              </div>

              <div className="rounded-3xl border border-secondary/20 bg-secondary/10 p-5 text-sm text-secondary-foreground">
                 <p className="font-semibold italic">"Potencia tus rasgos naturales con el estilo adecuado."</p>
              </div>
              
              <button 
                onClick={() => {
                  localStorage.setItem("ai_recommendation_service", result.recommendation);
                  localStorage.setItem("ai_recommendation_shape", result.faceShape);
                  if (onSelectAiService) {
                    onSelectAiService(result.recommendation);
                  } else {
                    navigate('/reserva', { 
                      state: { 
                        aiService: result.recommendation, 
                        aiFaceShape: result.faceShape 
                      } 
                    });
                  }
                }}
                className="w-full py-4 rounded-2xl bg-secondary text-secondary-foreground font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-lg cursor-pointer"
              >
                RESERVAR ESTE ESTILO
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-12 rounded-[2rem] border border-white/5 bg-white/[0.02] p-8 text-white/40">
        <h4 className="mb-4 text-xs font-black uppercase tracking-[0.3em] text-white/60">Cómo funciona</h4>
        <div className="grid gap-6 text-xs leading-relaxed sm:grid-cols-2">
           <p>
             Nuestra IA utiliza análisis facial inteligente para clasificar las proporciones de tu rostro. No almacenamos tus imágenes en la nube de forma persistente; todo el análisis está diseñado bajo estrictas políticas de seguridad y privacidad.
           </p>
           <p>
             Analizamos la relación geométrica entre el ancho de tus pómulos, mandíbula, frente y la altura total de tus rasgos faciales para darte el resultado más preciso y el corte idóneo.
           </p>
        </div>
      </div>
    </div>
  );
}
