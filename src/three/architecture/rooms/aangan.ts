import { Kit, starShape, type Detail, type MergedBucket } from '../kit';
import { LAYOUT } from '../layout';

const { courtyard } = LAYOUT;

/** Ground, water infrastructure, the Last Lantern plinth, seats and the arcade. */
export function buildAangan(detail: Detail): MergedBucket[] {
  const kit = new Kit(detail);
  const {
    outerHalfX,
    outerHalfZ,
    openHalfX,
    openHalfZ,
    firstFloorY,
    roofY,
    parapetHeight,
  } = courtyard;

  // ---------------------------------------------------------------------------
  // Ground and water
  // ---------------------------------------------------------------------------
  kit.box('sandstoneFloor', [outerHalfX * 2, 0.34, outerHalfZ * 2], [0, -0.17, 0], undefined, [
    outerHalfX / 2,
    outerHalfZ / 2,
  ]);
  kit.box('sandstoneTile', [openHalfX * 2 + 1.4, 0.1, openHalfZ * 2 + 1.4], [0, 0.05, 0], undefined, [
    openHalfX / 1.5,
    openHalfZ / 1.5,
  ]);
  // Broad inlaid border and wear path.
  const border = 0.55;
  for (const sign of [-1, 1] as const) {
    kit.box('sandstonePale', [openHalfX * 2 + 0.6, 0.05, border], [0, 0.09, sign * (openHalfZ + 0.35)]);
    kit.box('sandstonePale', [border, 0.05, openHalfZ * 2 + 0.6], [sign * (openHalfX + 0.35), 0.09, 0]);
  }
  kit.box('darkStone', [5.4, 0.06, 12.8], [0, 0.08, 0], undefined, [4, 8]);
  kit.box('sandstoneTile', [3.2, 0.035, 12.8], [0, 0.1, 0], undefined, [2, 8]);

  // Shallow water channel, engineered and scarce.
  for (const sign of [-1, 1] as const) {
    const start = 2.9;
    const length = openHalfX - start - 0.6;
    kit.box('darkStone', [length, 0.28, 0.95], [sign * (start + length / 2), -0.04, 0], undefined, [length / 2, 1]);
    kit.box('sandstoneTile', [length, 0.1, 0.2], [sign * (start + length / 2), 0.1, 0.48], undefined, [length / 2, 0.4]);
    kit.box('sandstoneTile', [length, 0.1, 0.2], [sign * (start + length / 2), 0.1, -0.48], undefined, [length / 2, 0.4]);
  }

  // ---------------------------------------------------------------------------
  // Fountain — low octagonal basin, carved rim, lotus pedestal.
  // ---------------------------------------------------------------------------
  // Hollow octagonal basin: eight wall segments, a moulded rim and a dark floor,
  // with the water surface sitting below the rim (see AanganRoom).
  const basinRadius = 2.6;
  const basinApothem = basinRadius * Math.cos(Math.PI / 8);
  const basinSide = 2 * basinRadius * Math.sin(Math.PI / 8);
  for (let i = 0; i < 8; i += 1) {
    const angle = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const cx = Math.cos(angle) * (basinApothem + 0.2);
    const cz = Math.sin(angle) * (basinApothem + 0.2);
    const yaw = -angle - Math.PI / 2;
    kit.box('sandstoneFloor', [basinSide + 0.18, 0.36, 0.4], [cx, 0.18, cz], [0, yaw, 0], [2, 1]);
    kit.box('sandstonePale', [basinSide + 0.22, 0.18, 0.48], [cx, 0.45, cz], [0, yaw, 0], [2, 1]);
    kit.box('sandstonePale', [basinSide + 0.02, 0.1, 0.32], [cx, 0.59, cz], [0, yaw, 0], [2, 1]);
    kit.sphere('brass', [0.05, 10, 8], [Math.cos(angle) * (basinApothem + 0.3), 0.67, Math.sin(angle) * (basinApothem + 0.3)]);
  }
  kit.cylinder('darkStone', [2.3, 2.3, 0.06, 8], [0, 0.03, 0], undefined, false, [3, 1]);

  // ---------------------------------------------------------------------------
  // The Last Lantern: a carved drum rising out of the basin, twelve seats round it.
  // ---------------------------------------------------------------------------
  kit.cylinder('sandstone', [0.86, 0.98, 0.64, 8], [0, 0.79, 0], undefined, false, [2, 1]);
  kit.cylinder('sandstonePale', [1.1, 1.2, 0.16, 8], [0, 1.19, 0], undefined, false, [2, 1]);
  kit.cylinder('sandstone', [0.98, 1.06, 0.22, 8], [0, 1.38, 0], undefined, false, [2, 1]);
  kit.cylinder('sandstonePale', [1.02, 0.94, 0.14, 8], [0, 1.56, 0], undefined, false, [2, 1]);
  for (let i = 0; i < 8; i += 1) {
    const angle = (i / 8) * Math.PI * 2;
    kit.extrude('sandstonePale', starShape(4, 0.13, 0.055), 0.03, [Math.cos(angle) * 0.74, 1.63, Math.sin(angle) * 0.74], [0, -angle, 0], [2, 2], 0.004);
  }
  for (let i = 0; i < LAYOUT.seats; i += 1) {
    const angle = (i / LAYOUT.seats) * Math.PI * 2 + Math.PI / LAYOUT.seats;
    const x = Math.cos(angle) * 4.8;
    const z = Math.sin(angle) * 4.8;
    const yaw = -angle + Math.PI / 2;
    kit.cylinder('sandstonePale', [0.46, 0.54, 0.3, 8], [x, 0.15, z], [0, yaw, 0], false, [1, 1]);
    kit.cylinder('sandstone', [0.4, 0.46, 0.16, 8], [x, 0.38, z], [0, yaw, 0], false, [1, 1]);
    kit.cylinder('fabricBurgundy', [0.42, 0.42, 0.12, 16], [x, 0.51, z], [0, yaw, 0], false, [1, 1]);
    kit.box('fabricBurgundy', [0.78, 0.09, 0.7], [x, 0.56, z], [0, yaw, 0], [1, 1]);
    kit.extrude('sandstonePale', starShape(6, 0.2, 0.09), 0.06, [x, 0.07, z], [0, yaw, 0], [2, 2], 0.004);
  }

  // ---------------------------------------------------------------------------
  // The four facades: ground wall, verandah, upper storey, jharokhas, roof.
  // ---------------------------------------------------------------------------
  for (const side of ['north', 'south', 'east', 'west'] as const) {
    buildFacade(kit, side, detail);
  }

  // Colonnade and its arches.
  buildColonnade(kit, detail);

  // Verandah ceilings and the first-floor slab.
  const slab = 0.3;
  kit.box('plaster', [outerHalfX * 2, slab, outerHalfZ - openHalfZ], [0, firstFloorY - slab / 2, -(openHalfZ + outerHalfZ) / 2], undefined, [8, 2]);
  kit.box('plaster', [outerHalfX * 2, slab, outerHalfZ - openHalfZ], [0, firstFloorY - slab / 2, (openHalfZ + outerHalfZ) / 2], undefined, [8, 2]);
  kit.box('plaster', [outerHalfX - openHalfX, slab, openHalfZ * 2], [-(openHalfX + outerHalfX) / 2, firstFloorY - slab / 2, 0], undefined, [3, 4]);
  kit.box('plaster', [outerHalfX - openHalfX, slab, openHalfZ * 2], [(openHalfX + outerHalfX) / 2, firstFloorY - slab / 2, 0], undefined, [3, 4]);
  // Verandah rib beams.
  for (let i = -4; i <= 4; i += 1) {
    const z = (i / 4) * openHalfZ;
    kit.box('woodDark', [outerHalfX - openHalfX, 0.18, 0.24], [-(openHalfX + outerHalfX) / 2, firstFloorY - slab - 0.09, z], undefined, [3, 1]);
    kit.box('woodDark', [outerHalfX - openHalfX, 0.18, 0.24], [(openHalfX + outerHalfX) / 2, firstFloorY - slab - 0.09, z], undefined, [3, 1]);
  }
  for (let i = -4; i <= 4; i += 1) {
    const x = (i / 4) * openHalfX;
    kit.box('woodDark', [0.24, 0.18, outerHalfZ - openHalfZ], [x, firstFloorY - slab - 0.09, -(openHalfZ + outerHalfZ) / 2], undefined, [1, 3]);
    kit.box('woodDark', [0.24, 0.18, outerHalfZ - openHalfZ], [x, firstFloorY - slab - 0.09, (openHalfZ + outerHalfZ) / 2], undefined, [1, 3]);
  }

  // Roof slab and parapet.
  kit.box('sandstoneFloor', [outerHalfX * 2 + 0.6, 0.4, outerHalfZ * 2 + 0.6], [0, roofY - 0.2, 0], undefined, [10, 8]);
  for (const sign of [-1, 1] as const) {
    kit.parapet({ length: outerHalfX * 2 + 0.6, height: parapetHeight, position: [0, roofY, sign * (outerHalfZ + 0.3)], rotation: [0, 0, 0] });
    kit.parapet({ length: outerHalfZ * 2 + 0.6, height: parapetHeight, position: [sign * (outerHalfX + 0.3), roofY, 0], rotation: [0, Math.PI / 2, 0] });
  }
  // Four corner chhatris and two gate pavilions.
  for (const sx of [-1, 1] as const) {
    for (const sz of [-1, 1] as const) {
      kit.chhatri({ radius: 1.75, height: 2.7, position: [sx * (outerHalfX - 2.1), roofY, sz * (outerHalfZ - 1.8)] });
    }
  }
  kit.chhatri({ radius: 2.1, height: 3.1, position: [0, roofY, -(outerHalfZ + 1.9)] });
  kit.chhatri({ radius: 2.1, height: 3.1, position: [0, roofY, outerHalfZ + 1.9] });
  // A second terrace mass behind the north facade, so the palace has depth.
  kit.box('sandstone', [12, 6.4, 7], [0, roofY - 0.4, -(outerHalfZ + 3.6)], undefined, [4, 2]);
  kit.chhatri({ radius: 2.4, height: 3.4, position: [-3.4, roofY + 5.8, -(outerHalfZ + 3.6)] });
  kit.chhatri({ radius: 2.4, height: 3.4, position: [3.4, roofY + 5.8, -(outerHalfZ + 3.6)] });
  kit.frieze({ length: 11.4, height: 0.55, position: [0, roofY + 5.4, -(outerHalfZ + 0.2)] });
  kit.box('sandstone', [10.5, 5.6, 6], [0, roofY - 0.6, outerHalfZ + 3.2], undefined, [3, 2]);
  kit.chhatri({ radius: 2.2, height: 3.2, position: [0, roofY + 5.0, outerHalfZ + 3.2] });

  return kit.merge();
}

