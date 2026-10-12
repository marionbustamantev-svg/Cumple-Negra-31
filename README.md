# Cumpleaños Negra 31

Página de invitación al camping en Radal 7 Tazas (14 y 15 de noviembre de 2026).

- `index.html`: la página (afiche, confirmación, entrada y camping, básicos para compartir, mochila).
- `afiche.jpg`: el afiche.
- `api/estado.js`: guarda quién lleva qué y quién confirmó (Upstash Redis).
- `lib/logica.js`: reglas de la lista (nadie puede tomar algo que ya tomó otro).

## Publicar en Vercel

1. **GitHub**: crea un repositorio nuevo (puede ser privado) y sube todos estos archivos, respetando las carpetas `api` y `lib`. En github.com sirve "Add file → Upload files" arrastrando la carpeta completa.
2. **Vercel**: "Add New → Project", importa el repositorio. Framework Preset: **Other**. No cambies nada más y presiona **Deploy**.
3. **Base de datos** (para que la lista compartida y los confirmados funcionen): en el proyecto de Vercel ve a **Storage → Create Database → Upstash for Redis** (plan gratis), y conéctala a este proyecto. Eso crea las variables de entorno solas.
4. **Redeploy**: en "Deployments", en el último deploy, "Redeploy", para que tome la base de datos.

Sin el paso 3 la página igual funciona: los invitados marcan lo que llevan y eso va en su mensaje de WhatsApp, pero no queda una lista compartida.

## Ajustes

- **Tu WhatsApp**: en `index.html`, cambia `const WHATSAPP = "";` por tu número, por ejemplo `"56912345678"`. Así el mensaje se abre directo en tu chat.
- **Agregar o quitar básicos**: edita `BASICOS` en `index.html` y la lista `ITEMS` en `lib/logica.js` con los mismos ids.
- **Corregir la lista**: si alguien tomó algo por error, escribe su nombre exacto en "Tu nombre" y toca "soltar" en esa cosa. También puedes editar los datos en la consola de Upstash (hashes `basicos` y `rsvp`).

Cada cambio que subas a GitHub se publica solo en Vercel.
