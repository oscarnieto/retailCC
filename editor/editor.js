/**
 * RetailCC · Editor visual
 * - Login (PBKDF2, contraseña no en texto plano).
 * - Dashboard multipágina: crear / duplicar / borrar / importar / exportar.
 * - Edición de TODO el contenido + vista previa en vivo (reutiliza el render del sitio).
 * - Persistencia local (localStorage) + exportación a JSON / content.js para publicar.
 *
 * Es 100% estático: funciona en cualquier servidor web. La seguridad "de verdad"
 * se consigue protegiendo la carpeta /editor/ desde el servidor (ver DOCUMENTACION.md).
 */
import { buildHTML } from "../js/render.js";
import defaultContent from "../js/content.js";

/* =========================== utilidades ================================== */
const clone = (o) => JSON.parse(JSON.stringify(o));
const uid = () =>
  "p_" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
const slugify = (s) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita diacríticos
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "pagina";
const fmtDate = (t) => new Date(t).toLocaleString();

function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  if (attrs)
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === "class") el.className = v;
      else if (k === "style" && typeof v === "object") Object.assign(el.style, v);
      else if (k === "dataset") Object.assign(el.dataset, v);
      else if (k.startsWith("on") && typeof v === "function")
        el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === "html") el.innerHTML = v;
      else if (k in el) {
        try { el[k] = v; } catch { el.setAttribute(k, v); }
      } else el.setAttribute(k, v);
    }
  for (const kid of kids.flat()) {
    if (kid == null || kid === false) continue;
    el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return el;
}

function download(filename, text, type = "application/json") {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = h("a", { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

const readFileAsDataURL = (file) =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });

let toastTimer;
function toast(msg) {
  document.querySelector(".toast")?.remove();
  const t = h("div", { class: "toast" }, msg);
  document.body.append(t);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.remove(), 3200);
}

/* =========================== autenticación ============================== */
const AUTH = {
  iters: 150000,
  salt: "4dc150fe9b9ce3204a25d789d9843182",
  hash: "7e56c2f74929e31efd9b963857b396299c5114981e28e5678fd32879fd77b3cc",
};
const hexToBytes = (hex) => Uint8Array.from(hex.match(/.{2}/g).map((b) => parseInt(b, 16)));
const bytesToHex = (buf) =>
  [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

async function verifyCreds(user, pass) {
  try {
    const km = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(`${user}:${pass}`),
      "PBKDF2",
      false,
      ["deriveBits"]
    );
    const bits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt: hexToBytes(AUTH.salt), iterations: AUTH.iters, hash: "SHA-256" },
      km,
      256
    );
    return bytesToHex(bits) === AUTH.hash;
  } catch {
    return false;
  }
}
const SESSION_KEY = "retailcc.session";
const isLoggedIn = () => sessionStorage.getItem(SESSION_KEY) === "1";
function logout() {
  sessionStorage.removeItem(SESSION_KEY);
  location.hash = "";
  route();
}

/* ============================ almacenamiento ============================= */
const STORE_KEY = "retailcc.pages.v1";
const loadStore = () => {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch { return {}; }
};
const saveStore = (s) => localStorage.setItem(STORE_KEY, JSON.stringify(s));
const listPages = () => Object.values(loadStore()).sort((a, b) => b.updatedAt - a.updatedAt);
const getPage = (id) => loadStore()[id];
function upsertPage(p) {
  const s = loadStore();
  p.updatedAt = Date.now();
  s[p.id] = p;
  saveStore(s);
  return p;
}
function deletePage(id) {
  const s = loadStore();
  delete s[id];
  saveStore(s);
}
function newPage(name, content) {
  return upsertPage({
    id: uid(),
    name: name || "Nueva página",
    slug: slugify(name),
    content: content || clone(defaultContent),
  });
}
function ensureSeed() {
  if (Object.keys(loadStore()).length === 0)
    newPage(defaultContent.hero?.title || "Página principal", clone(defaultContent));
}

/* ===================== texto enriquecido <-> markdown =================== */
const segmentsToMd = (arr = []) =>
  arr.map((s) => (s.bold ? `**${s.text}**` : s.text)).join("");
