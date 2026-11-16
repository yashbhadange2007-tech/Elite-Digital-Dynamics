import { BufferAttribute, BufferGeometry } from 'three';

/**
 * The logo's geometry (DESIGN.md section 9, from public/brand/edd-mark.svg), normalised so ring A's
 * centre line has radius 1. Angles are in degrees, counter-clockwise from the +x axis with y up,
 * so 45 is top-right on screen and 225 is bottom-left.
 */
export const LOGO = {
  /** Ring A's centre-line radius as a fraction of the mark's 64-unit box. */
  radiusInBox: 22 / 64,
  ringA: { radius: 1, band: 6.4 / 22, gap: 64, gapAt: 45 },
  ringB: { radius: 12.5 / 22, band: 3.6 / 22, gap: 70, gapAt: 225 },
  coreRadius: 6 / 22,
  glowRadius: 16 / 22,
} as const;

/** Band thickness along the ring's axis, as a fraction of its width across the ring. */
const THICKNESS = 0.45;

export type RingShape = { radius: number; band: number; gap: number; gapAt: number };

/**
 * One open ring in the xy plane, facing +z: a flattened elliptical cross-section swept around the
 * arc, closed at both ends by half a turn of the same profile (the 3D form of a round line cap),
 * so the caps meet the band with no crease. Normals are analytic, so there are no seams or facets.
 *
 * `around` = segments along the arc, `edge` = segments on each half of the profile.
 */
export function makeRing(shape: RingShape, around: number, edge: number): BufferGeometry {
  const across = shape.band / 2; // half width across the ring
  const along = across * THICKNESS; // half thickness along the axis

  // Half profile (a >= 0) of the ellipse, from the middle of the front face, round the outer edge,
  // to the middle of the back face. Each point: offset across the ring, offset along the axis, and
  // its normal. The face is gently crowned, not flat, so it reflects a sweep of the surroundings.
  const prof: [a: number, b: number, na: number, nb: number][] = [];
  for (let k = 0; k <= edge; k++) {
    const angle = Math.PI / 2 - (k * Math.PI) / edge;
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const length = Math.hypot(c / across, s / along);
    prof.push([across * c, along * s, c / across / length, s / along / length]);
  }
  const halfCount = prof.length;

  // Full closed profile for the band: the half, then its mirror image back to the start.
  const loop = [...prof];
  for (let j = halfCount - 2; j >= 1; j--) loop.push([-prof[j][0], prof[j][1], -prof[j][2], prof[j][3]]);
  const loopCount = loop.length;

  const capSteps = Math.max(6, Math.round(around / 10));
  const vertexCount = (around + 1) * loopCount + 2 * (capSteps + 1) * halfCount;
  const position = new Float32Array(vertexCount * 3);
  const normal = new Float32Array(vertexCount * 3);
  const index: number[] = [];
  let v = 0;

  // Writes one profile point placed at `centre` with the across-the-ring direction (dx, dy).
  const put = (cx: number, cy: number, dx: number, dy: number, p: (typeof prof)[number]) => {
    position.set([cx + p[0] * dx, cy + p[0] * dy, p[1]], v * 3);
    normal.set([p[2] * dx, p[2] * dy, p[3]], v * 3);
    v++;
  };
  // Two triangles per grid cell; `flip` reverses the winding.
  const quad = (a: number, b: number, c: number, d: number, flip: boolean) => {
    if (flip) index.push(a, c, b, c, d, b);
    else index.push(a, b, c, c, b, d);
  };

  const toRad = Math.PI / 180;
  const start = (shape.gapAt + shape.gap / 2) * toRad;
  const sweep = (360 - shape.gap) * toRad;

  // The band.
  for (let i = 0; i <= around; i++) {
    const theta = start + (sweep * i) / around;
    const dx = Math.cos(theta);
    const dy = Math.sin(theta);
    for (let j = 0; j < loopCount; j++) put(shape.radius * dx, shape.radius * dy, dx, dy, loop[j]);
  }
  for (let i = 0; i < around; i++) {
    for (let j = 0; j < loopCount; j++) {
      const j1 = (j + 1) % loopCount;
      quad(i * loopCount + j, i * loopCount + j1, (i + 1) * loopCount + j, (i + 1) * loopCount + j1, false);
    }
  }

  // The two caps: the half profile turned half a circle about the band's end, in the ring plane.
  for (const end of [0, 1]) {
    const theta = start + sweep * end;
    const rx = Math.cos(theta);
    const ry = Math.sin(theta);
    const out = end ? 1 : -1; // the cap bulges along the arc's tangent, away from the band
    const tx = -ry * out;
    const ty = rx * out;
    const base = v;
    for (let k = 0; k <= capSteps; k++) {
      const psi = (k * Math.PI) / capSteps;
      const dx = Math.cos(psi) * rx + Math.sin(psi) * tx;
      const dy = Math.cos(psi) * ry + Math.sin(psi) * ty;
      for (let j = 0; j < halfCount; j++) put(shape.radius * rx, shape.radius * ry, dx, dy, prof[j]);
    }
    for (let k = 0; k < capSteps; k++) {
      for (let j = 0; j < halfCount - 1; j++) {
        const a = base + k * halfCount + j;
        quad(a, a + 1, a + halfCount, a + halfCount + 1, end === 0);
      }
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(position, 3));
  geometry.setAttribute('normal', new BufferAttribute(normal, 3));
  geometry.setIndex(index);
  return geometry;
}
