# RetailCC — Documentación técnica y de despliegue

Landing page de inversión (**Parque Comercial Berango / Savills**) + **editor visual**
para gestionar el contenido. Este documento explica cómo está hecho el proyecto y
todo lo necesario para desplegarlo en un servidor propio.

> **Resumen para IT (lo esencial):** es un sitio **100 % estático** (HTML + CSS +
> JavaScript). No necesita backend, ni base de datos, ni Node.js en el servidor.
> Basta con **servir la carpeta del proyecto por HTTP(S)**. Único requisito real:
> servirlo desde un servidor web (no abrir los archivos con `file://`) y, muy
> recomendado, **proteger la carpeta `/editor/` con autenticación del servidor**.

---

## 1. Tecnología

| Área | Decisión |
| --- | --- |
| Frontend | HTML5 + CSS3 + **JavaScript “vanilla” (ES Modules)**. Sin framework. |
| Build | **Ninguno.** No hay paso de compilación; los archivos se sirven tal cual. |
| Animación | **GSAP + ScrollTrigger** (scroll reveals, contadores) y **Lenis** (scroll suave). Alojadas en local (`vendor/`), sin CDN. |
| Tipografías | **Montserrat** y **Playfair Display**, **auto-alojadas** en `fonts/` (sin Google Fonts CDN). |
| Mapa | Google Maps **embebido por iframe** (sin API key). Se carga en el navegador del visitante. |
| Editor | App estática en `/editor/` (sin backend). Persistencia en `localStorage` del navegador. |
| Datos | El contenido es un objeto JS (`js/content.js`) / JSON (`pages/*.json`). |

**Por qué sin framework ni build:** máxima portabilidad y longevidad. Cualquier
servidor web sirve el proyecto sin instalar nada, y es fácil de mantener.

---

## 2. Estructura de carpetas

```
retailCC/
├── index.html              ← Página pública (la landing)
├── DOCUMENTACION.md        ← Este documento
├── README.md               ← Resumen rápido
├── .nojekyll               ← (Sólo relevante en GitHub Pages; inocuo en otros servidores)
│
├── css/
│   └── styles.css          ← TODOS los estilos del sitio público
│
├── js/
│   ├── content.js          ← CONTENIDO de la portada (textos, imágenes, datos…)
│   ├── render.js           ← Construye el HTML a partir del contenido
│   ├── animations.js       ← GSAP/Lenis (motion sutil)
│   └── main.js             ← Punto de entrada; soporte multipágina (?page=)
│
├── editor/                 ← EDITOR VISUAL (acceso restringido)
│   ├── index.html
│   ├── editor.css
│   └── editor.js
│
├── pages/                  ← Páginas publicadas con el editor (JSON). Ver README dentro.
│
├── assets/
│   ├── favicon.svg
│   ├── hero.jpg            ← Foto del hero
│   ├── logos/             ← Logo Savills (versión amarilla y negra)
│   └── tenants/           ← Logos de inquilinos (carrusel)
│
├── fonts/                  ← Fuentes .woff2 + fonts.css (auto-alojadas)
├── vendor/                 ← GSAP, ScrollTrigger, Lenis (librerías, sin CDN)
│
├── scripts/vendor.mjs      ← (Sólo desarrollo) copia libs/fuentes desde node_modules
├── package.json            ← (Sólo desarrollo) dependencias para regenerar vendor/fonts
└── package-lock.json
```

> Para **funcionar en producción NO se necesitan** `package.json`, `package-lock.json`,
> `node_modules/`, `scripts/` ni `.nojekyll`. Son sólo de desarrollo. Puedes
> desplegar el resto de la carpeta tal cual.

---

## 3. Cómo funciona el sitio público

El renderizado es **dirigido por datos**:

1. `index.html` carga `js/main.js`.
2. `main.js` decide qué contenido mostrar:
   - **Sin parámetros** → usa `js/content.js` (la portada principal).
   - **Con `?page=<slug>`** → descarga `pages/<slug>.json` y lo usa.
3. `render.js` transforma ese objeto de contenido en el HTML de todas las secciones
   (hero, location + mapa, highlights, insights, feature, tenants, footer).
4. `animations.js` añade el motion sutil (si el navegador no lo soporta, el sitio se
   ve igual, sin animación).

**Secciones de la página:** Hero · Location (texto + mapa Google) · Asset Overview
(highlights) · Insights (2 iframes/gráficas) · Feature (imagen ancha) · Tenants
(carrusel de logos) · Footer (contactos + fees).

**Multipágina:** cada archivo `pages/<slug>.json` es una página. Se ve en
`…/index.html?page=<slug>`. No requiere configuración de servidor (es un parámetro
de consulta, no una ruta).

---

## 4. El editor visual

**URL:** `…/editor/`
**Acceso:** usuario **`retailcc2026`**, contraseña **`RetailCC@2026`**.

