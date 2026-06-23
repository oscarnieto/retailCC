# Parque Comercial Berango — Retail Investment Opportunity (Savills)

Landing page de inversión retail (a partir del diseño de Figma) **+ editor visual**
para gestionar el contenido. **100 % estática y data-driven**, responsive, con
**GSAP** (reveals, contadores) y **Lenis** (scroll suave).

➡️ **Despliegue y arquitectura completos: ver [`DOCUMENTACION.md`](DOCUMENTACION.md).**

---

## 🚀 Ejecutar en local

No requiere build. Sólo un servidor estático (los módulos ES necesitan `http://`):

```bash
npm run start      # python3 -m http.server 4321
# Web:    http://localhost:4321
# Editor: http://localhost:4321/editor/
```

Librerías y fuentes están **auto-alojadas** en `vendor/` y `fonts/` (sin CDN). Para
regenerarlas tras `npm install`: `npm run vendor`.

---

## 🧩 Arquitectura

```
index.html          Página pública
css/styles.css      Estilos + tokens de diseño + responsive
fonts/              Montserrat + Playfair Display (woff2) + fonts.css
vendor/             gsap.min.js, ScrollTrigger.min.js, lenis.min.js
js/
  content.js        ⭐ MODELO DE CONTENIDO de la portada (fuente de verdad)
  render.js         Construye el HTML desde el contenido (buildHTML / render)
  animations.js     GSAP + Lenis (motion sutil)
  main.js           Orquestador + multipágina (?page=<slug>)
editor/             EDITOR VISUAL (login + dashboard multipágina)
pages/              Páginas publicadas (JSON) — ver ?page=<slug>
assets/             hero.jpg, logos/ (Savills), tenants/ (inquilinos), favicon
```

**Todo el contenido vive en datos** (`js/content.js` o `pages/*.json`): cada texto,
dato, contacto, imagen e inquilino es una propiedad del objeto de contenido, y la
página se renderiza desde ahí (`render.js`). Cada nodo editable lleva
`data-edit="ruta.del.campo"` como ancla para el editor.

---

## ✏️ Editor visual

- **URL:** `/editor/`
- **Acceso:** usuario `retailcc2026` · contraseña `RetailCC@2026`
  (cambiable; ver `DOCUMENTACION.md` §4.3)
- Edita **todo**, con **vista previa en vivo**: textos, highlights (añadir/quitar),
  imágenes (subir o por ruta), iframes (Insights + mapa), tenants, contactos…
- **Multipágina:** crear / duplicar / borrar / importar páginas (se guardan en el
  navegador) y **exportar** a `JSON` / `content.js` para publicar.

---

## 🌐 Despliegue

Proyecto **estático**: se sirve en cualquier servidor web (nginx, Apache, IIS,
Node…). Sin backend ni base de datos. Pasos detallados, MIME types, y cómo
**proteger `/editor/`** con autenticación de servidor → **[`DOCUMENTACION.md`](DOCUMENTACION.md)**.
