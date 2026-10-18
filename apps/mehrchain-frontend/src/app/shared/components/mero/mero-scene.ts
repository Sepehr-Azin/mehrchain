import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createMascot, MascotDetail, MascotMood } from './mero-model';

/** One offscreen WebGL context and one model for all Mero canvases on the page. */
export function createMeroScene(detail: MascotDetail, onContextLost: () => void) {
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: detail !== 'low',
    powerPreference: 'low-power',
    failIfMajorPerformanceCaveat: true,
  });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  let environment: THREE.WebGLRenderTarget | undefined;
  if (detail !== 'low') {
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    environment = pmrem.fromScene(room, 0.04, 0.1, 100, { size: 64 });
    scene.environment = environment.texture;
    scene.environmentIntensity = 0.32;
    room.dispose();
    pmrem.dispose();
  }
  scene.add(new THREE.HemisphereLight('#d9fff0', '#28483d', 0.6));
  for (const [color, intensity, x, y, z] of [
    ['#e4fff4', 0.9, -1.5, 5, 1],
    ['#bceae7', 1.6, 3, 1, -2],
    ['#eaffdc', 1.8, -2, 0, -3],
    ['#ffe4b0', 0.25, 0, -2, 3],
  ] as const) {
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(x, y, z);
    scene.add(light);
  }
  // Frame the character itself, without the source icon's large empty margins.
  const camera = new THREE.OrthographicCamera(-1.4, 1.4, 1.4, -1.4, 0.1, 20);
  camera.position.set(0, 0, 7.6);
  const mascot = createMascot({ detail });
  scene.add(mascot.model);
  const lost = (event: Event) => {
    event.preventDefault();
    onContextLost();
  };
  renderer.domElement.addEventListener('webglcontextlost', lost);
  let pixels = 0;

  return {
    draw(
      target: CanvasRenderingContext2D,
      size: number,
      mood: MascotMood,
      glow: number,
      seconds: number,
      animated: boolean,
    ) {
      if (pixels !== size) {
        renderer.setSize(size, size, false);
        pixels = size;
      }
      mascot.setMood(mood);
      mascot.setGlow(glow);
      mascot.update(seconds, false, animated);
      renderer.render(scene, camera);
      if (target.canvas.width !== size || target.canvas.height !== size) {
        target.canvas.width = size;
        target.canvas.height = size;
      }
      target.clearRect(0, 0, size, size);
      // Copy immediately, before the browser clears the WebGL drawing buffer.
      target.drawImage(renderer.domElement, 0, 0);
    },
    dispose() {
      renderer.domElement.removeEventListener('webglcontextlost', lost);
      mascot.dispose();
      environment?.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
