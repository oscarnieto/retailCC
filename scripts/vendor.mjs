// Copia los archivos mínimos de las librerías npm al proyecto (self-hosted, sin CDN).
import { mkdirSync, copyFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const root = process.cwd();
const nm = join(root, 'node_modules');
mkdirSync(join(root, 'vendor'), { recursive: true });
mkdirSync(join(root, 'fonts'), { recursive: true });

const libs = [
  ['gsap/dist/gsap.min.js', 'vendor/gsap.min.js'],
  ['gsap/dist/ScrollTrigger.min.js', 'vendor/ScrollTrigger.min.js'],
  ['lenis/dist/lenis.min.js', 'vendor/lenis.min.js'],
];
for (const [from, to] of libs) {
  copyFileSync(join(nm, from), join(root, to));
  console.log('lib  ✓', to);
}

// Fuentes (solo woff2 latin)
const fonts = [
  ['@fontsource/montserrat/files/montserrat-latin-400-normal.woff2', 'fonts/montserrat-400.woff2'],
  ['@fontsource/montserrat/files/montserrat-latin-500-normal.woff2', 'fonts/montserrat-500.woff2'],
  ['@fontsource/montserrat/files/montserrat-latin-600-normal.woff2', 'fonts/montserrat-600.woff2'],
  ['@fontsource/montserrat/files/montserrat-latin-700-normal.woff2', 'fonts/montserrat-700.woff2'],
  ['@fontsource/playfair-display/files/playfair-display-latin-400-normal.woff2', 'fonts/playfair-400.woff2'],
  ['@fontsource/playfair-display/files/playfair-display-latin-500-normal.woff2', 'fonts/playfair-500.woff2'],
  ['@fontsource/playfair-display/files/playfair-display-latin-700-normal.woff2', 'fonts/playfair-700.woff2'],
  ['@fontsource/playfair-display/files/playfair-display-latin-400-italic.woff2', 'fonts/playfair-400-italic.woff2'],
];
for (const [from, to] of fonts) {
  copyFileSync(join(nm, from), join(root, to));
  console.log('font ✓', to);
}
console.log('\nVendor completo.');
