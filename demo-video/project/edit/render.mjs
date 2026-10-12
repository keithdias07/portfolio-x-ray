// Renders the demo: node render.mjs stills 12.5 44 ...   |   node render.mjs video out.mp4 [from to]
import { chromium } from '../rec/node_modules/playwright-core/index.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { FPS, DURATION, VO, SUBS, SHOTS } from './timeline.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const FF = process.env.FFMPEG || 'ffmpeg';
const url = (p) => 'file:///' + p.replace(/\\/g, '/');

// subtitle cues from actual trimmed narration durations
const durs = Object.fromEntries(fs.readFileSync(`${ROOT}/vo/${process.env.VOICE || 'andrew'}/durs.txt`, 'utf8').trim().split('\n').map((l) => { const [f, d] = l.split(' '); return [f.replace('.wav', ''), +d]; }));
export function cues() {
  const out = [];
  for (const v of VO) {
    const parts = SUBS[v.id]; const total = parts.reduce((s, p) => s + p.length, 0); let t = v.at;
    parts.forEach((p, i) => { const d = durs[v.id] * p.length / total; out.push({ from: t, to: i === parts.length - 1 ? t + d + 0.35 : t + d, text: p }); t += d; });
  }
  // avoid overlaps
  for (let i = 0; i < out.length - 1; i++) out[i].to = Math.min(out[i].to, out[i + 1].from - 0.04);
  return out;
}

const TAKE = process.env.TAKE || 'take3';
const frames = JSON.parse(fs.readFileSync(`${ROOT}/rec/${TAKE}/frames.json`, 'utf8'));
const M = Object.fromEntries(JSON.parse(fs.readFileSync(`${ROOT}/rec/${TAKE}/markers.json`, 'utf8')).map((m) => [m.name, m.t]));
const shots = SHOTS.map((s) => s.kind === 'app' ? { ...s, src: M[s.mark] + s.off } : s);
const brollCount = Object.fromEntries(['b1', 'b2', 'b3', 'b4', 'b5', 'b6'].map((d) => [d, fs.readdirSync(`${ROOT}/broll/${d}`).length]));
const data = { shots, frames, appDir: url(`${ROOT}/rec/${TAKE}/frames`), brollDir: url(`${ROOT}/broll`), brollCount, cues: cues() };

const [mode, ...args] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: EDGE, headless: true, args: ['--allow-file-access-from-files', '--force-color-profile=srgb'] });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
await p.goto(url(`${ROOT}/edit/stage.html`));
await p.evaluate((d) => window.init(d), data);
await p.evaluate(() => document.fonts.ready);

if (mode === 'stills') {
  fs.mkdirSync(`${ROOT}/edit/stills`, { recursive: true });
  for (const a of args) { await p.evaluate((t) => window.frame(t), +a); await p.screenshot({ path: `${ROOT}/edit/stills/t${a}.jpg`, type: 'jpeg', quality: 85 }); console.log('still', a); }
} else if (mode === 'video') {
  const out = args[0]; const from = +(args[1] ?? 0), to = +(args[2] ?? DURATION);
  const ff = spawn(FF, ['-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', String(FPS), out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const n0 = Math.round(from * FPS), n1 = Math.round(to * FPS);
  const tStart = Date.now();
  for (let n = n0; n < n1; n++) {
    await p.evaluate((t) => window.frame(t), n / FPS);
    const buf = await p.screenshot({ type: 'jpeg', quality: 93 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (n % 150 === 0) console.log(`frame ${n}/${n1} ${((Date.now() - tStart) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end(); await new Promise((r) => ff.on('close', r));
  console.log('video done', out);
} else if (mode === 'cues') {
  console.log(JSON.stringify(cues(), null, 1));
}
await b.close();
