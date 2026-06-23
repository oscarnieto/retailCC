/**
 * main.js — punto de entrada.
 * Renderiza desde el modelo de contenido e inicializa el motion sutil.
 */
import content from "./content.js";
import render from "./render.js";
import { initLenis, initScrollAnimations, revealAll } from "./animations.js";

const app = document.getElementById("app");

/* Multipágina: ?page=<slug> carga pages/<slug>.json (publicado en el repo).
   Sin parámetro, usa el contenido por defecto incluido en content.js. */
async function loadPageContent() {
  const slug = new URLSearchParams(location.search).get("page");
  if (!slug) return content;
  try {
    const res = await fetch(`pages/${encodeURIComponent(slug)}.json`, { cache: "no-cache" });
    if (res.ok) return await res.json();
  } catch (e) {
    /* fallback al contenido por defecto */
  }
  return content;
}

async function boot() {
  const data = await loadPageContent();
  render(app, data);

  if (!window.gsap || !window.ScrollTrigger) {
    revealAll();
    return;
  }
  initLenis();
  initScrollAnimations();
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}

window.addEventListener("load", () => {
  if (window.ScrollTrigger) window.ScrollTrigger.refresh();
});

/* API mínima para el FUTURO EDITOR VISUAL: re-render con contenido nuevo. */
window.RetailCC = {
  get content() {
    return content;
  },
  apply(next = content) {
    render(app, next);
    if (window.gsap && window.ScrollTrigger) initScrollAnimations();
    else revealAll();
  },
};
