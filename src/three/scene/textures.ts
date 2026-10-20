import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three';

/** A tileable ripple normal map, generated once so the water has real light response. */
export function makeWaterNormalTexture(size = 256): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('2D canvas unavailable');
  const image = context.createImageData(size, size);
  const height = (x: number, y: number) => {
    const u = (x / size) * Math.PI * 2;
    const v = (y / size) * Math.PI * 2;
    return (
      Math.sin(u * 2.0 + Math.sin(v) * 1.4) * 0.5 +
      Math.sin(v * 2.7 + Math.sin(u * 1.3) * 1.1) * 0.34 +
      Math.sin((u + v) * 4.1) * 0.16
    );
  };
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = height(x + 1, y) - height(x - 1, y);
      const dy = height(x, y + 1) - height(x, y - 1);
      const nx = -dx * 0.5;
      const ny = -dy * 0.5;
      const nz = 1;
      const length = Math.hypot(nx, ny, nz);
      const index = (y * size + x) * 4;
      image.data[index] = ((nx / length) * 0.5 + 0.5) * 255;
      image.data[index + 1] = ((ny / length) * 0.5 + 0.5) * 255;
      image.data[index + 2] = ((nz / length) * 0.5 + 0.5) * 255;
      image.data[index + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(3, 3);
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

/** Soft round grain used for dust motes and flame glows. */
export function makeGlowTexture(size = 128): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('2D canvas unavailable');
  const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.35, 'rgba(255,236,196,0.7)');
  gradient.addColorStop(0.75, 'rgba(255,190,110,0.16)');
  gradient.addColorStop(1, 'rgba(255,170,80,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/** A small, deterministic dust speck. */
export function makeDustTexture(size = 32): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('2D canvas unavailable');
  const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255,244,222,0.9)');
  gradient.addColorStop(0.5, 'rgba(255,234,196,0.25)');
  gradient.addColorStop(1, 'rgba(255,230,190,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  const texture = new CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}