function mdToSegments(str = "") {
  const out = [];
  const re = /\*\*([\s\S]+?)\*\*/g;
  let last = 0, m;
  while ((m = re.exec(str))) {
    if (m.index > last) out.push({ text: str.slice(last, m.index) });
    out.push({ text: m[1], bold: true });
    last = re.lastIndex;
  }
  if (last < str.length) out.push({ text: str.slice(last) });
  return out.length ? out : [{ text: "" }];
}

/* ============================ estado del editor ========================= */
let current = null; // página en edición
let previewDoc = null;
let saveStateEl = null;
let updTimer = null;

function scheduleUpdate() {
  if (saveStateEl) saveStateEl.textContent = "editando…";
  clearTimeout(updTimer);
  updTimer = setTimeout(() => {
    upsertPage(current);
    refreshPreview();
    if (saveStateEl) saveStateEl.textContent = "guardado ✓";
  }, 300);
}

/* =============================== campos ================================= */
function textInput(label, value, oninput, opts = {}) {
  const input = opts.multiline
    ? h("textarea", {
        rows: opts.rows || 3,
        value: value ?? "",
        placeholder: opts.placeholder || "",
        oninput: (e) => oninput(e.target.value),
      })
    : h("input", {
        type: "text",
        value: value ?? "",
        placeholder: opts.placeholder || "",
        oninput: (e) => oninput(e.target.value),
      });
  return h(
    "label",
    { class: "fld" },
    h("span", { class: "fld__label" }, label),
    input,
    opts.hint ? h("span", { class: "fld__hint" }, opts.hint) : null
  );
}

function imageField(label, obj, key, opts = {}) {
  const thumb = h("div", { class: "imgfld__thumb" });
  const txt = h("input", {
    type: "text",
    value: obj[key] || "",
    placeholder: "assets/… o https://…",
    oninput: (e) => { obj[key] = e.target.value; paint(); scheduleUpdate(); },
  });
  const file = h("input", {
    type: "file",
    accept: "image/*",
    style: { display: "none" },
    onchange: async (e) => {
      const f = e.target.files[0];
      if (!f) return;
      const data = await readFileAsDataURL(f);
      obj[key] = data;
      txt.value = data;
      paint();
      scheduleUpdate();
      if (f.size > 600000)
        toast("Imagen de " + Math.round(f.size / 1024) + " KB embebida; conviene optimizarla.");
    },
  });
  const paint = () => {
    thumb.innerHTML = "";
    if (obj[key]) thumb.append(h("img", { src: obj[key], alt: "" }));
    else thumb.append(h("span", { class: "imgfld__empty" }, opts.emptyLabel || "sin imagen"));
  };
  paint();
  return h(
    "div",
    { class: "fld" },
    h("span", { class: "fld__label" }, label),
    h(
      "div",
      { class: "imgfld__row" },
      thumb,
      h(
        "div",
        { class: "imgfld__ctrl" },
        txt,
        h(
          "div",
          { class: "imgfld__btns" },
          h("button", { class: "btn btn--ghost", type: "button", onclick: () => file.click() }, "Insertar archivo"),
          h("button", { class: "btn btn--ghost", type: "button", onclick: () => { obj[key] = ""; txt.value = ""; paint(); scheduleUpdate(); } }, "Quitar"),
          file
        )
      )
    ),
    opts.hint ? h("span", { class: "fld__hint" }, opts.hint) : null
  );
}

function rowTools(i, items, rerender) {
  const mv = (d) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    [items[i], items[j]] = [items[j], items[i]];
    rerender();
    scheduleUpdate();
  };
  return h(
    "div",
    { class: "row__tools" },
    h("button", { class: "ic", type: "button", title: "Subir", onclick: () => mv(-1) }, "↑"),
    h("button", { class: "ic", type: "button", title: "Bajar", onclick: () => mv(1) }, "↓"),
    h("button", { class: "ic ic--del", type: "button", title: "Eliminar", onclick: () => { items.splice(i, 1); rerender(); scheduleUpdate(); } }, "✕")
  );
}

