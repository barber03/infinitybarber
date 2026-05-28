import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, X, Bot, User, Loader2, Paperclip } from "lucide-react";
import { apiFetch } from "../lib/api";
import { cn } from "./ui/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "¡Hola! Soy Infinity, tu asistente virtual. ¿En qué puedo ayudarte hoy?" },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const authData = localStorage.getItem("authSession");
      const session = authData ? JSON.parse(authData) : null;
      const headers = new Headers();
      if (session?.token) headers.set("Authorization", `Bearer ${session.token}`);

      const res = await fetch("/api/payments/upload", {
        method: "POST",
        headers,
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      const imgUrl = data.url;
      const userMessage: Message = { role: "user", content: `(Comprobante subido: ${imgUrl})` };
      setMessages((prev) => [...prev, userMessage]);

      const response = await apiFetch<{ message: string }>("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      setMessages((prev) => [...prev, { role: "assistant", content: response.message }]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error al subir tu captura. Intenta de nuevo." },
      ]);
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const renderMessageContent = (content: string) => {
    const imgRegex = /!\[.*?\]\((.*?)\)/g;
    const parts = content.split(imgRegex);
    if (parts.length === 1) return content;

    return (
      <div className="flex flex-col gap-2">
        {parts.map((part, i) => {
          if (content.includes(`](${part})`)) {
            return <img key={i} src={part} alt="Attachment" className="w-full max-w-[200px] rounded-lg mt-2 shadow-md bg-white p-1" />;
          }
          return <span key={i}>{part}</span>;
        })}
      </div>
    );
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await apiFetch<{ message: string }>("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      setMessages((prev) => [...prev, { role: "assistant", content: response.message }]);
    } catch (error) {
      console.error("Error in chat:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Lo siento, tuve un problema al procesar tu mensaje. Intenta de nuevo más tarde." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Botón Flotante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300 hover:scale-110 active:scale-95",
          isOpen ? "bg-destructive text-destructive-foreground rotate-90" : "bg-primary text-primary-foreground"
        )}
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>

      {/* Ventana de Chat */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 flex h-[500px] w-[350px] flex-col overflow-hidden rounded-2xl border border-white/20 bg-card/80 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5 duration-300 sm:w-[400px]">
          {/* Cabecera */}
          <div className="flex items-center gap-3 bg-primary p-4 text-primary-foreground">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
              <Bot size={24} />
            </div>
            <div>
              <h3 className="text-sm font-bold">Infinity Assistant</h3>
              <p className="text-xs opacity-80">En línea • Infinity Barber</p>
            </div>
          </div>

          {/* Mensajes */}
          <div
            ref={scrollRef}
            className="flex-1 space-y-4 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-primary/20"
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "flex w-full animate-in fade-in duration-300",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "flex max-w-[80%] items-start gap-2 rounded-2xl p-3 text-sm shadow-sm",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : "bg-muted text-foreground rounded-tl-none border border-white/10"
                  )}
                >
                  {msg.role === "assistant" && <Bot size={16} className="mt-0.5 shrink-0" />}
                  <div className="whitespace-pre-wrap break-words overflow-hidden text-ellipsis">
                    {renderMessageContent(msg.content)}
                  </div>
                  {msg.role === "user" && <User size={16} className="mt-0.5 shrink-0" />}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl bg-muted p-3 text-sm border border-white/10">
                  <Loader2 size={16} className="animate-spin text-primary" />
                  <span>Infinity está pensando...</span>
                </div>
              </div>
            )}
          </div>

          {/* Entrada de texto */}
          <div className="border-t border-white/10 bg-card p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2 items-center"
            >
              <input
                type="file"
                accept="image/*"
                hidden
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="flex h-10 w-10 items-center justify-center shrink-0 rounded-full bg-muted/50 text-muted-foreground transition-all hover:bg-muted active:scale-95 disabled:opacity-50"
                title="Adjuntar pago"
              >
                <Paperclip size={18} />
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="flex-1 rounded-full bg-muted px-4 py-2 text-sm outline-none ring-primary transition-all focus:ring-2"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
