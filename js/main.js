/**
 * main.js — punto de entrada.
 * Renderiza desde el modelo de contenido e inicializa el motion sutil.
 */
import content from "./content.js";
import render from "./render.js";
import { initLenis, initScrollAnimations, revealAll } from "./animations.js";

const app = document.getElementById("app");

function boot() {
  render(app, content);

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