function listEditor(items, addLabel, makeRow, onAdd) {
  const box = h("div", { class: "list" });
  const rerender = () => {
    box.innerHTML = "";
    items.forEach((it, i) => box.append(makeRow(it, i, items, rerender)));
    box.append(
      h("button", { class: "btn btn--add", type: "button", onclick: () => { onAdd(); rerender(); scheduleUpdate(); } }, "+ " + addLabel)
    );
  };
  rerender();
  return box;
}

const sec = (title, ...content) =>
  h("details", { class: "sec", open: true }, h("summary", {}, title), h("div", { class: "sec__body" }, ...content));

/* ============================ formulario ================================ */
function sectionsFor(c) {
  /* --- General --- */
  c.meta = c.meta || {};
  const general = sec(
    "General (SEO y marca)",
    textInput("Título de la página (pestaña / SEO)", c.meta.title, (v) => { c.meta.title = v; scheduleUpdate(); }),
    textInput("Descripción (SEO)", c.meta.description, (v) => { c.meta.description = v; scheduleUpdate(); }, { multiline: true, rows: 2 }),
    textInput("Idioma", c.meta.lang, (v) => { c.meta.lang = v; scheduleUpdate(); }, { placeholder: "en / es" }),
    textInput("Nombre de marca", c.brand.name, (v) => { c.brand.name = v; scheduleUpdate(); }),
    textInput("Enlace de marca", c.brand.href, (v) => { c.brand.href = v; scheduleUpdate(); }),
    imageField("Logo (versión amarilla)", c.brand.assets, "yellow"),
    imageField("Logo (versión negra)", c.brand.assets, "black"),
    textInput("Botón cabecera · texto", c.nav.cta.label, (v) => { c.nav.cta.label = v; scheduleUpdate(); }),
    textInput("Botón cabecera · enlace", c.nav.cta.href, (v) => { c.nav.cta.href = v; scheduleUpdate(); })
  );

  /* --- Hero --- */
  const hero = sec(
    "Hero (portada)",
    textInput("Antetítulo", c.hero.eyebrow, (v) => { c.hero.eyebrow = v; scheduleUpdate(); }),
    textInput("Título", c.hero.title, (v) => { c.hero.title = v; scheduleUpdate(); }),
    textInput("Localización", c.hero.place, (v) => { c.hero.place = v; scheduleUpdate(); }),
    textInput("Subtítulo", c.hero.subtitle, (v) => { c.hero.subtitle = v; scheduleUpdate(); }, { multiline: true, rows: 2 }),
    imageField("Foto de fondo", c.hero.media, "src", { hint: "Apaisada, ~2000px. Inserta archivo (se embebe) o pon una ruta del repo." }),
    textInput("Texto alternativo de la foto", c.hero.media.alt, (v) => { c.hero.media.alt = v; scheduleUpdate(); })
  );

  /* --- Location --- */
  c.location.map = c.location.map || {};
  const location = sec(
    "Location (texto + mapa)",
    textInput("Etiqueta", c.location.label, (v) => { c.location.label = v; scheduleUpdate(); }),
    textInput("Texto", segmentsToMd(c.location.richText), (v) => { c.location.richText = mdToSegments(v); scheduleUpdate(); }, { multiline: true, rows: 6, hint: "Usa **negrita** para resaltar." }),
    textInput("Dirección del mapa (Google)", c.location.map.address, (v) => { c.location.map.address = v; scheduleUpdate(); }, { placeholder: "Paseo de la Castellana 81, Madrid", hint: "Si la rellenas, se muestra un mapa de Google embebido." }),
    imageField("Imagen del mapa (opcional, si no usas Google)", c.location.map, "src"),
    textInput("Texto alternativo del mapa", c.location.map.alt, (v) => { c.location.map.alt = v; scheduleUpdate(); })
  );

  /* --- Highlights / Asset overview --- */
  const stats = listEditor(
    c.assetOverview.stats,
    "Añadir dato",
    (stat, i, items, rer) =>
      h(
        "div",
        { class: "row" },
        rowTools(i, items, rer),
        h(
          "div",
          { class: "row__grid" },
          textInput("Valor", stat.value, (v) => { stat.value = v; scheduleUpdate(); }, { placeholder: "5,000 · 100% · €11.78" }),
          textInput("Unidad pequeña (opcional)", stat.unit || "", (v) => { stat.unit = v; scheduleUpdate(); }, { placeholder: "sqm · /sqm/month" }),
          textInput("Descripción", stat.caption, (v) => { stat.caption = v; scheduleUpdate(); })
        )
      ),
    () => c.assetOverview.stats.push({ value: "0", caption: "Nuevo dato" })
  );
  const highlights = sec(
    "Highlights (datos del activo)",
    textInput("Etiqueta", c.assetOverview.label, (v) => { c.assetOverview.label = v; scheduleUpdate(); }),
    stats
  );

  /* --- Insights (2 iframes/gráficas) --- */
  const insights = sec(
    "Insights (gráficas / iframes)",
    listEditor(
      c.insights.columns,
      "Añadir columna",
      (col, i, items, rer) => {
        col.media = col.media || { src: "", alt: "" };
        return h(
          "div",
          { class: "row" },
          rowTools(i, items, rer),
          h(
            "div",
            { class: "row__grid" },
            textInput("Etiqueta", col.label, (v) => { col.label = v; scheduleUpdate(); }),
            textInput("URL del iframe (gráfica embebida)", col.embed || "", (v) => { col.embed = v; scheduleUpdate(); }, { placeholder: "https://… (Looker / Power BI / Sheets)" }),
            imageField("…o una imagen", col.media, "src", { hint: "Si no pones iframe ni imagen, se muestra un recuadro rojo (placeholder)." })
          )
        );
      },
      () => c.insights.columns.push({ label: "Nueva columna", embed: "", media: { src: "", alt: "" } })
    )
  );

  /* --- Feature (imagen ancha) --- */
  const feature = sec(
    "Feature (imagen ancha)",
    textInput("Etiqueta", c.feature.label, (v) => { c.feature.label = v; scheduleUpdate(); }),
    imageField("Imagen", c.feature.media, "src"),
    textInput("Texto alternativo", c.feature.media.alt, (v) => { c.feature.media.alt = v; scheduleUpdate(); })
  );

  /* --- Tenants (carrusel) --- */
  const tenants = sec(
    "Tenants (carrusel de logos)",
    textInput("Etiqueta", c.tenants.label, (v) => { c.tenants.label = v; scheduleUpdate(); }),
    listEditor(
      c.tenants.items,
      "Añadir inquilino",
      (t, i, items, rer) =>
        h(
          "div",
          { class: "row" },
          rowTools(i, items, rer),
          h(
            "div",
            { class: "row__grid" },
            textInput("Nombre", t.name, (v) => { t.name = v; scheduleUpdate(); }),
            imageField("Logo", t, "logo", { hint: "PNG con fondo transparente. Si falta, se muestra el nombre." })
          )
        ),
      () => c.tenants.items.push({ name: "Nuevo inquilino", logo: "" })
    )
  );

  /* --- Footer --- */
  const footer = sec(
    "Footer (contactos + fees)",
    listEditor(
      c.footer.contacts,
      "Añadir contacto",
      (p, i, items, rer) =>
        h(
          "div",
          { class: "row" },
          rowTools(i, items, rer),
          h(
            "div",
            { class: "row__grid" },
            textInput("Nombre", p.name, (v) => { p.name = v; scheduleUpdate(); }),
            textInput("Cargo", p.role, (v) => { p.role = v; scheduleUpdate(); }, { multiline: true, rows: 2, hint: "Salto de línea = nueva línea." }),
            textInput("Teléfono", p.phone, (v) => { p.phone = v; scheduleUpdate(); }),
            textInput("Email", p.email, (v) => { p.email = v; scheduleUpdate(); })
          )
        ),
      () => c.footer.contacts.push({ name: "Nombre", role: "Cargo", phone: "", email: "" })
    ),
    textInput("Fees", segmentsToMd(c.footer.fees), (v) => { c.footer.fees = mdToSegments(v); scheduleUpdate(); }, { multiline: true, rows: 2, hint: "Usa **negrita** (p. ej. **1%**)." }),
    textInput("Aviso legal (disclaimer)", c.footer.disclaimer, (v) => { c.footer.disclaimer = v; scheduleUpdate(); }, { multiline: true, rows: 4 })
  );

  return [general, hero, location, highlights, insights, feature, tenants, footer];
}

