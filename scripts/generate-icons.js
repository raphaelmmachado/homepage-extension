import { Resvg } from '@resvg/resvg-js';
import fs from 'node:fs';
import path from 'node:path';

// Modern SVG with gradient background and clean, sharp home icon
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3B82F6" />
      <stop offset="50%" stop-color="#4F46E5" />
      <stop offset="100%" stop-color="#7C3AED" />
    </linearGradient>
    <linearGradient id="roofGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#F8FAFC" />
    </linearGradient>
  </defs>

  <!-- Background Squircle -->
  <rect x="28" y="28" width="456" height="456" rx="112" fill="url(#bgGrad)" />
  
  <!-- Subtle Border Highlight -->
  <rect x="28" y="28" width="456" height="456" rx="112" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="12" />

  <!-- Chimney -->
  <path d="M330 180 V144 C330 138 336 132 342 132 H366 C372 132 378 138 378 144 V218 Z" fill="#E2E8F0" />

  <!-- House Body & Roof -->
  <path d="M256 116 L94 246 C86 252 91 266 104 266 H136 V382 C136 396 148 408 162 408 H350 C364 408 376 396 376 382 V266 H408 C421 266 426 252 418 246 Z" fill="url(#roofGrad)" />
  
  <!-- Modern Door / Portal Cutout -->
  <path d="M214 408 V306 C214 284 233 266 256 266 C279 266 298 284 298 306 V408 Z" fill="#4338CA" />

  <!-- Glowing Door Accent Dot -->
  <circle cx="278" cy="342" r="8" fill="#FBBF24" />
</svg>`;

const publicDir = path.resolve('public');
fs.writeFileSync(path.join(publicDir, 'icon.svg'), svg.trim());
console.log('Saved public/icon.svg');

const sizes = [16, 32, 48, 128];
for (const size of sizes) {
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: size,
    },
  });

  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();
  const filename = `icon${size}.png`;
  fs.writeFileSync(path.join(publicDir, filename), pngBuffer);
  console.log(`Generated public/${filename} (${size}x${size})`);
}
