/**
 * animations.js — GSAP + Lenis + interacciones.
 * Usa globals UMD: window.gsap, window.ScrollTrigger, window.Lenis.
 */

const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
const Lenis = window.Lenis;

const reduced =
  window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isTouch = window.matchMedia && window.matchMedia("(hover: none)").matches;

/* ---------------------------------------------------------------- utils */
function splitWords(el) {
  const nodes = Array.from(el.childNodes);
  el.innerHTML = "";
  const inners = [];
  const makeWord = (text, bold) => {
    const outer = document.createElement("span");
    outer.className = "w";
    const inner = document.createElement("span");
    inner.className = "w-in";
    if (bold) inner.style.fontWeight = "600";
    inner.textContent = text;
    outer.appendChild(inner);
    el.appendChild(outer);
    el.appendChild(document.createTextNode(" "));
    inners.push(inner);
  };
  nodes.forEach((node) => {
    if (node.nodeType === 3) {
      (node.textContent.match(/\S+/g) || []).forEach((w) => makeWord(w, false));
    } else if (node.nodeType === 1) {
      const bold = node.tagName === "B" || node.tagName === "STRONG";
      (node.textContent.match(/\S+/g) || []).forEach((w) => makeWord(w, bold));
    }
  });
  return inners;
}

/* -------------------------------------------------------------- lenis */
export function initLenis() {
  if (reduced || !Lenis) return null;
  const lenis = new Lenis({
    lerp: 0.1,
    wheelMultiplier: 1,
    smoothWheel: true,
  });
  lenis.on("scroll", () => ScrollTrigger && ScrollTrigger.update());
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // anclas suaves
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute("href");
    if (id.length < 2) return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    lenis.scrollTo(target, { offset: 0, duration: 1.1 });
  });
  return lenis;
}

/* ------------------------------------------------------------- loader */
export function initLoader() {
  const loader = document.getElementById("loader");
  if (!loader) return Promise.resolve();
  const countEl = document.getElementById("loader-count");
  const bar = document.getElementById("loader-bar");

  if (reduced) {
    loader.style.display = "none";
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const obj = { v: 0 };
    const tl = gsap.timeline({
      onComplete: () => {
        gsap.to(loader, {
          yPercent: -100,
          duration: 0.9,
          ease: "power4.inOut",
          onComplete: () => {
            loader.classList.add("is-done");
            loader.style.display = "none";
            resolve();
          },
        });
      },
    });
    tl.to(bar, { scaleX: 1, duration: 1.35, ease: "power2.inOut" }, 0);
    tl.to(
      obj,
      {
        v: 100,
        duration: 1.35,
        ease: "power2.inOut",
        onUpdate: () => {
          if (countEl) countEl.textContent = Math.round(obj.v);
        },
      },
      0
    );
    tl.to({}, { duration: 0.15 });
  });
}

/* --------------------------------------------------------- hero intro */
export function heroIntro() {
  const hero = document.querySelector(".hero");
  if (!hero) return;
  const header = document.querySelector(".site-header");

  const lineTargets = hero.querySelectorAll('[data-reveal="line"], [data-reveal="lines"]');
  const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

  if (reduced) return;

  lineTargets.forEach((el) => {
    const inners = splitWords(el);
    tl.to(inners, { yPercent: 0, duration: 1.0, stagger: 0.04 }, "-=0.78");
  });
  if (header) tl.from(header, { yPercent: -40, opacity: 0, duration: 0.8 }, 0.1);
  const scroll = hero.querySelector(".hero__scroll");
  if (scroll) tl.from(scroll, { opacity: 0, duration: 0.8 }, "-=0.4");
}

/* ----------------------------------------------------------- reveals */
export function initReveals() {
  if (reduced) return;

  // splits para "lines" fuera del hero (location)
  document.querySelectorAll('[data-reveal="lines"]').forEach((el) => {
    if (el.closest(".hero")) return;
    const inners = splitWords(el);
    gsap.to(inners, {
      yPercent: 0,
      duration: 0.9,
      ease: "power4.out",
      stagger: 0.018,
      scrollTrigger: { trigger: el, start: "top 82%" },
    });
  });

  // fade
  gsap.utils.toArray('[data-reveal="fade"]').forEach((el) => {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 85%" },
    });
  });

  // stats (stagger por fila)
  const stats = gsap.utils.toArray('[data-reveal="stat"]');
  if (stats.length) {
    gsap.to(stats, {
      opacity: 1,
      y: 0,
      duration: 0.9,
      ease: "power3.out",
      stagger: { each: 0.08, grid: "auto", from: "start" },
      scrollTrigger: { trigger: stats[0].closest(".stats"), start: "top 80%" },
    });
  }
}

/* ---------------------------------------------------------- counters */
export function initCounters() {
  gsap.utils.toArray("[data-count]").forEach((el) => {
    const raw = el.getAttribute("data-count");
    const m = raw.match(/^([^\d-]*)([\d.,]+)(.*)$/);
    if (!m) return;
    const prefix = m[1] || "";
    const numPart = m[2];
    const hasComma = numPart.includes(",");
    const decimals = numPart.includes(".") ? numPart.split(".")[1].length : 0;
    const target = parseFloat(numPart.replace(/,/g, ""));
    const valueNode = el.firstChild; // text node con el valor

    const format = (v) => {
      let s = v.toFixed(decimals);
      if (hasComma) {
        const [int, dec] = s.split(".");
        s = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (dec ? "." + dec : "");
      }
      return prefix + s;
    };

    if (reduced) {
      valueNode.nodeValue = format(target);
      return;
    }
    valueNode.nodeValue = format(0);
    const o = { v: 0 };
    gsap.to(o, {
      v: target,
      duration: 1.7,
      ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top 88%" },
      onUpdate: () => {
        valueNode.nodeValue = format(o.v);
      },
    });
  });
}

