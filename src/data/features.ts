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
    title: "Huellas públicas (transparencia de certificados)",
    description:
      "Lista hostnames aparecidos en logs públicos CT (crt.sh) — visibilidad, no garantía de inventario.",
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
      "Lee el certificado HTTPS del dominio en :443: vencimiento, emisor y coincidencia de nombres.",
    status: "live",
    icon: "lock",
  },
  {
    id: "ai_insights",
    title: "Insights con IA",
    description:
      "Resumen ejecutivo y pasos para verificar o remediar, con advertencias claras sobre límites del escaneo.",
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
