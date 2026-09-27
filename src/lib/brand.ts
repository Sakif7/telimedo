import fs from 'node:fs';
import path from 'node:path';

/* The brand SVGs in public/brand are the single source for the logo. Server
   components read them at build time and inline them, exactly as v1's build did.
   Never redraw or restyle the logo. */

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), 'public', 'brand', file), 'utf8').trim();

/** Inline form: decorative (the surrounding link or label carries the name). */
const inline = (svg: string) => svg.replace('<svg ', '<svg aria-hidden="true" focusable="false" ');

/** One-colour form for the footer's large wordmark: shapes take currentColor and
    the pulse-line cut-outs take the page background. */
const mono = (svg: string) =>
  svg
    .replace(/stroke="#fff(?:fff)?"/gi, 'style="stroke:var(--bg)"')
    .replace(/fill="#(?:[0-9a-fA-F]{3}){1,2}"/g, 'fill="currentColor"')
    .replace(/stroke="#(?:[0-9a-fA-F]{3}){1,2}"/g, 'stroke="currentColor"');

const wordmark = read('telimedo-wordmark.svg');
const mark = read('telimedo-mark.svg');

export const brand = {
  /** Raw SVG sources (used by the product mock and the tablet's back decal). */
  raw: { wordmark, mark },
  wordmark: inline(wordmark),
  mark: inline(mark),
  wordmarkMono: mono(inline(wordmark)),
};

export type BrandSvgs = typeof brand.raw;