/* --------------------------------------------------------- parallax */
export function initParallax() {
  if (reduced) return;
  // imagen interior de cada media slot
  gsap.utils.toArray("[data-parallax] .media__img").forEach((img) => {
    gsap.fromTo(
      img,
      { yPercent: -7 },
      {
        yPercent: 7,
        ease: "none",
        scrollTrigger: {
          trigger: img.closest("[data-parallax]"),
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      }
    );
  });
  // hero: parallax sutil del texto al hacer scroll
  const heroInner = document.querySelector(".hero__inner");
  if (heroInner) {
    gsap.to(heroInner, {
      yPercent: -12,
      opacity: 0.65,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });
  }
}

/* ---------------------------------------------------------- marquee */
export function initMarquee() {
  const track = document.querySelector("[data-marquee]");
  if (!track || reduced) return;
  const loop = gsap.to(track, {
    xPercent: -50,
    ease: "none",
    duration: 26,
    repeat: -1,
  });
  track.addEventListener("mouseenter", () => gsap.to(loop, { timeScale: 0, duration: 0.4 }));
  track.addEventListener("mouseleave", () => gsap.to(loop, { timeScale: 1, duration: 0.4 }));
}

/* ----------------------------------------------------------- header */
export function initHeader() {
  const header = document.querySelector(".site-header");
  if (!header) return;
  const heroH = () => (document.querySelector(".hero")?.offsetHeight || window.innerHeight) * 0.9;
  ScrollTrigger.create({
    start: 0,
    end: "max",
    onUpdate: (self) => {
      const y = self.scroll();
      if (y > heroH()) {
        header.classList.add("is-pinned");
        if (self.direction === -1) header.classList.add("is-visible");
        else header.classList.remove("is-visible");
      } else {
        header.classList.remove("is-pinned", "is-visible");
      }
    },
  });
}

/* ----------------------------------------------------------- cursor */
export function initCursor() {
  const dotWrap = document.querySelector(".cursor");
  const ring = document.querySelector(".cursor__ring");
  if (!dotWrap || !ring) return;

  // detectar input táctil
  window.addEventListener(
    "touchstart",
    () => document.body.classList.add("using-touch"),
    { once: true, passive: true }
  );
  if (isTouch) {
    document.body.classList.add("using-touch");
    return;
  }

  const xTo = gsap.quickTo(dotWrap, "x", { duration: 0.12, ease: "power3" });
  const yTo = gsap.quickTo(dotWrap, "y", { duration: 0.12, ease: "power3" });
  const rx = gsap.quickTo(ring, "x", { duration: 0.4, ease: "power3" });
  const ry = gsap.quickTo(ring, "y", { duration: 0.4, ease: "power3" });

  window.addEventListener("pointermove", (e) => {
    xTo(e.clientX);
    yTo(e.clientY);
    rx(e.clientX);
    ry(e.clientY);
  });

  const hoverables = "a, button, [data-magnetic], .stat, .tenant, .media";
  document.addEventListener("pointerover", (e) => {
    if (e.target.closest(hoverables)) ring.classList.add("is-hover");
  });
  document.addEventListener("pointerout", (e) => {
    if (e.target.closest(hoverables)) ring.classList.remove("is-hover");
  });
}

/* --------------------------------------------------------- magnetic */
export function initMagnetic() {
  if (isTouch || reduced) return;
  gsap.utils.toArray("[data-magnetic]").forEach((el) => {
    const strength = 0.35;
    const xTo = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3" });
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * strength);
      yTo((e.clientY - (r.top + r.height / 2)) * strength);
    });
    el.addEventListener("pointerleave", () => {
      xTo(0);
      yTo(0);
    });
  });
}

/* ------------------------------------------------------------ footer line */
export function initFooterLine() {
  const line = document.querySelector("[data-line]");
  if (!line) return;
  if (reduced) {
    line.style.transform = "scaleX(1)";
    return;
  }
  gsap.to(line, {
    scaleX: 1,
    duration: 1.2,
    ease: "power3.inOut",
    scrollTrigger: { trigger: line, start: "top 92%" },
  });
}

/** Failsafe: si algo falla, muestra todo. */
export function revealAll() {
  document.querySelectorAll("[data-reveal]").forEach((el) => {
    el.style.opacity = "1";
    el.style.transform = "none";
  });
  document.querySelectorAll(".w-in").forEach((el) => (el.style.transform = "none"));
  const loader = document.getElementById("loader");
  if (loader) loader.style.display = "none";
}

export function initScrollAnimations() {
  if (!gsap || !ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  initReveals();
  initCounters();
  initParallax();
  initMarquee();
  initHeader();
  initFooterLine();
  initCursor();
  initMagnetic();
  ScrollTrigger.refresh();
}
