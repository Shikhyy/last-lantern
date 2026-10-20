import { useMemo } from 'react';
import {
  DoubleSide,
  FrontSide,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  SRGBColorSpace,
  Vector2,
} from 'three';
import { usePalaceAssets, type LoadedTextureSet } from './assets/AssetProvider';

export interface PalaceMaterials {
  sandstone: MeshStandardMaterial;
  sandstoneWarm: MeshStandardMaterial;
  sandstonePale: MeshStandardMaterial;
  sandstoneRed: MeshStandardMaterial;
  sandstoneFloor: MeshStandardMaterial;
  sandstoneTile: MeshStandardMaterial;
  marble: MeshStandardMaterial;
  darkStone: MeshStandardMaterial;
  plaster: MeshStandardMaterial;
  wood: MeshStandardMaterial;
  woodDark: MeshStandardMaterial;
  brass: MeshStandardMaterial;
  brassDark: MeshStandardMaterial;
  iron: MeshStandardMaterial;
  fabricBurgundy: MeshStandardMaterial;
  fabricIndigo: MeshStandardMaterial;
  fabricIvory: MeshStandardMaterial;
  paper: MeshStandardMaterial;
  mirror: MeshStandardMaterial;
  water: MeshPhysicalMaterial;
  glass: MeshPhysicalMaterial;
  flame: MeshBasicMaterial;
  soot: MeshStandardMaterial;
  desert: MeshStandardMaterial;
  rope: MeshStandardMaterial;
}

export type MaterialKey = keyof PalaceMaterials;

/** Emissive / light colours, kept with the material manifest. */
export const SCENE_COLORS = {
  flame: 0xf2b25c,
  flameHot: 0xffd9a0,
  lamp: 0xffb15c,
  moon: 0x9fb6d8,
  sun: 0xffd9a0,
} as const;

const C = {
  sandstone: 0xeccb9c,
  sandstoneWarm: 0xd9ac74,
  sandstonePale: 0xf7e6c4,
  sandstoneRed: 0xc79361,
  floor: 0xe0b183,
  tile: 0xd0a06c,
  marble: 0xefe1c6,
  darkStone: 0x6f5744,
  plaster: 0xdcc4a0,
  wood: 0x7a563a,
  woodDark: 0x4b3223,
  brass: 0xa87f24,
  brassDark: 0x6b4a1c,
  iron: 0x2e2c28,
  burgundy: 0x5c1f2b,
  indigo: 0x1c2740,
  ivory: 0xd9c4a0,
  paper: 0xd9c8a8,
  mirror: 0xb9a98d,
  water: 0x122225,
  glass: 0xd8e4e3,
  flame: 0xf2b25c,
  soot: 0x211a14,
  desert: 0xbd8a55,
  rope: 0x8a7352,
} as const;

function configureMaps(
  maps: LoadedTextureSet | null,
  anisotropy: number,
  diffuseColorSpace = true,
): LoadedTextureSet | null {
  if (!maps) return null;
  if (maps.diffuse) {
    maps.diffuse.anisotropy = anisotropy;
    if (diffuseColorSpace) maps.diffuse.colorSpace = SRGBColorSpace;
    maps.diffuse.needsUpdate = true;
  }
  if (maps.normal) {
    maps.normal.anisotropy = anisotropy;
    maps.normal.needsUpdate = true;
  }
  if (maps.rough) {
    maps.rough.anisotropy = anisotropy;
    maps.rough.needsUpdate = true;
  }
  return maps;
}

function texturedStandard(
  color: number,
  maps: LoadedTextureSet | null,
  options: {
    roughness?: number;
    metalness?: number;
    normalScale?: number;
    doubleSide?: boolean;
    envMapIntensity?: number;
  } = {},
): MeshStandardMaterial {
  const material = new MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.82,
    metalness: options.metalness ?? 0.01,
    map: maps?.diffuse ?? null,
    normalMap: maps?.normal ?? null,
    roughnessMap: maps?.rough ?? null,
    normalScale: new Vector2(options.normalScale ?? 1, options.normalScale ?? 1),
    side: options.doubleSide ? DoubleSide : FrontSide,
    dithering: true,
  });
  material.envMapIntensity = options.envMapIntensity ?? 0.95;
  return material;
}

function flatStandard(
  color: number,
  options: {
    roughness?: number;
    metalness?: number;
    doubleSide?: boolean;
    emissive?: number;
    emissiveIntensity?: number;
  } = {},
): MeshStandardMaterial {
  const material = new MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.6,
    metalness: options.metalness ?? 0,
    side: options.doubleSide ? DoubleSide : FrontSide,
    dithering: true,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0,
  });
  material.envMapIntensity = 1.1;
  return material;
}

