// Genera manifest.json: la lista de archivos desplegables del proyecto.
// El editor lo usa para "Descargar proyecto (ZIP)". Reejecutar tras añadir/quitar
// archivos (p. ej. imágenes en assets/):  npm run manifest
import { readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

const root = process.cwd();
const EXCLUDE_DIRS = new Set([".git", "node_modules", "scripts"]);
const EXCLUDE_FILES = new Set([
  "package.json",
  "package-lock.json",
  ".gitignore",
  "manifest.json",
]);

const files = [];
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (!EXCLUDE_DIRS.has(name)) walk(full);
    } else if (!EXCLUDE_FILES.has(name)) {
      files.push(relative(root, full).split(sep).join("/"));
    }
  }
}
walk(root);
files.sort();
files.push("manifest.json"); // se incluye a sí mismo en el paquete

writeFileSync(
  join(root, "manifest.json"),
  JSON.stringify({ generated: new Date().toISOString(), files }, null, 2) + "\n"
);
console.log("manifest.json generado:", files.length, "archivos");
