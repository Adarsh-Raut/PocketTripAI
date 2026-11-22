// Turns the full-size capture PNGs (docs/screenshots/raw, gitignored) into the
// small WebP files the README uses. 1600px wide is ~2x the width GitHub renders.
// Run: node docs/screenshots/optimize.mjs   (needs `sharp`, which Next.js installs)
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { statSync } from "node:fs";
import path from "node:path";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const USED = ["landing", "itinerary", "budget", "trip-dark"];

let before = 0, after = 0;
for (const name of USED) {
  const src = path.join(DIR, "raw", `${name}-desktop.png`);
  const out = path.join(DIR, `${name}.webp`);
  const info = await sharp(src).resize({ width: 1600 }).webp({ quality: 80, effort: 6 }).toFile(out);
  const orig = statSync(src).size;
  before += orig; after += info.size;
  console.log(`${name}: ${Math.round(orig / 1024)}KB png -> ${Math.round(info.size / 1024)}KB webp`);
}
console.log(`total: ${Math.round(before / 1024)}KB -> ${Math.round(after / 1024)}KB`);
