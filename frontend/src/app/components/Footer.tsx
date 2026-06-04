import { MapPin, Phone, MessageCircle, Clock, Mail } from "lucide-react";

// CONFIGURACIÓN DE CONTACTO Y REDES (Modifica aquí con tus datos reales)
const BUSINESS_WHATSAPP = "573127891889";
const BUSINESS_EMAIL = "contacto@infinitybarber.com";
const BUSINESS_PHONE_LABEL = "+57 312 789 1889";
const INSTAGRAM_URL = "https://instagram.com/infinitybarber.vdp";
const FACEBOOK_URL = "https://facebook.com/infinitybarber.vdp";

// DIRECCIÓN DE LA BARBERÍA
const BARBER_ADDRESS = "Diagonal 18C # 27A-20, Barrio Los Fundadores, Valledupar, Cesar - Colombia";

export function Footer() {
  // Query de Google Maps codificado
  const encodedAddress = encodeURIComponent(BARBER_ADDRESS);
  const mapSrc = `https://maps.google.com/maps?q=${encodedAddress}&t=&z=16&ie=UTF8&iwloc=&output=embed`;

  return (
    <footer id="contacto" className="relative bg-[#0a0a0e] pb-8 pt-16 sm:pt-20">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
      <div className="container mx-auto px-4">
        <div className="mb-14 grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3 md:gap-12 lg:gap-8">
          {/* Columna 1: Logo y Redes */}
          <div>
            <h3 className="mb-5 bg-gradient-to-r from-primary to-secondary bg-clip-text text-3xl font-extrabold tracking-widest text-transparent">INFINITY</h3>
            <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
              Más que un corte de pelo, ofrecemos una experiencia de cuidado personal con reservas simples, atención cercana y resultados consistentes.
            </p>
            <div className="flex gap-3">
              <a
                href={`https://wa.me/${BUSINESS_WHATSAPP}?text=${encodeURIComponent("Hola, quiero información sobre Infinity Barber.")}`}
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all duration-300"
                title="WhatsApp"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all duration-300"
                title="Instagram"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5"
                >
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </a>
              <a
                href={FACEBOOK_URL}
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all duration-300"
                title="Facebook"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5"
                >
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
              <a
                href={`mailto:${BUSINESS_EMAIL}`}
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all duration-300"
                title="Correo Electrónico"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Columna 2: Dirección y Contacto */}
          <div>
            <h4 className="mb-6 flex items-center gap-3 border-b border-primary/20 pb-4 text-lg font-bold text-white sm:mb-8">
              <MapPin className="w-5 h-5 text-primary" /> Ubicación
            </h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li className="leading-relaxed">
                Diagonal 18C # 27A-20
                <br />
                Barrio Los Fundadores
                <br />
                Valledupar, Cesar - Colombia
              </li>
              <li className="pt-2">
                <a
                  href={`https://wa.me/${BUSINESS_WHATSAPP}?text=${encodeURIComponent("Hola, quiero reservar una cita en Infinity Barber.")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 hover:text-primary transition-colors"
                >
                  <Phone className="w-4 h-4 text-primary" /> <span className="font-semibold text-white/95">{BUSINESS_PHONE_LABEL}</span>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${BUSINESS_EMAIL}`}
                  className="flex items-center gap-3 hover:text-primary transition-colors"
                >
                  <Mail className="w-4 h-4 text-primary" /> <span className="font-semibold text-white/95">{BUSINESS_EMAIL}</span>
                </a>
              </li>
            </ul>
            
            {/* Mapa integrado abajo de la dirección */}
            <div className="mt-6">
              <div className="overflow-hidden rounded-2xl border border-white/10 h-36 w-full bg-zinc-900 shadow-inner group">
                <iframe
                  src={mapSrc}
                  className="w-full h-full border-0 grayscale invert opacity-75 contrast-125 transition-all duration-500 group-hover:grayscale-0 group-hover:invert-0 group-hover:opacity-100"
                  allowFullScreen={false}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Mapa de ubicación de Infinity Barber"
                ></iframe>
              </div>
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex text-xs font-bold text-primary hover:text-secondary hover:underline transition-colors cursor-pointer"
              >
                Ver en Google Maps grande →
              </a>
            </div>
          </div>

          {/* Columna 3: Horarios */}
          <div>
            <h4 className="mb-6 flex items-center gap-3 border-b border-primary/20 pb-4 text-lg font-bold text-white sm:mb-8">
              <Clock className="w-5 h-5 text-primary" /> Horarios de Atención
            </h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li className="flex items-center justify-between gap-3">
                <span>Lunes a Viernes</span> <span className="font-medium text-white">09:00 - 19:00</span>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span>Sábados</span> <span className="font-medium text-white">09:00 - 17:00</span>
              </li>
              <li className="pt-2 flex items-center justify-between gap-3">
                <span>Domingos</span> <span className="text-red-400 font-bold border border-red-400/20 bg-red-400/5 px-2.5 py-0.5 rounded-md text-xs uppercase tracking-wider">Cerrado</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-start justify-between gap-4 border-t border-white/5 pt-8 text-xs text-muted-foreground md:flex-row md:items-center">
          <p>&copy; {new Date().getFullYear()} Infinity Barber. Reservas y atención por canales digitales.</p>
          <div className="flex gap-4">
            <a href={`https://wa.me/${BUSINESS_WHATSAPP}`} target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">WhatsApp</a>
            <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">Instagram</a>
            <a href={`mailto:${BUSINESS_EMAIL}`} className="hover:text-primary transition-colors">Correo</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

