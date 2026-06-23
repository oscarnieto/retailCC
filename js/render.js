/**
 * render.js — construye el DOM de la página a partir del modelo `content`.
 * Reproduce fielmente el diseño de Figma. Cada nodo editable lleva
 * `data-edit="ruta"` (base para el futuro editor visual).
 */

const esc = (s = "") =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const rich = (parts = []) =>
  parts.map((p) => (p.bold ? `<b>${esc(p.text)}</b>` : esc(p.text))).join("");

/* Logo "savills" como SVG editable (usa Montserrat de la página). */
export function logoMarkup(variant = "yellow", brand = {}) {
  const name = (brand && brand.name) || "savills";
  const src = brand && brand.assets && brand.assets[variant];
  if (src) {
    return `<span class="logo logo--${variant}"><img src="${esc(src)}" alt="${esc(
      name
    )}" /></span>`;
  }
  // Fallback: wordmark en línea si todavía no hay archivo de logo.
  return `
  <span class="logo logo--${variant}" role="img" aria-label="${esc(name)}">
    <svg viewBox="0 0 75 75" xmlns="http://www.w3.org/2000/svg">
      <rect width="75" height="75" rx="2" fill="var(--logo-bg)"/>
      <text x="37.5" y="46" text-anchor="middle"
            font-family="Montserrat, system-ui, sans-serif" font-weight="600"
            font-size="17" letter-spacing="-0.5" fill="var(--logo-fg)">${esc(name)}</text>
    </svg>
  </span>`;
}

/** Hueco de media: foto/gráfica. Vacío => cuadro rojo (como el Figma). */
function mediaSlot(media = {}, { className = "", editPath = "" } = {}) {
  const hasImg = media.src && media.src.trim() !== "";
  const inner = hasImg
    ? `<img class="media__img" src="${esc(media.src)}" alt="${esc(
        media.alt || ""
      )}" loading="lazy" onerror="this.style.display='none'" />`
    : `<div class="media__ph"><span>${esc(media.alt || "")}</span></div>`;
  return `<figure class="media ${className}" ${
    editPath ? `data-edit="${editPath}"` : ""
  }>${inner}</figure>`;
}

/** Slot de iframe genérico (mapa de Google, gráficas embebidas, dashboards…). */
function iframeSlot(src, { title = "", className = "", editPath = "" } = {}) {
  return `<figure class="media ${className}" ${
    editPath ? `data-edit="${editPath}"` : ""
  }>
    <iframe title="${esc(title)}" loading="lazy" src="${esc(src)}"
      referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>
  </figure>`;
}

/** URL de embed de Google Maps (sin API key) a partir de una dirección. */
const mapsEmbedUrl = (address) =>
  `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;

/* ------------------------------- sections ------------------------------- */
function header(c) {
  return `
  <header class="site-header">
    <div class="container site-header__inner">
      <a href="${esc(c.brand.href)}" aria-label="${esc(c.brand.name)}">
        ${logoMarkup("yellow", c.brand)}
      </a>
      <a href="${esc(c.nav.cta.href)}" class="btn" data-edit="nav.cta.label">${esc(
    c.nav.cta.label
  )}</a>
    </div>
  </header>`;
}

function hero(c) {
  const h = c.hero;
  const media =
    h.media && h.media.src
      ? `<img class="hero__media" src="${esc(h.media.src)}" alt="${esc(
          h.media.alt || ""
        )}" data-edit="hero.media" onerror="this.style.display='none'" />`
      : `<div class="hero__media" data-edit="hero.media" hidden></div>`;
  return `
  <section class="hero" id="top">
    ${media}
    <div class="hero__gradient" aria-hidden="true"></div>
    <div class="hero__inner container">
      <p class="hero__eyebrow" data-reveal data-edit="hero.eyebrow">${esc(h.eyebrow)}</p>
      <h1 class="hero__title" data-reveal data-edit="hero.title">${esc(h.title)}</h1>
      <p class="hero__place" data-reveal data-edit="hero.place">${esc(h.place)}</p>
      <p class="hero__subtitle" data-reveal data-edit="hero.subtitle">${esc(h.subtitle)}</p>
    </div>
  </section>`;
}

function location(c) {
  const l = c.location;
  return `
  <section class="section location" id="location">
    <div class="container">
      <span class="label location__label" data-reveal data-edit="location.label">${esc(
        l.label
      )}</span>
      <p class="location__text" data-reveal data-edit="location.richText">${rich(
        l.richText
      )}</p>
      ${
        l.map.address
          ? iframeSlot(mapsEmbedUrl(l.map.address), {
              title: l.map.alt || "Mapa",
              className: "location__map",
              editPath: "location.map",
            })
          : mediaSlot(l.map, { className: "location__map", editPath: "location.map" })
      }
    </div>
  </section>`;
}

