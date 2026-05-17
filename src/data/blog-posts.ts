export type BlogCategory =
  | "Email"
  | "TLS"
  | "Superficie de ataque"
  | "Credenciales"
  | "Headers"
  | "DNS"
  | "Cloud"
  | "Cumplimiento"
  | "Operaciones";

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: BlogCategory;
  tags: string[];
  readMinutes: number;
  publishedAt: string;
  coverImage: string;
  coverImageAlt: string;
  author: string;
  featured?: boolean;
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
    tags: ["SPF", "DMARC", "DKIM", "phishing"],
    readMinutes: 4,
    publishedAt: "2026-05-10",
    coverImage:
      "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1200&q=80&auto=format&fit=crop",
    coverImageAlt: "Pantalla con correos electrónicos y alertas de seguridad",
    author: "Equipo Hack LATAM",
    featured: true,
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
    tags: ["HTTPS", "certificados", "Let's Encrypt"],
    readMinutes: 3,
    publishedAt: "2026-05-08",
    coverImage:
      "https://images.unsplash.com/photo-1633265486064-086b219458ec?w=1200&q=80&auto=format&fit=crop",
    coverImageAlt: "Candado digital sobre interfaz de servidor",
    author: "Equipo Hack LATAM",
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
    slug: "headers-seguridad-faltantes",
    title: "Headers de seguridad ausentes: XSS y clickjacking sin fricción",
    excerpt:
      "Sin CSP, HSTS ni X-Frame-Options, tu aplicación web depende solo del navegador y la suerte del usuario.",
    category: "Headers",
    tags: ["CSP", "HSTS", "X-Frame-Options"],
    readMinutes: 5,
    publishedAt: "2026-05-07",
    coverImage:
      "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&q=80&auto=format&fit=crop",
    coverImageAlt: "Código fuente en pantalla con tonos azules",
    author: "Equipo Hack LATAM",
    problem:
      "Muchos sitios corporativos sirven HTML sin políticas de contenido ni protección contra incrustación en iframes. Un script inyectado o un formulario embebido en un sitio malicioso explota esa ausencia.",
    impact:
      "Robo de sesiones, desfiguración del sitio, fraude por clickjacking y sanciones en auditorías de clientes enterprise.",
    recommendations: [
      "Activa Strict-Transport-Security con includeSubDomains cuando todo el tráfico sea HTTPS.",
      "Define Content-Security-Policy en modo report-only primero, luego endurece.",
      "Añade X-Frame-Options DENY o frame-ancestors en CSP para paneles administrativos.",
      "Revisa headers_http en tu escaneo pasivo y corrige los gaps de mayor severidad primero.",
    ],
  },
  {
    slug: "subdominios-olvidados",
    title: "Subdominios olvidados: superficie de ataque invisible",
    excerpt:
      "Entornos de prueba, paneles antiguos y APIs sin parchear suelen vivir en subdominios que nadie recuerda.",
    category: "Superficie de ataque",
    tags: ["subdominios", "CT logs", "inventario"],
    readMinutes: 5,
    publishedAt: "2026-05-05",
    coverImage:
      "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&q=80&auto=format&fit=crop",
    coverImageAlt: "Rack de servidores en centro de datos",
    author: "Equipo Hack LATAM",
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
    slug: "mfa-no-obligatorio",
    title: "MFA opcional: la brecha que convierte un leak en incidente",
    excerpt:
      "Una contraseña filtrada basta para entrar si el segundo factor no es obligatorio en cuentas críticas.",
    category: "Credenciales",
    tags: ["MFA", "Microsoft 365", "acceso remoto"],
    readMinutes: 4,
    publishedAt: "2026-05-03",
    coverImage:
      "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=1200&q=80&auto=format&fit=crop",
    coverImageAlt: "Pantalla con matriz de código y temática de ciberseguridad",
    author: "Equipo Hack LATAM",
    problem:
      "Las PYMEs habilitan MFA solo para administradores o lo dejan como opción. Los atacantes priorizan cuentas de finanzas, RRHH y buzones compartidos sin segundo factor.",
    impact:
      "Business Email Compromise, robo de facturas y acceso persistente a SaaS críticos.",
    recommendations: [
      "Exige MFA para todos los usuarios en Microsoft 365 / Google Workspace con políticas condicionales.",
      "Bloquea legacy auth (IMAP/POP sin modern auth) que evade MFA.",
      "Prioriza FIDO2 o apps autenticadoras sobre SMS cuando sea posible.",
    ],
  },
  {
    slug: "contraseñas-reutilizadas",
    title: "Contraseñas reutilizadas tras filtraciones",
    excerpt:
      "Cuando un empleado reutiliza credenciales, una brecha ajena se convierte en acceso a tu correo o VPN.",
    category: "Credenciales",
    tags: ["brechas", "HIBP", "contraseñas"],
    readMinutes: 4,
    publishedAt: "2026-05-01",
    coverImage:
      "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=1200&q=80&auto=format&fit=crop",
    coverImageAlt: "Teclado con luz tenue en entorno de oficina",
    author: "Equipo Hack LATAM",
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
  {
    slug: "dnssec-sin-configurar",
    title: "DNSSEC desactivado: suplantación de DNS sin alarma",
    excerpt:
      "Sin validación criptográfica en DNS, un atacante en la red puede redirigir tráfico hacia sitios falsos.",
    category: "DNS",
    tags: ["DNSSEC", "envenenamiento DNS"],
    readMinutes: 4,
    publishedAt: "2026-04-28",
    coverImage:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80&auto=format&fit=crop",
    coverImageAlt: "Visualización de red global con nodos conectados",
    author: "Equipo Hack LATAM",
    problem:
      "Registradores y DNS gestionados a menudo dejan DNSSEC como opt-in. Las PYMEs asumen que «tener DNS» implica integridad, pero las respuestas pueden alterarse en tránsito.",
    impact:
      "Phishing corporativo, interceptación de login y pérdida de confianza en dominios de marca.",
    recommendations: [
      "Habilita DNSSEC en tu registrador y publica DS en el TLD padre.",
      "Verifica la cadena con herramientas de validación tras cada cambio de nameserver.",
      "Monitorea dns_health para detectar registros inconsistentes o delegaciones rotas.",
    ],
  },
  {
    slug: "apis-sin-autenticacion",
    title: "APIs públicas sin autenticación: datos expuestos por diseño",
    excerpt:
      "Endpoints REST olvidados en subdominios o rutas `/api/v1` sin auth son un catálogo de datos para scrapers.",
    category: "Superficie de ataque",
    tags: ["API", "REST", "autenticación"],
    readMinutes: 5,
    publishedAt: "2026-04-25",
    coverImage:
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&q=80&auto=format&fit=crop",
    coverImageAlt: "Desarrollador revisando código en monitor",
    author: "Equipo Hack LATAM",
    problem:
      "Equipos de producto publican APIs internas para integraciones y nunca añaden OAuth, API keys ni rate limiting. Los crawlers las indexan en horas.",
    impact:
      "Filtración de PII, manipulación de pedidos y multas por tratamiento indebido de datos personales.",
    recommendations: [
      "Inventaria rutas `/api`, GraphQL y webhooks expuestos con escaneo pasivo y revisión de código.",
      "Exige autenticación y autorización por recurso; niega por defecto.",
      "Añade rate limiting y logging de accesos anómalos en el perímetro.",
    ],
  },
  {
    slug: "cloud-misconfiguracion",
    title: "Buckets S3 públicos: la filtración más común en la nube",
    excerpt:
      "Un clic en «public read» convierte backups y exports en descargables por cualquiera con la URL.",
    category: "Cloud",
    tags: ["AWS", "S3", "almacenamiento"],
    readMinutes: 5,
    publishedAt: "2026-04-22",
    coverImage:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80&auto=format&fit=crop",
    coverImageAlt: "Rascacielos y skyline urbano representando infraestructura en la nube",
    author: "Equipo Hack LATAM",
    problem:
      "Equipos suben dumps de base de datos o logs a almacenamiento objeto para compartir con consultores y olvidan cerrar permisos. Los motores de búsqueda indexan listados abiertos.",
    impact:
      "Exposición masiva de datos, extorsión y notificación obligatoria a reguladores.",
    recommendations: [
      "Bloquea acceso público a nivel de cuenta y usa políticas de bucket explícitas.",
      "Habilita alertas de «public access» en AWS Config o equivalente en Azure/GCP.",
      "Rota claves y tokens si un bucket estuvo expuesto, aunque sea brevemente.",
    ],
  },
  {
    slug: "ransomware-prevencion-pymes",
    title: "Ransomware en PYMEs: vectores de entrada que puedes cerrar hoy",
    excerpt:
      "El 70% de los ataques empiezan por correo, RDP expuesto o parches atrasados — todos visibles desde fuera.",
    category: "Operaciones",
    tags: ["ransomware", "RDP", "parches"],
    readMinutes: 6,
    publishedAt: "2026-04-18",
    coverImage:
      "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1200&q=80&auto=format&fit=crop",
    coverImageAlt: "Pantalla con alerta de seguridad en rojo",
    author: "Equipo Hack LATAM",
    problem:
      "Atacantes escanean puertos RDP y VPN, envían phishing con adjuntos y explotan CVEs publicados. Las PYMEs sin SOC detectan el cifrado cuando ya es tarde.",
    impact:
      "Paralización operativa, pago de rescate, pérdida de backups y daño reputacional duradero.",
    recommendations: [
      "Cierra RDP a Internet; usa VPN con MFA o acceso Zero Trust.",
      "Segmenta redes y mantén backups offline inmutables probados mensualmente.",
      "Prioriza parches en servicios expuestos detectados en tu inventario externo.",
    ],
  },
  {
    slug: "cumplimiento-gdpr-pymes",
    title: "GDPR para PYMEs latinoamericanas con clientes europeos",
    excerpt:
      "Procesar datos de ciudadanos de la UE obliga a controles mínimos aunque tu sede esté fuera de Europa.",
    category: "Cumplimiento",
    tags: ["GDPR", "privacidad", "datos personales"],
    readMinutes: 5,
    publishedAt: "2026-04-15",
    coverImage:
      "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200&q=80&auto=format&fit=crop",
    coverImageAlt: "Balanza de la justicia sobre fondo neutro, simbolizando cumplimiento legal",
    author: "Equipo Hack LATAM",
    problem:
      "Muchas empresas LATAM venden SaaS o servicios a clientes UE sin registro de actividades de tratamiento, bases legales documentadas ni procedimiento de breach notification.",
    impact:
      "Multas de hasta 4% del facturación global, pérdida de contratos B2B y due diligence fallida.",
    recommendations: [
      "Mapea qué datos personales procesas, dónde residen y quién accede.",
      "Redacta aviso de privacidad y cláusulas DPA con subprocesadores.",
      "Define playbooks de respuesta a incidentes con plazos de 72 h para notificación.",
    ],
  },
  {
    slug: "backups-sin-probar",
    title: "Backups que nadie restaura: falsa sensación de resiliencia",
    excerpt:
      "Tener copias en la nube no sirve si nunca verificaste que el restore funciona bajo presión.",
    category: "Operaciones",
    tags: ["backups", "continuidad", "DR"],
    readMinutes: 4,
    publishedAt: "2026-04-12",
    coverImage:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80&auto=format&fit=crop",
    coverImageAlt: "Dashboard con gráficos de monitoreo y métricas de sistemas",
    author: "Equipo Hack LATAM",
    problem:
      "Los equipos configuran backup automático pero no prueban restauración completa. En ransomware descubren que las copias también estaban cifradas o eran incrementales corruptos.",
    impact:
      "Tiempo de inactividad prolongado, imposibilidad de recuperar sin pagar rescate y incumplimiento contractual.",
    recommendations: [
      "Programa restores de prueba trimestrales a un entorno aislado.",
      "Mantén al menos una copia offline o inmutable (WORM / Object Lock).",
      "Documenta RTO/RPO y asigna responsables con contacto 24/7.",
    ],
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
