# GIS Course Slides

[Slidev](https://sli.dev) decks for the GIS course. Every deck is built separately and published at

```
https://madhavpoddar.github.io/gis-slides/<deck-name>/
```

The overview page at https://madhavpoddar.github.io/gis-slides/ lists all decks.

## Layout

```
decks/
  _template/            # copied by `npm run new` (ignored by the build)
  map-projections/      # one folder = one deck = one URL
    slides.md
    components/         # Vue components used only by this deck
    public/             # images etc. for this deck (served at the deck root)
scripts/                # dev / build / new helpers
.github/workflows/      # builds all decks and deploys to GitHub Pages on push to main
```

## Usage

```bash
npm install

npm run new -- vector-vs-raster "Vector vs. Raster Data"   # scaffold a new deck
npm run dev -- vector-vs-raster                            # live preview one deck
npm run build                                              # build all decks into dist/
npm run build -- vector-vs-raster                          # build just one
npm run preview                                            # serve dist/ at http://localhost:3000/gis-slides/
```

The folder name is the URL slug. Its `title:` and `info:` headmatter appear on the overview page.
The base path defaults to `/gis-slides/`. You can override it with `BASE_PATH`.

## Deployment

Pushing to `main` runs [.github/workflows/deploy.yml](.github/workflows/deploy.yml). It builds every deck and publishes `dist/` to GitHub Pages. In the repo settings, go to **Pages → Source** and select **GitHub Actions**.
