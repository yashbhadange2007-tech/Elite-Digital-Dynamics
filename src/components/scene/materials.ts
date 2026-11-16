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
const DEEP = '#7A140D'; // ember-700: the core's outermost edge
export const CORE_LIGHT = '#FF4A2A';

const srgb = (hex: string) => {
  const c = new Color(hex).convertLinearToSRGB();
  return `vec3(${c.r.toFixed(4)}, ${c.g.toFixed(4)}, ${c.b.toFixed(4)})`;
};
const glsl = (hex: string, scale = 1) => {
  const c = new Color(hex).multiplyScalar(scale);
  return `vec3(${c.r.toFixed(4)}, ${c.g.toFixed(4)}, ${c.b.toFixed(4)})`;
};

/**
 * The one ring material for every tier: dark glossy red metal. A metal tints its reflections with
 * its own colour, so nothing in the environment can make it look pale. The pale parts are added on
 * top: a fresnel rim (salmon, near-white at the most grazing angles) for the edge highlights of
 * the reference, and a soft salmon sheen from the top left, the lit side of the logo's gradient.
 */
export function makeRingMaterial(): MeshStandardMaterial {
  const material = new MeshStandardMaterial({ color: RING_BODY, metalness: 1, roughness: 0.2 });
  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      `#include <emissivemap_fragment>
      vec3 toViewer = normalize(vViewPosition);
      float rim = 1.0 - saturate(dot(normal, toViewer));
      float sheen = saturate(dot(reflect(-toViewer, normal), normalize(vec3(-0.45, 0.5, 0.74))));
      totalEmissiveRadiance += ${glsl(SALMON, 0.45)} * pow(rim, 5.0) + ${glsl(HOT, 1.9)} * pow(rim, 11.0)
        + ${glsl(SALMON, 0.5)} * pow(sheen, 10.0);`,
    );
  };
  return material;
}

/**
 * The core: unlit, with the logo's radial gradient (edd-mark.svg, `coreh`): a small hot spot about
 * a quarter of the radius up-left of centre, the core red by 45% of the radius from it, and the
 * logo red at the limb, deepening to ember-700 at the outline, so the disc reads as a sphere.
 * The view-space normal's xy is the point's place on the disc, in units of the radius.
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
    // Colours are mixed and written as sRGB values, the way the SVG gradient is drawn.
    fragmentShader: `
      varying vec3 vNormalView;
      void main() {
        vec3 n = normalize(vNormalView);
        float d = length(n.xy - vec2(-0.18, 0.18));
        vec3 color = mix(${srgb(HOT)}, ${srgb(CORE)}, sqrt(clamp(d / 0.45, 0.0, 1.0)));
        float limb = 1.0 - smoothstep(0.1, 0.95, n.z);
        color = mix(color, ${srgb(KEY_RED)}, limb);
        gl_FragColor = vec4(mix(color, ${srgb(DEEP)}, 0.6 * limb * limb * limb), 1.0);
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
 * A large soft red key above and in front, a broad dimmer red from the viewer's side, two thin
 * pale strips at grazing angles behind the object (they only show on edges that turn away from
 * the viewer), and a dim fill everywhere.
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
  panel(KEY_RED, 5, 10, 8, -5, 5, 6); // key: above, front left (the logo is lit from top-left)
  panel(KEY_RED, 3, 16, 16, 0, 0, 12); // broad and soft from the viewer's side: faces are never black
  panel(SALMON, 30, 1.4, 12, -8, 2, -4); // strip: behind left
  panel(HOT, 28, 1.2, 10, 7, 4, -4); // strip: behind right
  panel(FILL, 3, 12, 6, 0, -7, 2); // fill from below

  const pmrem = new PMREMGenerator(renderer);
  const texture = pmrem.fromScene(scene, 0.04).texture;
  pmrem.dispose();
  geometry.dispose();
  for (const material of materials) material.dispose();
  return texture;
}
