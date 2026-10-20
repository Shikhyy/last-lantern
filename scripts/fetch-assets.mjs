#!/usr/bin/env node
/**
 * Fetch the CC0 Poly Haven textures, HDRIs and GLB props used by the Nimbagarh
 * environment, plus the CC BY photographic study references.
 *
 * All downloads are content-addressed by the upstream API. The script refuses
 * to overwrite an existing file whose size and md5 do not match the manifest.
 * It writes docs/provenance/asset-downloads.json for auditability.
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import {
  GLTF_OPTIMIZE_ARGS,
  HDRI_IDS,
  MODELS,
  PH_API,
  REFERENCES,
  TEXTURE_IDS,
  TEXTURE_MAPS,
} from './asset-catalog.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const UA = 'TheLastLantern-AssetPipeline/0.1 (+local development; reference study)';

const downloads = [];

async function fetchJson(url) {
  const res = await fetch(url, { headers: { 'user-agent': UA } });
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  return res.json();
}

async function run(command, args, cwd = ROOT) {
  execFileSync(command, args, { cwd, stdio: 'inherit' });
}

async function md5(filename) {
  const data = await readFile(filename);
  return createHash('md5').update(data).digest('hex');
}

async function download(url, destination, expected = {}) {
  await mkdir(path.dirname(destination), { recursive: true });
  if (existsSync(destination)) {
    const info = await stat(destination);
    const digest = await md5(destination);
    if (
      (!expected.size || info.size === expected.size) &&
      (!expected.md5 || digest === expected.md5)
    ) {
      downloads.push({ url, destination: path.relative(ROOT, destination), bytes: info.size, md5: digest, cached: true });
      return destination;
    }
  }
  const res = await fetch(url, { headers: { 'user-agent': UA } });
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const digest = createHash('md5').update(buffer).digest('hex');
  if (expected.size && buffer.byteLength !== expected.size) {
    throw new Error(`Size mismatch for ${url}: ${buffer.byteLength} != ${expected.size}`);
  }
  if (expected.md5 && digest !== expected.md5) {
    throw new Error(`MD5 mismatch for ${url}: ${digest} != ${expected.md5}`);
  }
  await writeFile(destination, buffer);
  downloads.push({
    url,
    destination: path.relative(ROOT, destination),
    bytes: buffer.byteLength,
    md5: digest,
    cached: false,
  });
  return destination;
}

async function fetchTextures() {
  for (const [slug, id] of Object.entries(TEXTURE_IDS)) {
    const files = await fetchJson(`${PH_API}/files/${id}`);
    for (const [mapSlug, mapKey] of Object.entries(TEXTURE_MAPS)) {
      for (const size of ['2k', '1k']) {
        const variant = files[mapKey]?.[size]?.jpg;
        if (!variant) throw new Error(`Missing ${id} ${mapKey} ${size}`);
        const jpg = path.join(
          ROOT,
          '.asset-source',
          'textures',
          `${slug}_${size}_${mapSlug}.jpg`,
        );
        await download(variant.url, jpg, variant);
        for (const outputSize of [size, ...(size === '2k' ? ['512'] : [])]) {
          const webp = path.join(
            ROOT,
            'public',
            'assets',
            'textures',
            `${slug}_${outputSize}_${mapSlug}.webp`,
          );
          const quality = mapSlug === 'normal' ? '92' : mapSlug === 'rough' ? '88' : '86';
          const args = ['-quiet', '-q', quality];
          if (outputSize === '512') args.push('-resize', '512', '0');
          args.push(jpg, '-o', webp);
          await run('cwebp', args);
          const info = await stat(webp);
          downloads.push({
            url: variant.url,
            destination: path.relative(ROOT, webp),
            bytes: info.size,
            derivedFrom: path.relative(ROOT, jpg),
            transform: `cwebp -q ${quality}${outputSize === '512' ? ' -resize 512 0' : ''}`,
          });
        }
      }
    }
  }
}

async function fetchHdris() {
  for (const [slug, entry] of Object.entries(HDRI_IDS)) {
    const files = await fetchJson(`${PH_API}/files/${entry.id}`);
    for (const size of entry.sizes) {
      const variant = files.hdri?.[size]?.hdr;
      if (!variant) throw new Error(`Missing HDRI ${entry.id} ${size}`);
      const destination = path.join(ROOT, 'public', 'assets', 'hdr', `${slug}_${size}.hdr`);
      await download(variant.url, destination, variant);
    }
  }
}

async function fetchModels() {
  for (const [slug, entry] of Object.entries(MODELS)) {
    const files = await fetchJson(`${PH_API}/files/${entry.id}`);
    const variant = files.gltf?.[entry.resolution]?.gltf;
    if (!variant) throw new Error(`Missing model ${entry.id} ${entry.resolution}`);
    const sourceDir = path.join(ROOT, '.asset-source', 'models', slug);
    await mkdir(sourceDir, { recursive: true });
    const gltfName = path.basename(new URL(variant.url).pathname);
    const gltfPath = path.join(sourceDir, gltfName);
    await download(variant.url, gltfPath, variant);
    for (const [relative, include] of Object.entries(variant.include ?? {})) {
      await download(include.url, path.join(sourceDir, relative), include);
    }
    const output = path.join(ROOT, 'public', 'models', 'props', entry.output);
    await mkdir(path.dirname(output), { recursive: true });
    await run('npx', ['gltf-transform', 'optimize', gltfPath, output, ...GLTF_OPTIMIZE_ARGS]);
    const info = await stat(output);
    downloads.push({
      url: variant.url,
      destination: path.relative(ROOT, output),
      bytes: info.size,
      derivedFrom: path.relative(ROOT, gltfPath),
      transform: 'gltf-transform optimize: meshopt, webp <=1024, simplify 0.0005',
    });
  }
}

async function fetchReferences() {
  for (const [filename, title] of Object.entries(REFERENCES)) {
    const query = new URLSearchParams({
      action: 'query',
      titles: title,
      prop: 'imageinfo',
      iiprop: 'url|extmetadata',
      iiurlwidth: '1600',
      format: 'json',
    });
    const data = await fetchJson(`https://commons.wikimedia.org/w/api.php?${query}`);
    const page = Object.values(data.query?.pages ?? {})[0];
    const info = page?.imageinfo?.[0];
    if (!info?.thumburl) throw new Error(`No Commons thumbnail for ${title}`);
    const destination = path.join(ROOT, 'refs', filename);
    await download(info.thumburl, destination);
    const metadata = info.extmetadata ?? {};
    const record = {
      title,
      filename,
      source: info.descriptionurl,
      license: metadata.LicenseShortName?.value,
      licenseUrl: metadata.LicenseUrl?.value,
      artist: metadata.Artist?.value,
      credit: metadata.Credit?.value,
      studyOnly: true,
    };
    await mkdir(path.join(ROOT, 'docs', 'references'), { recursive: true });
    await writeFile(
      path.join(ROOT, 'docs', 'references', `${filename.replace(/\.[^.]+$/, '')}.json`),
      `${JSON.stringify(record, null, 2)}\n`,
    );
  }
}

async function main() {
  await mkdir(path.join(ROOT, 'public', 'assets'), { recursive: true });
  await mkdir(path.join(ROOT, 'docs', 'provenance'), { recursive: true });
  console.log('Fetching CC0 PBR textures…');
  await fetchTextures();
  console.log('Fetching CC0 HDRIs…');
  await fetchHdris();
  console.log('Fetching and optimizing CC0 GLB props…');
  await fetchModels();
  console.log('Fetching CC BY photographic study references…');
  await fetchReferences();
  await writeFile(
    path.join(ROOT, 'docs', 'provenance', 'asset-downloads.json'),
    `${JSON.stringify({ generated: new Date().toISOString(), source: 'Poly Haven and Wikimedia Commons', downloads }, null, 2)}\n`,
  );
  console.log(`Done. ${downloads.length} audited files.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
