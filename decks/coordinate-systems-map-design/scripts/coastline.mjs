// Builds the data for the coastline slide (components/Coastline.vue) from ONS country
// boundaries: full resolution, clipped to mean high water, British National Grid (metres).
//
//   node --max-old-space-size=4096 coastline.mjs [workDir]
//
// Downloads ~80 MB into workDir (default: scripts/.work, git-ignored) on the first run and
// uses mapshaper via npx. Writes to ../components:
//   britain.json          main-island outline for drawing (simplified to 200 m), km, y down
//   britain-lengths.json  [ruler km, measured km], measured on the full-resolution line
//   britain-zooms.json    the three nested zoom views: land to fill and coast to walk
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const SERVICE = 'https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services/Countries_December_2023_Boundaries_UK_BFC/FeatureServer/0/query'
const COUNTRIES = ['England', 'Scotland', 'Wales']
// Ruler range and number of rulers measured for the chart
const R_MAX = 100, R_MIN = 0.02, N = 160
// Zoom views in km [xmin, ymin, xmax, ymax]: West Highlands (60 km), Arisaig (12 km), Arisaig shore (1.2 km).
// coast: outline the ruler walks; land: simplification of the filled land (m); dp: decimals kept
const ZOOMS = [
  { box: [140, 760, 200, 820], coast: 'gb-50', land: 100, dp: 2 },
  { box: [162, 778, 174, 790], coast: 'gb-main', land: 10, dp: 3 },
  { box: [164.2, 786.0, 165.4, 787.2], coast: 'gb-main', land: 0, dp: 3 },
]

const work = process.argv[2] ?? join(import.meta.dirname, '.work')
const OUT = join(import.meta.dirname, '..', 'components')
mkdirSync(work, { recursive: true })
const file = name => join(work, name)

function mapshaper(...args) {
  const { status } = spawnSync('npx', ['--yes', 'mapshaper@0.6.121', ...args], { stdio: 'inherit', shell: true })
  if (status !== 0) process.exit(status ?? 1)
}
const quoted = f => `"${f}"`
const readJson = f => JSON.parse(readFileSync(f, 'utf8'))
const geometries = g => g.geometries ?? g.features.map(f => f.geometry)

// 1. Download England, Scotland and Wales
for (const c of COUNTRIES) {
  if (existsSync(file(`${c}.json`))) continue
  console.log(`Downloading ${c}…`)
  const res = await fetch(`${SERVICE}?where=CTRY23NM%3D%27${c}%27&outFields=CTRY23NM&outSR=27700&f=json`)
  writeFileSync(file(`${c}.json`), Buffer.from(await res.arrayBuffer()))
}

// 2. ArcGIS JSON -> GeoJSON, one Polygon per outer ring (Esri outer rings run clockwise)
if (!existsSync(file('gb-parts.geojson'))) {
  const area = r => r.reduce((s, [x, y], i) => { const [x2, y2] = r[(i + 1) % r.length]; return s + x * y2 - x2 * y }, 0) / 2
  const features = []
  for (const c of COUNTRIES) {
    for (const f of readJson(file(`${c}.json`)).features) {
      for (const ring of f.geometry.rings) {
        if (area(ring) < 0) features.push({ type: 'Feature', properties: { name: c }, geometry: { type: 'Polygon', coordinates: [ring.slice().reverse()] } })
      }
    }
  }
  writeFileSync(file('gb-parts.geojson'), JSON.stringify({ type: 'FeatureCollection', features }))
}

// 3. Merge the countries: all land (for the zoom fills) and the main island alone
if (!existsSync(file('gb-all.geojson')))
  mapshaper(quoted(file('gb-parts.geojson')), '-dissolve', '-o', quoted(file('gb-all.geojson')))
if (!existsSync(file('gb-main.geojson')))
  mapshaper(quoted(file('gb-parts.geojson')), '-dissolve', '-explode', '-each', '"a=this.area"', '-sort', 'a', 'descending', '-filter', '"this.id==0"', '-o', quoted(file('gb-main.geojson')))
