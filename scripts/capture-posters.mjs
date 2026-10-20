#!/usr/bin/env node
/**
 * Capture review posters of the palace with headless Chrome, using the app's
 * deep links (?room=…&time=…&quality=…). Writes to docs/posters/ and copies the
 * hero still to public/poster.png for the no-WebGL fallback.
 *
 * Headless Chrome's --screenshot fires before a 40 MB asset load and a million
 * triangles have finished, so this drives the DevTools protocol instead: it
 * waits for every room to report its merged geometry, then reads the WebGL
 * drawing buffer with `?capture=1`. Screenshots of the composited page ghost the
 * DOM overlay into the WebGL frame under SwiftShader, so stills are canvas-only.
 *
 * This is a review and CI tool, not part of the shipped bundle.
 *
 * Run: npm run posters
 */
import { spawn } from 'node:child_process';
import { copyFile, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const PORT = Number(process.env.POSTER_PORT ?? 4178);
const OUT = path.join(ROOT, 'docs', 'posters');
const EXPECTED_ROOMS = 5;

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);

const SHOTS = [
  { name: 'aangan-day', query: 'room=aangan&time=day&quality=high' },
  { name: 'aangan-night', query: 'room=aangan&time=night&quality=high' },
  { name: 'gallery-day', query: 'room=gallery&time=day&quality=high' },
  { name: 'gallery-night', query: 'room=gallery&time=night&quality=high' },
  { name: 'archive-night', query: 'room=archive&time=night&quality=high' },
  { name: 'council-day', query: 'room=council&time=day&quality=high' },
  { name: 'council-night', query: 'room=council&time=night&quality=high' },
];

/** Ad-hoc captures: `node scripts/capture-posters.mjs name=room=council&cam=...` */
function shotsFromArgs(args) {
  const shots = args
    .filter((arg) => arg.includes('='))
    .map((arg) => {
      const index = arg.indexOf('=');
      return { name: arg.slice(0, index), query: arg.slice(index + 1) };
    });
  return shots.length > 0 ? shots : SHOTS;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function chromePath() {
  return CHROME_CANDIDATES.find((candidate) => existsSync(candidate)) ?? null;
}

async function waitForServer(url, timeoutMs = 30_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return true;
    } catch {
      // not up yet
    }
    await sleep(250);
  }
  return false;
}

/** Minimal CDP client over Node's built-in WebSocket. */
async function connect(wsUrl) {
  const socket = new WebSocket(wsUrl);
  const pending = new Map();
  const listeners = new Map();
  let nextId = 0;

  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });

  socket.addEventListener('message', (event) => {
    const message = JSON.parse(String(event.data));
    if (message.id !== undefined) {
      const entry = pending.get(message.id);
      if (!entry) return;
      pending.delete(message.id);
      if (message.error) entry.reject(new Error(message.error.message));
      else entry.resolve(message.result);
      return;
    }
    const handlers = listeners.get(message.method);
    if (handlers) for (const handler of handlers) handler(message.params);
  });

  return {
    send(method, params = {}) {
      const id = (nextId += 1);
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        socket.send(JSON.stringify({ id, method, params }));
      });
    },
    once(method) {
      return new Promise((resolve) => {
        const handler = (params) => {
          const handlers = listeners.get(method) ?? [];
          listeners.set(
            method,
            handlers.filter((candidate) => candidate !== handler),
          );
          resolve(params);
        };
        listeners.set(method, [...(listeners.get(method) ?? []), handler]);
      });
    },
    close() {
      socket.close();
    },
  };
}

async function launchChrome(chrome, suffix) {
  const profile = path.join(os.tmpdir(), `nimbagarh-posters-${process.pid}-${suffix}`);
  const child = spawn(
    chrome,
    [
      '--headless=new',
      '--hide-scrollbars',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      '--mute-audio',
      '--enable-unsafe-swiftshader',
      '--use-angle=swiftshader',
      '--force-color-profile=srgb',
      '--force-device-scale-factor=1',
      '--remote-debugging-port=0',
      `--user-data-dir=${profile}`,
      // Window is deliberately taller than the captured viewport so the
      // emulated metrics never exceed the real surface.
      '--window-size=1620,1240',
      // Deterministic software compositing: without this, SwiftShader can
      // ghost the DOM overlay into the WebGL frame that gets captured.
      '--run-all-compositor-stages-before-draw',
      '--disable-new-content-rendering-timeout',
      ...(process.env.POSTER_CHROME_FLAGS?.split(' ').filter(Boolean) ?? []),
      'about:blank',
    ],
    { stdio: 'ignore' },
  );

  const portFile = path.join(profile, 'DevToolsActivePort');
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (existsSync(portFile)) {
      const [port] = (await readFile(portFile, 'utf8')).split('\n');
      if (port) return { child, port: Number(port), profile };
    }
    await sleep(200);
  }
  child.kill('SIGKILL');
  throw new Error('Chrome did not expose a DevTools port');
}

