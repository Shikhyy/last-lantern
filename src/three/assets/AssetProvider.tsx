import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  EquirectangularReflectionMapping,
  LinearSRGBColorSpace,
  NoColorSpace,
  RepeatWrapping,
  SRGBColorSpace,
  Texture,
  TextureLoader,
  type ColorSpace,
  type Mesh,
} from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import {
  HDRI,
  MODELS,
  TEXTURES,
  textureMapsForTier,
  type ModelKey,
  type QualityTier,
  type TextureKey,
  type TextureMap,
} from './manifest';

export interface LoadedTextureSet {
  diffuse: Texture | null;
  normal: Texture | null;
  rough: Texture | null;
}

export type ModelBundle = Record<ModelKey, GLTF | null>;
export type TextureBundle = Record<TextureKey, LoadedTextureSet | null>;
export type HdriBundle = { day: Texture | null; night: Texture | null };

export interface AssetFailure {
  key: string;
  message: string;
}

interface PalaceAssets {
  quality: QualityTier;
  progress: number;
  loading: boolean;
  textures: TextureBundle;
  models: ModelBundle;
  hdri: HdriBundle;
  failures: AssetFailure[];
  reload: () => void;
}

const TextureKeys = Object.keys(TEXTURES) as TextureKey[];
const ModelKeys = Object.keys(MODELS) as ModelKey[];

const emptyTextures = Object.fromEntries(TextureKeys.map((key) => [key, null])) as TextureBundle;
const emptyModels = Object.fromEntries(ModelKeys.map((key) => [key, null])) as ModelBundle;

const AssetContext = createContext<PalaceAssets | null>(null);

export function cloneModel(gltf: GLTF | null): GLTF['scene'] | null {
  if (!gltf) return null;
  return gltf.scene.clone(true);
}

export function AssetProvider({
  quality,
  children,
}: {
  quality: QualityTier;
  children: ReactNode;
}) {
  const [textures, setTextures] = useState<TextureBundle>(emptyTextures);
  const [models, setModels] = useState<ModelBundle>(emptyModels);
  const [hdri, setHdri] = useState<HdriBundle>({ day: null, night: null });
  const [progress, setProgress] = useState(0);
  const [failures, setFailures] = useState<AssetFailure[]>([]);
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(true);
  const cache = useRef(new Map<string, Texture>());

  const texturePlan = useMemo(
    () =>
      TextureKeys.map((key) => ({
        key,
        maps: textureMapsForTier(key, quality),
      })),
    [quality],
  );

  useEffect(() => {
    let cancelled = false;
    const total = texturePlan.length * 3 + ModelKeys.length + 2;
    let completed = 0;
    const collectedFailures: AssetFailure[] = [];
    const anisotropy = quality === 'high' ? 8 : quality === 'medium' ? 4 : 2;
    const textureLoader = new TextureLoader();
    const gltfLoader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    const hdriLoader = new RGBELoader();

    const tick = () => {
      completed += 1;
      if (!cancelled) setProgress(Math.min(1, completed / total));
    };

    async function loadTexture(url: string, map: TextureMap): Promise<Texture | null> {
      const cached = cache.current.get(url);
      if (cached) {
        tick();
        return cached;
      }
      try {
        const texture = await textureLoader.loadAsync(url);
        texture.wrapS = RepeatWrapping;
        texture.wrapT = RepeatWrapping;
        texture.colorSpace = (map === 'diffuse' ? SRGBColorSpace : NoColorSpace) as ColorSpace;
        texture.anisotropy = anisotropy;
        texture.needsUpdate = true;
        cache.current.set(url, texture);
        return texture;
      } catch (error) {
        collectedFailures.push({ key: url, message: describeError(error) });
        return null;
      } finally {
        tick();
      }
    }

    async function loadModel(key: ModelKey): Promise<[ModelKey, GLTF | null]> {
      const definition = MODELS[key];
      try {
        const gltf = await gltfLoader.loadAsync(definition.url);
        gltf.scene.traverse((object) => {
          const mesh = object as Mesh;
          if (mesh.isMesh) {
            mesh.castShadow = quality !== 'low';
            mesh.receiveShadow = true;
            const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            for (const material of materials) {
              if ('envMapIntensity' in material) material.envMapIntensity = 1.15;
            }
          }
        });
        return [key, gltf];
      } catch (error) {
        collectedFailures.push({ key: definition.url, message: describeError(error) });
        return [key, null];
      } finally {
        tick();
      }
    }

    async function loadHdri(key: 'day' | 'night'): Promise<[string, Texture | null]> {
      const url = HDRI[key][quality];
      const cached = cache.current.get(url);
      if (cached) {
        tick();
        return [key, cached];
      }
      try {
        const texture = await hdriLoader.loadAsync(url);
        texture.mapping = EquirectangularReflectionMapping;
        texture.colorSpace = LinearSRGBColorSpace;
        cache.current.set(url, texture);
        return [key, texture];
      } catch (error) {
        collectedFailures.push({ key: url, message: describeError(error) });
        return [key, null];
      } finally {
        tick();
      }
    }

    async function load() {
      if (!cancelled) {
        setLoading(true);
        setProgress(0);
        setFailures([]);
      }
      const textureResults = await Promise.all(
        texturePlan.map(async ({ key, maps }) => {
          const [diffuse, normal, rough] = await Promise.all([
            loadTexture(maps.diffuse, 'diffuse'),
            loadTexture(maps.normal, 'normal'),
            loadTexture(maps.rough, 'rough'),
          ]);
          const entry = diffuse && normal && rough ? { diffuse, normal, rough } : null;
          return [key, entry] as const;
        }),
      );
      const modelResults = await Promise.all(ModelKeys.map((key) => loadModel(key)));
      const hdriResults = await Promise.all([loadHdri('day'), loadHdri('night')]);
      if (cancelled) return;
      setTextures(Object.fromEntries(textureResults) as TextureBundle);
      setModels(Object.fromEntries(modelResults) as ModelBundle);
      setHdri(Object.fromEntries(hdriResults) as HdriBundle);
      setFailures([...collectedFailures]);
      setProgress(1);
      setLoading(false);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [quality, attempt, texturePlan]);

  useEffect(
    () => () => {
      for (const texture of cache.current.values()) texture.dispose();
      cache.current.clear();
    },
    [],
  );

  const value = useMemo<PalaceAssets>(
    () => ({
      quality,
      progress,
      loading,
      textures,
      models,
      hdri,
      failures,
      reload: () => setAttempt((value) => value + 1),
    }),
    [quality, progress, loading, textures, models, hdri, failures],
  );

  return <AssetContext.Provider value={value}>{children}</AssetContext.Provider>;
}

export function usePalaceAssets(): PalaceAssets {
  const context = useContext(AssetContext);
  if (!context) throw new Error('usePalaceAssets must be used inside AssetProvider');
  return context;
}

function describeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}