/* ============================== preview ================================= */
function initPreview(iframe) {
  iframe.addEventListener("load", () => {
    previewDoc = iframe.contentDocument;
    refreshPreview();
  });
  iframe.srcdoc =
    '<!doctype html><html><head><meta charset="utf-8">' +
    '<base href="../"><link rel="stylesheet" href="css/styles.css">' +
    "<style>body{overflow-x:hidden}[data-reveal]{opacity:1!important;transform:none!important}" +
    ".tenants__track{animation:none!important}.site-header{position:absolute}</style>" +
    '</head><body><div id="app"></div></body></html>';
}
function refreshPreview() {
  if (!previewDoc) return;
  const app = previewDoc.getElementById("app");
  if (app) app.innerHTML = buildHTML(current.content);
}

/* =============================== vistas ================================= */
const root = () => document.getElementById("editor-root");

function renderLogin() {
  const user = h("input", { type: "text", placeholder: "Usuario", autocomplete: "username" });
  const pass = h("input", { type: "password", placeholder: "Contraseña", autocomplete: "current-password" });
  const err = h("p", { class: "login__err" });
  const form = h(
    "form",
    {
      class: "login__form",
      onsubmit: async (e) => {
        e.preventDefault();
        err.textContent = "";
        if (await verifyCreds(user.value.trim(), pass.value)) {
          sessionStorage.setItem(SESSION_KEY, "1");
          location.hash = "/";
          route();
        } else err.textContent = "Usuario o contraseña incorrectos.";
      },
    },
    h("h1", {}, "RetailCC"),
    h("p", { class: "login__sub" }, "Editor de páginas"),
    user,
    pass,
    err,
    h("button", { class: "btn btn--primary", type: "submit" }, "Entrar"),
    h(
      "p",
      { class: "login__note" },
      "Acceso restringido. En producción, protege además la carpeta /editor/ desde el servidor (Basic Auth / SSO)."
    )
  );
  root().replaceChildren(h("div", { class: "login" }, form));
}

