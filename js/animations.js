/**
 * animations.js — motion sutil que NO altera el aspecto final del Figma:
 * scroll suave (Lenis), reveals fade-up al entrar en viewport y contadores.
 * Globals UMD: window.gsap, window.ScrollTrigger, window.Lenis.
 */

const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
const Lenis = window.Lenis;

const reduced =
  window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ------------------------------ smooth scroll ---------------------------- */
export function initLenis() {
  if (reduced || !Lenis) return null;
  const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  lenis.on("scroll", () => ScrollTrigger && ScrollTrigger.update());
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute("href");
    if (id.length < 2) return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    lenis.scrollTo(target, { duration: 1.1 });
  });
  return lenis;
}

/* -------------------------------- reveals -------------------------------- */
function initReveals() {
  if (reduced) return;
  gsap.utils.toArray("[data-reveal]").forEach((el) => {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 0.9,
      ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 88%" },
    });
  });
}

/* ------------------------------- counters -------------------------------- */
function initCounters() {
  gsap.utils.toArray("[data-count]").forEach((el) => {
    const raw = el.getAttribute("data-count");
    const m = raw.match(/^([^\d-]*)([\d.,]+)(.*)$/);
    if (!m) return;
    const prefix = m[1] || "";
    const numPart = m[2];
    const suffix = m[3] || ""; // p.ej. "sqm", "%" (mismo tamaño que el número)
    const hasComma = numPart.includes(",");
    const decimals = numPart.includes(".") ? numPart.split(".")[1].length : 0;
    const target = parseFloat(numPart.replace(/,/g, ""));
    const valueNode = el.firstChild;

    const format = (v) => {
      let s = v.toFixed(decimals);
      if (hasComma) {
        const [int, dec] = s.split(".");
        s = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (dec ? "." + dec : "");
      }
      return prefix + s + suffix;
    };

    if (reduced) {
      valueNode.nodeValue = format(target);
      return;
    }
    valueNode.nodeValue = format(0);
    const o = { v: 0 };
    gsap.to(o, {
      v: target,
      duration: 1.6,
      ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top 90%" },
      onUpdate: () => {
        valueNode.nodeValue = format(o.v);
      },
    });
  });
}

/* Failsafe: si algo falla, mostrar todo. */
export function revealAll() {
  document.querySelectorAll("[data-reveal]").forEach((el) => {
    el.style.opacity = "1";
    el.style.transform = "none";
  });
}

export function initScrollAnimations() {
  if (!gsap || !ScrollTrigger) {
    revealAll();
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  initReveals();
  initCounters();
  ScrollTrigger.refresh();
}
