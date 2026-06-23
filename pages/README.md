# Páginas publicadas

Cada archivo `*.json` de esta carpeta es una página creada con el **editor visual**
(`/editor/`). El JSON contiene todo el contenido de esa página.

- Se ven en la web con: `index.html?page=<nombre-del-archivo-sin-.json>`
  (p. ej. `pages/berango.json` → `…/index.html?page=berango`).
- La **portada principal** (sin `?page=`) usa `js/content.js`. Para cambiarla,
  usa **Exportar content.js** en el editor y reemplaza `js/content.js`.

Flujo: editas en `/editor/` → **Exportar** → subes el `.json` aquí (o reemplazas
`js/content.js`) → la web se actualiza.
