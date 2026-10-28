<script setup lang="ts">
import { computed, ref } from 'vue'
import { geoDistance, geoEquirectangular, geoGraticule10, geoOrthographic, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import world from 'world-atlas/land-110m.json'

// Plain lat/lon map: SVG x is longitude, y is -latitude (degrees)
const path = geoPath(geoEquirectangular().scale(180 / Math.PI).translate([0, 0]))
const landGeo = feature(world as any, (world as any).objects.land)
const gratGeo = geoGraticule10()
const land = path(landGeo) ?? ''
const graticule = path(gratGeo) ?? ''

// GRS 80 ellipsoid (ETRS89); WGS 84 differs by under a millimetre, and the datums by under a metre
const a = 6378137, f = 1 / 298.257222101
const rad = Math.PI / 180

// EPSG:25832 = ETRS89 / UTM zone 32N: transverse Mercator on 9° E (Krüger series), no false northing.
// The formulas still give numbers far outside the zone; they match PROJ there too.
function utm32(lat: number, lon: number) {
  const n = f / (2 - f)
  const A = a / (1 + n) * (1 + n * n / 4 + n ** 4 / 64)
  const alpha = [n / 2 - 2 * n * n / 3 + 5 * n ** 3 / 16, 13 * n * n / 48 - 3 * n ** 3 / 5, 61 * n ** 3 / 240]
  const p = lat * rad, dl = (lon - 9) * rad
  const c = 2 * Math.sqrt(n) / (1 + n)
  const t = Math.sinh(Math.atanh(Math.sin(p)) - c * Math.atanh(c * Math.sin(p)))
  const xi = Math.atan2(t, Math.cos(dl)), eta = Math.atanh(Math.sin(dl) / Math.sqrt(1 + t * t))
  let E = eta, N = xi
  alpha.forEach((al, j) => {
    E += al * Math.cos(2 * (j + 1) * xi) * Math.sinh(2 * (j + 1) * eta)
    N += al * Math.sin(2 * (j + 1) * xi) * Math.cosh(2 * (j + 1) * eta)
  })
  return [500000 + 0.9996 * A * E, 0.9996 * A * N]
}

// Thin space as thousands separator and a real minus sign, so commas never appear
const fmt = (v: number, d = 0) => v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })
  .replace(/,/g, ' ').replace('-', '−')

function rows(lat: number, lon: number) {
  const la = { k: 'lat', v: `${fmt(lat, 2)}°` }, lo = { k: 'lon', v: `${fmt(lon, 2)}°` }
  const [E, N] = utm32(lat, lon)
  return [
    { values: [la, lo] },
    { values: [lo, la] },
    { values: [{ k: 'E', v: `${fmt(E)} m` }, { k: 'N', v: `${fmt(N)} m` }] },
  ]
}

const SYSTEMS = [
  { name: 'Latitude, longitude', crs: 'EPSG:4326' },
  { name: 'Longitude, latitude', crs: 'OGC:CRS84' },
  { name: 'UTM zone 32N', crs: 'EPSG:25832' },
]

// Bamberg
const lat = ref(49.89)
const lon = ref(10.89)
const antiLat = computed(() => -lat.value)
const antiLon = computed(() => lon.value > 0 ? lon.value - 180 : lon.value + 180)
const point = computed(() => rows(lat.value, lon.value))
const anti = computed(() => rows(antiLat.value, antiLon.value))

// Globe: orthographic view of the front, plus the back hemisphere seen through it
// (viewed from the opposite side and mirrored, so back points sit where they really are)
const mode = ref<'map' | 'globe'>('map')
const R = 85
const view = ref<[number, number]>([0, 0])
const globe = computed(() => {
  const [vl, vp] = view.value
  const front = geoOrthographic().scale(R).translate([0, 0]).rotate([-vl, -vp])
  const back = geoOrthographic().scale(R).translate([0, 0]).rotate([-(vl + 180), vp]).reflectX(true)
  const fp = geoPath(front), bp = geoPath(back)
  const at = (p: [number, number]) => ({ xy: front(p)!, behind: geoDistance(p, view.value) > Math.PI / 2 })
  return {
    landFront: fp(landGeo) ?? '', landBack: bp(landGeo) ?? '',
    gridFront: fp(gratGeo) ?? '', gridBack: bp(gratGeo) ?? '',
    p: at([lon.value, lat.value]), a: at([antiLon.value, antiLat.value]),
  }
})
// Turn the globe so the point is on the front, off-centre, and the line through the Earth shows
function setMode(m: 'map' | 'globe', e: MouseEvent) {
  if (m === 'globe' && mode.value !== 'globe') view.value = [lon.value + 45, lat.value * 0.3]
  mode.value = m
  // Give focus back to the slide, so the arrow keys keep navigating
  ;(e.currentTarget as HTMLElement).blur()
}

const map = ref<SVGSVGElement>()
const toSvg = (e: PointerEvent) => new DOMPoint(e.clientX, e.clientY).matrixTransform(map.value!.getScreenCTM()!.inverse())
let last: DOMPoint | undefined
function drag(e: PointerEvent) {
  if (e.type === 'pointermove' && !e.buttons) return
  const pt = toSvg(e)
  if (mode.value === 'map') {
    lon.value = Math.max(-179.99, Math.min(179.99, pt.x))
    lat.value = Math.max(-89.99, Math.min(89.99, -pt.y))
    return
  }
  // Globe: dragging turns it, about 0.67° per unit at this size
  if (e.type === 'pointermove' && last) {
    const k = 180 / Math.PI / R
    view.value = [view.value[0] - (pt.x - last.x) * k, Math.max(-89, Math.min(89, view.value[1] + (pt.y - last.y) * k))]
  }
  last = pt
}
</script>

