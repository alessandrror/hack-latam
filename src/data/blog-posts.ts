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
    slug: "contrasenas-reutilizadas",
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
  {
    slug: "rdp-expuesto-internet",
    title: "RDP expuesto a Internet: la puerta trasera mas buscada",
    excerpt:
      "El puerto 3389 abierto al mundo es uno de los primeros blancos en escaneos automatizados.",
    category: "Superficie de ataque",
    tags: ["RDP", "puertos", "acceso remoto"],
    readMinutes: 4,
    publishedAt: "2026-04-10",
    coverImage:
      "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=1200&q=80&auto=format&fit=crop",
    coverImageAlt: "Pantalla con codigo y tematica de seguridad informatica",
    author: "Equipo Hack LATAM",
    problem:
      "Equipos habilitan escritorio remoto para soporte y olvidan restringir el firewall. Los bots prueban credenciales por defecto y exploits conocidos en minutos.",
    impact:
      "Ransomware, movimiento lateral y cifrado de estaciones de trabajo completas.",
    recommendations: [
      "Cierra 3389 al publico; usa VPN o solucion Zero Trust con MFA.",
      "Habilita bloqueo de cuenta y NLA en todas las sesiones RDP.",
      "Audita puertos expuestos con escaneo pasivo recurrente.",
    ],
  },
  {
    slug: "panel-admin-publico",
    title: "Paneles /admin sin restriccion: acceso de cortesia para atacantes",
    excerpt:
      "Rutas de administracion indexables o sin IP allowlist son incidentes esperando el primer escaneo.",
    category: "Superficie de ataque",
    tags: ["admin", "WAF", "hardening"],
    readMinutes: 5,
    publishedAt: "2026-04-08",
    coverImage:
      "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&q=80&auto=format&fit=crop",
    coverImageAlt: "Codigo fuente en monitor con tema oscuro",
    author: "Equipo Hack LATAM",
    problem:
      "Aplicaciones legacy dejan /admin, /wp-admin o /manager/html accesibles sin VPN. Los crawlers los catalogan y los atacantes prueban credenciales por defecto.",
    impact:
      "Toma de control del CMS, defacement y pivot hacia bases de datos internas.",
    recommendations: [
      "Restringe paneles admin por IP, VPN o autenticacion en capa de red.",
      "Elimina rutas de demo y cambia URLs por defecto cuando el producto lo permita.",
      "Anade MFA y rate limiting en todos los formularios de login administrativos.",
    ],
  },
  {
    slug: "cors-permisivo",
    title: "CORS demasiado permisivo: tu API confia en cualquier origen",
    excerpt:
      "Access-Control-Allow-Origin: * en APIs con cookies o tokens facilita robo de datos desde sitios maliciosos.",
    category: "Headers",
    tags: ["CORS", "API", "browser"],
    readMinutes: 4,
    publishedAt: "2026-04-05",
    coverImage:
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&q=80&auto=format&fit=crop",
    coverImageAlt: "Desarrollador trabajando en codigo de aplicacion web",
    author: "Equipo Hack LATAM",
    problem:
      "Equipos habilitan CORS amplio para integraciones rapidas y nunca lo endurecen. Un sitio atacante puede leer respuestas autenticadas del navegador de la victima.",
    impact:
      "Exfiltracion de datos de sesion, acciones no autorizadas y violaciones de politica de origen cruzado.",
    recommendations: [
      "Lista explicitamente origenes permitidos; evita wildcard con credenciales.",
      "Separa APIs publicas de APIs autenticadas con politicas distintas.",
      "Revisa headers_http en tu escaneo y corrige Access-Control mal configurado.",
    ],
  },
  {
    slug: "whois-sin-privacidad",
    title: "WHOIS sin privacidad: filtracion de contactos y superficie social",
    excerpt:
      "Datos de registro publicos alimentan spear-phishing y vishing contra tu equipo.",
    category: "DNS",
    tags: ["WHOIS", "privacidad", "OSINT"],
    readMinutes: 3,
    publishedAt: "2026-04-02",
    coverImage:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80&auto=format&fit=crop",
    coverImageAlt: "Red global iluminada vista desde el espacio",
    author: "Equipo Hack LATAM",
    problem:
      "Dominios corporativos registrados con nombre, correo y telefono reales del fundador o IT. Los atacantes cruzan esa data con LinkedIn para campanas dirigidas.",
    impact:
      "Phishing de alta credibilidad, spam dirigido y acoso a personas clave.",
    recommendations: [
      "Activa privacy protection en el registrador o usa contactos role-based.",
      "Separa correos de WHOIS de buzones personales y monitorea filtraciones.",
      "Revisa periodicamente registros RDAP/WHOIS tras renovaciones o transferencias.",
    ],
  },
  {
    slug: "certificados-autofirmados-produccion",
    title: "Certificados autofirmados en produccion: advertencias que nadie lee",
    excerpt:
      "TLS sin CA de confianza entrena a usuarios a ignorar alertas del navegador.",
    category: "TLS",
    tags: ["TLS", "certificados", "confianza"],
    readMinutes: 4,
    publishedAt: "2026-03-28",
    coverImage:
      "https://images.unsplash.com/photo-1633265486064-086b219458ec?w=1200&q=80&auto=format&fit=crop",
    coverImageAlt: "Candado digital sobre teclado de portatil",
    author: "Equipo Hack LATAM",
    problem:
      "Entornos internos publicados a Internet conservan certificados autofirmados por comodidad. Empleados aprenden a hacer clic en continuar de todos modos.",
    impact:
      "Facilita ataques MITM, phishing con proxies y perdida de confianza en avisos legitimos.",
    recommendations: [
      "Emite certificados de una CA publica o PKI interna confiable en todos los hosts publicos.",
      "Automatiza renovacion y alertas de caducidad en subdominios descubiertos.",
      "Usa tls_check para detectar cadenas incompletas o autofirmadas en :443.",
    ],
  },
  {
    slug: "simulacro-phishing-equipo",
    title: "Sin simulacros de phishing: el factor humano sin entrenar",
    excerpt:
      "La tecnologia no compensa un clic en un enlace creible si el equipo nunca practico.",
    category: "Email",
    tags: ["phishing", "awareness", "capacitacion"],
    readMinutes: 5,
    publishedAt: "2026-03-25",
    coverImage:
      "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1200&q=80&auto=format&fit=crop",
    coverImageAlt: "Persona revisando correos en portatil",
    author: "Equipo Hack LATAM",
    problem:
      "PYMEs invierten en firewall pero no en educacion continua. Un solo clic en OAuth falso o adjunto malicioso compromete Microsoft 365.",
    impact:
      "BEC, robo de credenciales y malware inicial en la red corporativa.",
    recommendations: [
      "Ejecuta campanas de simulacion trimestrales con metricas por area.",
      "Combina SPF/DMARC fuerte con reportes de usuario para correos sospechosos.",
      "Refuerza senales visibles: dominio del remitente, urgencia artificial y adjuntos inesperados.",
    ],
  },
  {
    slug: "waf-ausente-perimetro",
    title: "Sin WAF en el perimetro: ataques web sin filtro",
    excerpt:
      "Exponer aplicaciones directamente a Internet sin capa de filtrado facilita SQLi, XSS y fuerza bruta a escala.",
    category: "Headers",
    tags: ["WAF", "perimetro", "aplicaciones web"],
    readMinutes: 4,
    publishedAt: "2026-03-22",
    coverImage:
      "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&q=80&auto=format&fit=crop",
    coverImageAlt: "Servidores en rack de centro de datos",
    author: "Equipo Hack LATAM",
    problem:
      "PYMEs despliegan apps en VPS o PaaS sin WAF ni rate limiting. Los escaneos automaticos explotan vulnerabilidades OWASP Top 10 en horas.",
    impact:
      "Defacement, robo de bases de datos y caida de servicio por bots.",
    recommendations: [
      "Coloca WAF o reverse proxy con reglas OWASP delante de todo trafico HTTP publico.",
      "Habilita rate limiting y bloqueo geografico si tu audiencia es regional.",
      "Revisa headers_http y rutas expuestas en escaneos pasivos recurrentes.",
    ],
  },
  {
    slug: "vpn-sin-parches",
    title: "VPN sin parches: puerta de entrada a la red interna",
    excerpt:
      "Concentradores VPN con CVEs publicados son el blanco preferido antes de moverse lateralmente.",
    category: "Operaciones",
    tags: ["VPN", "parches", "acceso remoto"],
    readMinutes: 5,
    publishedAt: "2026-03-20",
    coverImage:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&q=80&auto=format&fit=crop",
    coverImageAlt: "Persona trabajando con laptop en entorno remoto",
    author: "Equipo Hack LATAM",
    problem:
      "Appliances VPN quedan en versiones antiguas porque reiniciar implica ventana de mantenimiento. Los exploits aparecen en foros el mismo dia del advisory.",
    impact:
      "Acceso completo a la red corporativa, exfiltracion y despliegue de ransomware.",
    recommendations: [
      "Aplica parches en ventana acordada; manten un plan de rollback documentado.",
      "Segmenta redes para que usuarios VPN no lleguen a servidores criticos por defecto.",
      "Monitorea intentos de autenticacion fallidos y geolocalizaciones anomalas.",
    ],
  },
  {
    slug: "shadow-it-saas",
    title: "Shadow IT: SaaS no aprobados con datos corporativos",
    excerpt:
      "Herramientas adoptadas sin revision de seguridad multiplican superficie y fugas accidentales.",
    category: "Cloud",
    tags: ["SaaS", "shadow IT", "gobierno"],
    readMinutes: 5,
    publishedAt: "2026-03-18",
    coverImage:
      "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=1200&q=80&auto=format&fit=crop",
    coverImageAlt: "Codigo en pantalla con reflejos azules",
    author: "Equipo Hack LATAM",
    problem:
      "Equipos suben hojas de calculo con clientes a apps de terceros sin DPA ni SSO. IT descubre el servicio cuando hay incidente o factura duplicada.",
    impact:
      "Filtracion de PII, cumplimiento incumplido y cuentas huerfanas sin offboarding.",
    recommendations: [
      "Mantén catalogo de SaaS aprobados con SSO y MFA obligatorio.",
      "Bloquea categorias de alto riesgo en proxy corporativo cuando sea viable.",
      "Audita OAuth grants y sesiones activas en Microsoft 365 / Google trimestralmente.",
    ],
  },
  {
    slug: "monitoreo-sin-alertas",
    title: "Logs sin alertas: detectar el ataque cuando ya termino",
    excerpt:
      "Guardar eventos sin reglas de correlacion es archivo muerto, no seguridad operativa.",
    category: "Operaciones",
    tags: ["SIEM", "logs", "deteccion"],
    readMinutes: 4,
    publishedAt: "2026-03-15",
    coverImage:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80&auto=format&fit=crop",
    coverImageAlt: "Dashboard de metricas y graficos de monitoreo",
    author: "Equipo Hack LATAM",
    problem:
      "PYMEs activan logging en cloud pero nadie revisa. Los indicadores de compromiso aparecen dias antes del ransomware en logs que nadie consulta.",
    impact:
      "MTTD alto, respuesta reactiva y perdida de evidencia forense por rotacion corta.",
    recommendations: [
      "Define 5-10 alertas criticas: login fallido masivo, nuevo admin, egress inusual.",
      "Centraliza logs de DNS, correo, VPN y endpoints en un solo panel.",
      "Ejecuta tabletop de incidente trimestral con datos reales de tus alertas.",
    ],
  },
];

const SLUG_ALIASES: Record<string, string> = {
  "contraseñas-reutilizadas": "contrasenas-reutilizadas",
};

export function resolveBlogSlug(slug: string): string {
  let decoded = slug;
  try {
    decoded = decodeURIComponent(slug);
  } catch {
    decoded = slug;
  }
  return SLUG_ALIASES[decoded] ?? decoded;
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  const resolved = resolveBlogSlug(slug);
  return BLOG_POSTS.find((p) => p.slug === resolved);
}
