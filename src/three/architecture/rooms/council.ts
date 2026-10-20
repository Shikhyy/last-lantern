import { Kit, starShape, type Detail, type MergedBucket } from '../kit';
import { LAYOUT } from '../layout';

const { council } = LAYOUT;

export function buildCouncil(detail: Detail): MergedBucket[] {
  const kit = new Kit(detail);
  const width = council.maxX - council.minX;
  const depth = council.maxZ - council.minZ;
  const midX = (council.minX + council.maxX) / 2;
  const midZ = (council.minZ + council.maxZ) / 2;

  // Floor with an inlaid stone medallion under the table.
  kit.box('sandstoneFloor', [width, 0.36, depth], [midX, -0.18, midZ], undefined, [width / 4, depth / 4]);
  kit.cylinder('sandstoneTile', [4.9, 4.9, 0.05, 48], [20.8, 0.025, 0], undefined, false, [7, 7]);
  kit.torus('brassDark', [4.78, 0.028, 6, 96], [20.8, 0.055, 0], [Math.PI / 2, 0, 0]);
  kit.torus('brassDark', [2.72, 0.024, 6, 96], [20.8, 0.055, 0], [Math.PI / 2, 0, 0]);
  for (let i = 0; i < 12; i += 1) {
    const angle = (i / 12) * Math.PI * 2 + Math.PI / 12;
    kit.extrude(
      'brassDark',
      starShape(4, 0.3, 0.12),
      0.03,
      [20.8 + Math.cos(angle) * 3.6, 0.05, Math.sin(angle) * 3.6],
      [0, -angle, Math.PI / 2],
      [2, 2],
      0.002,
    );
  }

  // North and south walls with jali screens between carved piers.
  for (const sign of [-1, 1] as const) {
    const z = sign < 0 ? council.minZ : council.maxZ;
    kit.wallWithArch({
      material: 'sandstoneWarm',
      width,
      height: council.height,
      depth: 0.7,
      opening: { width: 6.0, spring: 4.6, rise: 1.4, base: 1.3, lobes: 5 },
      position: [midX, 0, z],
    });
    for (let i = 0; i < 5; i += 1) {
      const x = council.minX + 1.6 + ((width - 3.2) / 4) * i;
      kit.blindArch({
        width: 2.7,
        height: 4.0,
        material: 'sandstonePale',
        position: [x, 0, z + sign * 0.42],
        rotation: [0, sign < 0 ? 0 : Math.PI, 0],
        jali: true,
      });
      kit.jaliPanel({
        width: 2.0,
        height: 1.5,
        position: [x, 4.9, z + sign * 0.46],
        rotation: [0, sign < 0 ? 0 : Math.PI, 0],
        pattern: i % 2 === 0 ? 'star' : 'floral',
      });
      kit.frieze({
        length: 2.8,
        height: 0.36,
        position: [x, 1.05, z + sign * 0.46],
        rotation: [0, sign < 0 ? 0 : Math.PI, 0],
      });
    }
  }

  // East wall behind the dais: solid stone with a deep carved niche and jali,
  // so the chamber closes properly behind the host.
  kit.box('sandstone', [0.7, council.height, depth], [council.maxX, council.height / 2, midZ], undefined, [
    depth / 2,
    council.height / 2,
  ]);
  kit.blindArch({
    width: 3.8,
    height: 5.6,
    material: 'sandstonePale',
    position: [council.maxX - 0.4, 0, midZ],
    rotation: [0, -Math.PI / 2, 0],
    jali: true,
  });
  kit.frieze({
    length: depth - 0.8,
    height: 0.5,
    position: [council.maxX - 0.42, 6.3, midZ],
    rotation: [0, -Math.PI / 2, 0],
  });
  kit.jaliPanel({
    width: 2.6,
    height: 1.1,
    position: [council.maxX - 0.44, 7.25, midZ],
    rotation: [0, -Math.PI / 2, 0],
    pattern: 'floral',
  });

  // Colonnade around the chamber, carrying a coffered ceiling.
  const columnZ = [council.minZ + 1.5, council.maxZ - 1.5];
  const columnX = [council.minX + 2.4, 24.2, council.maxX - 4.6];
  for (const x of columnX) {
    for (const z of columnZ) {
      kit.column({ height: 6.4, order: 1, radius: 0.34, position: [x, 0, z], material: 'sandstonePale' });
    }
  }
  for (const z of columnZ) {
    kit.chhajja({
      width: council.maxX - council.minX - 3.2,
      depth: 0.9,
      position: [midX, 6.55, z + (z < 0 ? 0.6 : -0.6)],
      rotation: [0, z < 0 ? 0 : Math.PI, 0],
      material: 'sandstonePale',
    });
  }

  // Ceiling: beams, coffers, and mirrored panels that catch the flame.
  kit.box('plaster', [width + 0.4, 0.5, depth + 0.4], [midX, council.height - 0.25, midZ], undefined, [8, 6]);
  if (detail.beams) {
    for (let i = 0; i <= 6; i += 1) {
      const x = council.minX + 0.7 + ((width - 1.4) / 6) * i;
      kit.box('woodDark', [0.34, 0.42, depth - 0.6], [x, council.height - 0.7, midZ], undefined, [1, depth / 2]);
    }
    for (let i = 0; i <= 3; i += 1) {
      const z = council.minZ + 0.9 + ((depth - 1.8) / 3) * i;
      kit.box('woodDark', [width - 0.6, 0.34, 0.3], [midX, council.height - 0.86, z], undefined, [width / 2, 1]);
    }
  }
  for (let i = 0; i < 5; i += 1) {
    for (let j = 0; j < 3; j += 1) {
      const x = council.minX + 4.2 + i * 3.4;
      const z = council.minZ + 3.4 + j * 3.0;
      kit.box('mirror', [2.4, 0.06, 2.0], [x, council.height - 1.06, z], undefined, [2, 2]);
      kit.frieze({ length: 2.7, height: 0.22, position: [x, council.height - 1.16, z + 1.14] });
    }
  }

  // Raised dais with the host's seat, three broad steps, and a carved canopy.
  kit.stairs({ width: 8.5, steps: 3, rise: 0.22, run: 0.46, position: [26.6, 0, 0], rotation: [0, -Math.PI / 2, 0], material: 'marble' });
  kit.box('sandstonePale', [5.4, 0.66, 8.2], [29.3, 0.33, midZ], undefined, [3, 3]);
  kit.box('sandstonePale', [5.0, 0.2, 7.8], [29.3, 0.76, midZ], undefined, [3, 3]);
  // Host seat: a carved high-backed chair under a slender stone canopy.
  kit.box('woodDark', [2.0, 0.5, 1.05], [30.2, 1.11, 0], undefined, [2, 1]);
  kit.box('fabricBurgundy', [1.84, 0.16, 0.92], [30.18, 1.44, 0], undefined, [2, 1]);
  for (const sign of [-1, 1] as const) {
    kit.cylinder('woodDark', [0.09, 0.11, 2.0, 10], [30.86, 2.2, sign * 0.76]);
    kit.box('woodDark', [1.05, 0.12, 0.16], [30.26, 1.83, sign * 0.62], undefined, [1, 1]);
    kit.cylinder('woodDark', [0.055, 0.065, 0.46, 8], [29.8, 1.58, sign * 0.6]);
  }
  kit.box('woodDark', [0.22, 1.5, 1.62], [30.88, 2.3, 0], undefined, [1, 2]);
  kit.box('fabricBurgundy', [0.1, 1.16, 1.28], [30.76, 2.28, 0], undefined, [1, 1]);
  kit.box('woodDark', [0.3, 0.2, 1.78], [30.86, 3.16, 0], undefined, [1, 1]);
  kit.box('brass', [0.12, 0.24, 0.24], [30.86, 3.38, 0]);
  kit.box('marble', [1.0, 0.16, 0.66], [29.45, 0.94, 0], undefined, [1, 1]);
  // Canopy: four slender posts, a carved abacus, a shallow dome and a finial.
  for (const sign of [-1, 1] as const) {
    for (const side of [-1, 1] as const) {
      kit.column({
        height: 2.64,
        order: 0,
        radius: 0.13,
        position: [30.5 + sign * 1.0, 0.86, side * 1.2],
        material: 'sandstonePale',
        bracket: false,
      });
    }
  }
  kit.box('sandstonePale', [2.9, 0.24, 3.2], [30.5, 3.62, 0], undefined, [2, 2]);
  kit.frieze({ length: 3.0, height: 0.3, position: [30.5, 3.56, 1.54] });
  kit.frieze({ length: 3.0, height: 0.3, position: [30.5, 3.56, -1.54], rotation: [0, Math.PI, 0] });
  kit.frieze({ length: 2.6, height: 0.3, position: [29.4, 3.56, 0], rotation: [0, Math.PI / 2, 0] });
  kit.sphere('sandstonePale', [1.5, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2], [30.5, 3.74, 0]);
  kit.cylinder('sandstonePale', [0.09, 0.15, 0.4, 10], [30.5, 5.24, 0]);
  kit.sphere('brass', [0.16, 16, 12], [30.5, 5.49, 0]);

  // Round brass table with a dark stone inlay, at seated height.
  kit.cylinder('sandstoneTile', [1.5, 1.7, 0.16, 24], [20.8, 0.08, 0], undefined, false, [2, 2]);
  kit.cylinder('brassDark', [1.15, 1.32, 0.2, 24], [20.8, 0.26, 0]);
  kit.cylinder('woodDark', [0.3, 0.36, 0.42, 16], [20.8, 0.56, 0]);
  kit.torus('brass', [0.38, 0.05, 8, 32], [20.8, 0.7, 0], [Math.PI / 2, 0, 0]);
  kit.cylinder('brass', [2.6, 2.48, 0.16, 64], [20.8, 0.68, 0], undefined, false, [6, 6]);
  kit.cylinder('marble', [2.3, 2.3, 0.06, 64], [20.8, 0.76, 0], undefined, false, [4, 4]);
  kit.torus('brass', [2.34, 0.04, 8, 96], [20.8, 0.79, 0], [Math.PI / 2, 0, 0]);
  kit.cylinder('mirror', [0.5, 0.5, 0.03, 32], [20.8, 0.8, 0]);
  for (let i = 0; i < 12; i += 1) {
    const angle = (i / 12) * Math.PI * 2;
    kit.cylinder('brassDark', [0.045, 0.055, 0.14, 10], [20.8 + Math.cos(angle) * 2.1, 0.82, Math.sin(angle) * 2.1]);
  }

  // Twelve council chairs, each turned to face the table. The ring is offset
  // by half a seat so the aisle from the entrance stays clear.
  for (let i = 0; i < LAYOUT.seats; i += 1) {
    const angle = (i / LAYOUT.seats) * Math.PI * 2 + Math.PI / LAYOUT.seats;
    const x = 20.8 + Math.cos(angle) * 4.0;
    const z = Math.sin(angle) * 4.0;
    const yaw = Math.PI / 2 - angle;
    const cos = Math.cos(yaw);
    const sin = Math.sin(yaw);
    // Local frame: +z points away from the table, so the chair back is +z.
    const at = (lx: number, lz: number): [number, number] => [x + lx * cos + lz * sin, z - lx * sin + lz * cos];
    // Solid plinth base: a darbar chair reads as one heavy form instead of
    // dissolving into a skeleton of thin bars in the low interior light.
    kit.box('wood', [0.68, 0.4, 0.62], [x, 0.2, z], [0, yaw, 0], [1, 1]);
    kit.box('sandstonePale', [0.72, 0.05, 0.66], [x, 0.425, z], [0, yaw, 0], [1, 1]);
    kit.box('fabricBurgundy', [0.62, 0.12, 0.56], [x, 0.51, z], [0, yaw, 0], [1, 1]);
    // Arms: one carved rail each side, held by a short post at the front.
    for (const lx of [-0.35, 0.35] as const) {
      kit.box('wood', [0.1, 0.09, 0.5], [...at(lx, 0.02), 0.68] as [number, number, number], [0, yaw, 0], [1, 1]);
      kit.box('wood', [0.09, 0.22, 0.09], [...at(lx, -0.2), 0.56] as [number, number, number], [0, yaw, 0], [1, 1]);
    }
    // Carved back: a full panel, a padded inset and a pale crest rail.
    kit.box('wood', [0.68, 0.95, 0.1], [...at(0, 0.3), 1.05] as [number, number, number], [0, yaw, 0], [1, 1]);
    kit.box('fabricBurgundy', [0.42, 0.5, 0.03], [...at(0, 0.24), 1.06] as [number, number, number], [0, yaw, 0], [1, 1]);
    kit.box('sandstonePale', [0.72, 0.08, 0.14], [...at(0, 0.3), 1.55] as [number, number, number], [0, yaw, 0], [1, 1]);
    if (i % 4 === 0) {
      kit.box('brass', [0.24, 0.06, 0.03], [...at(0, 0.24), 1.55] as [number, number, number], [0, yaw, 0], [1, 1]);
    }
  }

  // Table props: a runner, the Lantern codex, ink, and cups.
  kit.box('fabricBurgundy', [2.2, 0.04, 1.2], [20.8, 0.81, 0], [0, 0.2, 0], [1, 1]);
  kit.box('paper', [1.1, 0.04, 0.8], [20.8, 0.84, 0], [0, 0.2, 0], [1, 1]);
  for (let i = 0; i < 6; i += 1) {
    const angle = (i / 6) * Math.PI * 2 + 0.3;
    kit.cylinder('brass', [0.07, 0.09, 0.11, 12], [20.8 + Math.cos(angle) * 1.7, 0.85, Math.sin(angle) * 1.7]);
  }

  return kit.merge();
}