function buildFacade(kit: Kit, side: 'north' | 'south' | 'east' | 'west', detail: Detail) {
  const { outerHalfX, outerHalfZ, wallThickness, arcadeHeight, firstFloorY, roofY, gateHalfWidth, gateSpring, gateRise } = courtyard;
  const horizontal = side === 'north' || side === 'south';
  const width = horizontal ? outerHalfX * 2 : outerHalfZ * 2;
  const sign = side === 'north' || side === 'west' ? -1 : 1;
  const z = side === 'north' ? -outerHalfZ : side === 'south' ? outerHalfZ : 0;
  const x = side === 'west' ? -outerHalfX : side === 'east' ? outerHalfX : 0;
  const rotationY = side === 'north' ? 0 : side === 'south' ? Math.PI : side === 'west' ? -Math.PI / 2 : Math.PI / 2;
  const position: [number, number, number] = horizontal ? [0, 0, z] : [x, 0, 0];
  const inward = { north: [0, Math.PI, 0], south: [0, 0, 0], west: [0, -Math.PI / 2, 0], east: [0, Math.PI / 2, 0] }[side] as [number, number, number];

  // Ground storey with the ceremonial opening.
  kit.wallWithArch({
    material: 'sandstone',
    width,
    height: arcadeHeight,
    depth: wallThickness,
    opening: { width: gateHalfWidth * 2, spring: gateSpring, rise: gateRise, base: 0, lobes: 7 },
    position,
    rotation: [0, rotationY, 0],
  });
  kit.archFrame({
    material: 'sandstonePale',
    width: gateHalfWidth * 2,
    spring: gateSpring,
    rise: gateRise,
    base: 0,
    position: horizontal ? [0, 0, z + sign * 0.36] : [x + sign * 0.36, 0, 0],
    rotation: [0, rotationY, 0],
    lobes: 7,
    radii: [0.22, 0.14, 0.08],
  });
  // Two guarded side doors, in blind arches.
  const sideDoorOffset = horizontal ? outerHalfX * 0.58 : outerHalfZ * 0.58;
  for (const dir of [-1, 1] as const) {
    const offset = dir * sideDoorOffset;
    const blindPosition: [number, number, number] = horizontal
      ? [offset, 0, z + sign * 0.4]
      : [x + sign * 0.4, 0, offset];
    kit.blindArch({
      width: horizontal ? 2.6 : 2.6,
      height: 3.9,
      material: 'sandstonePale',
      position: blindPosition,
      rotation: [0, rotationY, 0],
      jali: true,
    });
    kit.box('woodDark', [1.4, 2.7, 0.2], horizontal ? [offset, 1.35, z + sign * 0.5] : [x + sign * 0.5, 1.35, offset], [0, rotationY, 0]);
  }

  // Upper storey — carved wall, jali windows and blind arches.
  kit.wallWithArch({
    material: 'sandstoneWarm',
    width,
    height: roofY - firstFloorY,
    depth: wallThickness,
    opening: { width: gateHalfWidth * 1.2, spring: 1.5, rise: 1.0, base: 1.25, lobes: 5 },
    position: [position[0], firstFloorY, position[2]],
    rotation: [0, rotationY, 0],
  });
  const bays = 5;
  for (let i = 0; i < bays; i += 1) {
    const offset = -width / 2 + (width / bays) * (i + 0.5);
    const distanceFromGate = Math.abs(offset);
    if (distanceFromGate < 3.1) continue;
    const bayPosition: [number, number, number] = horizontal
      ? [offset, firstFloorY, z + sign * 0.42]
      : [x + sign * 0.42, firstFloorY, offset];
    kit.blindArch({
      width: 2.3,
      height: 3.1,
      material: 'sandstonePale',
      position: bayPosition,
      rotation: [0, rotationY, 0],
      jali: true,
    });
    kit.jaliPanel({
      width: 1.5,
      height: 1.1,
      position: horizontal ? [offset, firstFloorY + 1.25, z + sign * 0.56] : [x + sign * 0.56, firstFloorY + 1.25, offset],
      rotation: [0, rotationY, 0],
      pattern: i % 2 === 0 ? 'star' : 'diamond',
    });
  }

  // A jharokha per side — the projecting oriel that gives the haveli silhouette.
  const jharokhaOffset = horizontal ? (outerHalfX * 0.46) : (outerHalfZ * 0.46);
  const project = 0.78;
  const jharokhaPos: [number, number, number] = horizontal
    ? [0, firstFloorY + 0.55, z - sign * project]
    : [x - sign * project, firstFloorY + 0.55, 0];
  kit.jharokha({
    width: 2.3,
    height: 2.7,
    depth: 0.95,
    position: jharokhaPos,
    rotation: inward,
    material: 'sandstonePale',
    jali: 'star',
  });
  for (const dir of [-1, 1] as const) {
    const offset = dir * jharokhaOffset;
    const pos: [number, number, number] = horizontal
      ? [offset, firstFloorY + 0.65, z - sign * (project * 0.7)]
      : [x - sign * (project * 0.7), firstFloorY + 0.65, offset];
    kit.jharokha({
      width: 1.8,
      height: 2.25,
      depth: 0.78,
      position: pos,
      rotation: inward,
      material: 'sandstonePale',
      jali: dir < 0 ? 'diamond' : 'chevron',
    });
  }

  // Entablature, frieze and chhajja along the verandah edge.
  kit.frieze({
    length: width - 0.4,
    height: 0.42,
    position: horizontal ? [0, arcadeHeight - 0.55, z + sign * 0.28] : [x + sign * 0.28, arcadeHeight - 0.55, 0],
    rotation: [0, rotationY, 0],
  });
  kit.chhajja({
    width: width - 0.2,
    depth: 1.05,
    position: horizontal ? [0, firstFloorY - 0.15, z + sign * 0.62] : [x + sign * 0.62, firstFloorY - 0.15, 0],
    rotation: [0, side === 'north' ? Math.PI : side === 'south' ? 0 : side === 'west' ? -Math.PI / 2 : Math.PI / 2, 0],
    material: 'sandstonePale',
  });

  // Small carved base course to resist the wall and catch light.
  kit.box('darkStone', [width, 0.4, wallThickness + 0.14], [position[0], 0.2, position[2]], [0, rotationY, 0], [width / 3, 1]);
  if (detail.fine) {
    kit.frieze({
      length: width - 1.4,
      height: 0.3,
      position: horizontal ? [0, 4.55, z + sign * 0.34] : [x + sign * 0.34, 4.55, 0],
      rotation: [0, rotationY, 0],
    });
  }
}

