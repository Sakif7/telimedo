# Telimedo website

The marketing site for Telimedo, a telemedicine platform for clinics, employers and patients. It is a single page built with Next.js (App Router, TypeScript) and plain CSS. A 3D buddy, rendered with three.js, walks visitors through a video visit: he listens, his lens opens into the call, and he hands over the clinic dashboard.

## Run it

Requires Node.js 20.9 or newer.

```bash
npm install
npm run dev      # http://localhost:3000
```

| Script | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build (includes the type check) |
| `npm run start` | Serves the production build |
| `npm run lint` | ESLint |
| `npm test` | Playwright checks: builds, serves on port 3200, then checks the 3D story (tablet landing, lens glow, one canvas), the layout, the interactions, reduced motion, the no-WebGL fallback and accessibility. About 5 minutes plus the build, because the 3D renders in software. Run `npx playwright install chromium` once first. |
| `npm run shots -- desktop <dir>` | Optional: screenshots of every named moment for a manual review (`desktop`, `small`, `wide` or `mobile`; `SCHEME=dark`, `BASE_URL`, `NO_WEBGL=1`, `REDUCED=1`) |

`node scripts/brand-assets.mjs` regenerates the favicon, the Apple touch icon and the Open Graph image in `src/app/`.

## Where things are

- `src/content/site.ts` holds every string on the page. Values that still need real data (figures, the testimonial, customer names, prices, contact details, the domain) are marked `placeholder: true` and show a dotted coral underline on the page.
- `src/app/` has the routes: the layout, the page, the 404, the demo form action and the metadata files.
- `src/styles/` has the design tokens (`tokens.css`, both themes) and the base styles (`globals.css`).
- `src/components/` has the shared UI primitives (`ui/`), the header and footer (`layout/`), one folder per page section (`sections/`), the pinned story, the 3D studio windows and the product mock shown on the tablet. Styles are CSS Modules next to the components; the primitives share `ui/ui.module.css`.
- `src/lib/` has the logic without React: the story controller, the three.js engine and the runtime that runs them in one animation loop. `src/hooks/` has the hooks that connect components to that runtime.
- `public/` has the buddy model (Draco GLB, used as is), the Draco decoders, textures, posters and the brand SVGs.
- `tests/e2e/` has the Playwright checks. There are no screenshot comparisons; the look is reviewed by hand.

## Before launch

- Replace every placeholder in `src/content/site.ts`.
- Set `NEXT_PUBLIC_SITE_URL` to the production domain (used for metadata, the sitemap and robots.txt).
- Connect the demo form: `src/app/actions.ts` validates requests but doesn't store or send them yet. Then remove the "not connected" note from the content file.
- Point "Sign in" and the footer's company and legal links at real pages.
