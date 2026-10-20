import {
  BoxGeometry,
  BufferGeometry,
  CatmullRomCurve3,
  CylinderGeometry,
  Euler,
  ExtrudeGeometry,
  LatheGeometry,
  Matrix4,
  Path,
  Quaternion,
  Shape,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { MaterialKey } from '../materials';

export interface Detail {
  frieze: number;
  lattice: number;
  jaliBars: number;
  fine: boolean;
  beams: boolean;
}

export const DETAIL: Record<'high' | 'medium' | 'low', Detail> = {
  high: { frieze: 1, lattice: 2, jaliBars: 11, fine: true, beams: true },
  medium: { frieze: 1, lattice: 1, jaliBars: 8, fine: true, beams: true },
  low: { frieze: 0, lattice: 0, jaliBars: 5, fine: false, beams: false },
};

type Vec3 = [number, number, number];
type Position = number | Vec3;

function positionFrom(value: Position | undefined): Vector3 {
  if (value === undefined) return new Vector3();
  return Array.isArray(value) ? new Vector3(value[0], value[1], value[2]) : new Vector3(0, value, 0);
}

function scaleUv(geometry: BufferGeometry, u: number, v: number) {
  const uv = geometry.getAttribute('uv');
  if (!uv) return;
  for (let i = 0; i < uv.count; i += 1) {
    uv.setXY(i, uv.getX(i) * u, uv.getY(i) * v);
  }
  uv.needsUpdate = true;
}

function bevel(geometry: BoxGeometry, radius: number) {
  const position = geometry.getAttribute('position');
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    position.setXYZ(i, x - Math.sign(x) * radius, y - Math.sign(y) * radius, z - Math.sign(z) * radius);
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
}

/** A multi-cusped Rajput arch as a closed path, suitable for a wall opening. */
export function cuspedArchPath(
  width: number,
  spring: number,
  rise: number,
  baseY = 0,
  lobes = 7,
  cusp = 0.16,
): Path {
  const half = width / 2;
  const path = new Path();
  path.moveTo(-half, baseY);
  path.lineTo(-half, spring);
  const steps = Math.max(30, lobes * 6);
  for (let i = 1; i <= steps; i += 1) {
    const t = i / steps;
    const x = -half * Math.cos(Math.PI * t);
    const arch = Math.sin(Math.PI * t) ** 0.72;
    const notch = Math.abs(Math.cos(Math.PI * lobes * t)) * cusp;
    const y = spring + rise * Math.max(0.02, arch - notch);
    path.lineTo(x, y);
  }
  path.lineTo(half, spring);
  path.lineTo(half, baseY);
  path.closePath();
  return path;
}

export function starShape(points = 8, outer = 0.5, inner = 0.22): Shape {
  const shape = new Shape();
  const step = Math.PI / points;
  for (let i = 0; i < points * 2; i += 1) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = i * step - Math.PI / 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}

export function scrollShape(length = 0.5, height = 1.0): Shape {
  const shape = new Shape();
  shape.moveTo(0, 0);
  shape.lineTo(length, 0);
  shape.bezierCurveTo(length * 1.1, height * 0.22, length * 0.2, height * 0.42, length * 0.42, height * 0.62);
  shape.bezierCurveTo(length * 0.7, height * 0.86, length * 0.5, height, length * 0.7, height);
  shape.lineTo(0, height);
  shape.closePath();
  return shape;
}

export interface MergedBucket {
  material: MaterialKey;
  geometry: BufferGeometry;
}

export class Kit {
  private buckets = new Map<MaterialKey, BufferGeometry[]>();
  private captureStack: BufferGeometry[][] = [];

  constructor(readonly detail: Detail) {}

  private push(material: MaterialKey, geometry: BufferGeometry): BufferGeometry {
    const list = this.buckets.get(material);
    if (list) list.push(geometry);
    else this.buckets.set(material, [geometry]);
    for (const frame of this.captureStack) frame.push(geometry);
    return geometry;
  }

  private apply(geometry: BufferGeometry, position?: Position, rotation?: Vec3) {
    const quat = rotation
      ? new Quaternion().setFromEuler(new Euler(rotation[0], rotation[1], rotation[2]))
      : new Quaternion();
    geometry.applyMatrix4(new Matrix4().compose(positionFrom(position), quat, new Vector3(1, 1, 1)));
    geometry.computeBoundingSphere();
    return geometry;
  }

  private composite(position: Position | undefined, rotation: Vec3 | undefined, build: () => void) {
    const frame: BufferGeometry[] = [];
    this.captureStack.push(frame);
    build();
    this.captureStack.pop();
    for (const geometry of frame) this.apply(geometry, position, rotation);
  }

  box(material: MaterialKey, size: Vec3, position?: Position, rotation?: Vec3, uv?: [number, number]) {
    const geometry = new BoxGeometry(size[0], size[1], size[2]);
    if (uv) scaleUv(geometry, uv[0], uv[1]);
    return this.push(material, this.apply(geometry, position, rotation));
  }

  roundedBox(
    material: MaterialKey,
    size: Vec3,
    radius: number,
    position?: Position,
    rotation?: Vec3,
    uv?: [number, number],
  ) {
    const geometry = new BoxGeometry(size[0], size[1], size[2]);
    bevel(geometry, radius);
    if (uv) scaleUv(geometry, uv[0], uv[1]);
    return this.push(material, this.apply(geometry, position, rotation));
  }

  cylinder(
    material: MaterialKey,
    [radiusTop, radiusBottom, height, radial = 16]: [number, number, number, number?],
    position?: Position,
    rotation?: Vec3,
    openEnded = false,
    uv?: [number, number],
  ) {
    const geometry = new CylinderGeometry(radiusTop, radiusBottom, height, radial, 1, openEnded);
    if (uv) scaleUv(geometry, uv[0], uv[1]);
    return this.push(material, this.apply(geometry, position, rotation));
  }

  torus(
    material: MaterialKey,
    [radius, tube, radial = 8, tubular = 28]: [number, number, number?, number?],
    position?: Position,
    rotation?: Vec3,
  ) {
    const geometry = new TorusGeometry(radius, tube, radial, tubular);
    return this.push(material, this.apply(geometry, position, rotation));
  }

  sphere(
    material: MaterialKey,
    [radius, width = 16, height = 12, phiStart = 0, phiLength = Math.PI * 2, thetaStart = 0, thetaLength = Math.PI * 2]: [
      number,
      number?,
      number?,
      number?,
      number?,
      number?,
      number?,
    ],
    position?: Position,
    rotation?: Vec3,
  ) {
    const geometry = new SphereGeometry(radius, width, height, phiStart, phiLength, thetaStart, thetaLength);
    return this.push(material, this.apply(geometry, position, rotation));
  }

  lathe(
    material: MaterialKey,
    points: Vector2[],
    segments: number,
    position?: Position,
    rotation?: Vec3,
    uv?: [number, number],
  ) {
    const geometry = new LatheGeometry(points, segments);
    if (uv) scaleUv(geometry, uv[0], uv[1]);
    return this.push(material, this.apply(geometry, position, rotation));
  }

  extrude(
    material: MaterialKey,
    shape: Shape,
    depth: number,
    position?: Position,
    rotation?: Vec3,
    uv?: [number, number],
    bevelSize = 0.01,
  ) {
    const geometry = new ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: bevelSize > 0,
      bevelSize,
      bevelThickness: bevelSize,
      bevelSegments: 1,
      curveSegments: 14,
    });
    if (uv) scaleUv(geometry, uv[0], uv[1]);
    return this.push(material, this.apply(geometry, position, rotation));
  }

  tube(material: MaterialKey, points: Vec3[], radius: number, closed = false) {
    const curve = new CatmullRomCurve3(
      points.map((point) => new Vector3(...point)),
      closed,
      'catmullrom',
      0.1,
    );
    const geometry = new TubeGeometry(
      curve,
      Math.max(20, points.length * 3),
      radius,
      this.detail.fine ? 8 : 5,
      closed,
    );
    return this.push(material, geometry);
  }

  wallWithArch(options: {
    material?: MaterialKey;
    width: number;
    height: number;
    depth: number;
    opening: { width: number; spring: number; rise: number; base?: number; lobes?: number };
    position?: Position;
    rotation?: Vec3;
    uvScale?: number;
  }) {
    const { width, height, depth, opening, position, rotation, material = 'sandstone' } = options;
    const shape = new Shape();
    shape.moveTo(-width / 2, 0);
    shape.lineTo(width / 2, 0);
    shape.lineTo(width / 2, height);
    shape.lineTo(-width / 2, height);
    shape.closePath();
    shape.holes.push(
      cuspedArchPath(
        opening.width,
        opening.spring,
        opening.rise,
        opening.base ?? 0,
        opening.lobes ?? 7,
      ),
    );
    const geometry = new ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 20 });
    geometry.translate(0, 0, -depth / 2);
    const scale = 1 / (options.uvScale ?? 3.6);
    scaleUv(geometry, scale, scale);
    return this.push(material, this.apply(geometry, position, rotation));
  }

  archFrame(options: {
    material?: MaterialKey;
    width: number;
    spring: number;
    rise: number;
    base?: number;
    position?: Position;
    rotation?: Vec3;
    lobes?: number;
    radii?: number[];
    depth?: number;
  }) {
    const {
      width,
      spring,
      rise,
      base = 0,
      position,
      rotation,
      lobes = 7,
      radii = [0.16, 0.1, 0.055],
      material = 'sandstonePale',
    } = options;
    const half = width / 2;
    const archPoints: Vec3[] = [];
    const steps = Math.max(32, lobes * 6);
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      const x = -half * Math.cos(Math.PI * t);
      const arch = Math.sin(Math.PI * t) ** 0.72;
      const notch = Math.abs(Math.cos(Math.PI * lobes * t)) * 0.16;
      const y = spring + rise * Math.max(0.02, arch - notch);
      archPoints.push([x, y, 0]);
    }
    this.composite(position, rotation, () => {
      for (const radius of radii) {
        this.tube(material, archPoints, radius);
        this.box(material, [width + radius * 3, radius * 2.4, radius * 2.4], [0, base + radius, 0]);
        this.box(material, [radius * 2.4, spring - base + radius * 2, radius * 2.4], [-half + radius * 0.2, (base + spring) / 2, 0]);
        this.box(material, [radius * 2.4, spring - base + radius * 2, radius * 2.4], [half - radius * 0.2, (base + spring) / 2, 0]);
      }
      this.extrude(material, starShape(8, 0.34, 0.14), 0.14, [0, spring + rise * 0.84, 0.03], undefined, [0.6, 0.6], 0.008);
    });
    return this;
  }

  jaliPanel(options: {
    width: number;
    height: number;
    pattern?: 'star' | 'diamond' | 'floral' | 'chevron' | 'calligraphic';
    position?: Position;
    rotation?: Vec3;
    material?: MaterialKey;
    depth?: number;
    frame?: boolean;
  }) {
    const {
      width,
      height,
      pattern = 'star',
      position,
      rotation,
      material = 'sandstonePale',
      depth = 0.16,
      frame = true,
    } = options;
    const bar = Math.max(0.026, Math.min(width, height) / 110);
    const barCount = Math.max(4, this.detail.jaliBars);
    this.composite(position, rotation, () => {
      if (frame) {
        const t = 0.16;
        this.box(material, [width, t, depth], [0, height / 2 - t / 2, 0], undefined, [width / 1.4, t / 1.4]);
        this.box(material, [width, t, depth], [0, -height / 2 + t / 2, 0], undefined, [width / 1.4, t / 1.4]);
        this.box(material, [t, height - t * 2, depth], [-width / 2 + t / 2, 0, 0], undefined, [height / 1.4, t / 1.4]);
        this.box(material, [t, height - t * 2, depth], [width / 2 - t / 2, 0, 0], undefined, [height / 1.4, t / 1.4]);
      }
      const innerW = Math.max(0.2, width - 0.4);
      const innerH = Math.max(0.2, height - 0.4);
      if (pattern === 'star' || pattern === 'diamond' || pattern === 'floral') {
        for (let i = 1; i < barCount; i += 1) {
          const x = -innerW / 2 + (innerW / barCount) * i;
          this.box(material, [bar, innerH * 1.6, depth * 0.7], [x, 0, 0], undefined, [1, innerH / 0.7]);
        }
      }
      if (pattern === 'diamond' || pattern === 'star') {
        const diagonal = Math.hypot(innerW, innerH);
        for (let i = -barCount; i <= barCount; i += 1) {
          const step = (innerW / barCount) * i;
          this.box(material, [bar, diagonal, depth * 0.62], [step, 0, 0], [0, 0, Math.PI / 4], [1, diagonal / 0.8]);
          this.box(material, [bar, diagonal, depth * 0.62], [step, 0, 0], [0, 0, -Math.PI / 4], [1, diagonal / 0.8]);
        }
      }
      if (pattern === 'chevron') {
        const rows = Math.max(4, Math.round(innerH / 0.42));
        for (let row = 0; row < rows; row += 1) {
          const y = -innerH / 2 + (row / rows) * innerH;
          for (let i = 0; i < barCount; i += 1) {
            const x = -innerW / 2 + (innerW / barCount) * (i + 0.5);
            this.box(material, [bar, innerW / barCount, depth * 0.62], [x, y, 0], [0, 0, row % 2 === 0 ? Math.PI / 4 : -Math.PI / 4]);
          }
        }
      }
      if (pattern === 'calligraphic') {
        for (let s = 0; s < 4; s += 1) {
          const points: Vec3[] = [];
          for (let i = 0; i <= 18; i += 1) {
            const t = i / 18;
            points.push([
              -innerW / 2 + innerW * t,
              -innerH / 2 + (innerH / 5) * (s + 1) + Math.sin(t * Math.PI * 4) * innerH * 0.06,
              0,
            ]);
          }
          this.tube(material, points, bar * 1.05);
        }
      }
      if (pattern === 'star' || pattern === 'floral') {
        const cols = Math.max(2, Math.round(width / 1.1));
        const rows = Math.max(2, Math.round(height / 1.1));
        for (let cx = 0; cx < cols; cx += 1) {
          for (let cy = 0; cy < rows; cy += 1) {
            const x = -innerW / 2 + (innerW / cols) * (cx + 0.5);
            const y = -innerH / 2 + (innerH / rows) * (cy + 0.5);
            const squares = pattern === 'floral' ? 8 : 6;
            this.extrude(material, starShape(squares, 0.24, 0.1), depth * 0.8, [x, y, 0], undefined, [2.4, 2.4], 0.006);
            if (pattern === 'floral') this.torus(material, [0.2, bar * 0.8, 6, 16], [x, y, 0], [Math.PI / 2, 0, 0]);
          }
        }
      }
    });
    return this;
  }

  column(options: {
    height: number;
    order?: 0 | 1 | 2 | 3;
    position?: Position;
    rotation?: Vec3;
    radius?: number;
    bracket?: boolean;
    material?: MaterialKey;
  }) {
    const { height, order = 0, position, rotation, radius = 0.26, bracket = true, material = 'sandstonePale' } = options;
    const plinth = radius * 2.4;
    this.composite(position, rotation, () => {
      this.box(material, [plinth, 0.18, plinth], [0, 0.09, 0], undefined, [1.2, 1.2]);
      this.box(material, [plinth * 0.78, 0.16, plinth * 0.78], [0, 0.26, 0], undefined, [1, 1]);
      this.cylinder(material, [radius * 1.16, radius * 1.26, 0.16, 8], [0, 0.42, 0], undefined, false, [1, 1]);
      const shaft = Math.max(0.5, height - 1.15);
      this.cylinder(material, [radius * 0.94, radius * 1.06, shaft, 8], [0, 0.5 + shaft / 2, 0], undefined, false, [shaft / 1.2, 1]);
      const rings = order === 0 ? 3 : order === 1 ? 4 : 2;
      for (let i = 1; i <= rings; i += 1) {
        const y = 0.56 + (shaft / (rings + 1)) * i;
        this.torus(material, [radius * 1.02, 0.028, 6, 18], [0, y, 0], [Math.PI / 2, 0, 0]);
      }
      this.cylinder(material, [radius * 1.28, radius * 1.1, 0.22, 8], [0, height - 0.63, 0], undefined, false, [1, 1]);
      this.cylinder(material, [radius * 1.5, radius * 1.34, 0.18, 16], [0, height - 0.46, 0], undefined, false, [1, 1]);
      this.box(material, [radius * 3.3, 0.16, radius * 3.3], [0, height - 0.3, 0], undefined, [1.2, 1.2]);
      if (bracket) {
        const bracketHeight = Math.min(0.9, height * 0.3);
        for (let i = 0; i < 4; i += 1) {
          this.extrude(
            material,
            scrollShape(bracketHeight * 0.6, bracketHeight),
            radius * 1.5,
            [0, height - 0.24 - bracketHeight, 0],
            [0, (Math.PI / 2) * i, 0],
            [1.4, 1.4],
            0.01,
          );
        }
      }
    });
    return this;
  }

  bracket(options: { size?: number; position?: Position; rotation?: Vec3; material?: MaterialKey }) {
    const { size = 0.7, position, rotation, material = 'sandstonePale' } = options;
    return this.extrude(material, scrollShape(size * 0.7, size), size * 1.15, position, rotation, [1.5, 1.5], 0.01);
  }

  chhajja(options: {
    width: number;
    depth?: number;
    position?: Position;
    rotation?: Vec3;
    material?: MaterialKey;
    brackets?: number;
  }) {
    const { width, depth = 0.95, position, rotation, material = 'sandstonePale' } = options;
    this.composite(position, rotation, () => {
      this.box(material, [width, 0.22, depth], [0, 0, -depth / 2], undefined, [width / 1.4, 1]);
      this.box(material, [width, 0.1, depth * 0.82], [0, -0.13, -depth * 0.42], undefined, [width / 1.4, 1]);
      this.roundedBox(material, [width, 0.12, 0.16], 0.04, [0, -0.05, -depth + 0.08], undefined, [width / 1.2, 1]);
      const count = Math.max(3, Math.round(width / 1.5));
      for (let i = 0; i < count; i += 1) {
        const x = -width / 2 + (width / (count - 1 || 1)) * i;
        this.bracket({ size: 0.62, position: [x, -0.55, -depth * 0.42], material });
      }
      const fringe = Math.max(6, Math.round(width * 2));
      for (let i = 0; i < fringe; i += 1) {
        const x = -width / 2 + (width / (fringe - 1 || 1)) * i;
        this.box(material, [0.1, 0.13, 0.1], [x, -0.1, -depth + 0.02], undefined, [0.4, 0.4]);
      }
    });
    return this;
  }

  jharokha(options: {
    width?: number;
    height?: number;
    depth?: number;
    position?: Position;
    rotation?: Vec3;
    material?: MaterialKey;
    jali?: 'star' | 'diamond' | 'chevron';
  }) {
    const {
      width = 1.8,
      height = 2.4,
      depth = 0.9,
      position,
      rotation,
      material = 'sandstonePale',
      jali = 'star',
    } = options;
    const half = width / 2;
    this.composite(position, rotation, () => {
      this.box(material, [width * 1.16, 0.22, depth * 1.08], [0, -0.02, -depth * 0.28], undefined, [1.4, 1]);
      for (let i = 0; i < 4; i += 1) {
        this.bracket({ size: 0.85, position: [-half + 0.34 + (i * (width - 0.68)) / 3, -0.5, -depth * 0.2], material });
      }
      this.box(material, [0.18, height, depth], [-half + 0.09, height / 2, -depth / 2 + 0.02], undefined, [1, height / 1.2]);
      this.box(material, [0.18, height, depth], [half - 0.09, height / 2, -depth / 2 + 0.02], undefined, [1, height / 1.2]);
      this.wallWithArch({
        material,
        width,
        height,
        depth: 0.2,
        opening: { width: width * 0.66, spring: height * 0.42, rise: height * 0.34, base: 0.42, lobes: 5 },
        position: [0, 0, -depth + 0.08],
      });
      this.jaliPanel({
        width: width * 0.54,
        height: height * 0.34,
        position: [0, 0.62, -depth + 0.2],
        material,
        depth: 0.12,
        pattern: jali,
      });
      this.archFrame({
        material,
        width: width * 0.66,
        spring: height * 0.42,
        rise: height * 0.34,
        base: 0.42,
        position: [0, 0, -depth + 0.2],
        lobes: 5,
        radii: [0.12, 0.07],
      });
      this.chhajja({ width: width * 1.2, depth: depth * 1.05, position: [0, height + 0.08, -depth * 0.2], material, brackets: 3 });
      const dome = new Shape();
      dome.absarc(0, 0, width * 0.42, Math.PI, 0, true);
      this.extrude(material, dome, depth * 0.6, [0, height + 0.18, -depth * 0.32], undefined, [1.2, 1.2], 0.02);
      this.cylinder(material, [0.08, 0.11, 0.42, 8], [0, height + 0.72, -depth * 0.32]);
      this.sphere(material, [0.14], [0, height + 1.02, -depth * 0.32]);
    });
    return this;
  }

  chhatri(options: {
    radius?: number;
    height?: number;
    position?: Position;
    rotation?: Vec3;
    material?: MaterialKey;
    columns?: number;
  }) {
    const { radius = 1.9, height = 3.0, position, rotation, material = 'sandstonePale' } = options;
    const columns = options.columns ?? (this.detail.fine ? 8 : 6);
    this.composite(position, rotation, () => {
      this.cylinder(material, [radius * 1.14, radius * 1.24, 0.22, 16], [0, 0.11, 0], undefined, false, [2, 1]);
      this.cylinder(material, [radius, radius * 1.12, 0.16, 16], [0, 0.3, 0], undefined, false, [2, 1]);
      for (let i = 0; i < columns; i += 1) {
        const angle = (i / columns) * Math.PI * 2 + Math.PI / columns;
        this.column({
          height: height - 0.36,
          order: 2,
          radius: 0.19,
          position: [Math.cos(angle) * radius * 0.72, 0.4, Math.sin(angle) * radius * 0.72],
          material,
          bracket: false,
        });
      }
      this.torus(material, [radius * 0.78, 0.1, 8, columns * 4], [0, height - 0.02, 0], [Math.PI / 2, 0, 0]);
      this.cylinder(material, [radius * 0.9, radius * 0.9, 0.18, 16], [0, height + 0.1, 0], undefined, false, [2, 1]);
      this.sphere(material, [radius * 0.82, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2], [0, height + 0.18, 0]);
      this.cylinder(material, [0.1, 0.16, 0.42, 10], [0, height + 0.78, 0]);
      this.sphere(material, [0.18], [0, height + 1.02, 0]);
      for (let i = 0; i < 4; i += 1) {
        const angle = (Math.PI / 2) * i;
        this.bracket({
          size: 0.5,
          position: [Math.cos(angle) * radius * 0.8, height - 0.3, Math.sin(angle) * radius * 0.8],
          rotation: [0, -angle, 0],
          material,
        });
      }
    });
    return this;
  }

  parapet(options: {
    length: number;
    height?: number;
    material?: MaterialKey;
    position?: Position;
    rotation?: Vec3;
    merlons?: number;
  }) {
    const { length, height = 0.95, material = 'sandstonePale', position, rotation } = options;
    const merlons = options.merlons ?? Math.max(4, Math.round(length / 1.25));
    this.composite(position, rotation, () => {
      this.roundedBox(material, [length, 0.22, 0.42], 0.04, [0, 0.11, 0], undefined, [length / 1.4, 1]);
      this.box(material, [length, 0.12, 0.5], [0, 0.26, 0], undefined, [length / 1.4, 1]);
      for (let i = 0; i < merlons; i += 1) {
        const x = -length / 2 + (length / (merlons - 1 || 1)) * i;
        this.box(material, [0.62, height - 0.38, 0.36], [x, 0.32 + (height - 0.38) / 2, 0], undefined, [0.6, 0.6]);
        this.box(material, [0.72, 0.1, 0.42], [x, height - 0.04, 0]);
        this.torus(material, [0.17, 0.035, 5, 12], [x, 0.46, -0.02]);
      }
    });
    return this;
  }

  stairs(options: {
    width: number;
    steps: number;
    rise: number;
    run: number;
    material?: MaterialKey;
    position?: Position;
    rotation?: Vec3;
  }) {
    const { width, steps, rise, run, material = 'sandstoneFloor', position, rotation } = options;
    this.composite(position, rotation, () => {
      for (let i = 0; i < steps; i += 1) {
        const height = rise * (i + 1);
        this.box(material, [width, height, run], [0, height / 2, -run * i], undefined, [width / 3, 1]);
        this.roundedBox(material, [width, 0.05, 0.12], 0.02, [0, height + 0.025, -run * i + run / 2 - 0.06]);
      }
    });
    return this;
  }

  frieze(options: {
    length: number;
    height?: number;
    material?: MaterialKey;
    position?: Position;
    rotation?: Vec3;
  }) {
    const { length, height = 0.42, material = 'sandstonePale', position, rotation } = options;
    const count = Math.max(4, Math.round(length * this.detail.frieze * 1.5));
    this.composite(position, rotation, () => {
      this.box(material, [length, height, 0.12], [0, 0, 0], undefined, [length / 1.3, height / 1.3]);
      for (let i = 0; i < count; i += 1) {
        const x = -length / 2 + (length / count) * (i + 0.5);
        this.extrude(material, starShape(4, height * 0.32, height * 0.13), 0.12, [x, 0, 0.08], [0, 0, Math.PI / 4], [2, 2], 0.006);
        this.cylinder(material, [height * 0.1, height * 0.1, 0.1, 8], [x, 0, 0.06], [Math.PI / 2, 0, 0]);
      }
    });
    return this;
  }

  blindArch(options: {
    width: number;
    height: number;
    material?: MaterialKey;
    position?: Position;
    rotation?: Vec3;
    jali?: boolean;
  }) {
    const { width, height, material = 'sandstonePale', position, rotation, jali = false } = options;
    this.composite(position, rotation, () => {
      this.wallWithArch({
        material,
        width,
        height,
        depth: 0.22,
        opening: { width: width * 0.6, spring: height * 0.5, rise: height * 0.32, base: 0.28, lobes: 5 },
      });
      if (jali) {
        this.jaliPanel({
          width: width * 0.5,
          height: height * 0.34,
          position: [0, height * 0.28, 0.1],
          material,
          pattern: 'star',
          frame: false,
          depth: 0.1,
        });
      }
      this.archFrame({
        material,
        width: width * 0.6,
        spring: height * 0.5,
        rise: height * 0.32,
        base: 0.28,
        position: [0, 0, 0.14],
        lobes: 5,
        radii: [0.11, 0.06],
      });
    });
    return this;
  }

  merge(): MergedBucket[] {
    const merged: MergedBucket[] = [];
    for (const [material, list] of this.buckets) {
      if (list.length === 0) continue;
      // mergeGeometries requires a consistent index state; our kit mixes
      // indexed primitives with non-indexed extrusions, so normalise first.
      const normalised = list.map((item) => {
        if (!item.index) return item;
        const clone = item.toNonIndexed();
        item.dispose();
        return clone;
      });
      const geometry = normalised.length === 1 ? normalised[0] : mergeGeometries(normalised, false);
      if (!geometry) continue;
      geometry.computeBoundingSphere();
      merged.push({ material, geometry });
      if (normalised.length > 1) {
        for (const item of normalised) item.dispose();
      }
    }
    this.buckets.clear();
    this.captureStack = [];
    return merged;
  }
}