function overview(c) {
  const o = c.assetOverview;
  const stats = o.stats
    .map(
      (s, i) => `
      <div class="stat" data-reveal data-edit="assetOverview.stats.${i}">
        <span class="stat__value" data-count="${esc(s.value)}">${esc(s.value)}${
        s.unit ? `<span class="unit">${esc(s.unit)}</span>` : ""
      }</span>
        <span class="stat__caption" data-edit="assetOverview.stats.${i}.caption">${esc(
        s.caption
      )}</span>
      </div>`
    )
    .join("");
  return `
  <section class="section overview" id="overview">
    <div class="container">
      <span class="label overview__label" data-reveal data-edit="assetOverview.label">${esc(
        o.label
      )}</span>
      <div class="stats">${stats}</div>
    </div>
  </section>`;
}

function insights(c) {
  const cols = c.insights.columns
    .map((col, i) => {
      const slot = col.embed
        ? iframeSlot(col.embed, {
            title: col.label,
            className: "insight__media",
            editPath: `insights.columns.${i}.embed`,
          })
        : mediaSlot(col.media, {
            className: "insight__media",
            editPath: `insights.columns.${i}.media`,
          });
      return `
      <div class="insight" data-reveal>
        <span class="label insight__label" data-edit="insights.columns.${i}.label">${esc(
        col.label
      )}</span>
        ${slot}
      </div>`;
    })
    .join("");
  return `
  <section class="section insights" id="insights">
    <div class="container"><div class="insights__grid">${cols}</div></div>
  </section>`;
}

function feature(c) {
  const f = c.feature;
  return `
  <section class="section feature" id="feature">
    <div class="container">
      <span class="label feature__label" data-reveal data-edit="feature.label">${esc(
        f.label
      )}</span>
      ${mediaSlot(f.media, { className: "feature__media", editPath: "feature.media" })}
    </div>
  </section>`;
}

function tenants(c) {
  const t = c.tenants;
  const items = t.items
    .map(
      (it, i) =>
        `<span class="tenant" data-edit="tenants.items.${i}.name">${
          it.logo
            ? `<img src="${esc(it.logo)}" alt="${esc(it.name)}" loading="lazy" />`
            : esc(it.name)
        }</span>`
    )
    .join("");
  return `
  <section class="section tenants" id="tenants">
    <div class="container">
      <span class="label tenants__label" data-reveal data-edit="tenants.label">${esc(
        t.label
      )}</span>
      <div class="tenants__row" data-reveal>${items}</div>
    </div>
  </section>`;
}

function footer(c) {
  const f = c.footer;
  const contacts = f.contacts
    .map(
      (p, i) => `
      <div class="contact" data-reveal data-edit="footer.contacts.${i}">
        <span class="contact__name" data-edit="footer.contacts.${i}.name">${esc(p.name)}</span>
        <span class="contact__role" data-edit="footer.contacts.${i}.role">${esc(p.role)}</span>
        <span class="contact__line"></span>
        <span class="contact__meta">
          <a href="tel:${esc(p.phone.replace(/\s+/g, ""))}" data-edit="footer.contacts.${i}.phone">${esc(
        p.phone
      )}</a>
          <a href="mailto:${esc(p.email)}" data-edit="footer.contacts.${i}.email">${esc(
        p.email
      )}</a>
        </span>
      </div>`
    )
    .join("");
  return `
  <footer class="site-footer" id="contact">
    <div class="container">
      <div class="footer__top">
        <a href="${esc(c.brand.href)}" aria-label="${esc(c.brand.name)}">${logoMarkup(
    "black",
    c.brand
  )}</a>
        ${contacts}
        <p class="fees" data-reveal data-edit="footer.fees">${rich(f.fees)}</p>
      </div>
      <div class="footer__line"></div>
      <p class="footer__disclaimer" data-edit="footer.disclaimer">${esc(f.disclaimer)}</p>
    </div>
  </footer>`;
}

/** Renderiza toda la página dentro de `root`. */
export function render(root, c) {
  if (c.meta) {
    document.documentElement.lang = c.meta.lang || "en";
    if (c.meta.title) document.title = c.meta.title;
  }
  root.innerHTML = [
    header(c),
    "<main>",
    hero(c),
    location(c),
    overview(c),
    insights(c),
    feature(c),
    tenants(c),
    "</main>",
    footer(c),
  ].join("\n");
}

export default render;