export function usePalaceMaterials(): PalaceMaterials {
  const { textures, quality } = usePalaceAssets();
  return useMemo(() => {
    const anisotropy = quality === 'high' ? 8 : quality === 'medium' ? 4 : 2;
    const stone = configureMaps(textures.sandstoneWall, anisotropy);
    const red = configureMaps(textures.sandstoneRed, anisotropy);
    const floor = configureMaps(textures.sandstoneFloor, anisotropy);
    const tile = configureMaps(textures.sandstoneTile, anisotropy);
    const wood = configureMaps(textures.wood, anisotropy);
    const linen = configureMaps(textures.linen, anisotropy);
    const velvet = configureMaps(textures.velvet, anisotropy);
    const marble = configureMaps(textures.marble, anisotropy);

    const sandstone = texturedStandard(C.sandstone, stone, {
      roughness: 0.79,
      normalScale: 1.15,
    });
    const sandstoneWarm = texturedStandard(C.sandstoneWarm, stone, {
      roughness: 0.82,
      normalScale: 1.1,
    });
    const sandstonePale = texturedStandard(C.sandstonePale, stone, {
      roughness: 0.75,
      normalScale: 0.9,
    });
    const sandstoneRed = texturedStandard(C.sandstoneRed, red, {
      roughness: 0.84,
      normalScale: 1.2,
    });
    const sandstoneFloor = texturedStandard(C.floor, floor, {
      roughness: 0.86,
      normalScale: 1,
      envMapIntensity: 1.55,
    });
    const sandstoneTile = texturedStandard(C.tile, tile, {
      roughness: 0.8,
      normalScale: 1,
      envMapIntensity: 1.4,
    });
    const marbleMaterial = texturedStandard(C.marble, marble, {
      roughness: 0.62,
      normalScale: 0.7,
    });
    const darkStone = texturedStandard(C.darkStone, stone, {
      roughness: 0.9,
      normalScale: 0.8,
    });
    const plaster = texturedStandard(C.plaster, stone, {
      roughness: 0.96,
      normalScale: 0.55,
    });
    const woodMaterial = texturedStandard(C.wood, wood, {
      roughness: 0.68,
      normalScale: 1.4,
    });
    const woodDark = texturedStandard(C.woodDark, wood, {
      roughness: 0.74,
      normalScale: 1.3,
    });
    const paper = texturedStandard(C.paper, linen, {
      roughness: 0.92,
      normalScale: 0.35,
    });
    const fabricBurgundy = texturedStandard(C.burgundy, velvet, {
      roughness: 0.97,
      normalScale: 2.2,
    });
    const fabricIndigo = texturedStandard(C.indigo, linen, {
      roughness: 0.98,
      normalScale: 1.8,
    });
    const fabricIvory = texturedStandard(C.ivory, linen, {
      roughness: 0.95,
      normalScale: 1.2,
    });

    const water = new MeshPhysicalMaterial({
      color: C.water,
      roughness: 0.08,
      metalness: 0.06,
      clearcoat: 0.7,
      clearcoatRoughness: 0.08,
      transparent: true,
      opacity: 0.94,
      envMapIntensity: 1.8,
      side: DoubleSide,
    });
    const glass = new MeshPhysicalMaterial({
      color: C.glass,
      roughness: 0.06,
      metalness: 0,
      transparent: true,
      opacity: 0.15,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      envMapIntensity: 0.7,
      side: DoubleSide,
    });
    const flame = new MeshBasicMaterial({
      color: C.flame,
      transparent: true,
      opacity: 0.94,
      toneMapped: false,
      side: DoubleSide,
    });

    return {
      sandstone,
      sandstoneWarm,
      sandstonePale,
      sandstoneRed,
      sandstoneFloor,
      sandstoneTile,
      marble: marbleMaterial,
      darkStone,
      plaster,
      wood: woodMaterial,
      woodDark,
      brass: flatStandard(C.brass, { roughness: 0.38, metalness: 0.88 }),
      brassDark: flatStandard(C.brassDark, { roughness: 0.56, metalness: 0.82 }),
      iron: flatStandard(C.iron, { roughness: 0.44, metalness: 0.75 }),
      fabricBurgundy,
      fabricIndigo,
      fabricIvory,
      paper,
      mirror: flatStandard(C.mirror, { roughness: 0.12, metalness: 0.94 }),
      water,
      glass,
      flame,
      soot: flatStandard(C.soot, { roughness: 0.98 }),
      desert: texturedStandard(C.desert, stone, { roughness: 0.98, normalScale: 0.4 }),
      rope: flatStandard(C.rope, { roughness: 1 }),
    };
  }, [textures, quality]);
}
