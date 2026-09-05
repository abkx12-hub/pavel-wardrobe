import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';

// Export only the finished wardrobe and its images; no server is required.
const source = process.argv[2] || '../wardrobe-daily-site/public/wardrobe-web.html';
let html = await fs.readFile(source, 'utf8');
const images = [...new Set(html.match(/data:image\/webp;base64,[A-Za-z0-9+/=]+/g) || [])];
await fs.mkdir('assets', { recursive: true });
for (const image of images) {
  const bytes = Buffer.from(image.slice(image.indexOf(',') + 1), 'base64');
  const name = createHash('sha256').update(bytes).digest('hex').slice(0, 20);
  const target = `assets/${name}.webp`;
  await fs.writeFile(target, bytes);
  html = html.split(image).join(target);
}
html = html.replace('img-src data: blob:', "img-src data: blob: https://abkx12-hub.github.io");
html = html.replace(/<img(?![^>]*loading=)/g, '<img loading="lazy"');
await fs.writeFile('wardrobe.html', html);
const version = createHash('sha256').update(html).digest('hex').slice(0, 12);
const index = await fs.readFile('index.html', 'utf8');
await fs.writeFile('index.html', index.replace(/src="wardrobe\.html(?:\?[^"]*)?"/, `src="wardrobe.html?v=${version}"`));
console.log(JSON.stringify({ images: images.length, pageKB: Math.round(Buffer.byteLength(html) / 1024) }));
