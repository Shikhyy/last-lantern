import { Kit, type Detail, type MergedBucket } from '../kit';
import { LAYOUT } from '../layout';

const { gallery } = LAYOUT;

export function buildGallery(detail: Detail): MergedBucket[] {
  const kit = new Kit(detail);
  const { halfWidth, startZ, endZ, height, bay, niches, lightCourtWidth } = gallery;
  const length = startZ - endZ;
  const midZ = (startZ + endZ) / 2;
  const wallMaterial = 'sandstoneWarm';

  // Floor and carpet.
  kit.box('sandstoneFloor', [halfWidth * 2 + 0.4, 0.3, length + 0.6], [0, -0.15, midZ], undefined, [2.6, length / 4.2]);
  kit.box('fabricBurgundy', [1.7, 0.04, length - 2.4], [0, 0.17, midZ], undefined, [1.2, length / 1.2]);
  kit.box('fabricIvory', [1.9, 0.02, length - 2.4], [0, 0.165, midZ], undefined, [1.2, length / 1.2]);

  // West wall, carved and pierced, with the twelve portrait niches.
  kit.wallWithArch({
    material: wallMaterial,
    width: length,
    height,
    depth: 0.56,
    opening: { width: 1, spring: 0.5, rise: 0.2, base: 0, lobes: 3 },
    position: [-halfWidth, 0, midZ],
    rotation: [0, Math.PI / 2, 0],
  });
  // A solid backing so the opening above reads as carved stone, not a hole into nothing.
  kit.box('darkStone', [0.2, height, length], [-halfWidth - 0.32, height / 2, midZ], undefined, [1, length / 3]);
  kit.box('sandstoneWarm', [halfWidth * 2, 0.42, length], [0, 0.21, midZ], undefined, [4, length / 4]);

  for (let i = 0; i < niches; i += 1) {
    const z = startZ - 3.3 - i * (length - 5.4) / (niches - 1);
    buildPortraitNiches(kit, z, i);
  }

  // East arcade to the light court: real arches between deep piers.
  for (let i = 0; i < 12; i += 1) {
    const z = startZ - bay / 2 - i * bay;
    kit.wallWithArch({
      material: wallMaterial,
      width: bay,
      height,
      depth: 0.5,
      opening: { width: bay - 0.8, spring: 2.85, rise: 0.95, base: 0.55, lobes: 5 },
      position: [halfWidth, 0, z],
      rotation: [0, -Math.PI / 2, 0],
    });
    kit.archFrame({
      material: 'sandstonePale',
      width: bay - 0.8,
      spring: 2.85,
      rise: 0.95,
      base: 0.55,
      position: [halfWidth - 0.3, 0, z],
      rotation: [0, -Math.PI / 2, 0],
      lobes: 5,
      radii: [0.13, 0.08],
    });
    kit.column({ height: 3.1, order: 1, radius: 0.2, position: [halfWidth - 0.05, 0.5, z - bay / 2], material: 'sandstonePale', bracket: false });
    kit.frieze({ length: bay, height: 0.3, position: [halfWidth - 0.25, 4.55, z], rotation: [0, -Math.PI / 2, 0] });
  }

  // Light court: engraved parapet, water trough and a jali screen that rakes light.
  const courtMid = (gallery.lightCourtStart + gallery.lightCourtEnd) / 2;
  const courtLength = gallery.lightCourtStart - gallery.lightCourtEnd;
  kit.box('sandstoneFloor', [lightCourtWidth, 0.28, courtLength + 1], [halfWidth + 0.6 + lightCourtWidth / 2, -0.14, courtMid], undefined, [2, courtLength / 3]);
  kit.box('darkStone', [1.1, 0.22, courtLength - 4], [halfWidth + 1.6, -0.06, courtMid], undefined, [1, courtLength / 3]);
  kit.box('sandstonePale', [1.3, 0.16, courtLength - 4], [halfWidth + 1.6, 0.06, courtMid], undefined, [1, courtLength / 3]);
  kit.box('sandstonePale', [lightCourtWidth + 0.4, 0.24, courtLength + 1], [halfWidth + 0.6 + lightCourtWidth / 2, 0.12, courtMid], undefined, [2, courtLength / 3]);
  kit.parapet({ length: courtLength, height: 0.9, position: [halfWidth + 0.6 + lightCourtWidth, 0.2, courtMid], rotation: [0, Math.PI / 2, 0] });

  // Outer pierced screen on the east side of the light court.
  const screenX = halfWidth + 0.6 + lightCourtWidth;
  for (let i = 0; i < 14; i += 1) {
    const z = gallery.lightCourtStart - 1.4 - i * 2.9;
    kit.wallWithArch({
      material: wallMaterial,
      width: 2.9,
      height,
      depth: 0.5,
      opening: { width: 2.15, spring: 2.9, rise: 0.75, base: 1.35, lobes: 5 },
      position: [screenX, 0, z],
      rotation: [0, Math.PI / 2, 0],
    });
    kit.jaliPanel({
      width: 2.05,
      height: 1.65,
      position: [screenX - 0.3, 2.35, z],
      rotation: [0, -Math.PI / 2, 0],
      pattern: i % 3 === 0 ? 'star' : i % 3 === 1 ? 'diamond' : 'calligraphic',
    });
    kit.archFrame({
      material: 'sandstonePale',
      width: 2.15,
      spring: 2.9,
      rise: 0.75,
      base: 1.35,
      position: [screenX - 0.3, 0, z],
      rotation: [0, -Math.PI / 2, 0],
      lobes: 5,
      radii: [0.11, 0.06],
    });
    kit.column({ height: 3.2, order: 2, radius: 0.16, position: [screenX - 0.08, 1.1, z - 1.45], material: 'sandstonePale', bracket: false });
  }

  // Roof, beams and brackets over the colonnade.
  kit.box('sandstoneFloor', [halfWidth * 2 + 1.2, 0.42, length + 0.6], [halfWidth - 0.2, height - 0.21, midZ], undefined, [4, length / 4]);
  if (detail.beams) {
    for (let i = 0; i <= 13; i += 1) {
      const z = startZ - 0.4 - i * (length - 1) / 13;
      kit.box('woodDark', [halfWidth * 2 + 0.8, 0.26, 0.3], [halfWidth - 0.1, height - 0.55, z], undefined, [3, 1]);
      for (const sign of [-1, 1] as const) {
        kit.bracket({
          size: 0.55,
          position: [sign * (halfWidth - 0.25), height - 1.05, z],
          rotation: [0, sign > 0 ? Math.PI : 0, 0],
          material: 'sandstonePale',
        });
      }
    }
    kit.box('plaster', [halfWidth * 2 + 1.2, 0.16, length + 0.6], [halfWidth - 0.2, height - 0.78, midZ], undefined, [4, length / 4]);
  }
  // Clerestory jali above the west niches.
  for (let i = 0; i < 12; i += 1) {
    const z = startZ - bay / 2 - i * bay;
    kit.jaliPanel({
      width: 2.1,
      height: 0.75,
      position: [-halfWidth + 0.34, height - 1.15, z],
      rotation: [0, Math.PI / 2, 0],
      pattern: i % 2 === 0 ? 'diamond' : 'chevron',
      frame: false,
      depth: 0.12,
    });
  }

  // The mirrored bay.
  buildMirroredBay(kit, midZ - 6.2);

  // The end arch and the terrace chhatri that closes the vista.
  kit.wallWithArch({
    material: wallMaterial,
    width: halfWidth * 2 + 0.6,
    height,
    depth: 0.6,
    opening: { width: 3.4, spring: 2.9, rise: 1.3, base: 0, lobes: 7 },
    position: [0, 0, endZ],
  });
  kit.archFrame({
    material: 'sandstonePale',
    width: 3.4,
    spring: 2.9,
    rise: 1.3,
    base: 0,
    position: [0, 0, endZ + 0.32],
    lobes: 7,
    radii: [0.18, 0.11, 0.06],
  });
  kit.box('sandstoneFloor', [8, 0.3, 5], [0, -0.15, endZ - 2.5], undefined, [3, 2]);
  kit.chhatri({ radius: 2.3, height: 3.2, position: [0, 0.2, endZ - 4.1] });
  return kit.merge();
}

