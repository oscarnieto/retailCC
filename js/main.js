/**
 * main.js — punto de entrada.
 * Renderiza desde el modelo de contenido, inicializa el fondo WebGL del hero
 * y todas las animaciones (GSAP + Lenis).
 */
import content from "./content.js";
import render, { logoMarkup } from "./render.js";
import initHeroWebGL from "./three-hero.js";
import {
  initLenis,
  initLoader,
  heroIntro,
  initScrollAnimations,
  revealAll,
} from "./animations.js";

const app = document.getElementById("app");

/* 1 · Render del DOM desde el contenido */
render(app, content);

/* 2 · Logo del loader */
const loaderLogo = document.getElementById("loader-logo");
if (loaderLogo) loaderLogo.innerHTML = logoMarkup("yellow", content.brand.name);

/* 3 · Fondo WebGL del hero (Three.js) */
let hero3d = null;
function bootWebGL() {
  const canvas = document.getElementById("hero-canvas");
  if (canvas && !hero3d) hero3d = initHeroWebGL(canvas, { intensity: 1.0 });
}

/* 4 · Animaciones */
function boot() {
  bootWebGL();

  // Sin GSAP (p.ej. fallo de red de los vendor scripts): mostrar todo.
  if (!window.gsap || !window.ScrollTrigger) {
    revealAll();
    return;
  }

  initLenis();
  initScrollAnimations();

  initLoader().then(() => {
    heroIntro();
    // recalcular posiciones tras el reflow del loader
    requestAnimationFrame(() => window.ScrollTrigger && window.ScrollTrigger.refresh());
  });
}

if (document.readyState === "complete" || document.readyState === "interactive") {
  // los vendor scripts son `defer`, así que ya se ejecutaron antes que este módulo
  boot();
} else {
  window.addEventListener("DOMContentLoaded", boot);
}

window.addEventListener("load", () => {
  if (window.ScrollTrigger) window.ScrollTrigger.refresh();
  if (hero3d) hero3d.resize();
});

/* Failsafe: si tras 6s sigue el loader, forzar visibilidad. */
setTimeout(() => {
  const loader = document.getElementById("loader");
  if (loader && loader.style.display !== "none" && !loader.classList.contains("is-done")) {
    revealAll();
  }
}, 6000);

/* ------------------------------------------------------------------ */
/* API mínima para el FUTURO EDITOR VISUAL.
   Permite re-renderizar la web con un nuevo modelo de contenido.      */
window.RetailCC = {
  get content() {
    return content;
  },
  /** Re-renderiza con un modelo nuevo (o el actual mutado). */
  apply(next = content) {
    render(app, next);
    hero3d && hero3d.destroy && hero3d.destroy();
    hero3d = null;
    boot();
  },
};
