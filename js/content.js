/**
 * ============================================================================
 *  CONTENT MODEL — única fuente de verdad de toda la web.
 * ============================================================================
 *
 *  Toda la página se renderiza a partir de este objeto (ver js/render.js).
 *  Está pensado para que el FUTURO EDITOR VISUAL pueda leer/escribir aquí
 *  sin tocar el markup: cada nodo editable del DOM lleva un atributo
 *  `data-edit="ruta.del.campo"` que apunta a una propiedad de este objeto.
 *
 *  Convenciones:
 *   - `media`  -> hueco para foto/gráfica (los "cuadros rojos" del Figma).
 *                Deja `src: ""` para mostrar el placeholder editable.
 *   - `richText` (array) -> párrafos con tramos en negrita: [{text, bold?}]
 *   - Las rutas usadas en data-edit son las claves de este árbol
 *     (p.ej. "hero.title", "assetOverview.stats.0.value").
 * ============================================================================
 */

export const content = {
  /* ------------------------------------------------------------------ */
  meta: {
    lang: "en",
    title: "Parque Comercial Berango — Retail Investment Opportunity | Savills",
    description:
      "Dominant retail park in Greater Bilbao’s northern corridor with 100% occupancy and resilient income. A retail investment opportunity by Savills.",
    themeColor: "#111111",
  },

  brand: {
    name: "savills",
    // El logo se dibuja como SVG editable (ver js/render.js -> logoMarkup()).
    // Sustituye estos archivos por el logo oficial cuando lo tengas:
    assets: {
      yellow: "assets/logos/logo-yellow.svg", // versión amarilla (sobre fondos oscuros)
      black: "assets/logos/logo-black.svg", // versión negra (sobre fondos claros)
    },
    href: "#top",
  },

  /* ------------------------------------------------------------------ */
  nav: {
    cta: { label: "Contact us", href: "#contact" },
  },

  /* ------------------------------- HERO ----------------------------- */
  hero: {
    eyebrow: "Retail Investment Opportunity", // Playfair Display italic · amarillo
    title: "Parque Comercial Berango", // Playfair Display · blanco
    place: "BERANGO · ESPAÑA", // Montserrat medium · amarillo
    subtitle:
      "Dominant retail park in Greater Bilbao’s northern corridor with 100% occupancy and resilient income.",
    // Imagen de fondo del hero (cuadro rojo). Vacío => fondo WebGL animado.
    media: {
      src: "",
      alt: "Vista aérea de Parque Comercial Berango",
    },
    scrollHint: "Scroll",
  },

  /* ----------------------------- LOCATION --------------------------- */
  location: {
    label: "Location",
    richText: [
      { text: "Parque Comercial Berango is the " },
      {
        text: "dominant retail park in the northern area of Greater Bilbao",
        bold: true,
      },
      {
        text:
          ". Anchored by leading brands, the asset benefits from strong critical mass in its immediate surroundings and serves a catchment of c.150,000 residents. The location sits within a ",
      },
      { text: "highly affluent area", bold: true },
      {
        text:
          ", with socio-economic indicators above the Spanish average and even above the Madrid region.",
      },
    ],
    map: {
      src: "", // hueco para el mapa / Google Maps (cuadro rojo)
      alt: "Mapa de Parque Comercial Berango, Greater Bilbao",
      caption: "Berango · Bizkaia · Greater Bilbao",
    },
  },

  /* -------------------------- ASSET OVERVIEW ------------------------ */
  assetOverview: {
    label: "Asset Overview",
    stats: [
      { value: "2017", suffix: "", caption: "Opening date" },
      { value: "5,000", suffix: "sqm", caption: "GLA" },
      { value: "100", suffix: "%", caption: "Occupancy rate" },
      { value: "148", suffix: "", caption: "Parking spaces (outdoor/indoor)" },
      { value: "€11.78", suffix: "/sqm/month", caption: "Average rent" },
      { value: "€655,000", suffix: "", caption: "Approximate NOI" },
      { value: "100", suffix: "%", caption: "Ownership" },
      { value: "100", suffix: "%", caption: "Ownership" },
    ],
  },

  /* --------------------------- INSIGHTS ----------------------------- */
  // Dos columnas con gráficas (cuadros rojos).
  insights: {
    columns: [
      {
        label: "MGR by tenant",
        media: { src: "", alt: "MGR by tenant — gráfica" },
      },
      {
        label: "Comparison of socio-economic indicators",
        media: { src: "", alt: "Comparison of socio-economic indicators — gráfica" },
      },
    ],
  },

  /* ---------------------------- FEATURE ----------------------------- */
  // Imagen ancha destacada (cuadro rojo).
  feature: {
    label: "Lorem ipsum dolor cae",
    media: { src: "", alt: "Imagen destacada del activo" },
  },

  /* ---------------------------- TENANTS ----------------------------- */
  tenants: {
    label: "Berango tenants",
    // Inquilinos identificados en el diseño. Sustituye `logo` por el SVG/PNG real.
    items: [
      { name: "Worten", logo: "" },
      { name: "Sport Zone", logo: "" },
      { name: "The Food Co.", logo: "" },
      { name: "C&A", logo: "" },
      { name: "Kiabi", logo: "" },
      { name: "+ more", logo: "" },
    ],
  },

  /* ----------------------------- FOOTER ----------------------------- */
  footer: {
    contacts: [
      {
        name: "Salvador González",
        role: "National Director Retail.\nCapital Markets. MRICS",
        phone: "+34 607 64 72 89",
        email: "salvador.gonzalez@savills.es",
      },
      {
        name: "Ignacio Zamora",
        role: "Associate Director Retail.\nCapital Markets. MRICS",
        phone: "+34 673 57 52 26",
        email: "ignacio.zamora@savills.es",
      },
    ],
    // El "1%" se resalta en negrita.
    fees: [
      { text: "Fees of " },
      { text: "1%", bold: true },
      { text: " to be paid to Savills by the buyer." },
    ],
    disclaimer:
      "This document contains confidential information and is provided to the targeted party. The document is to be used exclusively by the addressee or his professional advisors. Not the entire document, nor excerpts from it can be published. The same holds for any image or figure realized by Savills. The information this document contains has been acquired in good faith and only constitutes a general guide. At no point the included information is part of a contract. This document does not provide any type of assurance or warranty, nor does it assume responsibility or obligation referring to the success or the probability of future projects, previsions or statements regarding potential and future returns.",
  },
};

export default content;
