import { Kit, starShape, type Detail, type MergedBucket } from '../kit';
import { LAYOUT } from '../layout';

const { archive } = LAYOUT;

export function buildArchive(detail: Detail): MergedBucket[] {
  const kit = new Kit(detail);
  const width = archive.maxX - archive.minX;
  const depth = archive.maxZ - archive.minZ;
  const midX = (archive.minX + archive.maxX) / 2;
  const midZ = (archive.minZ + archive.maxZ) / 2;

  // Floor, ceiling and beams.
  kit.box('wood', [width, 0.32, depth], [midX, -0.16, midZ], undefined, [depth / 2.4, width / 2.4]);
  for (const z of [archive.minZ, archive.maxZ]) {
    kit.wallWithArch({
      material: 'plaster',
      width,
      height: archive.height,
      depth: 0.6,
      opening: { width: 4.6, spring: 2.7, rise: 0.9, base: 1.1, lobes: 5 },
      position: [midX, 0, z],
    });
    kit.archFrame({
      material: 'sandstonePale',
      width: 4.6,
      spring: 2.7,
      rise: 0.9,
      base: 1.1,
      position: [midX, 0, z + (z < 0 ? 0.32 : -0.32)],
      rotation: [0, z < 0 ? 0 : Math.PI, 0],
      lobes: 5,
      radii: [0.12, 0.07],
    });
  }
  kit.wallWithArch({
    material: 'sandstoneWarm',
    width: depth,
    height: archive.height,
    depth: 0.6,
    opening: { width: 5.2, spring: 3.1, rise: 0.9, base: 1.15, lobes: 5 },
    position: [archive.minX, 0, midZ],
    rotation: [0, Math.PI / 2, 0],
  });
  kit.jaliPanel({
    width: 4.9,
    height: 1.75,
    position: [archive.minX + 0.36, 3.0, midZ],
    rotation: [0, Math.PI / 2, 0],
    pattern: 'star',
    frame: false,
  });
  kit.archFrame({
    material: 'sandstonePale',
    width: 5.2,
    spring: 3.1,
    rise: 0.9,
    base: 1.15,
    position: [archive.minX + 0.34, 0, midZ],
    rotation: [0, Math.PI / 2, 0],
    lobes: 5,
    radii: [0.12, 0.07],
  });
  kit.box('plaster', [width + 0.4, 0.4, depth + 0.4], [midX, archive.height - 0.2, midZ], undefined, [6, 4]);
  if (detail.beams) {
    for (let i = 0; i <= 7; i += 1) {
      const x = archive.minX + 0.6 + ((width - 1.2) / 7) * i;
      kit.box('woodDark', [0.28, 0.34, depth - 0.4], [x, archive.height - 0.56, midZ], undefined, [1, depth / 2]);
      kit.bracket({ size: 0.5, position: [x, archive.height - 0.95, archive.minZ + 0.5], material: 'sandstonePale' });
      kit.bracket({ size: 0.5, position: [x, archive.height - 0.95, archive.maxZ - 0.5], rotation: [0, Math.PI, 0], material: 'sandstonePale' });
    }
  }

  // Shelves on the north and south walls, filled with ledgers.
  for (const sign of [-1, 1] as const) {
    const z = sign < 0 ? archive.minZ + 0.6 : archive.maxZ - 0.6;
    for (const run of [0, 1] as const) {
      const x0 = archive.minX + 1.4 + run * (width / 2 - 0.4);
      buildShelfRun(kit, x0, z, width / 2 - 2.2, sign);
    }
  }
  // Strong-room door with the cut seal clue.
  buildStrongroomDoor(kit, archive.minX + 0.4, archive.minZ + 2.1);

  // Scriptorium desks.
  const deskZ = [-2.6, 0, 2.6];
  deskZ.forEach((z, index) => {
    buildDesk(kit, midX + (index % 2 === 0 ? -1.6 : 1.6), z);
  });
  // A sorting table and evidence wall.
  buildEvidenceWall(kit, archive.maxX - 2.4, midZ);
  // Fallen seal fragment, a deliberate clue in the dust.
  kit.cylinder('brass', [0.24, 0.24, 0.035, 24], [archive.minX + 2.4, 0.04, archive.minZ + 1.2], [Math.PI / 2, 0, 0]);
  kit.extrude('sandstonePale', starShape(6, 0.2, 0.08), 0.06, [archive.minX + 2.9, 0.03, archive.minZ + 1.6], [0, 0, 0], [2, 2], 0.004);
  kit.box('soot', [0.9, 0.03, 1.4], [archive.minX + 2.65, 0.02, archive.minZ + 1.4], undefined, [1, 1]);

  return kit.merge();
}

