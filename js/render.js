/**
 * render.js — construye el DOM de la página a partir del modelo `content`.
 *
 * Cada nodo editable lleva `data-edit="ruta"` apuntando a js/content.js.
 * Esa convención es la base del futuro editor visual (click → ruta → campo).
 */

/* --------------------------- helpers --------------------------- */
const esc = (s = "") =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const richText = (parts = []) =>
  parts
    .map((p) => (p.bold ? `<b>${esc(p.text)}</b>` : esc(p.text)))
    .join("");

/* Logo "savills" como SVG editable (usa la fuente Montserrat de la página). */
export function logoMarkup(variant = "yellow", title = "savills") {
  return `
  <span class="logo logo--${variant}" data-edit="brand.name" role="img" aria-label="${esc(
    title
  )}">
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="64" height="64" rx="12" fill="var(--logo-bg)"/>
      <text x="32" y="33" text-anchor="middle" dominant-baseline="middle"
            font-family="Montserrat, system-ui, sans-serif" font-weight="600"
            font-size="14.5" letter-spacing="-0.4" fill="var(--logo-fg)">${esc(title)}</text>
    </svg>
  </span>`;
}

const phIcon = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"
       stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <rect x="3" y="4" width="18" height="16" rx="2"/>
    <circle cx="8.5" cy="9.5" r="1.6"/>
    <path d="m4 17 4.5-4.5a2 2 0 0 1 2.8 0L17 18"/>
    <path d="m14 15 1.8-1.8a2 2 0 0 1 2.8 0L21 15.5"/>
  </svg>`;

/** Hueco de media (los "cuadros rojos": foto o gráfica). */
function mediaSlot(media = {}, { className = "", dark = false, editPath = "" } = {}) {
  const hasImg = media.src && media.src.trim() !== "";
  const inner = hasImg
    ? `<img class="media__img" src="${esc(media.src)}" alt="${esc(
        media.alt || ""
      )}" loading="lazy" />`
    : `<div class="media__ph">
         ${phIcon}
         <span>${esc(media.alt || "Image")}</span>
         <small>Image slot</small>
       </div>`;
  return `<figure class="media ${dark ? "media--dark" : ""} ${className}" ${
    editPath ? `data-edit="${editPath}"` : ""
  } data-parallax>${inner}</figure>`;
}

/* ------------------------------- sections ------------------------------- */
function header(c) {
  return `
  <header class="site-header" data-header>
    <div class="container site-header__inner">
      <a href="${esc(c.brand.href)}" class="logo-link" data-magnetic aria-label="${esc(
    c.brand.name
  )} — home">
        ${logoMarkup("yellow", c.brand.name)}
      </a>
      <a href="${esc(c.nav.cta.href)}" class="btn btn--cta" data-magnetic data-edit="nav.cta.label">
        ${esc(c.nav.cta.label)}
      </a>
    </div>
  </header>`;
}

function hero(c) {
  const h = c.hero;
  const media =
    h.media && h.media.src
      ? `<img class="hero__media" src="${esc(h.media.src)}" alt="${esc(
          h.media.alt || ""
        )}" data-edit="hero.media" />`
      : `<div class="hero__media" data-edit="hero.media" hidden></div>`;
  return `
  <section class="hero" id="top">
    ${media}
    <canvas class="hero__canvas" id="hero-canvas" aria-hidden="true"></canvas>
    <div class="hero__gradient" aria-hidden="true"></div>
    <div class="hero__inner">
      <p class="hero__eyebrow" data-reveal="line" data-edit="hero.eyebrow">${esc(h.eyebrow)}</p>
      <h1 class="hero__title" data-reveal="lines" data-edit="hero.title">${esc(h.title)}</h1>
      <p class="hero__place" data-reveal="line" data-edit="hero.place">${esc(h.place)}</p>
      <p class="hero__subtitle" data-reveal="line" data-edit="hero.subtitle">${esc(
        h.subtitle
      )}</p>
    </div>
    <span class="hero__scroll" aria-hidden="true" data-edit="hero.scrollHint">${esc(
      h.scrollHint
    )}<i></i></span>
  </section>`;
}

