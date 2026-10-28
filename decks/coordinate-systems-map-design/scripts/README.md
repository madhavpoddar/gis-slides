# Generated assets

These scripts rebuild the deck's generated maps and data. Run them from this folder.

| Script | Builds | Source data |
|---|---|---|
| `node world-maps.mjs` | `public/mercator-world.svg` | Natural Earth 1:110m (`world-atlas` package) |
| `node --max-old-space-size=4096 coastline.mjs` | `components/britain.json`, `britain-lengths.json`, `britain-zooms.json` | ONS Countries (Dec 2023) BFC, downloaded on first run |
| `python ice-screens.py` | `public/ice-screen-out.jpg`, `public/ice-screen-in.jpg` | Original photos in `sources/` |

## world-maps.mjs

Generates the Mercator map with its planted issues: a single scale bar, a straight route labelled with the great-circle distance, and Antarctica cut off at 60°S. The interactive comparison on the next slide (Mercator, Equal Earth, globe; straight vs shortest route) is drawn live by `components/RouteMap.vue`, using the same colours and data.

## coastline.mjs

1. Downloads England, Scotland and Wales from the ONS ArcGIS service at full resolution. The boundaries are clipped to mean high water and use British National Grid metres. About 80 MB goes into `.work/`, which is git-ignored.
2. Merges the three countries with [mapshaper](https://github.com/mbloch/mapshaper), run via `npx`. Keeps the main island for measuring and all land for the zoom fills.
3. Measures the main island with 160 ruler lengths from 100 km to 10 m, using Richardson's divider method on the full-resolution line. The slide interpolates between these.
4. Writes a 200 m simplified outline for drawing, plus the three nested zoom views. The zoom boxes are set in `ZOOMS`.

Intermediate files in `.work/` are reused. Delete one to rebuild it, or pass a different work directory as the first argument.

Data: Source: Office for National Statistics licensed under the Open Government Licence v3.0. Contains OS data © Crown copyright and database right 2023.

## ice-screens.py

Cuts the passenger display out of each photo and corrects the perspective, so both screens come out as the same 1920×1130 rectangle. The corner coordinates are in `SCREENS`. The script needs Pillow and NumPy.
