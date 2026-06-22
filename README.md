# Parque Comercial Berango — Retail Investment Opportunity (Savills)

Landing page de ficha de producto retail, _awwwards-style_, construida a partir
del diseño de Figma. **100% data-driven**, responsive, con **GSAP** (scroll suave,
reveals, contadores, cursor, parallax) y **Three.js** (fondo WebGL del hero).

> Pensada para que, en una segunda fase, se pueda montar un **editor visual**
> sobre el modelo de contenido sin tocar el markup.

---

## 🚀 Cómo ejecutar en local

No requiere build. Solo un servidor estático (los módulos ES necesitan `http://`):

```bash
npm run start      # python3 -m http.server 4321
# abre http://localhost:4321
```

Las librerías y fuentes están **self-hosted** en `/vendor` y `/fonts` (sin CDN).
Si reinstalas dependencias y quieres regenerarlas:

```bash
npm install
npm run vendor     # copia three/gsap/lenis + woff2 a /vendor y /fonts
```

---

## 🧩 Arquitectura (clave para el editor visual)

```
index.html            Shell + importmap (Three) + carga de GSAP/Lenis
css/styles.css        Estilos, tokens de diseño y responsive
fonts/                Montserrat + Playfair Display (woff2) + fonts.css
vendor/               three.module.min.js, gsap.min.js, ScrollTrigger.min.js, lenis.min.js
js/
  content.js          ⭐ MODELO DE CONTENIDO — única fuente de verdad
  render.js           Construye el DOM desde content.js (añade data-edit)
  three-hero.js       Fondo WebGL del hero (shader)
  animations.js       GSAP + Lenis + cursor + contadores + marquee…
  main.js             Orquestador + window.RetailCC (API para el editor)
assets/logos/         Logo "savills" (versión amarilla y negra) — SVG editable
.github/workflows/    Despliegue automático a GitHub Pages
```

### Todo el contenido vive en `js/content.js`

Cada texto, dato, contacto, imagen e inquilino es una propiedad del objeto
`content`. La página entera se renderiza desde ahí (`render.js`).

### Anclas para el editor: `data-edit`

Cada nodo editable del DOM lleva `data-edit="ruta.del.campo"` apuntando a una
propiedad de `content.js`. Ejemplos: `hero.title`, `assetOverview.stats.2.value`,
`footer.contacts.0.email`. Un editor visual solo necesita:

1. Escuchar clics en elementos con `data-edit`.
2. Editar la propiedad correspondiente del modelo.
3. Volver a pintar con `window.RetailCC.apply(nuevoContenido)`.

```js
// Ejemplo desde consola:
const c = window.RetailCC.content;
c.hero.title = "Nuevo título";
window.RetailCC.apply(c);
```

### Huecos de imagen (los "cuadros rojos" del Figma)

Se representan como `media` con `src: ""`. Mientras estén vacíos muestran un
**placeholder elegante** (con el texto `alt`). Basta con poner una URL en `src`
para que aparezca la foto/gráfica, con su efecto de parallax.

Slots presentes: `hero.media`, `location.map`, `insights.columns[].media`,
`feature.media`, más logos de `tenants.items[].logo`.

---

## 🎨 Fidelidad al diseño

- **Tipografías**: Playfair Display (display/serif: título e _eyebrow_ en
  itálica) y Montserrat (todo lo demás), tal como pediste. En Figma había
  algún texto en "Gotham" → mapeado a Montserrat.
- **Color de marca**: amarillo Savills `#ffdf00`. Footer amarillo, hero oscuro.
- **Logo**: el asset no era descargable desde este entorno (política de red),
  así que se ha **recreado el wordmark "savills"** como SVG editable en sus dos
  versiones (amarilla / negra). Sustitúyelo por el oficial en `assets/logos/`.
- **Stats**: valores y etiquetas tomados del Figma. Dos etiquetas eran claramente
  _placeholders_ ("Opening date" repetido y "Ownership" duplicado); se ajustó la
  primera a "Average rent". Revísalas en `content.js` si quieres afinarlas.
- **Inquilinos**: identificados Worten, Sport Zone, The Food Co., C&A, Kiabi.
  Añade el resto y sus logotipos reales en `tenants.items`.

---

## ♿ Accesibilidad y rendimiento

- Respeta `prefers-reduced-motion` (desactiva animaciones y WebGL animado).
- Cursor personalizado solo en dispositivos con puntero (se oculta en táctil).
- Fuentes con `font-display: swap` y precarga de las críticas.
- WebGL se pausa fuera de viewport y con la pestaña oculta.
- Fallbacks: sin JS o si fallan los vendor scripts, el contenido se muestra igual.

---

## 🌐 Despliegue (GitHub Pages)

Hay un workflow (`.github/workflows/deploy-pages.yml`) que, en cada push a la
rama de trabajo, ensambla `_site/` y lo publica en GitHub Pages
(habilitándolo automáticamente). La URL aparece en la pestaña **Actions →
Deploy** y en **Settings → Pages**.
