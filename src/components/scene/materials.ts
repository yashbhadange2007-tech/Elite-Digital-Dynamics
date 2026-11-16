import {
  AdditiveBlending,
  CanvasTexture,
  Color,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  ShaderMaterial,
  SpriteMaterial,
  type Texture,
  type WebGLRenderer,
} from 'three';

/** Scene colours, DESIGN.md section 9 ("Scene values"). */
const RING_BODY = '#6A0F0C';
const SALMON = '#FF8A6B';
const HOT = '#FFD9CC';
const KEY_RED = '#C42415';
const FILL = '#2A0A07';
const CORE = '#FF3B1F';
export const CORE_LIGHT = '#FF4A2A';

const glsl = (hex: string, scale = 1) => {
  const c = new Color(hex).multiplyScalar(scale);
  return `vec3(${c.r.toFixed(4)}, ${c.g.toFixed(4)}, ${c.b.toFixed(4)})`;
};

/**
 * The one ring material for every tier: dark glossy red metal. A metal tints its reflections with
 * its own colour, so the pale edge highlights of the reference come from a fresnel rim added on
 * top (salmon, turning near-white at the most grazing angles).
 */
export function makeRingMaterial(): MeshStandardMaterial {
  const material = new MeshStandardMaterial({ color: RING_BODY, metalness: 1, roughness: 0.22 });
  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      `#include <emissivemap_fragment>
      float rim = 1.0 - saturate(dot(normal, normalize(vViewPosition)));
      totalEmissiveRadiance += ${glsl(SALMON, 0.9)} * pow(rim, 3.0) + ${glsl(HOT, 0.9)} * pow(rim, 7.0);`,
    );
  };
  return material;
}

/**
 * The core: unlit, with the logo's radial gradient. The hot spot sits up-left of centre, as in
 * edd-mark.svg (gradient centre 1.4 left and 1.6 up of a radius-6 disc, gradient radius 7.6).
 */
export function makeCoreMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    toneMapped: false,
    vertexShader: `
      varying vec3 vNormalView;
      void main() {
        vNormalView = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      varying vec3 vNormalView;
      void main() {
        float d = length(normalize(vNormalView).xy - vec2(-0.233, 0.267)) / 1.267;
        vec3 color = mix(${glsl(HOT)}, ${glsl(CORE)}, smoothstep(0.0, 0.45, d));
        color = mix(color, ${glsl(KEY_RED)}, smoothstep(0.45, 1.0, d));
        gl_FragColor = vec4(color, 1.0);
        #include <colorspace_fragment>
      }`,
  });
}

/** Soft round glow sprite material. The texture is drawn here: no image files. */
export function makeHaloMaterial(color: string, opacity: number): SpriteMaterial {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const context = canvas.getContext('2d')!;
  const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgb(255 255 255 / 1)');
  gradient.addColorStop(0.35, 'rgb(255 255 255 / 0.42)');
  gradient.addColorStop(1, 'rgb(255 255 255 / 0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  return new SpriteMaterial({
    map: new CanvasTexture(canvas),
    color,
    opacity,
    blending: AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
}

/**
 * The reflections: a tiny scene of glowing panels, blurred once into an environment map.
 * A large soft red key above and in front, two thin pale strips at grazing angles behind the
 * object (they only show on edges that turn away from the viewer), and a dim fill everywhere.
 * No HDR file and no network.
 */
export function makeEnvironment(renderer: WebGLRenderer): Texture {
  const scene = new Scene();
  scene.background = new Color(FILL).multiplyScalar(0.6);
  const geometry = new PlaneGeometry(1, 1);
  const materials: MeshBasicMaterial[] = [];
  const panel = (hex: string, power: number, w: number, h: number, x: number, y: number, z: number) => {
    const material = new MeshBasicMaterial({ color: new Color(hex).multiplyScalar(power), side: DoubleSide });
    materials.push(material);
    const mesh = new Mesh(geometry, material);
    mesh.scale.set(w, h, 1);
    mesh.position.set(x, y, z);
    mesh.lookAt(0, 0, 0);
    scene.add(mesh);
  };
  panel(KEY_RED, 5, 9, 6, -3, 6, 6); // key: above, front left
  panel(KEY_RED, 2, 6, 5, 6, -2, 5); // softer key from the right
  panel(SALMON, 14, 1.2, 12, -8, 2, -5); // strip: behind left
  panel(HOT, 12, 1, 10, 7, 4, -6); // strip: behind right
  panel(FILL, 3, 12, 6, 0, -7, 2); // fill from below

  const pmrem = new PMREMGenerator(renderer);
  const texture = pmrem.fromScene(scene, 0.04).texture;
  pmrem.dispose();
  geometry.dispose();
  for (const material of materials) material.dispose();
  return texture;
}
