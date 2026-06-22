/**
 * three-hero.js — Fondo WebGL del hero (Three.js).
 *
 * Shader de degradado oscuro con flujo dorado (marca Savills), viñeta,
 * grano y parallax sutil con el ratón. Diseñado para verse premium incluso
 * sin fotografía. Se pausa cuando el hero no está visible o la pestaña
 * está oculta, y respeta `prefers-reduced-motion`.
 */
import * as THREE from "three";

const FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float u_time;
uniform vec2  u_res;
uniform vec2  u_mouse;
uniform float u_intensity;

// --- Simplex noise 2D (Ashima Arts) ---
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec2 mod289(vec2 x){return x-floor(x*(1.0/289.0))*289.0;}
vec3 permute(vec3 x){return mod289(((x*34.0)+1.0)*x);}
float snoise(vec2 v){
  const vec4 C=vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);
  vec2 i=floor(v+dot(v,C.yy));
  vec2 x0=v-i+dot(i,C.xx);
  vec2 i1=(x0.x>x0.y)?vec2(1.0,0.0):vec2(0.0,1.0);
  vec4 x12=x0.xyxy+C.xxzz; x12.xy-=i1;
  i=mod289(i);
  vec3 p=permute(permute(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));
  vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0);
  m=m*m; m=m*m;
  vec3 x=2.0*fract(p*C.www)-1.0;
  vec3 h=abs(x)-0.5;
  vec3 ox=floor(x+0.5);
  vec3 a0=x-ox;
  m*=1.79284291400159-0.85373472095314*(a0*a0+h*h);
  vec3 g;
  g.x=a0.x*x0.x+h.x*x0.y;
  g.yz=a0.yz*x12.xz+h.yz*x12.yw;
  return 130.0*dot(m,g);
}
float fbm(vec2 p){
  float s=0.0, a=0.5;
  for(int i=0;i<5;i++){ s+=a*snoise(p); p*=2.02; a*=0.5; }
  return s;
}
float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }

void main(){
  vec2 uv=vUv;
  float agp=u_res.x/u_res.y;
  vec2 p=uv; p.x*=agp;
  vec2 m=u_mouse*0.12;

  float t=u_time*0.045;
  // campo de flujo
  vec2 q=vec2(fbm(p*1.4+vec2(t,0.0)+m), fbm(p*1.4+vec2(5.2,1.3)-t));
  float n=fbm(p*1.8 + q*1.6 + vec2(-t*1.2, t));
  n=0.5+0.5*n;

  // paleta: carbón profundo -> oro
  vec3 dark1=vec3(0.043,0.043,0.051);
  vec3 dark2=vec3(0.094,0.090,0.086);
  vec3 gold =vec3(1.0,0.874,0.0);
  vec3 amber=vec3(0.78,0.55,0.07);

  vec3 col=mix(dark1, dark2, smoothstep(0.2,0.9,n));

  // vetas doradas (finas, en la zona superior)
  float veins=smoothstep(0.62,0.95,n);
  float topMask=smoothstep(0.95,0.15,uv.y);     // más arriba
  col=mix(col, amber, veins*0.5*topMask);

  // bloom dorado a la deriva
  vec2 c=vec2(0.32+0.16*sin(u_time*0.06)+m.x, 0.30+0.12*cos(u_time*0.05));
  float d=distance(vec2(uv.x*agp,uv.y), vec2(c.x*agp,c.y));
  float glow=exp(-d*2.6);
  col+=gold*glow*0.22*topMask;

  col*=u_intensity;

  // viñeta
  float vig=smoothstep(1.15,0.35,distance(uv,vec2(0.5)));
  col*=mix(0.55,1.0,vig);

  // oscurecer la base (se funde con el gradiente CSS y el texto)
  col*=mix(0.5,1.0,smoothstep(0.0,0.55,uv.y));

  // grano
  float g=hash(uv*u_res.xy + u_time)*0.05-0.025;
  col+=g;

  gl_FragColor=vec4(col,1.0);
}
`;

const VERT = /* glsl */ `
varying vec2 vUv;
void main(){ vUv=uv; gl_Position=vec4(position,1.0); }
`;

export function initHeroWebGL(canvas, opts = {}) {
  if (!canvas) return null;
  const reduced =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      powerPreference: "high-performance",
    });
  } catch (e) {
    return null; // sin WebGL: el degradado CSS hace de fondo
  }

  const dpr = Math.min(window.devicePixelRatio || 1, 1.6);
  renderer.setPixelRatio(dpr);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const geometry = new THREE.PlaneGeometry(2, 2);
  const uniforms = {
    u_time: { value: 0 },
    u_res: { value: new THREE.Vector2(1, 1) },
    u_mouse: { value: new THREE.Vector2(0, 0) },
    u_intensity: { value: opts.intensity ?? 1.0 },
  };
  const material = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms,
  });
  scene.add(new THREE.Mesh(geometry, material));

  const targetMouse = new THREE.Vector2(0, 0);

  function resize() {
    const w = canvas.clientWidth || canvas.parentElement.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || canvas.parentElement.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    uniforms.u_res.value.set(w * dpr, h * dpr);
  }

  function onMove(e) {
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = (e.clientY / window.innerHeight) * 2 - 1;
    targetMouse.set(x, -y);
  }

  let running = true;
  let raf = 0;
  const clock = new THREE.Clock();

  function frame() {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    const dt = clock.getDelta();
    uniforms.u_time.value += reduced ? 0 : dt;
    uniforms.u_mouse.value.lerp(targetMouse, 0.04);
    renderer.render(scene, camera);
  }

  function start() {
    if (running) return;
    running = true;
    clock.getDelta();
    frame();
  }
  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  resize();
  window.addEventListener("resize", resize);
  if (!reduced) window.addEventListener("pointermove", onMove, { passive: true });

  // Pausa cuando el hero sale de viewport
  let io;
  if ("IntersectionObserver" in window) {
    io = new IntersectionObserver(
      (entries) => {
        const v = entries[0].isIntersecting;
        if (v) start();
        else stop();
      },
      { threshold: 0.01 }
    );
    io.observe(canvas);
  }
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  running = false;
  start();

  // render estático si reduced-motion
  if (reduced) {
    uniforms.u_time.value = 12.0;
    renderer.render(scene, camera);
  }

  return {
    resize,
    destroy() {
      stop();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      if (io) io.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    },
  };
}

export default initHeroWebGL;