Permite cambiar **todo** el contenido, con **vista previa en vivo**:

- Textos (SEO, hero, location, etiquetas, footer, fees, disclaimer…).
- **Highlights:** añadir / quitar / reordenar datos, con su unidad pequeña opcional.
- **Imágenes:** pegar una ruta/URL **o** “Insertar archivo” (se incrusta en el JSON).
- **Iframes:** las dos columnas de Insights y el mapa (por dirección de Google).
- **Tenants:** añadir / quitar logos del carrusel.
- **Contactos** del footer: añadir / quitar / reordenar.
- **Multipágina:** un **dashboard** para **crear, duplicar, borrar e importar** páginas.

### 4.1 Cómo se guardan y publican los cambios

El editor es estático, así que **guarda en el `localStorage` del navegador** (borrador
de trabajo). Para **publicar** en el servidor:

- **Portada principal:** en el editor, botón **“Exportar content.js”** → reemplaza el
  archivo `js/content.js` del servidor por el descargado.
- **Otras páginas:** botón **“Exportar JSON”** → sube el archivo `<slug>.json` a la
  carpeta `pages/` del servidor. Se verá en `…/index.html?page=<slug>`.

> Es decir: **el editor produce los archivos; publicarlos = copiarlos al servidor**
> (por FTP, panel, pipeline… lo que use IT). Esto es deliberado: así nadie puede
> alterar la web en vivo sin acceso al servidor.

### 4.2 Seguridad del editor — IMPORTANTE para IT

El login del editor está **hasheado** (PBKDF2, la contraseña no está en texto plano),
pero al ser una web estática **el login del navegador no es una barrera infalible**.
La protección **real** debe ponerse en el **servidor**, restringiendo la carpeta
`/editor/` (y opcionalmente `/pages/`). Ver ejemplos en la sección 6.4.

Aun sin esa protección, el daño potencial es limitado: el editor **sólo exporta
archivos**; no puede publicar nada en el servidor por sí mismo.

### 4.3 Cambiar usuario/contraseña del editor

El login se valida contra un hash en `editor/editor.js` (constante `AUTH`). Para
cambiarlo, genera un nuevo hash (necesitas Node.js sólo para este paso):

```bash
node -e '
const c=require("crypto"), user="NUEVO_USUARIO", pass="NUEVA_CLAVE";
const salt=c.randomBytes(16), it=150000;
const h=c.pbkdf2Sync(user+":"+pass, salt, it, 32, "sha256");
console.log("salt:", salt.toString("hex"));
console.log("hash:", h.toString("hex"));'
```

Pega los valores en `editor/editor.js`:

```js
const AUTH = { iters: 150000, salt: "…(salt)…", hash: "…(hash)…" };
```

---

## 5. Requisitos

- **Servidor:** cualquier servidor web capaz de servir archivos estáticos
  (nginx, Apache, IIS, Caddy, Node, S3 + CloudFront, etc.).
- **HTTPS:** recomendado (y necesario para que el login use Web Crypto en algunos
  navegadores; en `localhost` también funciona).
- **Navegador del visitante:** moderno (Chrome/Edge/Firefox/Safari recientes). Usa ES
  Modules, `fetch` y Web Crypto, soportados por todos desde hace años.
- **Conectividad del visitante:** el **mapa de Google** se carga desde `google.com`.
  Si la red de destino bloquea internet, el mapa no cargará (usa una imagen estática
  en su lugar desde el editor). El resto del sitio (fuentes, libs) es **local** y
  funciona sin internet.

No se necesita Node.js, npm ni base de datos **en el servidor**. (Node sólo se usa en
desarrollo para regenerar `vendor/`/`fonts/` o cambiar la contraseña.)

---

## 6. Despliegue paso a paso

### 6.1 Genérico (cualquier servidor)

1. Copia el contenido del proyecto al directorio público del servidor
   (puedes omitir `node_modules/`, `scripts/`, `package*.json`, `.nojekyll`, `.git/`).
2. Asegúrate de que el servidor sirve los **tipos MIME** correctos (sección 6.5).
3. Sirve por **HTTPS**. Abre `https://tu-dominio/` → debe verse la landing.
4. Abre `https://tu-dominio/editor/` → login del editor.
5. **Protege `/editor/`** con autenticación del servidor (6.4).

Funciona igual en la **raíz del dominio** (`/`) o en un **subdirectorio**
(`/retailcc/`): todas las rutas son **relativas**, no hay nada cableado a un dominio.

No hacen falta reglas de *rewrite* ni configuración de SPA: son archivos estáticos y
el enrutado del editor es por `#hash`.

### 6.2 nginx

```nginx
server {
    listen 443 ssl;
    server_name tu-dominio.com;
    root /var/www/retailcc;          # carpeta del proyecto
    index index.html;

    # (SSL, etc.)

    location / {
        try_files $uri $uri/ =404;
    }

    # Proteger el editor con usuario/contraseña del servidor
    location ^~ /editor/ {
        auth_basic "Acceso restringido";
        auth_basic_user_file /etc/nginx/retailcc.htpasswd;
        try_files $uri $uri/ =404;
    }
}
```