function buildPortraitNiches(kit: Kit, z: number, index: number) {
  const x = -3 + 0.34;
  const recess = 0.34;
  kit.box('soot', [recess, 1.6, 1.12], [x - 0.06, 1.95, z], undefined, [1, 1]);
  kit.wallWithArch({
    material: 'sandstonePale',
    width: 1.55,
    height: 2.6,
    depth: 0.2,
    opening: { width: 1.05, spring: 1.85, rise: 0.55, base: 0.9, lobes: 5 },
    position: [x + 0.1, 0.55, z],
    rotation: [0, Math.PI / 2, 0],
  });
  kit.archFrame({
    material: 'sandstonePale',
    width: 1.05,
    spring: 1.85,
    rise: 0.55,
    base: 0.9,
    position: [x + 0.2, 0.55, z],
    rotation: [0, Math.PI / 2, 0],
    lobes: 5,
    radii: [0.1, 0.055],
  });
  kit.jaliPanel({
    width: 0.92,
    height: 0.5,
    position: [x + 0.18, 1.2, z],
    rotation: [0, Math.PI / 2, 0],
    pattern: 'star',
    frame: false,
    depth: 0.1,
  });
  kit.box('sandstonePale', [0.24, 0.16, 1.2], [x + 0.16, 0.5, z], undefined, [1, 1]);
  kit.cylinder('brass', [0.1, 0.1, 0.04, 12], [x + 0.26, 0.44, z], [0, 0, Math.PI / 2]);
  if (index % 3 === 0) {
    kit.box('fabricIndigo', [0.12, 1.5, 1.0], [x - 0.28, 1.95, z], undefined, [1, 1]);
    kit.torus('brassDark', [0.12, 0.02, 6, 14], [x - 0.35, 2.55, z], [0, 0, 0]);
  }
  kit.box('sandstonePale', [0.5, 0.36, 1.5], [x + 0.05, 0.18, z], undefined, [1, 1]);
}