function buildShelfRun(kit: Kit, x0: number, z: number, length: number, sign: -1 | 1) {
  const height = 3.5;
  const yaw = sign < 0 ? 0 : Math.PI;
  kit.box('woodDark', [length, 0.28, 0.72], [x0 + length / 2, 0.14, z], [0, yaw, 0], [length / 2, 1]);
  for (const side of [-1, 1] as const) {
    kit.box('woodDark', [0.3, height, 0.72], [x0 + (side < 0 ? 0.15 : length - 0.15), height / 2, z], [0, yaw, 0], [1, height / 2]);
  }
  const shelves = 5;
  for (let i = 1; i <= shelves; i += 1) {
    const y = 0.24 + (height - 0.3) * (i / (shelves + 1));
    kit.box('wood', [length - 0.4, 0.12, 0.66], [x0 + length / 2, y, z], [0, yaw, 0], [length / 2, 1]);
    const books = Math.max(4, Math.round((length - 0.7) / 0.34));
    for (let b = 0; b < books; b += 1) {
      const bx = x0 + 0.45 + ((length - 0.9) / books) * b;
      const bookHeight = 0.28 + ((b * 7) % 5) * 0.055;
      const material = b % 3 === 0 ? 'fabricBurgundy' : b % 3 === 1 ? 'fabricIndigo' : 'paper';
      kit.box(material, [0.18, bookHeight, 0.48], [bx, y + 0.06 + bookHeight / 2, z + sign * 0.02], [0, yaw, 0], [1, 1]);
      if (b % 6 === 0) kit.box('brass', [0.2, 0.03, 0.1], [bx, y + 0.11, z + sign * 0.2], [0, yaw, 0]);
    }
  }
  kit.box('woodDark', [length + 0.2, 0.26, 0.86], [x0 + length / 2, height, z], [0, yaw, 0], [length / 2, 1]);
  kit.frieze({ length: length - 0.2, height: 0.24, position: [x0 + length / 2, height - 0.26, z + sign * 0.45], rotation: [0, yaw, 0] });
}

function buildStrongroomDoor(kit: Kit, x: number, z: number) {
  kit.wallWithArch({
    material: 'darkStone',
    width: 2.6,
    height: 3.6,
    depth: 0.3,
    opening: { width: 1.6, spring: 2.2, rise: 0.7, base: 0, lobes: 5 },
    position: [x, 0, z],
    rotation: [0, Math.PI / 2, 0],
  });
  kit.box('woodDark', [0.3, 2.5, 0.75], [x + 0.4, 1.25, z - 0.42], undefined, [1, 2]);
  kit.box('woodDark', [0.3, 2.5, 0.75], [x + 0.4, 1.25, z + 0.42], undefined, [1, 2]);
  for (let i = 0; i < 5; i += 1) {
    kit.cylinder('brass', [0.05, 0.05, 0.06, 8], [x + 0.58, 0.5 + i * 0.45, z - 0.42], [0, 0, Math.PI / 2]);
    kit.cylinder('brass', [0.05, 0.05, 0.06, 8], [x + 0.58, 0.5 + i * 0.45, z + 0.42], [0, 0, Math.PI / 2]);
  }
  // Cut seal plate on the frame.
  kit.box('sandstonePale', [0.12, 0.34, 0.34], [x + 0.42, 2.6, z + 0.86], undefined, [1, 1]);
  kit.torus('brass', [0.16, 0.025, 6, 18], [x + 0.52, 2.6, z + 0.86], [0, Math.PI / 2, 0]);
  kit.box('sandstonePale', [0.24, 0.08, 0.2], [x + 0.56, 2.6, z + 1.12], undefined, [1, 1]);
}

function buildDesk(kit: Kit, x: number, z: number) {
  kit.box('wood', [2.4, 0.14, 1.25], [x, 0.82, z], undefined, [2, 1]);
  kit.box('woodDark', [2.2, 0.5, 1.05], [x, 0.55, z], undefined, [2, 1]);
  for (const sx of [-1, 1] as const) {
    for (const sz of [-1, 1] as const) {
      kit.box('woodDark', [0.16, 0.8, 0.16], [x + sx * 1.05, 0.4, z + sz * 0.48], undefined, [1, 1]);
    }
  }
  kit.box('brass', [0.5, 0.05, 0.34], [x - 0.5, 0.9, z], undefined, [1, 1]);
  kit.cylinder('brass', [0.05, 0.07, 0.4, 10], [x - 0.5, 1.12, z], undefined, false, [1, 1]);
  kit.sphere('flame', [0.05], [x - 0.5, 1.35, z]);
  kit.box('paper', [0.6, 0.02, 0.78], [x + 0.35, 0.9, z + 0.1], [0, 0.3, 0], [1, 1]);
  kit.cylinder('paper', [0.05, 0.05, 0.7, 10], [x + 0.85, 0.96, z - 0.36], [0, 0, Math.PI / 2]);
  kit.cylinder('paper', [0.05, 0.05, 0.62, 10], [x + 0.92, 0.97, z - 0.28], [0, 0, Math.PI / 2]);
  kit.box('soot', [0.3, 0.05, 0.3], [x + 1.05, 0.9, z + 0.4], undefined, [1, 1]);
}

function buildEvidenceWall(kit: Kit, x: number, z: number) {
  kit.box('wood', [0.12, 2.4, 3.6], [x, 2.0, z], [0, Math.PI / 2, 0], [1, 2]);
  const rows = 3;
  const cols = 4;
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const y = 1.2 + r * 0.7;
      const zz = z - 1.4 + c * 0.95;
      kit.box(c % 2 === 0 ? 'paper' : 'fabricIndigo', [0.02, 0.42, 0.5], [x - 0.1, y, zz], [0, Math.PI / 2, 0], [1, 1]);
      kit.box('brass', [0.04, 0.05, 0.05], [x - 0.14, y + 0.25, zz], undefined, [1, 1]);
    }
  }
  kit.box('woodDark', [0.5, 0.1, 4.0], [x - 0.1, 3.3, z], [0, Math.PI / 2, 0], [1, 1]);
  kit.cylinder('brass', [0.08, 0.08, 0.2, 10], [x - 0.35, 3.5, z - 1.5], [0, 0, Math.PI / 2]);
  kit.cylinder('brass', [0.08, 0.08, 0.2, 10], [x - 0.35, 3.5, z + 1.5], [0, 0, Math.PI / 2]);
}
