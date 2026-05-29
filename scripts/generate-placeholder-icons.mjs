#!/usr/bin/env node
/**
 * Generate solid-bone placeholder icons for The White Oak.
 *
 * Until the real brand mark lands, the favicon / Apple touch icon /
 * Open Graph image are flat squares in the brand bone color. They sit
 * at app/icon.png, app/apple-icon.png, app/opengraph-image.png, and
 * app/favicon.ico — Next.js App Router auto-serves all four.
 *
 * Pure Node stdlib (zlib only). No `sharp`, no Pillow, no ImageMagick.
 * Re-run any time the bone color or the social image dimensions need
 * to change, then commit the resulting binaries.
 *
 *   node scripts/generate-placeholder-icons.mjs
 */

import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

// Brand token — keep in sync with tailwind.config.ts `bone`.
const BONE = { r: 0xec, g: 0xe2, b: 0xcb };

const here = dirname(fileURLToPath(import.meta.url));
const appDir = resolve(here, "..", "app");

// ----- PNG encoder ----------------------------------------------------------

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

const crc32 = (buf) => {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
};

const solidPng = (width, height, { r, g, b }) => {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: truecolor RGB
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const rowBytes = width * 3 + 1; // +1 for filter byte
  const raw = Buffer.alloc(rowBytes * height);
  for (let y = 0; y < height; y++) {
    const row = y * rowBytes;
    raw[row] = 0; // filter: None
    for (let x = 0; x < width; x++) {
      const o = row + 1 + x * 3;
      raw[o] = r;
      raw[o + 1] = g;
      raw[o + 2] = b;
    }
  }

  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
};

// ----- ICO encoder (single-entry, PNG-encoded) ------------------------------

const pngIco = (pngBuf, size) => {
  // ICONDIR (6 bytes) + 1 ICONDIRENTRY (16 bytes) + PNG payload.
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: ICO
  header.writeUInt16LE(1, 4); // image count

  const entry = Buffer.alloc(16);
  entry[0] = size === 256 ? 0 : size; // width (0 means 256)
  entry[1] = size === 256 ? 0 : size; // height
  entry[2] = 0; // colors in palette
  entry[3] = 0; // reserved
  entry.writeUInt16LE(1, 4); // color planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(pngBuf.length, 8); // image data size
  entry.writeUInt32LE(6 + 16, 12); // offset to image data

  return Buffer.concat([header, entry, pngBuf]);
};

// ----- Outputs --------------------------------------------------------------

const targets = [
  { file: "icon.png", width: 512, height: 512 },
  { file: "apple-icon.png", width: 180, height: 180 },
  { file: "opengraph-image.png", width: 1200, height: 630 },
];

for (const { file, width, height } of targets) {
  const png = solidPng(width, height, BONE);
  writeFileSync(resolve(appDir, file), png);
  console.log(`wrote ${file} (${width}x${height}, ${png.length} bytes)`);
}

const icoPng = solidPng(64, 64, BONE);
const ico = pngIco(icoPng, 64);
writeFileSync(resolve(appDir, "favicon.ico"), ico);
console.log(`wrote favicon.ico (64x64 PNG inside ICO, ${ico.length} bytes)`);
