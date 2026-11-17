# Image sources and regeneration

The cover and six gallery pages have editable HTML in `src/`, with shared brand styles in `src/style.css`.

## Sources

- [TechCycle on Devpost](https://devpost.com/software/techcycle): project name, sole creator Alaap Joshi, PeddieHacks 2023, and **Solo Prize (USA Address only)**. The project update is dated August 19, 2023; this is not a verified event date range.
- [Owner profile](https://devpost.com/alaapjoshi): includes TechCycle in the project listing.
- [Original gallery image](https://d112y698adiu2z.cloudfront.net/photos/production/software_photos/002/565/201/datas/original.png): downloaded as `devpost-gallery-original.png`. Devpost's only still gallery image is the project logo, not a team photo or product screenshot. `devpost-gallery-original.jpg` is its gallery-sized version.
- [Embedded demo video](https://www.youtube.com/watch?v=VKVpra67uo4): downloaded as `src/shots/devpost-demo.mp4` (171 seconds, published August 20, 2023). The existing `src/shots/demo-home.png`, `demo-item.png`, `demo-price.png`, and `demo-map.png` are labeled as frames from the 2023 demo. Covers and gallery 1–4 use these historical frames, whose copy and service implementation differ from the current code.
- `src/shots/upload.png`: existing local upload-form capture used in gallery 5. TODO(Alaap): confirm capture environment and date.
- Gallery 6: architecture diagram checked against the current source; it is not a product screenshot.

The actual source media takes priority over illustrative feature cards. No team photos were present on the project page.

## Rendering

Render all eight HTML pages at deviceScaleFactor 2. Logical sizes are 1280×640 for the cover, 1200×627 for LinkedIn, and 1600×1000 for each gallery image. PNG pixel dimensions are twice those values.

Install rendering tools in an ignored directory without changing the app's dependency files:

```bash
npm install --prefix node_modules/.render-tools --no-package-lock playwright
node node_modules/.render-tools/node_modules/playwright/cli.js install chromium
node docs/images/src/render.mjs
```

Optionally set `CHROMIUM_EXECUTABLE_PATH` to a compatible installed Chromium executable.

## Verification status

All eight PNGs in this directory have been rendered from the latest HTML and visually reviewed. Their layouts are readable. The HTML sources remain the authoritative layouts.
