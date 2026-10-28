<script setup lang="ts">
import { computed, ref } from 'vue'
import britain from './britain.json'
import table from './britain-lengths.json'
import zoomData from './britain-zooms.json'

type Pt = [number, number]
// All coordinates are British National Grid in km, with y pointing down for SVG.
// Outline simplified for drawing; the lengths were measured offline on the full-resolution line.
const ring = britain as Pt[]
const lengths = table as [number, number][]
// Nested zoom views: land to fill, and the stretches of coast the ruler walks
const zooms = (zoomData as { box: number[], land: string, runs: Pt[][] }[]).map(({ box: [x0, y0, x1, y1], land, runs }) => {
  const w = x1 - x0
  return { x: x0, y: -y1, w, land, runs, coast: runs.map(r => toPath(r)).join('') }
})

// Walk a line with a pair of dividers opened to r km (Richardson's method)
function divide(line: Pt[], r: number) {
  const pts: Pt[] = [line[0]]
  let c = line[0], seg = 0, t0 = 0
  for (;;) {
    let next: Pt | undefined
    for (let j = seg; j < line.length - 1 && !next; j++) {
      const [ax, ay] = line[j], [bx, by] = line[j + 1]
      const dx = bx - ax, dy = by - ay, fx = ax - c[0], fy = ay - c[1]
      const A = dx * dx + dy * dy, B = 2 * (fx * dx + fy * dy), C = fx * fx + fy * fy - r * r
      const disc = B * B - 4 * A * C
      if (!A || disc < 0) continue
      // Where the line leaves the circle around the current point
      const t = (-B + Math.sqrt(disc)) / (2 * A)
      if (t >= (j === seg ? t0 : 0) && t <= 1) {
        next = [ax + t * dx, ay + t * dy]
        seg = j
        t0 = t
      }
    }
    if (!next) break
    pts.push(next)
    c = next
  }
  return pts
}

// Measured length for any ruler, interpolated in log space between the table's rulers
function lengthAt(r: number) {
  const i = Math.max(1, lengths.findIndex(([lr]) => lr <= r))
  const [r0, l0] = lengths[i - 1], [r1, l1] = lengths[i]
  return l0 + (l1 - l0) * Math.log(r0 / r) / Math.log(r0 / r1)
}

// Ruler range and published coastline lengths (note their scope: UK vs mainland Great Britain)
const R_MAX = 100, R_MIN = 0.01
const PUBLISHED = [
  { km: 12429, label: 'CIA World Factbook (UK): 12,429 km' },
  { km: 17820, label: 'Ordnance Survey (mainland GB): 17,820 km' },
  { km: 19717, label: 'World Resources Institute (UK): 19,717 km' },
]

const ruler = ref(R_MAX)
const length = computed(() => lengthAt(ruler.value))
const fmt = (km: number) => Math.round(km).toLocaleString('en-US')
const fmtRuler = (r: number) => r >= 10 ? `${Math.round(r)} km` : r >= 1 ? `${+r.toFixed(1)} km` : `${Math.round(r * 1000)} m`

function toPath(pts: Pt[], close = false) {
  return `M${pts.map(p => p.join(',')).join('L')}${close ? 'Z' : ''}`
}

// Full map
const xs = ring.map(p => p[0]), ys = ring.map(p => p[1])
const pad = 12
const box = [Math.min(...xs) - pad, Math.min(...ys) - pad, Math.max(...xs) - Math.min(...xs) + 2 * pad, Math.max(...ys) - Math.min(...ys) + 2 * pad]
const coast = toPath(ring, true)
// A walk with steps under ~1 px looks the same as the coastline, so the coastline is drawn instead
const gbSteps = computed(() => divide(ring, ruler.value))
const gbWalk = computed(() => ruler.value >= box[2] / 200 ? toPath(gbSteps.value, true) : undefined)
// Zoom views walk their own detailed stretch of coast; a ruler too long for that stretch
// steps across the whole view, so the full map's walk is shown instead
const zoomWalks = computed(() => zooms.map((z) => {
  if (ruler.value >= Math.max(2, z.w * 0.4)) return [[...gbSteps.value, gbSteps.value[0]]]
  if (ruler.value >= z.w / 150) return z.runs.map(run => divide(run, ruler.value))
}))

