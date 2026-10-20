#!/usr/bin/env node
/**
 * Verify that every asset the Nimbagarh environment claims to ship is present,
 * non-empty, of the right container format, and covered by the provenance
 * record. Fails loudly rather than letting a broken path ship.
 *
 * Run: npm run assets:verify
 */
import { readFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import {
  HDRI_IDS,
  MODELS,
  REFERENCES,
  TEXTURE_IDS,
  TEXTURE_MAPS,
  TEXTURE_OUTPUT_SIZES,
} from './asset-catalog.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const problems = [];
const groups = [];

const MAGIC = {
  webp: (buffer) => buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP',
  hdr: (buffer) => buffer.subarray(0, 10).toString('ascii').startsWith('#?RADIANCE'),
  glb: (buffer) => buffer.subarray(0, 4).toString('ascii') === 'glTF',
  jpeg: (buffer) => buffer[0] === 0xff && buffer[1] === 0xd8,
};

async function check(relative, kind, { minBytes = 64, needles = [] } = {}) {
  const absolute = path.join(ROOT, relative);
  if (!existsSync(absolute)) {
    problems.push(`missing ${relative}`);
    return null;
  }
  const info = await stat(absolute);
  if (info.size < minBytes) {
    problems.push(`too small (${info.size}B): ${relative}`);
    return info.size;
  }
  const buffer = await readFile(absolute);
  if (kind && !MAGIC[kind](buffer)) {
    problems.push(`not a valid ${kind.toUpperCase()}: ${relative}`);
  }
  for (const needle of needles) {
    if (!buffer.includes(Buffer.from(needle))) {
      problems.push(`${relative} is missing expected marker "${needle}"`);
    }
  }
  return info.size;
}

async function verifyTextures() {
  let bytes = 0;
  let files = 0;
  for (const slug of Object.keys(TEXTURE_IDS)) {
    for (const map of Object.keys(TEXTURE_MAPS)) {
      for (const size of TEXTURE_OUTPUT_SIZES) {
        const size0 = await check(`public/assets/textures/${slug}_${size}_${map}.webp`, 'webp');
        if (size0) {
          bytes += size0;
          files += 1;
        }
      }
    }
  }
  groups.push(['textures', files, bytes]);
}

async function verifyHdris() {
  let bytes = 0;
  let files = 0;
  for (const [slug, entry] of Object.entries(HDRI_IDS)) {
    for (const size of entry.sizes) {
      const size0 = await check(`public/assets/hdr/${slug}_${size}.hdr`, 'hdr', { minBytes: 100_000 });
      if (size0) {
        bytes += size0;
        files += 1;
      }
    }
  }
  groups.push(['hdr', files, bytes]);
}

async function verifyModels() {
  let bytes = 0;
  let files = 0;
  for (const entry of Object.values(MODELS)) {
    const size = await check(`public/models/props/${entry.output}`, 'glb', {
      minBytes: 10_000,
      needles: ['EXT_meshopt_compression', 'image/webp'],
    });
    if (size) {
      bytes += size;
      files += 1;
    }
  }
  groups.push(['models', files, bytes]);
}

async function verifyReferences() {
  let bytes = 0;
  let files = 0;
  for (const filename of Object.keys(REFERENCES)) {
    const size = await check(`refs/${filename}`, 'jpeg', { minBytes: 10_000 });
    if (size) {
      bytes += size;
      files += 1;
    }
    const meta = `docs/references/${filename.replace(/\.[^.]+$/, '')}.json`;
    if (!existsSync(path.join(ROOT, meta))) {
      problems.push(`missing study-reference licence record: ${meta}`);
      continue;
    }
    const record = JSON.parse(await readFile(path.join(ROOT, meta), 'utf8'));
    if (!record.license) problems.push(`study reference without a licence: ${meta}`);
    if (record.studyOnly !== true) problems.push(`study reference not marked studyOnly: ${meta}`);
  }
  groups.push(['references (study only)', files, bytes]);
}

async function verifyPublicHygiene() {
  const entries = await readdir(path.join(ROOT, 'public'), { recursive: true, withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const name = entry.name;
    if (name.startsWith('.source_')) problems.push(`un-derived source image shipped in public/: ${name}`);
    if (/\.jpe?g$/i.test(name)) problems.push(`raw JPEG shipped in public/ (should be WebP): ${name}`);
  }
  // Study references must never be reachable as game assets.
  if (existsSync(path.join(ROOT, 'public', 'refs'))) {
    problems.push('refs/ was copied into public/; study references must not ship');
  }
}

async function verifyProvenance() {
  const file = path.join(ROOT, 'docs', 'provenance', 'asset-downloads.json');
  if (!existsSync(file)) {
    problems.push('missing docs/provenance/asset-downloads.json');
    return;
  }
  const record = JSON.parse(await readFile(file, 'utf8'));
  if (!Array.isArray(record.downloads) || record.downloads.length === 0) {
    problems.push('provenance record has no downloads');
    return;
  }
  let missing = 0;
  for (const download of record.downloads) {
    if (!download.destination) continue;
    if (!existsSync(path.join(ROOT, download.destination))) missing += 1;
  }
  if (missing > 0) problems.push(`${missing} provenance targets are not on disk`);
  const hosts = new Set(
    record.downloads.map((download) => {
      try {
        return new URL(download.url).host;
      } catch {
        return 'unknown';
      }
    }),
  );
  console.log(`Provenance: ${record.downloads.length} entries from ${[...hosts].join(', ')}`);
}

async function main() {
  await verifyTextures();
  await verifyHdris();
  await verifyModels();
  await verifyReferences();
  await verifyPublicHygiene();
  await verifyProvenance();

  console.log('\nShipped asset groups');
  for (const [label, files, bytes] of groups) {
    console.log(`  ${label.padEnd(24)} ${String(files).padStart(4)} files  ${(bytes / 1024 / 1024).toFixed(1)} MB`);
  }

  if (problems.length > 0) {
    console.error(`\n${problems.length} problem(s):`);
    for (const problem of problems) console.error(`  ✗ ${problem}`);
    process.exitCode = 1;
    return;
  }
  console.log('\nAll assets verified.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
