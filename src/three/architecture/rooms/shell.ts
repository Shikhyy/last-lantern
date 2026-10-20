import { Kit, type Detail, type MergedBucket } from '../kit';
import { LAYOUT } from '../layout';

const { outerHalfX, outerHalfZ } = LAYOUT.courtyard;

/**
 * The exterior massing and the desert that Nimbagarh stands in.
 *
 * This is what gives the courtyard real depth: a continuous stone terrace
 * under every wing, a defended outer circuit facing the desert, corner towers
 * that break the skyline, and a horizon that never ends in empty air. Nothing
 * here is a decorative backdrop standing in for a room — the circuit walls are
 * offset from the courtyard walls so the palace reads as a walled complex with
 * a perimeter walk, and the long gallery wing passes out through the north gate.
 */
export function buildShell(detail: Detail): MergedBucket[] {
  const kit = new Kit(detail);

  // One continuous terrace under courtyard, gallery wing and both side rooms.
  // Its top sits fractionally below the courtyard floor so the paving wins.
  kit.box('sandstoneFloor', [65, 1.5, 71], [1, -0.77, -22.5], undefined, [16, 18]);
  kit.box('sandstone', [65.6, 0.5, 71.6], [1, -1.42, -22.5], undefined, [16, 18]);

  const towerX = outerHalfX + 4.5;
  const towerZ = outerHalfZ + 4;

  // Four corner towers, rising above the parapet so the silhouette reads as a fort.
  for (const sx of [-1, 1] as const) {
    for (const sz of [-1, 1] as const) {
      const x = sx * towerX;
      const z = sz * towerZ;
      kit.cylinder('sandstoneWarm', [2.5, 2.95, 16.5, 12], [x, 8.25, z], undefined, false, [3, 7]);
      kit.cylinder('sandstonePale', [3.0, 3.0, 0.5, 12], [x, 16.75, z], undefined, false, [3, 1]);
      kit.cylinder('sandstonePale', [2.75, 3.0, 0.42, 12], [x, 17.25, z], undefined, false, [3, 1]);
      kit.chhatri({ radius: 2.15, height: 3.0, position: [x, 17.45, z], material: 'sandstonePale' });
    }
  }

  // North and south curtain walls, running tower to tower with a gate on each
  // face. The north gate is where the long gallery leaves the courtyard.
  const curtainLength = towerX * 2;
  for (const sign of [-1, 1] as const) {
    const z = sign * towerZ;
    kit.wallWithArch({
      material: 'sandstoneWarm',
      width: curtainLength,
      height: 8.6,
      depth: 1.3,
      opening: { width: 8.0, spring: 3.9, rise: 1.2, base: 0, lobes: 5 },
      position: [0, 0, z],
      rotation: [0, sign < 0 ? Math.PI : 0, 0],
    });
    kit.archFrame({
      material: 'sandstonePale',
      width: 8.0,
      spring: 3.9,
      rise: 1.2,
      base: 0,
      position: [0, 0, z + (sign < 0 ? 0.75 : -0.75)],
      rotation: [0, sign < 0 ? Math.PI : 0, 0],
      lobes: 5,
      radii: [0.24, 0.14, 0.08],
    });
    kit.parapet({
      length: curtainLength,
      height: 1.25,
      position: [0, 8.6, z],
      rotation: [0, 0, 0],
      merlons: 30,
    });
    // A string course and jali band give the long wall some scale.
    kit.frieze({ length: curtainLength - 1, height: 0.34, position: [0, 6.6, z + (sign < 0 ? 0.72 : -0.72)], rotation: [0, sign < 0 ? 0 : Math.PI, 0] });
  }

  // Gatehouse on the south face, tall enough to be the palace's front door.
  const gateZ = towerZ + 1.7;
  kit.box('sandstone', [14, 12.4, 7.2], [0, 6.2, gateZ], undefined, [4, 3]);
  kit.wallWithArch({
    material: 'sandstoneWarm',
    width: 9.4,
    height: 10.4,
    depth: 0.9,
    opening: { width: 5.2, spring: 4.3, rise: 1.6, base: 0, lobes: 7 },
    position: [0, 0, gateZ - 3.9],
    rotation: [0, Math.PI, 0],
  });
  kit.archFrame({
    material: 'sandstonePale',
    width: 5.2,
    spring: 4.3,
    rise: 1.6,
    base: 0,
    position: [0, 0, gateZ - 4.3],
    rotation: [0, Math.PI, 0],
    lobes: 7,
    radii: [0.24, 0.15, 0.09],
  });
  kit.chhatri({ radius: 2.9, height: 3.8, position: [0, 12.4, gateZ], material: 'sandstonePale' });
  for (const sign of [-1, 1] as const) {
    kit.cylinder('sandstonePale', [1.5, 1.7, 10.6, 10], [sign * 5.9, 5.3, gateZ], undefined, false, [2, 5]);
    kit.chhatri({ radius: 1.6, height: 2.5, position: [sign * 5.9, 10.8, gateZ], material: 'sandstonePale', columns: 6 });
  }

  // Desert floor.
  kit.box('desert', [900, 0.4, 900], [0, -1.5, 0], undefined, [180, 180]);

  // Distant dune ridges. Each is a very large hemisphere sunk almost entirely
  // below the desert, so only a low, soft cap rises — hundreds of metres away,
  // never near enough to enclose the palace.
  const dunes: Array<{ x: number; z: number; radius: number }> = [
    { x: -240, z: -120, radius: 120 },
    { x: 260, z: -160, radius: 150 },
    { x: -120, z: 210, radius: 130 },
    { x: 190, z: 250, radius: 110 },
    { x: -10, z: -310, radius: 170 },
  ];
  for (const dune of dunes) {
    const sink = dune.radius - 7;
    kit.sphere('desert', [dune.radius, 28, 10, 0, Math.PI * 2, 0, Math.PI / 2], [dune.x, -sink, dune.z]);
  }

  // The fort town on the horizon: a broken defensive line of bastions, walls
  // and domes, varied so it reads as a settlement rather than a repeated stamp.
  const horizonZ = -200;
  kit.box('desert', [520, 13, 7], [0, 4.5, horizonZ], undefined, [48, 2]);
  const bastions: Array<{ x: number; height: number; radius: number; dome: boolean }> = [
    { x: -180, height: 16, radius: 4.8, dome: true },
    { x: -138, height: 22, radius: 6.2, dome: true },
    { x: -92, height: 14, radius: 4.0, dome: false },
    { x: -48, height: 26, radius: 7.0, dome: true },
    { x: 0, height: 30, radius: 8.4, dome: true },
    { x: 48, height: 24, radius: 6.6, dome: true },
    { x: 92, height: 17, radius: 4.4, dome: false },
    { x: 138, height: 21, radius: 5.8, dome: true },
    { x: 180, height: 15, radius: 4.6, dome: true },
  ];
  for (const bastion of bastions) {
    kit.cylinder('desert', [bastion.radius * 0.82, bastion.radius, bastion.height, 12], [bastion.x, bastion.height / 2, horizonZ - 1], undefined, false, [3, 4]);
    if (bastion.dome) {
      kit.sphere('desert', [bastion.radius * 1.05, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2], [bastion.x, bastion.height, horizonZ - 1]);
    } else {
      kit.box('desert', [bastion.radius * 1.9, 2.2, bastion.radius * 1.9], [bastion.x, bastion.height + 1.1, horizonZ - 1], undefined, [2, 2]);
    }
  }
  for (let i = 0; i < 26; i += 1) {
    const x = -210 + i * 16.5 + (i % 3) * 4;
    const height = 1.4 + (i % 4) * 0.5;
    kit.box('desert', [1.4, height, 1.4], [x, height / 2 + 0.2, horizonZ - 3.2]);
  }
  // A few larger pavilions set back from the wall.
  for (const x of [-110, -20, 70, 150]) {
    kit.box('desert', [12, 8, 8], [x, 4, horizonZ - 18], undefined, [3, 2]);
    kit.chhatri({ radius: 4.2, height: 3.2, position: [x, 8, horizonZ - 18], material: 'desert' });
  }

  return kit.merge();
}
