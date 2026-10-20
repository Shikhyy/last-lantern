/**
 * The single source of truth for which third-party assets the Nimbagarh
 * environment ships. Both the fetch script and the verification script read
 * this file, so the provenance record can never drift from what is on disk.
 *
 * Every upstream id here is on Poly Haven and is CC0 (public domain). The
 * Wikimedia Commons photographs are study references only and are never
 * shipped inside public/.
 */

export const PH_API = 'https://api.polyhaven.com';

export const TEXTURE_IDS = {
  sandstone_wall: 'large_sandstone_blocks',
  sandstone_red: 'red_sandstone_wall',
  sandstone_floor: 'red_sandstone_pavement',
  sandstone_tile: 'red_sandstone_tiles',
  wood: 'old_wood_floor',
  linen: 'rough_linen',
  velvet: 'velour_velvet',
  marble: 'marble_tiles',
};

export const TEXTURE_MAPS = {
  diffuse: 'Diffuse',
  normal: 'nor_gl',
  rough: 'Rough',
};

/** Sizes assembled by cwebp. 512 is derived from the 2k source. */
export const TEXTURE_OUTPUT_SIZES = ['2k', '1k', '512'];

export const HDRI_IDS = {
  day: { id: 'qwantani_sunset_puresky', sizes: ['2k', '1k'] },
  night: { id: 'qwantani_night_puresky', sizes: ['2k', '1k'] },
};

export const MODELS = {
  lantern_diya: { id: 'brass_diya_lantern', resolution: '2k', output: 'lantern_diya.glb' },
  vessel_brass: { id: 'brass_pot_01', resolution: '1k', output: 'vessel_brass.glb' },
  candlesticks: { id: 'brass_candleholders', resolution: '2k', output: 'candlesticks.glb' },
};

export const REFERENCES = {
  'courtyard_carved_sandstone.jpg': 'File:Carved sandstone courtyard interior, Jaisalmer.jpg',
  'patwon_facade.jpg': 'File:Patwa Haveli, Jaisalmer - front facade.jpg',
  'patwon_windows.jpg': 'File:Patwa Haveli, Jaisalmer - intricate windows.jpg',
  'fort_haveli_art.jpg': 'File:Jaisalmer, India, Jaisalmer Fort, Haveli art.jpg',
  'jain_columns.jpg': 'File:Jaisalmer, India, Jaisalmer Fort, Jain Temple, Columns.jpg',
  'jain_carvings.jpg': 'File:Jaisalmer, India, Jaisalmer Fort, Jain Temple, Carvings 2.jpg',
};

export const GLTF_OPTIMIZE_ARGS = [
  '--compress',
  'meshopt',
  '--texture-compress',
  'webp',
  '--texture-size',
  '1024',
  '--simplify',
  'true',
  '--simplify-error',
  '0.0005',
];