async function capture(chrome, url, destination, { width = 1600, height = 1000 } = {}) {
  const { child, port } = await launchChrome(chrome, path.basename(destination, '.png'));
  try {
    const target = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, {
      method: 'PUT',
    }).then((response) => response.json());
    const client = await connect(target.webSocketDebuggerUrl);

    await client.send('Page.enable');
    await client.send('Runtime.enable');
    // Configure the viewport before navigating, while the window is still blank.
    await client.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await client.send('Page.navigate', { url: `${url}${url.includes('?') ? '&' : '?'}capture=1` });

    // Wait until every room has merged its geometry, then let the GPU settle.
    const readyDeadline = Date.now() + 90_000;
    let rooms = 0;
    while (Date.now() < readyDeadline) {
      const { result } = await client.send('Runtime.evaluate', {
        expression: 'window.__nimbagarh?.length ?? 0',
        returnByValue: true,
      });
      rooms = Number(result?.value ?? 0);
      if (rooms >= EXPECTED_ROOMS) break;
      await sleep(400);
    }
    await sleep(3000);

    // Freeze CSS motion so the still is deterministic.
    await client.send('Runtime.evaluate', {
      expression: `(() => {
        const style = document.createElement('style');
        style.textContent = '*, *::before, *::after { animation: none !important; transition: none !important; }';
        document.head.append(style);
      })()`,
    });
    await sleep(600);
    // Read the drawing buffer directly. A compositor screenshot ghosts the DOM
    // overlay into the WebGL frame under SwiftShader, and no CSS workaround
    // fixes it reliably, so stills are the canvas alone.
    await client.send('Runtime.evaluate', {
      expression:
        'new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve(true))))',
      awaitPromise: true,
    });
    const pixels = await client.send('Runtime.evaluate', {
      expression: 'document.querySelector("canvas").toDataURL("image/png")',
      returnByValue: true,
    });
    const dataUrl = pixels.result?.value;
    if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/png')) {
      throw new Error('canvas did not return an image');
    }
    await writeFile(destination, Buffer.from(dataUrl.slice('data:image/png;base64,'.length), 'base64'));

    client.close();
    await fetch(`http://127.0.0.1:${port}/json/close/${target.id}`);
    return rooms;
  } finally {
    child.kill('SIGKILL');
  }
}

async function main() {
  const chrome = chromePath();
  if (!chrome) {
    console.error('No Chrome/Chromium found. Set CHROME_PATH to capture posters.');
    process.exitCode = 1;
    return;
  }
  if (!existsSync(path.join(ROOT, 'dist', 'index.html'))) {
    console.error('dist/ not built. Run `npm run build` first.');
    process.exitCode = 1;
    return;
  }

  await mkdir(OUT, { recursive: true });
  const shots = shotsFromArgs(process.argv.slice(2));
  const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
    cwd: ROOT,
    stdio: 'ignore',
  });

  const base = `http://localhost:${PORT}/`;
  if (!(await waitForServer(base))) {
    server.kill('SIGTERM');
    console.error('preview server did not start');
    process.exitCode = 1;
    return;
  }

  try {
    for (const shot of shots) {
      const destination = path.join(OUT, `${shot.name}.png`);
      process.stdout.write(`capturing ${shot.name}… `);
      try {
        const rooms = await capture(chrome, `${base}?${shot.query}`, destination);
        const info = await stat(destination);
        console.log(`${(info.size / 1024).toFixed(0)} KB (${rooms} rooms)`);
      } catch (error) {
        console.log(`failed (${error instanceof Error ? error.message : String(error)})`);
      }
    }
  } finally {
    server.kill('SIGTERM');
  }

  const heroSource = path.join(OUT, 'aangan-day.png');
  if (process.argv.length <= 2 && existsSync(heroSource)) {
    await copyFile(heroSource, path.join(ROOT, 'public', 'poster.png'));
    console.log('Wrote public/poster.png (WebGL fallback still).');
  }
  console.log(`\nPosters in ${path.relative(ROOT, OUT)}/`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