function pageCard(p) {
  return h(
    "div",
    { class: "card" },
    h("div", { class: "card__name" }, p.name),
    h("div", { class: "card__slug" }, "?page=" + p.slug),
    h("div", { class: "card__meta" }, "Editada: " + fmtDate(p.updatedAt)),
    h(
      "div",
      { class: "card__row" },
      h("button", { class: "btn btn--primary", onclick: () => { location.hash = "/edit/" + p.id; } }, "Editar"),
      h("button", { class: "btn", onclick: () => { const c = newPage(p.name + " (copia)", clone(p.content)); location.hash = "/edit/" + c.id; } }, "Duplicar"),
      h("button", { class: "btn", onclick: () => download(p.slug + ".json", JSON.stringify(p.content, null, 2)) }, "Exportar"),
      h("a", { class: "btn btn--ghost", href: "../index.html?page=" + encodeURIComponent(p.slug), target: "_blank", title: "Funciona una vez publicado el JSON en el servidor" }, "Ver"),
      h("button", { class: "btn btn--danger", onclick: () => { if (confirm("¿Borrar la página “" + p.name + "”? Esto no se puede deshacer.")) { deletePage(p.id); renderDashboard(); } } }, "Borrar")
    )
  );
}

function importPage() {
  const inp = h("input", { type: "file", accept: "application/json,.json", style: { display: "none" } });
  inp.onchange = async () => {
    const f = inp.files[0];
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      const name = data.meta?.title || data.hero?.title || f.name.replace(/\.json$/i, "");
      const p = newPage(name, data);
      location.hash = "/edit/" + p.id;
    } catch {
      toast("El archivo no es un JSON válido.");
    }
  };
  document.body.append(inp);
  inp.click();
  inp.remove();
}

