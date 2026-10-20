export type QualityTier = 'high' | 'medium' | 'low';
export type TimeOfDay = 'day' | 'night';
export type RoomId = 'aangan' | 'gallery' | 'archive' | 'council';
export type TextureMap = 'diffuse' | 'normal' | 'rough';

export interface TextureSet {
  diffuse: string;
  normal: string;
  rough: string;
}

export type TextureKey =
  | 'sandstoneWall'
  | 'sandstoneRed'
  | 'sandstoneFloor'
  | 'sandstoneTile'
  | 'wood'
  | 'linen'
  | 'velvet'
  | 'marble';

const sizeFor = (tier: QualityTier, ceiling: QualityTier) => {
  const order: QualityTier[] = ['low', 'medium', 'high'];
  const chosen = order[Math.min(order.indexOf(tier), order.indexOf(ceiling))];
  return chosen === 'high' ? '2k' : chosen === 'medium' ? '1k' : '512';
};

const textureSet = (base: string, size: string): TextureSet => ({
  diffuse: `${import.meta.env.BASE_URL}assets/textures/${base}_${size}_diffuse.webp`,
  normal: `${import.meta.env.BASE_URL}assets/textures/${base}_${size}_normal.webp`,
  rough: `${import.meta.env.BASE_URL}assets/textures/${base}_${size}_rough.webp`,
});

interface TextureDefinition {
  base: string;
  label: string;
  /** Highest resolution the project ships for this surface. */
  ceiling: QualityTier;
  tileMetres: number;
}

export const TEXTURES: Record<TextureKey, TextureDefinition> = {
  sandstoneWall: { base: 'sandstone_wall', label: 'Jaisalmer sandstone, coursed blocks', ceiling: 'high', tileMetres: 3.6 },
  sandstoneRed: { base: 'sandstone_red', label: 'Red sandstone, weathered', ceiling: 'high', tileMetres: 3.2 },
  sandstoneFloor: { base: 'sandstone_floor', label: 'Red sandstone paving', ceiling: 'high', tileMetres: 4.2 },
  sandstoneTile: { base: 'sandstone_tile', label: 'Cut sandstone tiles', ceiling: 'high', tileMetres: 3.0 },
  wood: { base: 'wood', label: 'Aged sheesham and sal', ceiling: 'medium', tileMetres: 2.4 },
  linen: { base: 'linen', label: 'Hand-woven linen', ceiling: 'medium', tileMetres: 1.2 },
  velvet: { base: 'velvet', label: 'Burgundy velvet', ceiling: 'medium', tileMetres: 0.9 },
  marble: { base: 'marble', label: 'Cream marble, aged', ceiling: 'medium', tileMetres: 2.0 },
};

export function textureMapsForTier(key: TextureKey, tier: QualityTier): TextureSet {
  const definition = TEXTURES[key];
  return textureSet(definition.base, sizeFor(tier, definition.ceiling));
}

export const HDRI = {
  day: {
    high: `${import.meta.env.BASE_URL}assets/hdr/day_2k.hdr`,
    medium: `${import.meta.env.BASE_URL}assets/hdr/day_1k.hdr`,
    low: `${import.meta.env.BASE_URL}assets/hdr/day_1k.hdr`,
    credit: 'Qwantani Sunset (Pure Sky) by Jarod Guest and Sergej Majboroda, Poly Haven, CC0.',
    source: 'https://polyhaven.com/a/qwantani_sunset_puresky',
  },
  night: {
    high: `${import.meta.env.BASE_URL}assets/hdr/night_2k.hdr`,
    medium: `${import.meta.env.BASE_URL}assets/hdr/night_1k.hdr`,
    low: `${import.meta.env.BASE_URL}assets/hdr/night_1k.hdr`,
    credit: 'Qwantani Night (Pure Sky) by Jarod Guest and Sergej Majboroda, Poly Haven, CC0.',
    source: 'https://polyhaven.com/a/qwantani_night_puresky',
  },
} as const;

export type ModelKey = 'lanternDiya' | 'vesselBrass' | 'candlesticks';

export const MODELS: Record<ModelKey, { url: string; label: string; credit: string; source: string }> = {
  lanternDiya: {
    url: `${import.meta.env.BASE_URL}models/props/lantern_diya.glb`,
    label: 'Brass diya lantern',
    credit: 'Brass Diya Lantern by Bhargav Kubal, Poly Haven, CC0.',
    source: 'https://polyhaven.com/a/brass_diya_lantern',
  },
  vesselBrass: {
    url: `${import.meta.env.BASE_URL}models/props/vessel_brass.glb`,
    label: 'Aged brass vessel',
    credit: 'Brass Pot 01 by Rico Cilliers, Poly Haven, CC0.',
    source: 'https://polyhaven.com/a/brass_pot_01',
  },
  candlesticks: {
    url: `${import.meta.env.BASE_URL}models/props/candlesticks.glb`,
    label: 'Brass candleholders',
    credit: 'Brass Candleholders by Tina, Poly Haven, CC0.',
    source: 'https://polyhaven.com/a/brass_candleholders',
  },
};

export const SCENE_CREDITS = {
  title: 'Nimbagarh — an authored, reference-matched reconstruction',
  architecture:
    'Original modular geometry authored for this project, in code. Suryagarh Palace and Jaisalmer havelis were studied as photographic references; no Suryagarh scan, photograph, logo or footage is shipped.',
  references: [
    'Patwa Haveli facade and windows, Jaisalmer — Wikimedia Commons, CC BY-SA 4.0.',
    'Carved sandstone courtyard interior, Jaisalmer — Wikimedia Commons, CC BY-SA 4.0.',
    'Jaisalmer Fort haveli art and Jain temple columns — Wikimedia Commons, CC BY 4.0.',
  ],
  materials: 'Poly Haven PBR textures and HDRIs, CC0.',
  props: 'Brass Diya Lantern, Brass Pot 01 and Brass Candleholders, Poly Haven, CC0.',
  limitation:
    'No exact Suryagarh model or scan exists under a licence permitting redistribution as a game asset. Room dimensions, layout, carving patterns, furniture and the hidden spaces are fictional; the palace is a reference-matched reconstruction, not a survey.',
};
