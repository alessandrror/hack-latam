export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readMinutes: number;
  publishedAt: string;
  problem: string;
  impact: string;
  recommendations: string[];
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "spf-dmarc-faltantes",
    title: "SPF y DMARC ausentes: la puerta abierta al phishing",
    excerpt:
      "Sin registros de autenticación de correo, cualquiera puede suplantar tu dominio en campañas de phishing creíbles.",
    category: "Email",
    readMinutes: 4,
    publishedAt: "2026-05-10",
    problem:
      "Muchas PYMEs publican su sitio web pero nunca configuran SPF ni DMARC en DNS. Los atacantes envían correos que parecen legítimos porque el dominio del remitente coincide con el de la víctima.",
    impact:
      "Pérdida de confianza del cliente, fraude por transferencia bancaria y bloqueo de entregabilidad cuando los proveedores marcan tu dominio como abusivo.",
    recommendations: [
      "Publica un registro SPF en TXT del dominio raíz que liste solo tus servidores de envío autorizados.",
      "Implementa DMARC con política p=none al inicio, revisa reportes y sube a quarantine/reject cuando estés listo.",
      "Añade selectores DKIM en tu proveedor de correo (Google, Microsoft, etc.) y verifica que firmen correctamente.",
      "Ejecuta un escaneo pasivo de dns_health para validar presencia y sintaxis básica.",
    ],
  },
  {
    slug: "certificados-tls-vencidos",
    title: "Certificados TLS vencidos: interrupciones y pérdida de confianza",
    excerpt:
      "Un certificado HTTPS caducado rompe la confianza del navegador y puede tumbar integraciones API.",
    category: "TLS",
    readMinutes: 3,
    publishedAt: "2026-05-08",
    problem:
      "Los certificados Let's Encrypt duran 90 días; en entornos sin renovación automática es común olvidar un subdominio o un entorno de staging expuesto.",
    impact:
      "Usuarios ven advertencias de seguridad, bots de monitoreo fallan y atacantes pueden intentar downgrade o suplantación en redes comprometidas.",
    recommendations: [
      "Automatiza renovación con cert-manager, ACME o el panel de tu hosting.",
      "Inventaria todos los hostnames (incluidos los descubiertos en CT logs) y asigna alertas 30/14/7 días antes del vencimiento.",
      "Usa tls_check periódico sobre :443 para detectar caducidad y errores de cadena.",
    ],
  },
  {
    slug: "subdominios-olvidados",
    title: "Subdominios olvidados: superficie de ataque invisible",
    excerpt:
      "Entornos de prueba, paneles antiguos y APIs sin parchear suelen vivir en subdominios que nadie recuerda.",
    category: "Superficie de ataque",
    readMinutes: 5,
    publishedAt: "2026-05-05",
    problem:
      "La transparencia de certificados revela nombres que el equipo de TI ya no gestiona. Un `staging.`, `dev.` o `old-api.` sin WAF ni parches es un blanco fácil.",
    impact:
      "Exfiltración de datos, acceso lateral hacia producción y ransomware vía servicios con credenciales por defecto.",
    recommendations: [
      "Corre subdomain_enum mensualmente y cruza la lista con tu CMDB o inventario de DNS.",
      "Elimina registros DNS y certificados de hosts que ya no se usan.",
      "Aplica el mismo hardening (auth, parches, logs) que en producción a cualquier host público.",
    ],
  },
  {
    slug: "contraseñas-reutilizadas",
    title: "Contraseñas reutilizadas tras filtraciones",
    excerpt:
      "Cuando un empleado reutiliza credenciales, una brecha ajena se convierte en acceso a tu correo o VPN.",
    category: "Credenciales",
    readMinutes: 4,
    publishedAt: "2026-05-01",
    problem:
      "Las brechas masivas publican hashes y contraseñas. Los atacantes prueban esas combinaciones en Microsoft 365, VPN y paneles de administración.",
    impact:
      "Compromiso de cuentas privilegiadas, fraude interno y cumplimiento normativo (GDPR, sector financiero).",
    recommendations: [
      "Exige MFA en todos los accesos remotos y administrativos.",
      "Bloquea contraseñas débiles y habilita detección de credenciales filtradas (próximo módulo HIBP).",
      "Capacita al personal: nunca reutilizar contraseñas corporativas en sitios personales.",
    ],
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