function renderDashboard() {
  ensureSeed();
  const top = h(
    "header",
    { class: "dash-top" },
    h("div", { class: "brand" }, "RetailCC · Editor"),
    h(
      "div",
      {},
      h("button", { class: "btn btn--ghost", onclick: importPage }, "Importar JSON"),
      h("button", { class: "btn btn--primary", onclick: () => { const name = prompt("Nombre de la nueva página:", "Nueva página"); if (name != null) { const p = newPage(name.trim() || "Nueva página"); location.hash = "/edit/" + p.id; } } }, "+ Nueva página"),
      h("button", { class: "btn btn--ghost", onclick: logout }, "Salir")
    )
  );
  const grid = h("div", { class: "dash-grid" }, ...listPages().map(pageCard));
  const help = h("div", { class: "dash-help", html:
    "<strong>Cómo publicar:</strong> los cambios se guardan en este navegador. Para publicarlos en el servidor, " +
    'pulsa <em>Exportar</em> en una página y sube el archivo <code>&lt;slug&gt;.json</code> a la carpeta <code>pages/</code> del proyecto. ' +
    "La web mostrará esa página en <code>?page=&lt;slug&gt;</code>. Para la portada principal, usa <em>Exportar content.js</em> dentro del editor y reemplaza <code>js/content.js</code>. " +
    "Consulta <code>DOCUMENTACION.md</code> para el despliegue completo." });
  root().replaceChildren(top, h("main", { class: "dash" }, h("h1", {}, "Páginas"), grid, help));
}

function deviceButtons(stage) {
  const d = h("button", { class: "chip chip--on", type: "button" }, "Escritorio");
  const m = h("button", { class: "chip", type: "button" }, "Móvil");
  d.onclick = () => { stage.style.maxWidth = ""; d.classList.add("chip--on"); m.classList.remove("chip--on"); };
  m.onclick = () => { stage.style.maxWidth = "390px"; m.classList.add("chip--on"); d.classList.remove("chip--on"); };
  return h("div", { class: "chips" }, d, m);
}

function renderEditor(page) {
  current = page;
  previewDoc = null;

  saveStateEl = h("span", { class: "savestate" }, "guardado ✓");
  const slugLabel = h("span", { class: "slug" }, "?page=" + current.slug);
  const nameInput = h("input", {
    class: "pagename",
    value: current.name,
    oninput: (e) => {
      current.name = e.target.value;
      current.slug = slugify(e.target.value);
      slugLabel.textContent = "?page=" + current.slug;
      scheduleUpdate();
    },
  });

  const exportJSON = () =>
    download(current.slug + ".json", JSON.stringify(current.content, null, 2));
  const exportContentJS = () =>
    download("content.js", "export default " + JSON.stringify(current.content, null, 2) + ";\n", "text/javascript");

  const top = h(
    "header",
    { class: "ed-top" },
    h("button", { class: "btn btn--ghost", onclick: () => { location.hash = "/"; } }, "← Páginas"),
    h("div", { class: "ed-top__name" }, nameInput, slugLabel),
    saveStateEl,
    h(
      "div",
      { class: "ed-top__actions" },
      h("button", { class: "btn btn--primary", onclick: exportJSON }, "Exportar JSON"),
      h("button", { class: "btn", onclick: exportContentJS, title: "Para la portada principal: reemplaza js/content.js" }, "Exportar content.js"),
      h("button", { class: "btn btn--ghost", onclick: logout }, "Salir")
    )
  );

  const form = h("div", { class: "form" }, ...sectionsFor(current.content));

  const iframe = h("iframe", { class: "preview__frame", title: "Vista previa" });
  const stage = h("div", { class: "preview__stage" }, iframe);
  const preview = h(
    "div",
    { class: "preview" },
    h("div", { class: "preview__bar" }, deviceButtons(stage), h("span", { class: "preview__hint" }, "Vista previa en vivo")),
    stage
  );

  root().replaceChildren(top, h("div", { class: "ed-main" }, form, preview));
  initPreview(iframe);
}

/* =============================== router ================================= */
function route() {
  if (!isLoggedIn()) return renderLogin();
  const hash = location.hash.replace(/^#/, "");
  const m = hash.match(/^\/edit\/(.+)$/);
  if (m) {
    const p = getPage(m[1]);
    if (!p) { location.hash = "/"; return renderDashboard(); }
    return renderEditor(p);
  }
  return renderDashboard();
}

window.addEventListener("hashchange", route);
route();