// Chart: measured length against ruler length (log), long ruler on the left
const CW = 440, CH = 220, M = { l: 34, r: 8, t: 18, b: 22 }
const Y_MAX = 20000
const span = Math.log(R_MAX / R_MIN)
const cx = (r: number) => M.l + Math.log(R_MAX / r) / span * (CW - M.l - M.r)
const cy = (km: number) => CH - M.b - km / Y_MAX * (CH - M.t - M.b)
const curve = `M${lengths.map(([r, l]) => `${cx(r).toFixed(1)},${cy(l).toFixed(1)}`).join('L')}`

const chart = ref<SVGSVGElement>()
function drag(e: PointerEvent) {
  if (e.type === 'pointermove' && !e.buttons) return
  const m = chart.value!.getScreenCTM()!.inverse()
  const x = new DOMPoint(e.clientX, e.clientY).matrixTransform(m).x
  const f = Math.min(1, Math.max(0, (x - M.l) / (CW - M.l - M.r)))
  ruler.value = R_MAX * (R_MIN / R_MAX) ** f
}
</script>

<template>
  <div class="coastline">
    <div class="left">
      <svg :viewBox="box.join(' ')" class="gb">
        <path :d="coast" class="land" />
        <path v-click="1" :d="gbWalk ?? coast" class="walk" />
        <rect :x="zooms[0].x" :y="zooms[0].y" :width="zooms[0].w" :height="zooms[0].w" class="frame" />
      </svg>
      <div v-click="1" class="readout">
        <div class="label">Ruler</div>
        <div class="mid">{{ fmtRuler(ruler) }}</div>
        <div class="label mt-2">Measured coastline</div>
        <div class="big">{{ fmt(length) }} km</div>
      </div>
    </div>

    <div class="right">
      <div class="zooms">
        <figure v-for="(z, i) in zooms" :key="i">
          <svg :viewBox="`${z.x} ${z.y} ${z.w} ${z.w}`">
            <rect :x="z.x" :y="z.y" :width="z.w" :height="z.w" class="sea" />
            <path :d="z.land" class="land" />
            <g v-click="1">
              <template v-if="zoomWalks[i]">
                <path v-for="(walk, j) in zoomWalks[i]" :key="j" :d="toPath(walk)" class="walk" />
                <template v-if="ruler >= z.w / 25">
                  <template v-for="(walk, j) in zoomWalks[i]" :key="j">
                    <circle v-for="(p, k) in walk" :key="k" :cx="p[0]" :cy="p[1]" :r="z.w / 90" class="step" />
                  </template>
                </template>
              </template>
              <path v-else :d="z.coast" class="walk" />
              <!-- The ruler to scale, when it fits -->
              <g v-if="ruler <= z.w * 0.6 && ruler >= z.w / 60">
                <line :x1="z.x + z.w * 0.06" :x2="z.x + z.w * 0.06 + ruler" :y1="z.y + z.w * 0.93" :y2="z.y + z.w * 0.93" class="ruler" />
              </g>
            </g>
            <rect
              v-if="zooms[i + 1]" :x="zooms[i + 1].x" :y="zooms[i + 1].y"
              :width="zooms[i + 1].w" :height="zooms[i + 1].w" class="frame"
            />
          </svg>
          <figcaption>{{ fmtRuler(z.w) }} across</figcaption>
        </figure>
      </div>

      <div v-click="1">
        <svg
          ref="chart" :viewBox="`0 0 ${CW} ${CH}`" class="chart"
          @pointerdown="drag" @pointermove="drag"
        >
          <g v-for="y in [5000, 10000, 15000, 20000]" :key="y">
            <line :x1="M.l" :x2="CW - M.r" :y1="cy(y)" :y2="cy(y)" class="grid" />
            <text :x="M.l - 6" :y="cy(y) + 3" text-anchor="end" class="tick">{{ y / 1000 }}k</text>
          </g>
          <g v-for="(r, i) in [100, 10, 1, 0.1, 0.01]" :key="r">
            <text :x="cx(r)" :y="CH - 6" :text-anchor="i ? i < 4 ? 'middle' : 'end' : 'start'" class="tick">{{ fmtRuler(r) }}</text>
          </g>
          <line :x1="M.l" :x2="CW - M.r" :y1="cy(0)" :y2="cy(0)" class="axis" />

          <g v-for="p in PUBLISHED" :key="p.km">
            <line :x1="M.l" :x2="CW - M.r" :y1="cy(p.km)" :y2="cy(p.km)" class="ref" />
            <text :x="M.l + 4" :y="cy(p.km) - 4" class="tiny">{{ p.label }}</text>
          </g>

          <path :d="curve" class="curve" />
          <line :x1="cx(ruler)" :x2="cx(ruler)" :y1="cy(length)" :y2="cy(0)" class="cursor" />
          <circle :cx="cx(ruler)" :cy="cy(length)" r="4.5" class="dot" />
          <circle :cx="cx(ruler)" :cy="cy(0)" r="6" class="handle" />
        </svg>
        <div class="label">Drag along the chart to change the ruler</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.coastline {
  display: flex;
  gap: 1.5rem;
  height: 100%;
  width: 100%;
}
.left {
  width: 11.5rem;
  flex: none;
  display: flex;
  flex-direction: column;
}
.gb {
  width: 100%;
}
.right {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.zooms {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.6rem;
}
figure {
  margin: 0;
}
figure svg {
  width: 100%;
  display: block;
  border: 1px solid color-mix(in srgb, var(--ink) 35%, transparent);
}
figcaption {
  margin-top: 0.2rem;
  font-size: 0.65rem;
  color: var(--muted);
}
.sea {
  fill: color-mix(in srgb, var(--ink) 3%, transparent);
}
.land {
  fill: color-mix(in srgb, var(--ink) 8%, transparent);
  stroke: var(--ink);
  stroke-width: 0.8;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
  opacity: 0.7;
}
.walk {
  fill: none;
  stroke: var(--accent);
  stroke-width: 1.8;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
}
.step {
  fill: var(--accent);
}
.ruler {
  stroke: var(--accent);
  stroke-width: 4;
  vector-effect: non-scaling-stroke;
}
.frame {
  fill: none;
  stroke: var(--ink);
  stroke-width: 1.2;
  vector-effect: non-scaling-stroke;
}
.readout {
  margin-top: auto;
}
.label {
  font-size: 0.65rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted);
}
.mid,
.big {
  font-family: 'Source Serif 4', Georgia, serif;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}
.mid {
  font-size: 1.4rem;
  color: var(--accent);
}
.big {
  font-size: 1.9rem;
}
.chart {
  width: 100%;
  cursor: ew-resize;
  touch-action: none;
  user-select: none;
}
.grid {
  stroke: color-mix(in srgb, var(--ink) 12%, transparent);
}
.axis {
  stroke: var(--ink);
}
.tick,
.tiny {
  font-size: 10px;
  fill: var(--muted);
}
.ref {
  stroke: var(--ink);
  stroke-dasharray: 4 3;
}
.curve {
  fill: none;
  stroke: var(--ink);
  stroke-width: 1.6;
}
.cursor {
  stroke: var(--accent);
}
.dot {
  fill: var(--accent);
}
.handle {
  fill: var(--paper);
  stroke: var(--accent);
  stroke-width: 2;
}
</style>
