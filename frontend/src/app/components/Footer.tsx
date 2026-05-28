import { MapPin, Phone, MessageCircle, Clock, Mail } from "lucide-react";

const BUSINESS_WHATSAPP = "573127891889";
const BUSINESS_EMAIL = "contacto@infinitybarber.com";
const BUSINESS_PHONE_LABEL = "+57 312 789 1889";

export function Footer() {
  return (
    <footer id="contacto" className="relative bg-[#0a0a0e] pb-8 pt-16 sm:pt-20">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
      <div className="container mx-auto px-4">
        <div className="mb-14 grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-12 lg:gap-16">
          <div>
            <h3 className="mb-5 bg-gradient-to-r from-primary to-secondary bg-clip-text text-3xl font-extrabold tracking-widest text-transparent">INFINITY</h3>
            <p className="mb-6 text-base leading-relaxed text-muted-foreground sm:text-lg">
              Mas que un corte de pelo, ofrecemos una experiencia de cuidado personal con reservas simples, atencion cercana y resultados consistentes.
            </p>
            <div className="flex gap-4">
              <a
                href={`https://wa.me/${BUSINESS_WHATSAPP}?text=${encodeURIComponent("Hola, quiero informacion sobre Infinity Barber.")}`}
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-full bg-muted/20 flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
              <a
                href={`mailto:${BUSINESS_EMAIL}`}
                className="w-10 h-10 rounded-full bg-muted/20 flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
          <div>
            <h4 className="mb-6 flex items-center gap-3 border-b border-primary/20 pb-4 text-xl font-bold text-white sm:mb-8">
              <MapPin className="w-6 h-6 text-primary" /> Contacto y Reservas
            </h4>
            <ul className="space-y-4 text-base text-muted-foreground sm:space-y-5 sm:text-lg">
              <li className="leading-snug">
                Diagonal 18C # 27A-20
                <br />
                Barrio Los Fundadores
                <br />
                Valledupar, Cesar - Colombia
              </li>
              <li className="mt-6">
                <a
                  href={`https://wa.me/${BUSINESS_WHATSAPP}?text=${encodeURIComponent("Hola, quiero reservar una cita en Infinity Barber.")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 hover:text-primary transition-colors"
                >
                  <Phone className="w-5 h-5" /> <span className="font-semibold">{BUSINESS_PHONE_LABEL}</span>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${BUSINESS_EMAIL}`}
                  className="flex items-center gap-3 hover:text-primary transition-colors"
                >
                  <Mail className="w-5 h-5" /> <span className="font-semibold">{BUSINESS_EMAIL}</span>
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-6 flex items-center gap-3 border-b border-primary/20 pb-4 text-xl font-bold text-white sm:mb-8">
              <Clock className="w-6 h-6 text-primary" /> Horarios de Atencion
            </h4>
            <ul className="space-y-4 text-base text-muted-foreground sm:text-lg">
              <li className="flex items-center justify-between gap-3">
                <span>Lunes a Viernes</span> <span className="font-medium text-white">09:00 - 19:00</span>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span>Sabados</span> <span className="font-medium text-white">09:00 - 17:00</span>
              </li>
              <li className="mt-4 flex items-center justify-between gap-3">
                <span>Domingos</span> <span className="text-red-400 font-bold border border-red-400/30 px-3 py-1 rounded-md">Cerrado</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col items-start justify-between gap-4 border-t border-muted-foreground/10 pt-8 text-sm text-muted-foreground md:flex-row md:items-center">
          <p>&copy; {new Date().getFullYear()} Infinity Barber. Reservas y atencion por canales digitales.</p>
          <div className="flex gap-4">
            <a href={`https://wa.me/${BUSINESS_WHATSAPP}`} target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">WhatsApp</a>
            <a href={`mailto:${BUSINESS_EMAIL}`} className="hover:text-primary transition-colors">Correo</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
