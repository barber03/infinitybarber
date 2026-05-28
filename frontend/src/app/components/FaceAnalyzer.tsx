import React, { useRef, useEffect, useState, useCallback } from "react";
import Webcam from "react-webcam";
import { useNavigate } from "react-router";
import * as faceapi from "face-api.js";
import { Loader2, Camera, RefreshCw, CheckCircle2, AlertCircle, Scissors, Sparkles, UploadCloud } from "lucide-react";
import { cn } from "./ui/utils";
import axios from "axios";
import { resolveApiUrl } from "../lib/api";

const MODEL_URL = "/models";

interface AnalysisResult {
  faceShape: string;
  recommendation: string;
  description: string;
}

export default function FaceAnalyzer({ onSelectAiService }: { onSelectAiService?: (recommendation: string) => void }) {
  const navigate = useNavigate();
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);

  // Estados para modo de subida de archivo
  const [activeTab, setActiveTab] = useState<"camera" | "upload">("camera");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Cargar modelos al montar
  useEffect(() => {
    let isMounted = true;
    const loadModels = async () => {
      try {
        console.log("Cargando modelos desde:", MODEL_URL);
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        
        if (isMounted) {
          console.log("Modelos cargados exitosamente");
          setModelsLoaded(true);
        }
      } catch (err) {
        console.error("Error crítico al cargar modelos de IA:", err);
        if (isMounted) {
          setError("Error al cargar motores de IA. Verifica tu conexión o recarga.");
        }
      }
    };
    loadModels();
    return () => { isMounted = false; };
  }, []);

  // Captura desde Cámara y Envío al Backend
  const handleCapture = useCallback(async () => {
    if (!webcamRef.current || !webcamRef.current.video || !modelsLoaded) {
      console.warn("Intento de captura sin cámara o modelos listos");
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
      console.log("Iniciando detección facial...");
      
      // 1. Detección local con face-api.js para dibujar landmarks
      try {
        const detection = await faceapi
          .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.5 }))
          .withFaceLandmarks();

        if (detection && canvasRef.current) {
          const displaySize = { width: video.videoWidth, height: video.videoHeight };
          faceapi.matchDimensions(canvasRef.current, displaySize);
          const resizedDetections = faceapi.resizeResults(detection, displaySize);
          
          const ctx = canvasRef.current.getContext("2d");
          if (ctx) {
              ctx.clearRect(0, 0, displaySize.width, displaySize.height);
              faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections);
          }
        }
      } catch (localErr) {
        console.warn("Detección local de landmarks no disponible o sin rostro detectado:", localErr);
      }

      // 2. Capturar captura de pantalla de la cámara
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        throw new Error("No se pudo capturar la imagen de la cámara.");
      }

      const responseBlob = await fetch(imageSrc);
      const blob = await responseBlob.blob();
      const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });

      // 3. Enviar al backend para el análisis oficial
      const formData = new FormData();
      formData.append("image", file);

      const url = resolveApiUrl("/api/detectar-rostro");
      const apiRes = await axios.post(url, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (apiRes.data.success) {
        setResult({
          faceShape: apiRes.data.faceShape,
          recommendation: apiRes.data.recommendation,
          description: apiRes.data.description
        });
      } else {
        throw new Error(apiRes.data.error || "Hubo un problema al analizar el rostro en el servidor.");
      }
    } catch (err) {
      console.error("Error durante el análisis facial:", err);
      setError(err instanceof Error ? err.message : "Error de procesamiento facial.");
    } finally {
      setIsAnalyzing(false);
    }
  }, [modelsLoaded]);

  // Subida de Archivo y Envío al Backend
  const handleUploadAndAnalyze = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);

      const url = resolveApiUrl("/api/detectar-rostro");
      const apiRes = await axios.post(url, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (apiRes.data.success) {
        setResult({
          faceShape: apiRes.data.faceShape,
          recommendation: apiRes.data.recommendation,
          description: apiRes.data.description
        });
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
    if (canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d");
        ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
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
          
          {/* Vista Cámara en Vivo */}
          {activeTab === "camera" && (
            <div className="relative aspect-video w-full overflow-hidden rounded-[2rem] bg-zinc-900">
              {!modelsLoaded ? (
                <div className="flex h-full w-full flex-col items-center justify-center gap-4 text-white/40">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="font-medium">Cargando motores de IA...</p>
                </div>
              ) : (
                <>
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    onUserMedia={() => setIsCameraReady(true)}
                    className="h-full w-full object-cover"
                    videoConstraints={{ facingMode: "user" }}
                  />
                  <canvas
                    ref={canvasRef}
                    className="absolute left-0 top-0 h-full w-full pointer-events-none"
                  />
                  {!isCameraReady && (
                     <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/80 text-white/60">
                        <p>Solicitando acceso a cámara...</p>
                     </div>
                  )}
                </>
              )}

              {isAnalyzing && (
                <div className="absolute inset-0 flex items-center justify-center bg-primary/20 backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-3 rounded-2xl bg-black/60 p-6 shadow-2xl">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="font-bold text-white uppercase tracking-widest text-xs">Analizando facciones</p>
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
                        setPreviewUrl(URL.createObjectURL(file));
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="relative aspect-video w-full overflow-hidden rounded-[2rem] bg-zinc-900 border border-white/10">
                  <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                  {isAnalyzing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-primary/20 backdrop-blur-sm">
                      <div className="flex flex-col items-center gap-3 rounded-2xl bg-black/60 p-6 shadow-2xl">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="font-bold text-white uppercase tracking-widest text-xs">Analizando imagen...</p>
                      </div>
                    </div>
                  )}
                  {!isAnalyzing && (
                    <button
                      onClick={() => { setSelectedFile(null); setPreviewUrl(null); setResult(null); }}
                      className="absolute right-4 top-4 rounded-xl bg-black/60 px-4 py-2 text-white hover:bg-black/80 transition-all text-xs font-bold cursor-pointer"
                    >
                      Cambiar Foto
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Botones de acción */}
          <div className="mt-6 flex flex-wrap gap-4 p-4">
             {result ? (
               <button
                  onClick={resetAnalysis}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white/10 py-4 font-bold text-white transition-all hover:bg-white/20 cursor-pointer"
               >
                  <RefreshCw className="h-5 w-5" />
                  NUEVO ANÁLISIS
               </button>
             ) : activeTab === "camera" ? (
               <button
                  onClick={handleCapture}
                  disabled={!modelsLoaded || isAnalyzing}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-2xl py-4 font-black uppercase tracking-widest transition-all shadow-xl cursor-pointer",
                    !modelsLoaded || isAnalyzing 
                      ? "bg-white/5 text-white/20 cursor-not-allowed" 
                      : "bg-primary text-primary-foreground hover:scale-[1.02] active:scale-[0.98] shadow-primary/30"
                  )}
               >
                  <Camera className="h-6 w-6" />
                  CAPTURAR Y ANALIZAR
               </button>
             ) : (
               <button
                  onClick={handleUploadAndAnalyze}
                  disabled={!selectedFile || isAnalyzing}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-2xl py-4 font-black uppercase tracking-widest transition-all shadow-xl cursor-pointer",
                    !selectedFile || isAnalyzing 
                      ? "bg-white/5 text-white/20 cursor-not-allowed" 
                      : "bg-primary text-primary-foreground hover:scale-[1.02] active:scale-[0.98] shadow-primary/30"
                  )}
               >
                  <Sparkles className="h-6 w-6" />
                  ANALIZAR FOTOGRAFÍA
               </button>
             )}
          </div>
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
              <h3 className="text-2xl font-bold text-white">IA Infinity Barber</h3>
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
