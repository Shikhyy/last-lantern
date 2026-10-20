#!/usr/bin/env node
/**
 * Report the shipped payload against the budgets recorded in
 * docs/TECHNICAL_ARCHITECTURE.md §7.
 *
 * Budgets checked here are the ones that can be measured from the build
 * output: initial JavaScript, total JavaScript, and the size of the asset
 * trees the browser may be asked to fetch.
 *
 * Run: npm run size   (after npm run build)
 */
import { readFile, readdir, stat } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const DIST = path.join(ROOT, 'dist');

const MB = 1024 * 1024;
const KB = 1024;

const BUDGETS = {
  initialJsGzip: 900 * KB,
  totalJsGzip: 1400 * KB,
  textures: 34 * MB,
  hdr: 16 * MB,
  models: 6 * MB,
  publicTotal: 56 * MB,
};

const failures = [];
const notes = [];

async function walk(directory) {
  if (!existsSync(directory)) return [];
  const entries = await readdir(directory, { recursive: true, withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const absolute = path.join(entry.parentPath ?? directory, entry.name);
    files.push(absolute);
  }
  return files;
}

async function sum(directory, filter, options = {}) {
  const files = await walk(directory);
  let bytes = 0;
  let count = 0;
  let largest = { file: '', bytes: 0 };
  for (const file of files) {
    if (filter && !filter(file)) continue;
    const info = await stat(file);
    const size = options.gzip ? gzipSizeOf(await readFile(file)) : info.size;
    bytes += size;
    count += 1;
    if (size > largest.bytes) largest = { file: path.relative(ROOT, file), bytes: size };
  }
  return { bytes, count, largest };
}

function gzipSizeOf(buffer) {
  return gzipSync(buffer, { level: 9 }).byteLength;
}

async function measureInitialJs() {
  const indexHtml = path.join(DIST, 'index.html');
  if (!existsSync(indexHtml)) {
    failures.push('dist/index.html not found — run `npm run build` first');
    return { bytes: 0, entry: 'n/a' };
  }
  const html = await readFile(indexHtml, 'utf8');
  const match = html.match(/<script[^>]+src="\/([^"]+\.js)"/);
  if (!match) {
    failures.push('no entry script found in dist/index.html');
    return { bytes: 0, entry: 'n/a' };
  }
  const buffer = await readFile(path.join(DIST, match[1]));
  return { bytes: gzipSizeOf(buffer), entry: match[1] };
}

async function main() {
  const entry = await measureInitialJs();
  const allJs = await sum(path.join(DIST, 'assets'), (file) => file.endsWith('.js'), { gzip: true });
  const textures = await sum(path.join(ROOT, 'public', 'assets', 'textures'));
  const hdr = await sum(path.join(ROOT, 'public', 'assets', 'hdr'));
  const models = await sum(path.join(ROOT, 'public', 'models'));
  const publicTotal = await sum(path.join(ROOT, 'public'));
  const refs = await sum(path.join(ROOT, 'refs'));

  const line = (label, bytes, budget) => {
    const status = budget === undefined ? '     ' : bytes <= budget ? '  ok ' : ' FAIL';
    const target = budget === undefined ? '' : ` / ${(budget / MB).toFixed(1)} MB`;
    console.log(`${status} ${label.padEnd(28)} ${(bytes / KB).toFixed(0).padStart(6)} KB${target}`);
  };

  console.log('\nPayload budget\n');
  line('initial JS (gzip)', entry.bytes, BUDGETS.initialJsGzip);
  line('all JS (gzip)', allJs.bytes, BUDGETS.totalJsGzip);
  line('public textures', textures.bytes, BUDGETS.textures);
  line('public HDRIs', hdr.bytes, BUDGETS.hdr);
  line('public models', models.bytes, BUDGETS.models);
  line('public total', publicTotal.bytes, BUDGETS.publicTotal);
  line('study refs (not shipped)', refs.bytes);

  console.log(`\nEntry chunk: ${entry.entry}`);
  console.log(`JS files: ${allJs.count}`);
  if (allJs.largest.file) console.log(`Largest JS: ${allJs.largest.file} (${(allJs.largest.bytes / KB).toFixed(0)} KB)`);
  if (textures.largest.file) console.log(`Largest texture: ${textures.largest.file} (${(textures.largest.bytes / KB).toFixed(0)} KB)`);

  for (const check of [
    ['initial JS over budget', entry.bytes, BUDGETS.initialJsGzip],
    ['total JS over budget', allJs.bytes, BUDGETS.totalJsGzip],
    ['textures over budget', textures.bytes, BUDGETS.textures],
    ['HDRIs over budget', hdr.bytes, BUDGETS.hdr],
    ['models over budget', models.bytes, BUDGETS.models],
    ['public total over budget', publicTotal.bytes, BUDGETS.publicTotal],
  ]) {
    const [label, bytes, budget] = check;
    if (bytes > budget) failures.push(`${label}: ${(bytes / MB).toFixed(2)} MB > ${(budget / MB).toFixed(2)} MB`);
  }

  if (refs.count > 0) notes.push(`${refs.count} study photographs in refs/ are git-ignored and never shipped`);

  console.log('');
  for (const note of notes) console.log(`note: ${note}`);
  if (failures.length > 0) {
    console.error('\nBudget failures:');
    for (const failure of failures) console.error(`  ✗ ${failure}`);
    process.exitCode = 1;
    return;
  }
  console.log('\nWithin budget.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