function buildMirroredBay(kit: Kit, z: number) {
  const x = -3;
  kit.wallWithArch({
    material: 'sandstonePale',
    width: 4.4,
    height: 4.4,
    depth: 0.4,
    opening: { width: 3.1, spring: 2.5, rise: 1.0, base: 0.35, lobes: 7 },
    position: [x + 0.2, 0, z],
    rotation: [0, Math.PI / 2, 0],
  });
  kit.archFrame({
    material: 'sandstonePale',
    width: 3.1,
    spring: 2.5,
    rise: 1.0,
    base: 0.35,
    position: [x + 0.4, 0, z],
    rotation: [0, Math.PI / 2, 0],
    lobes: 7,
    radii: [0.14, 0.08],
  });
  const cols = 3;
  const rows = 3;
  for (let cx = 0; cx < cols; cx += 1) {
    for (let cy = 0; cy < rows; cy += 1) {
      const y = 1.25 + cy * 0.85;
      const zz = z - 0.9 + cx * 0.9;
      kit.box('mirror', [0.08, 0.66, 0.66], [x - 0.05, y, zz], undefined, [1, 1]);
      kit.box('brassDark', [0.12, 0.78, 0.08], [x - 0.02, y, zz - 0.4], undefined, [1, 1]);
      kit.box('brassDark', [0.12, 0.08, 0.78], [x - 0.02, y + 0.37, zz], undefined, [1, 1]);
    }
  }
  kit.box('sandstonePale', [0.7, 0.5, 2.2], [x + 0.1, 0.25, z], undefined, [1, 1]);
  kit.frieze({ length: 3.4, height: 0.34, position: [x + 0.32, 3.85, z], rotation: [0, Math.PI / 2, 0] });
  kit.box('fabricBurgundy', [0.4, 0.12, 1.5], [x - 0.2, 0.24, z], undefined, [1, 1]);
}
