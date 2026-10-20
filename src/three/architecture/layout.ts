export const LAYOUT = {
  courtyard: {
    outerHalfX: 14,
    outerHalfZ: 11,
    openHalfX: 10.6,
    openHalfZ: 7.6,
    wallThickness: 0.7,
    arcadeHeight: 5.1,
    firstFloorY: 5.25,
    roofY: 10.4,
    parapetHeight: 1.05,
    gateHalfWidth: 2.5,
    gateSpring: 3.1,
    gateRise: 1.25,
  },
  gallery: {
    halfWidth: 3,
    startZ: -11,
    endZ: -57,
    height: 5.4,
    bay: 3.6,
    niches: 12,
    lightCourtStart: -14,
    lightCourtEnd: -56,
    lightCourtWidth: 3.6,
  },
  archive: {
    minX: -30,
    maxX: -14,
    minZ: -6,
    maxZ: 6,
    height: 5.6,
  },
  council: {
    minX: 14,
    maxX: 32,
    minZ: -7,
    maxZ: 7,
    height: 8.6,
  },
  seats: 12,
} as const;

export const ROOM_LABELS = {
  aangan: {
    title: 'The Aangan',
    kicker: 'Courtyard · Nimbagarh',
    caption:
      'Open court, low fountain, the Last Lantern on its carved plinth. Four doors, twelve seats, one flame.',
    camera: { position: [-8.6, 4.4, 7.0], target: [0.0, 1.6, -0.4], fov: 46 },
  },
  gallery: {
    title: 'The Long Gallery',
    kicker: 'Colonnade · twelve niches',
    caption:
      'Forty-six metres of cusped arches and pierced screens. The jali writes the sun across the floor.',
    camera: { position: [1.2, 1.95, -12.6], target: [0.05, 2.15, -46], fov: 44 },
  },
  archive: {
    title: 'The Archive of Ashes',
    kicker: 'Scriptorium · lower strong-room',
    caption:
      'Ledgers, rolled manuscripts and a broken seal. One high jali draws a single blade of light.',
    camera: { position: [-19.4, 2.15, 4.4], target: [-27.2, 1.65, -1.6], fov: 42 },
  },
  council: {
    title: 'The Council Chamber',
    kicker: 'Darbar · the last question',
    caption:
      'A raised dais, a round brass table, twelve floor positions and mirror-work that catches the flame.',
    camera: { position: [15.2, 3.4, 4.6], target: [22.5, 1.0, -1.2], fov: 52 },
  },
} as const;

export type RoomLabel = keyof typeof ROOM_LABELS;
