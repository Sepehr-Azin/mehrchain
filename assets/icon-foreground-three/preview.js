import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createMascot } from './mascot.js';

const viewport = document.getElementById('viewport');
const scene = new THREE.Scene();
// Orthographic projection preserves the source image's measured proportions.
const REFERENCE_FRAME = 1024 / 180;
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 40);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x000000, 1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
viewport.append(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 3.5;
controls.maxDistance = 15;
controls.minZoom = 0.65;
controls.maxZoom = 2.5;
controls.autoRotateSpeed = 1.2;
const pmrem = new THREE.PMREMGenerator(renderer);
const room = new RoomEnvironment();
const environment = pmrem.fromScene(room, 0.04);
scene.environment = environment.texture;
scene.environmentIntensity = 0.32;
room.dispose();
pmrem.dispose();
scene.add(new THREE.HemisphereLight('#d9fff0', '#28483d', 0.6));
function addLight(color, intensity, x, y, z) {
  const light = new THREE.DirectionalLight(color, intensity);
  light.position.set(x, y, z);
  scene.add(light);
}
addLight('#e4fff4', 0.9, -1.5, 5, 1);
addLight('#bceae7', 1.6, 3, 1, -2);
addLight('#eaffdc', 1.8, -2, 0, -3);
addLight('#ffe4b0', 0.25, 0, -2, 3);
const mascot = createMascot();
scene.add(mascot.model);
const shadowMaterial = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  toneMapped: false,
  vertexShader:
    'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader:
    'varying vec2 vUv; void main() { float r = length((vUv - 0.5) * 2.0); float alpha = 0.49 * exp(-4.0 * r * r) * (1.0 - smoothstep(0.7, 1.0, r)); gl_FragColor = vec4(0.0, 0.0, 0.0, alpha); }',
});
const shadow = new THREE.Mesh(new THREE.CircleGeometry(1, 96), shadowMaterial);
shadow.name = 'Soft oval shadow from the reference';
shadow.position.set(0, -1.76, -0.6);
shadow.scale.set(1.28, 0.24, 1);
scene.add(shadow);
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let animated = false;
let lightBackground = false;
let disposed = false;
let elapsed = 0;
let lastFrame = null;

function frontView() {
  camera.position.set(-11.5 / 180, 29 / 180, 7.6);
  controls.target.set(-11.5 / 180, 29 / 180, 0);
  camera.zoom = 1;
  camera.updateProjectionMatrix();
  controls.update();
}
function resize() {
  const { width, height } = viewport.getBoundingClientRect();
  const aspect = width / height;
  const comparing = document.querySelector('main').classList.contains('comparing');
  const frame = comparing ? REFERENCE_FRAME : 4.3;
  const viewHeight = frame / Math.min(aspect, 1);
  camera.left = (-viewHeight * aspect) / 2;
  camera.right = (viewHeight * aspect) / 2;
  camera.top = viewHeight / 2;
  camera.bottom = -viewHeight / 2;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}
const observer = new ResizeObserver(resize);
observer.observe(viewport);
frontView();
resize();
function pressed(id, enabled) {
  document.getElementById(id).setAttribute('aria-pressed', String(enabled));
}
function setMood(mood) {
  mascot.setMood(mood);
  for (const name of ['reference', 'happy', 'sad']) pressed(`mood-${name}`, mood === name);
}
for (const mood of ['reference', 'happy', 'sad']) {
  document.getElementById(`mood-${mood}`).addEventListener('click', () => setMood(mood));
}
document.getElementById('motion').addEventListener('click', () => {
  animated = !animated;
  pressed('motion', animated);
});
document.getElementById('rotate').addEventListener('click', () => {
  controls.autoRotate = !controls.autoRotate;
  pressed('rotate', controls.autoRotate);
});
document.getElementById('front').addEventListener('click', () => {
  controls.autoRotate = false;
  animated = false;
  pressed('rotate', false);
  pressed('motion', false);
  setMood('reference');
  mascot.update(0, false);
  frontView();
});
document.getElementById('background').addEventListener('click', () => {
  lightBackground = !lightBackground;
  renderer.setClearColor(lightBackground ? 0xf0f2e9 : 0x000000, 1);
  document.getElementById('reference-panel').style.backgroundColor = lightBackground
    ? '#f0f2e9'
    : '#000';
  pressed('background', lightBackground);
});
document.getElementById('reference').addEventListener('click', () => {
  const panel = document.getElementById('reference-panel');
  panel.hidden = !panel.hidden;
  document.querySelector('main').classList.toggle('comparing', !panel.hidden);
  pressed('reference', !panel.hidden);
  if (!panel.hidden) {
    controls.autoRotate = false;
    animated = false;
    pressed('rotate', false);
    pressed('motion', false);
    mascot.update(0, false);
    frontView();
  }
  resize();
});
document.getElementById('glow').addEventListener('input', (event) => {
  mascot.setGlow(Number(event.target.value));
});
document.getElementById('export').addEventListener('click', () => {
  // Preserve the current angle; match the reference icon's generous square margin.
  const previousSize = renderer.getSize(new THREE.Vector2());
  const previousRatio = renderer.getPixelRatio();
  const previousColor = renderer.getClearColor(new THREE.Color());
  const previousAlpha = renderer.getClearAlpha();
  const exportCamera = camera.clone();
  exportCamera.left = -REFERENCE_FRAME / 2;
  exportCamera.right = REFERENCE_FRAME / 2;
  exportCamera.top = REFERENCE_FRAME / 2;
  exportCamera.bottom = -REFERENCE_FRAME / 2;
  exportCamera.updateProjectionMatrix();
  try {
    renderer.setPixelRatio(1);
    renderer.setSize(1024, 1024, false);
    renderer.setClearColor(0x000000, 0);
    renderer.render(scene, exportCamera);
    const link = document.getElementById('download');
    link.href = renderer.domElement.toDataURL('image/png');
    link.hidden = false;
    link.click();
  } finally {
    renderer.setPixelRatio(previousRatio);
    renderer.setSize(previousSize.x, previousSize.y, false);
    renderer.setClearColor(previousColor, previousAlpha);
    renderer.render(scene, camera);
  }
});
renderer.domElement.addEventListener('webglcontextlost', (event) => {
  event.preventDefault();
  document.getElementById('status').textContent =
    'ارتباط با پردازندهٔ گرافیکی قطع شد. صفحه را دوباره بارگذاری کنید.';
});
document.getElementById('status').textContent = '';
renderer.setAnimationLoop((time) => {
  if (disposed) return;
  const delta = lastFrame === null ? 0 : Math.min((time - lastFrame) / 1000, 0.1);
  lastFrame = time;
  if (document.hidden) return;
  elapsed += delta;
  mascot.update(elapsed, animated, !reducedMotion.matches || animated);
  controls.update(reducedMotion.matches ? Math.min(delta, 1 / 60) : delta);
  renderer.render(scene, camera);
});
window.addEventListener('pagehide', (event) => {
  if (event.persisted) return;
  disposed = true;
  renderer.setAnimationLoop(null);
  observer.disconnect();
  controls.dispose();
  mascot.dispose();
  shadow.geometry.dispose();
  shadowMaterial.dispose();
  environment.dispose();
  renderer.dispose();
});
