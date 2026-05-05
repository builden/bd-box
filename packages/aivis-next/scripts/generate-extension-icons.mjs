import { mkdir, writeFile } from 'node:fs/promises';
import { deflateSync } from 'node:zlib';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const outDir = resolve(rootDir, 'public/extension-icons');

const sizes = [16, 32, 48, 128];

function crc32(buffer) {
  let crc = -1;
  for (let i = 0; i < buffer.length; i += 1) {
    crc ^= buffer[i];
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const lengthBuffer = Buffer.alloc(4);
  lengthBuffer.writeUInt32BE(data.length, 0);
  const crcBuffer = Buffer.alloc(4);
  const crc = crc32(Buffer.concat([typeBuffer, data]));
  crcBuffer.writeUInt32BE(crc, 0);
  return Buffer.concat([lengthBuffer, typeBuffer, data, crcBuffer]);
}

function createPng(width, height, rgba) {
  const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // rgba
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const rowSize = width * 4 + 1;
  const raw = Buffer.alloc(rowSize * height);
  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * rowSize;
    raw[rowOffset] = 0;
    for (let x = 0; x < width; x += 1) {
      const src = (y * width + x) * 4;
      const dst = rowOffset + 1 + x * 4;
      raw[dst] = rgba[src];
      raw[dst + 1] = rgba[src + 1];
      raw[dst + 2] = rgba[src + 2];
      raw[dst + 3] = rgba[src + 3];
    }
  }

  const idat = chunk('IDAT', deflateSync(raw));
  const iend = chunk('IEND', Buffer.alloc(0));
  return Buffer.concat([header, chunk('IHDR', ihdr), idat, iend]);
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function smoothstep(edge0, edge1, x) {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function blendPixel(base, overlay) {
  const alpha = overlay[3] / 255;
  const inv = 1 - alpha;
  return [
    Math.round(overlay[0] * alpha + base[0] * inv),
    Math.round(overlay[1] * alpha + base[1] * inv),
    Math.round(overlay[2] * alpha + base[2] * inv),
    255,
  ];
}

function distanceRoundedRect(x, y, cx, cy, halfWidth, halfHeight, radius) {
  const dx = Math.abs(x - cx) - halfWidth + radius;
  const dy = Math.abs(y - cy) - halfHeight + radius;
  const ax = Math.max(dx, 0);
  const ay = Math.max(dy, 0);
  const outside = Math.hypot(ax, ay);
  const inside = Math.min(Math.max(dx, dy), 0);
  return outside + inside - radius;
}

function renderIcon(size) {
  const pixels = Buffer.alloc(size * size * 4);
  const samples = 4;
  const sampleCount = samples * samples;
  const bg = [15, 17, 21];
  const purple = [124, 58, 237];
  const white = [248, 250, 252];
  const accent = [168, 85, 247];

  const center = size / 2;
  const radius = size * 0.24;
  const orbRadius = size * 0.23;
  const plusHalf = size * 0.17;
  const barThickness = Math.max(1.5, size * 0.09);
  const barRadius = barThickness / 2;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let accum = [0, 0, 0, 0];

      for (let sy = 0; sy < samples; sy += 1) {
        for (let sx = 0; sx < samples; sx += 1) {
          const px = x + (sx + 0.5) / samples;
          const py = y + (sy + 0.5) / samples;

          let current = [...bg, 255];
          const rectDistance = distanceRoundedRect(px, py, center, center, center - 1, center - 1, radius);
          const rectAlpha = smoothstep(1.2, -0.2, rectDistance);
          current = [
            Math.round(bg[0] * rectAlpha),
            Math.round(bg[1] * rectAlpha),
            Math.round(bg[2] * rectAlpha),
            Math.round(255 * rectAlpha),
          ];

          const dx = px - center;
          const dy = py - center;
          const orbDistance = Math.hypot(dx, dy) - orbRadius;
          const orbAlpha = smoothstep(1.0, -1.0, orbDistance);
          const orbColor = [
            Math.round((purple[0] + accent[0]) / 2),
            Math.round((purple[1] + accent[1]) / 2),
            Math.round((purple[2] + accent[2]) / 2),
            Math.round(255 * orbAlpha * 0.95),
          ];
          current = blendPixel(current, orbColor);

          const crossDistance = Math.min(
            Math.abs(dx) - barThickness / 2,
            Math.abs(dy) - barThickness / 2
          );
          const crossRange = smoothstep(1.0, -1.0, crossDistance);
          const inCrossBounds = Math.abs(dx) <= plusHalf && Math.abs(dy) <= plusHalf;
          const crossAlpha = inCrossBounds ? crossRange * 0.96 : 0;
          const crossColor = [white[0], white[1], white[2], Math.round(255 * crossAlpha)];
          current = blendPixel(current, crossColor);

          accum[0] += current[0];
          accum[1] += current[1];
          accum[2] += current[2];
          accum[3] += current[3];
        }
      }

      const dst = (y * size + x) * 4;
      pixels[dst] = Math.round(accum[0] / sampleCount);
      pixels[dst + 1] = Math.round(accum[1] / sampleCount);
      pixels[dst + 2] = Math.round(accum[2] / sampleCount);
      pixels[dst + 3] = Math.round(accum[3] / sampleCount);
    }
  }

  return createPng(size, size, pixels);
}

await mkdir(outDir, { recursive: true });

for (const size of sizes) {
  const png = renderIcon(size);
  await writeFile(resolve(outDir, `icon-${size}.png`), png);
}
