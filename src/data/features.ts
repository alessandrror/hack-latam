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
    title: "Mapeo en tiempo real",
    description:
      "Descubre subdominios visibles en registros públicos de transparencia de certificados (crt.sh).",
    status: "live",
    icon: "radar",
  },
  {
    id: "dns_health",
    title: "Salud de correo (SPF / DMARC / DKIM)",
    description:
      "Detecta configuraciones débiles de autenticación de email que facilitan phishing.",
    status: "live",
    icon: "dns",
  },
  {
    id: "tls_check",
    title: "Inspección TLS en :443",
    description:
      "Lee el certificado HTTPS del objetivo: vencimiento, emisor y coincidencia de nombres.",
    status: "live",
    icon: "lock",
  },
  {
    id: "ai_insights",
    title: "Insights con IA",
    description:
      "Resumen ejecutivo y acciones priorizadas en lenguaje claro, generados bajo demanda.",
    status: "live",
    icon: "ai",
  },
  {
    id: "shodan_ports",
    title: "Servicios expuestos",
    description:
      "Puertos y servicios visibles desde fuentes OSINT (Shodan) — próximamente.",
    status: "soon",
    icon: "ports",
  },
  {
    id: "hibp",
    title: "Credenciales filtradas",
    description:
      "Cruza emails corporativos con bases de brechas conocidas (HIBP) — próximamente.",
    status: "soon",
    icon: "breach",
  },
  {
    id: "streaming",
    title: "Escaneo en streaming",
    description:
      "Resultados parciales en vivo vía SSE mientras los módulos terminan — próximamente.",
    status: "soon",
    icon: "stream",
  },
];
