export type FeatureStatus = "live" | "soon";

export type Feature = {
  id: string;
  title: string;
  description: string;
  status: FeatureStatus;
  icon: "radar" | "dns" | "lock" | "ai" | "ports" | "breach" | "stream";
};

export const FEATURES: Feature[] = [
  {
    id: "subdomain_enum",
    title: "Huella observable (transparencia de certificados)",
    description:
      "Hostnames aparecidos en registros públicos CT (crt.sh): contexto típico, no inventario completo.",
    status: "live",
    icon: "radar",
  },
  {
    id: "dns_health",
    title: "Postura de correo (SPF / DMARC / DKIM)",
    description:
      "Señala huecos típicos en autenticación de email que aumentan el riesgo de suplantación (phishing), según registros públicos.",
    status: "live",
    icon: "dns",
  },
  {
    id: "tls_check",
    title: "HTTPS en puerto :443",
    description:
      "Certificado público observado desde fuera: vigencia, emisor y coherencia con el nombre esperado.",
    status: "live",
    icon: "lock",
  },
  {
    id: "ai_insights",
    title: "Orientación IA (opcional)",
    description:
      "Ordena y explica tus hallazgos con pasos de verificación que tú validas antes de cualquier cambio.",
    status: "live",
    icon: "ai",
  },
  {
    id: "shodan_ports",
    title: "Resumen de superficie desde OSINT",
    description:
      "Visión contextual desde fuentes OSINT públicas tipo Shodan (roadmap) — siempre dentro de uso autorizado.",
    status: "soon",
    icon: "ports",
  },
  {
    id: "hibp",
    title: "Exposiciones conocidas por brechas",
    description:
      "Cruce respetando ToS (HIBP u homólogo) cuando esté disponible como señal defensiva adicional.",
    status: "soon",
    icon: "breach",
  },
  {
    id: "streaming",
    title: "Progresión de resultado en tiempo del escaneo",
    description:
      "Mostrar cómo van cerrando los módulos cuando la UI lo soporte — no vigilancia ante amenazas en vivo.",
    status: "soon",
    icon: "stream",
  },
];