<template>
  <div class="antipode">
    <svg
      ref="map" viewBox="-180 -90 360 180" class="map"
      @pointerdown="drag" @pointermove="drag"
    >
      <defs>
        <radialGradient id="globe-shade" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stop-color="var(--paper)" />
          <stop offset="100%" stop-color="color-mix(in srgb, var(--ink) 14%, var(--paper))" />
        </radialGradient>
      </defs>

      <template v-if="mode === 'map'">
        <rect x="-180" y="-90" width="360" height="180" class="sea" />
        <path :d="graticule" class="grid" />
        <path :d="land" class="land" />
        <g v-click="1">
          <circle :cx="antiLon" :cy="-antiLat" r="2.6" class="anti" />
        </g>
        <circle :cx="lon" :cy="-lat" r="2.6" class="point" />
      </template>

      <template v-else>
        <circle :r="R" fill="url(#globe-shade)" />
        <path :d="globe.gridBack" class="grid back" />
        <path :d="globe.landBack" class="land back" />
        <path :d="globe.gridFront" class="grid" />
        <path :d="globe.landFront" class="land front" />
        <circle :r="R" class="limb" />
        <g v-click="1">
          <circle r="1.4" class="centre" />
          <line :x1="globe.p.xy[0]" :y1="globe.p.xy[1]" :x2="globe.a.xy[0]" :y2="globe.a.xy[1]" class="chord" />
          <circle :cx="globe.a.xy[0]" :cy="globe.a.xy[1]" r="2.6" class="anti" :class="{ behind: globe.a.behind }" />
        </g>
        <circle :cx="globe.p.xy[0]" :cy="globe.p.xy[1]" r="2.6" class="point" :class="{ behind: globe.p.behind }" />
      </template>
    </svg>
    <div class="controls mt-1">
      <span class="label">{{ mode === 'map' ? 'Drag the point anywhere on the map' : 'Drag to turn the globe' }}</span>
      <span class="switch">
        <button :class="{ on: mode === 'map' }" @click="setMode('map', $event)">Map</button>
        <button :class="{ on: mode === 'globe' }" @click="setMode('globe', $event)">Globe</button>
      </span>
    </div>

    <table class="mt-3">
      <thead>
        <tr>
          <th />
          <th>Point</th>
          <th>Antipode</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(s, i) in SYSTEMS" :key="s.crs">
          <td>
            <b>{{ s.name }}</b>
            <span class="crs">{{ s.crs }}</span>
          </td>
          <td class="val">
            <div v-for="c in point[i].values" :key="c.k"><span class="k">{{ c.k }}</span>{{ c.v }}</div>
          </td>
          <td v-click="1" class="val">
            <div v-for="c in anti[i].values" :key="c.k"><span class="k">{{ c.k }}</span>{{ c.v }}</div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.antipode {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.map {
  /* Shrink with the space the table leaves, keeping the frame tight around the 2:1 map */
  flex: 1 1 0;
  min-height: 0;
  width: auto;
  max-width: 100%;
  aspect-ratio: 2 / 1;
  align-self: flex-start;
  cursor: crosshair;
  touch-action: none;
  user-select: none;
  border: 1px solid color-mix(in srgb, var(--ink) 35%, transparent);
}
.sea {
  fill: color-mix(in srgb, var(--ink) 3%, transparent);
}
.grid {
  fill: none;
  stroke: color-mix(in srgb, var(--ink) 15%, transparent);
  stroke-width: 0.6;
  vector-effect: non-scaling-stroke;
}
.land {
  fill: color-mix(in srgb, var(--ink) 9%, transparent);
  stroke: var(--ink);
  stroke-width: 0.7;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
  opacity: 0.7;
}
.land.front {
  opacity: 0.85;
}
/* Far side of the globe, seen through it */
.back {
  fill: none;
  opacity: 0.3;
  stroke-dasharray: 2 2;
}
.limb {
  fill: none;
  stroke: var(--ink);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}
.chord {
  stroke: var(--accent);
  stroke-width: 1.6;
  stroke-dasharray: 4 3;
  vector-effect: non-scaling-stroke;
}
.centre {
  fill: var(--ink);
}
.behind {
  opacity: 0.55;
}
.point {
  fill: var(--accent);
  stroke: var(--paper);
  stroke-width: 1.5;
  vector-effect: non-scaling-stroke;
}
.controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.switch {
  display: flex;
}
.switch button {
  padding: 0.05rem 0.7rem;
  border: 1px solid var(--ink);
  margin-left: -1px;
  font-size: 0.7rem;
  color: var(--ink);
  background: transparent;
  cursor: pointer;
}
.switch button.on {
  background: var(--ink);
  color: var(--paper);
}
.anti {
  fill: var(--paper);
  stroke: var(--accent);
  stroke-width: 2;
  vector-effect: non-scaling-stroke;
}
.label {
  font-size: 0.65rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted);
}
table {
  font-size: 0.8rem;
  border-collapse: collapse;
}
th {
  font-size: 0.65rem;
  font-weight: 400;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted);
  text-align: left;
  padding: 0.15rem 0.5rem;
}
td {
  padding: 0.3rem 0.5rem;
  border: none;
  border-top: 1px solid color-mix(in srgb, var(--ink) 15%, transparent);
  white-space: nowrap;
  vertical-align: top;
  line-height: 1.3;
}
b {
  font-weight: 600;
}
.crs {
  display: block;
  color: var(--muted);
  font-size: 0.65rem;
}
.k {
  display: inline-block;
  width: 1.8rem;
  color: var(--muted);
  font-size: 0.7rem;
}
.val {
  font-variant-numeric: tabular-nums;
}
</style>