function location(c) {
  const l = c.location;
  return `
  <section class="section location" id="location">
    <div class="container">
      <span class="label" data-reveal="fade" data-edit="location.label">${esc(l.label)}</span>
      <div class="location__grid">
        <p class="location__text" data-reveal="lines" data-edit="location.richText">${richText(
          l.richText
        )}</p>
        <div data-reveal="fade">
          ${mediaSlot(l.map, { className: "location__map", editPath: "location.map" })}
          <p class="location__cap" data-edit="location.map.caption">${esc(
            l.map.caption || ""
          )}</p>
        </div>
      </div>
    </div>
  </section>`;
}

function overview(c) {
  const o = c.assetOverview;
  const stats = o.stats
    .map(
      (s, i) => `
      <div class="stat" data-reveal="stat" data-edit="assetOverview.stats.${i}">
        <span class="stat__value" data-count="${esc(s.value)}">${esc(s.value)}${
        s.suffix ? `<span class="unit">${esc(s.suffix)}</span>` : ""
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
      <span class="label" data-reveal="fade" data-edit="assetOverview.label">${esc(o.label)}</span>
      <div class="stats">${stats}</div>
    </div>
  </section>`;
}

function insights(c) {
  const cols = c.insights.columns
    .map(
      (col, i) => `
      <div class="insight" data-reveal="fade">
        <span class="label" data-edit="insights.columns.${i}.label">${esc(col.label)}</span>
        ${mediaSlot(col.media, {
          className: "insight__media",
          editPath: `insights.columns.${i}.media`,
        })}
      </div>`
    )
    .join("");
  return `
  <section class="section insights" id="insights">
    <div class="container">
      <div class="insights__grid">${cols}</div>
    </div>
  </section>`;
}

function feature(c) {
  const f = c.feature;
  return `
  <section class="section feature" id="feature">
    <div class="container">
      <span class="label" data-reveal="fade" data-edit="feature.label">${esc(f.label)}</span>
      ${mediaSlot(f.media, { className: "feature__media", editPath: "feature.media" })}
    </div>
  </section>`;
}

function tenants(c) {
  const t = c.tenants;
  const one = t.items
    .map(
      (it, i) =>
        `<span class="tenant" data-edit="tenants.items.${i}.name">${
          it.logo
            ? `<img src="${esc(it.logo)}" alt="${esc(it.name)}" loading="lazy" />`
            : esc(it.name)
        }</span>`
    )
    .join("");
  // duplicado para marquee continuo
  const track = one + one;
  return `
  <section class="section tenants" id="tenants">
    <div class="container">
      <span class="label" data-reveal="fade" data-edit="tenants.label">${esc(t.label)}</span>
    </div>
    <div class="marquee">
      <div class="marquee__track" data-marquee>${track}</div>
    </div>
  </section>`;
}

function footer(c) {
  const f = c.footer;
  const contacts = f.contacts
    .map(
      (p, i) => `
      <div class="contact" data-reveal="fade" data-edit="footer.contacts.${i}">
        <span class="contact__name" data-edit="footer.contacts.${i}.name">${esc(p.name)}</span>
        <span class="contact__line"></span>
        <span class="contact__role" data-edit="footer.contacts.${i}.role">${esc(p.role)}</span>
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
        <a href="${esc(c.brand.href)}" class="logo-link" aria-label="${esc(
    c.brand.name
  )}" data-magnetic>${logoMarkup("black", c.brand.name)}</a>
        ${contacts}
        <p class="fees" data-reveal="fade" data-edit="footer.fees">${richText(f.fees)}</p>
      </div>
      <div class="footer__line" data-line></div>
      <p class="footer__disclaimer" data-edit="footer.disclaimer">${esc(f.disclaimer)}</p>
    </div>
  </footer>`;
}

/** Renderiza toda la página dentro de `root`. */
export function render(root, c) {
  // <head> dinámico
  if (c.meta) {
    document.documentElement.lang = c.meta.lang || "en";
    if (c.meta.title) document.title = c.meta.title;
  }
  root.innerHTML = [
    header(c),
    `<main>`,
    hero(c),
    location(c),
    overview(c),
    insights(c),
    feature(c),
    tenants(c),
    `</main>`,
    footer(c),
  ].join("\n");
}

export default render;