Crear el fichero de credenciales del servidor:
```bash
htpasswd -c /etc/nginx/retailcc.htpasswd usuario_it
```

### 6.3 Apache

Subir el proyecto a la carpeta pública y crear `editor/.htaccess`:

```apache
AuthType Basic
AuthName "Acceso restringido"
AuthUserFile /ruta/segura/retailcc.htpasswd
Require valid-user
```

(Requiere `mod_auth_basic`. Genera el `.htpasswd` con `htpasswd`.)

### 6.4 Recomendación de seguridad para `/editor/`

Cualquiera de estas opciones da **seguridad real** (mejor que el login de cliente):

- **HTTP Basic Auth** (nginx/Apache, ejemplos arriba) — lo más simple.
- **SSO corporativo / reverse proxy** (p. ej. Azure AD, Okta, Cloudflare Access)
  delante de la ruta `/editor/`.
- Restringir `/editor/` por **IP** (sólo red interna/VPN).

### 6.5 Tipos MIME (importante)

Los **ES Modules** sólo cargan si el servidor envía el `Content-Type` correcto:

| Extensión | Content-Type |
| --- | --- |
| `.js` | `text/javascript` (o `application/javascript`) |
| `.json` | `application/json` |
| `.woff2` | `font/woff2` |
| `.svg` | `image/svg+xml` |
| `.css` | `text/css` |

nginx/Apache modernos ya los tienen. En **IIS** suele haber que **añadir** `.woff2`
(`font/woff2`) y comprobar `.json`/`.js` en `web.config`.

### 6.6 Node (alternativa simple)

```bash
npx serve .          # o: npx http-server -p 8080
```

---

## 7. Publicar cambios de contenido (flujo habitual)

1. Entra en `…/editor/` y edita (se guarda solo en tu navegador).
2. **Exporta**: `content.js` (portada) o `<slug>.json` (otras páginas).
3. **Sube** ese archivo al servidor:
   - `content.js` → reemplaza `js/content.js`.
   - `<slug>.json` → cópialo a `pages/`.
4. Recarga la web (Ctrl/Cmd + Shift + R si hay caché).

Las **imágenes** insertadas con “Insertar archivo” quedan **incrustadas** en el
JSON/`content.js` (no requieren subir el archivo aparte). Para imágenes grandes (p.
ej. el hero) es mejor subir el archivo a `assets/` y poner su ruta, para no inflar el
JSON.

---

## 8. Personalización

- **Colores / tipografías del sitio:** variables CSS al inicio de `css/styles.css`
  (`:root { --yellow, --red, --ink, --font-sans, --font-serif … }`).
- **Fuentes:** se declaran en `fonts/fonts.css` y se sirven desde `fonts/`.
- **Logos / favicon:** en `assets/`.
- **Estructura/markup de las secciones:** `js/render.js`.

### Regenerar librerías o fuentes (sólo desarrollo)

```bash
npm install            # instala dependencias en node_modules/
npm run vendor         # copia GSAP/Lenis a vendor/ y las fuentes a fonts/
```

---

## 9. Limitaciones conocidas

- El editor guarda borradores en el **navegador** (localStorage): no se comparten
  entre equipos hasta que **exportas y publicas** el archivo.
- **Publicar** es un paso manual (subir el archivo al servidor). Es intencional por
  seguridad. Si en el futuro quieres “publicar con un botón”, requeriría un backend.
- El **login del editor** es de cliente; la seguridad real la aporta el servidor
  (sección 6.4).
- El **mapa de Google** necesita internet en el navegador del visitante.
- Imágenes incrustadas como base64 aumentan el tamaño del JSON; para fotos grandes,
  usar archivos en `assets/`.

---

## 10. Checklist de despliegue para IT

- [ ] Copiar el proyecto al directorio público (sin `node_modules/`, `scripts/`, `package*.json`).
- [ ] Servir por **HTTPS**.
- [ ] Verificar **MIME types** (`.js`, `.json`, `.woff2`).
- [ ] Comprobar que `https://dominio/` muestra la landing.
- [ ] Comprobar que `https://dominio/editor/` abre el editor y el login funciona.
- [ ] **Proteger `/editor/`** con Basic Auth / SSO / IP.
- [ ] (Opcional) Cambiar usuario/clave del editor (sección 4.3).
- [ ] Definir el flujo para subir `content.js` / `pages/*.json` cuando se edite contenido.

---

*Proyecto estático, sin dependencias de servidor. Para dudas de mantenimiento, los
puntos de entrada son `js/content.js` (contenido), `js/render.js` (estructura),
`css/styles.css` (estilo) y `editor/` (editor).*