for (const interval of [50, 200]) {
  if (!existsSync(file(`gb-${interval}.geojson`)))
    mapshaper(quoted(file('gb-main.geojson')), '-simplify', `interval=${interval}`, '-o', quoted(file(`gb-${interval}.geojson`)))
}
ZOOMS.forEach(({ box, land }, i) => {
  const m = (box[2] - box[0]) / 60
  const bbox = [box[0] - m, box[1] - m, box[2] + m, box[3] + m].map(v => Math.round(v * 1000)).join(',')
  mapshaper(quoted(file('gb-all.geojson')), '-clip', `bbox=${bbox}`, ...(land ? ['-simplify', `interval=${land}`] : []), '-o', quoted(file(`zoom-${i}-land.geojson`)))
})

const rings = {}
const ringOf = name => rings[name] ??= geometries(readJson(file(`${name}.geojson`)))[0].coordinates[0].map(([x, y]) => [x / 1000, y / 1000])
// km with y pointing down, for SVG
const fix = (dp, [x, y]) => [+x.toFixed(dp), +(-y).toFixed(dp)]

// 4. Outline for drawing
writeFileSync(join(OUT, 'britain.json'), JSON.stringify(ringOf('gb-200').map(p => fix(2, p))))

// 5. Measured length for each ruler (Richardson's divider method)
function divide(ring, r) {
  let n = 1, c = ring[0], seg = 0, t0 = 0
  for (;;) {
    let next
    for (let j = seg; j < ring.length - 1 && !next; j++) {
      const [ax, ay] = ring[j], [bx, by] = ring[j + 1]
      const dx = bx - ax, dy = by - ay, fx = ax - c[0], fy = ay - c[1]
      const A = dx * dx + dy * dy, B = 2 * (fx * dx + fy * dy), C = fx * fx + fy * fy - r * r
      const disc = B * B - 4 * A * C
      if (!A || disc < 0) continue
      const t = (-B + Math.sqrt(disc)) / (2 * A)
      if (t >= (j === seg ? t0 : 0) && t <= 1) { next = [ax + t * dx, ay + t * dy]; seg = j; t0 = t }
    }
    if (!next) break
    n++
    c = next
  }
  return (n - 1) * r + Math.hypot(ring[0][0] - c[0], ring[0][1] - c[1])
}
const full = ringOf('gb-main')
const lengths = Array.from({ length: N }, (_, i) => {
  const r = R_MAX * (R_MIN / R_MAX) ** (i / (N - 1))
  return [+r.toPrecision(4), Math.round(divide(full, r))]
})
writeFileSync(join(OUT, 'britain-lengths.json'), JSON.stringify(lengths))

// 6. Zoom views
const zooms = ZOOMS.map(({ box, coast, dp }, i) => {
  const [x0, y0, x1, y1] = box
  const m = (x1 - x0) * 0.3
  const inside = ([x, y]) => x >= x0 - m && x <= x1 + m && y >= y0 - m && y <= y1 + m
  // Runs of consecutive coast points near the box; each walk starts off-screen in the margin
  const runs = []
  let run = []
  for (const p of ringOf(coast)) {
    if (inside(p)) run.push(fix(dp, p))
    else if (run.length) { if (run.length > 1) runs.push(run); run = [] }
  }
  if (run.length > 1) runs.push(run)

  let land = ''
  for (const g of geometries(readJson(file(`zoom-${i}-land.geojson`)))) {
    const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates
    for (const poly of polys) for (const r of poly) land += `M${r.map(p => fix(dp, [p[0] / 1000, p[1] / 1000]).join(',')).join('L')}Z`
  }
  return { box, land, runs }
})
writeFileSync(join(OUT, 'britain-zooms.json'), JSON.stringify(zooms))
console.log(`Wrote components/britain*.json: ${lengths[0][1]} km at ${R_MAX} km … ${lengths[N - 1][1]} km at ${R_MIN * 1000} m`)