function buildColonnade(kit: Kit, detail: Detail) {
  const { openHalfX, openHalfZ, firstFloorY } = courtyard;
  const spacing = 3.1;
  const columnHeight = 3.75;
  const addRun = (
    axis: 'x' | 'z',
    fixed: number,
    from: number,
    to: number,
    inwardRotation: [number, number, number],
  ) => {
    const count = Math.max(2, Math.round((to - from) / spacing) + 1);
    const points: number[] = [];
    for (let i = 0; i < count; i += 1) {
      const value = from + ((to - from) / (count - 1)) * i;
      points.push(value);
    }
    for (const value of points) {
      const position: [number, number, number] = axis === 'x' ? [value, 0, fixed] : [fixed, 0, value];
      kit.column({ height: columnHeight, order: 0, position, material: 'sandstonePale' });
    }
    for (let i = 0; i < points.length - 1; i += 1) {
      const a = points[i];
      const b = points[i + 1];
      const mid = (a + b) / 2;
      const width = Math.abs(b - a) - 0.18;
      const position: [number, number, number] = axis === 'x' ? [mid, 0, fixed] : [fixed, 0, mid];
      if (Math.abs(mid) < 3.4 && axis !== 'x') continue;
      kit.archFrame({
        material: 'sandstonePale',
        width,
        spring: 3.0,
        rise: 1.05,
        base: 0,
        position,
        rotation: inwardRotation,
        lobes: 5,
        radii: [0.15, 0.09],
      });
    }
  };

  addRun('x', -openHalfZ, -openHalfX, openHalfX, [0, 0, 0]);
  addRun('x', openHalfZ, -openHalfX, openHalfX, [0, Math.PI, 0]);
  addRun('z', -openHalfX, -openHalfZ, openHalfZ, [0, Math.PI / 2, 0]);
  addRun('z', openHalfX, -openHalfZ, openHalfZ, [0, -Math.PI / 2, 0]);

  // Grand arches over the two ceremonial gates.
  kit.archFrame({
    material: 'sandstonePale',
    width: 7.4,
    spring: 3.4,
    rise: 1.35,
    base: 0,
    position: [0, 0, -openHalfZ],
    lobes: 7,
    radii: [0.2, 0.12, 0.07],
  });
  kit.archFrame({
    material: 'sandstonePale',
    width: 7.4,
    spring: 3.4,
    rise: 1.35,
    base: 0,
    position: [0, 0, openHalfZ],
    rotation: [0, Math.PI, 0],
    lobes: 7,
    radii: [0.2, 0.12, 0.07],
  });
  kit.archFrame({
    material: 'sandstonePale',
    width: 6.4,
    spring: 3.3,
    rise: 1.25,
    base: 0,
    position: [-openHalfX, 0, 0],
    rotation: [0, Math.PI / 2, 0],
    lobes: 5,
    radii: [0.2, 0.12, 0.07],
  });
  kit.archFrame({
    material: 'sandstonePale',
    width: 6.4,
    spring: 3.3,
    rise: 1.25,
    base: 0,
    position: [openHalfX, 0, 0],
    rotation: [0, -Math.PI / 2, 0],
    lobes: 5,
    radii: [0.2, 0.12, 0.07],
  });

  // Arcade beam and frieze.
  for (const axis of ['x', 'z'] as const) {
    for (const sign of [-1, 1] as const) {
      const length = axis === 'x' ? openHalfX * 2 : openHalfZ * 2;
      const position: [number, number, number] = axis === 'x' ? [0, 0, sign * openHalfZ] : [sign * openHalfX, 0, 0];
      kit.frieze({
        length,
        height: 0.36,
        position: [position[0], 4.32, position[2]],
        rotation: [0, axis === 'x' ? 0 : Math.PI / 2, 0],
      });
      kit.box(
        'sandstonePale',
        axis === 'x' ? [length, 0.34, 0.5] : [0.5, 0.34, length],
        [position[0], 4.55, position[2]],
        [0, axis === 'x' ? 0 : Math.PI / 2, 0],
        axis === 'x' ? [length / 2, 1] : [length / 2, 1],
      );
    }
  }
  if (detail.fine) {
    for (const axis of ['x', 'z'] as const) {
      for (const sign of [-1, 1] as const) {
        const length = axis === 'x' ? openHalfX * 2 : openHalfZ * 2;
        const position: [number, number, number] = axis === 'x' ? [0, 0, sign * openHalfZ] : [sign * openHalfX, 0, 0];
        kit.box(
          'sandstone',
          axis === 'x' ? [length, firstFloorY - 4.72, 0.36] : [0.36, firstFloorY - 4.72, length],
          [position[0], 4.72 + (firstFloorY - 4.72) / 2, position[2]],
          [0, axis === 'x' ? 0 : Math.PI / 2, 0],
          [length / 2, 1],
        );
      }
    }
  }
}

