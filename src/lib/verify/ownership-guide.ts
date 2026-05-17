export type OwnershipGuideLink = {
  label: string;
  href: string;
};

/** Pasos cortos para el desplegable de ayuda — DNS TXT. */
export const OWNERSHIP_GUIDE_DNS_STEPS_ES: readonly string[] = [
  "Abre la zona DNS de tu dominio apex en el registrador o CDN donde gestionas los registros (Cloudflare, el panel del registrador, etc.).",
  "Crea un registro nuevo de tipo TXT.",
  "En nombre/host introduce exactamente la cadena que mostramos; en algunos paneles bastará la parte antes de tu dominio (p. ej. `_hack-latam-verify`).",
  "En valor/pega copia exacta del token — sin espacios ni caracteres extra al inicio o al final.",
  "Guarda; la propagación DNS puede tardar minutos u horas. Después usa «Ya lo publiqué — verificar ahora».",
];

/** Paneles donde suelen crear el TXT — documentación oficial. */
export const OWNERSHIP_GUIDE_DNS_LINKS_ES: readonly OwnershipGuideLink[] = [
  {
    label: "Cloudflare — crear registros DNS",
    href: "https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/",
  },
  {
    label: "GoDaddy — añadir un registro TXT",
    href: "https://www.godaddy.com/help/add-a-txt-record-19232",
  },
  {
    label: "Namecheap — registros TXT (SPF/DKIM/verificación)",
    href: "https://www.namecheap.com/support/knowledgebase/article.aspx/317/2237/how-do-i-add-txtspfdkim-verification-dns-records/",
  },
];

/** Pasos cortos para archivo HTTPS bajo /.well-known. */
export const OWNERSHIP_GUIDE_HTTPS_STEPS_ES: readonly string[] = [
  "En el servidor o el hosting que responde en el dominio apex por HTTPS (el mismo nombre que muestra la URL de comprobación), publica el archivo en la raíz web.",
  "La ruta debe ser exactamente `/.well-known/hack-latam-challenge.txt` (carpetas `.well-known` y archivo con ese nombre).",
  "El contenido del archivo debe ser solo el token en texto plano (sin HTML, sin JSON, sin líneas ni espacios de más si no son parte del token).",
  'Comprueba en el navegador o con `curl` que esa URL sirve texto y que coincide con nuestra cadena antes de pulsar «verificar».',
];

/** Alojamiento / marco habitual — público en raíz para Next.js/Vercel. */
export const OWNERSHIP_GUIDE_HTTPS_LINKS_ES: readonly OwnershipGuideLink[] = [
  {
    label: "Next.js — carpeta `public` (assets estáticos)",
    href: "https://nextjs.org/docs/app/api-reference/file-conventions/public-folder",
  },
  {
    label: "Vercel — despliegue de Next.js",
    href: "https://vercel.com/docs/frameworks/nextjs",
  },
];
