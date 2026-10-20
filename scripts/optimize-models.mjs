#!/usr/bin/env node
/**
 * Re-run the glTF optimisation pass on the downloaded sources without
 * re-downloading anything. Use after changing meshopt/WebP settings, or to
 * reproduce public/models/props/*.glb from .asset-source/models/*.
 *
 * Run: npm run assets:optimize
 */
import { execFileSync } from 'node:child_process';
import { mkdir, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { GLTF_OPTIMIZE_ARGS, MODELS } from './asset-catalog.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');

async function findSource(slug) {
  const directory = path.join(ROOT, '.asset-source', 'models', slug);
  if (!existsSync(directory)) return null;
  const entries = await readdir(directory);
  const candidate = entries.find((name) => name.endsWith('.gltf')) ?? entries.find((name) => name.endsWith('.glb'));
  return candidate ? path.join(directory, candidate) : null;
}

async function main() {
  let optimised = 0;
  for (const [slug, entry] of Object.entries(MODELS)) {
    const source = await findSource(slug);
    if (!source) {
      console.warn(`skip ${slug}: no source in .asset-source/models/${slug} (run npm run assets:fetch)`);
      continue;
    }
    const output = path.join(ROOT, 'public', 'models', 'props', entry.output);
    await mkdir(path.dirname(output), { recursive: true });
    console.log(`optimising ${path.relative(ROOT, source)} → ${path.relative(ROOT, output)}`);
    execFileSync('npx', ['gltf-transform', 'optimize', source, output, ...GLTF_OPTIMIZE_ARGS], {
      cwd: ROOT,
      stdio: 'inherit',
    });
    const info = await stat(output);
    console.log(`  ${entry.output}: ${(info.size / 1024 / 1024).toFixed(2)} MB`);
    optimised += 1;
  }
  console.log(`\nOptimised ${optimised} model(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
