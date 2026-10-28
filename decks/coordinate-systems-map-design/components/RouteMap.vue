<script setup lang="ts">
import { computed, ref } from 'vue'
import { geoCircle, geoDistance, geoEqualEarth, geoGraticule10, geoInterpolate, geoMercator, geoOrthographic, geoPath } from 'd3-geo'
import { feature, neighbors } from 'topojson-client'
import world from 'world-atlas/countries-110m.json'

type LonLat = [number, number]
const topo = world as any
const countries = feature(topo, topo.objects.countries).features as any[]
const sphere = { type: 'Sphere' } as any
const graticule = geoGraticule10()

// Same colours and labels as the Mercator map on the previous slide; greedy colouring so neighbours differ
const PALETTE = ['#e9dcb8', '#cfe1c4', '#f1cba9', '#d9cfe7', '#f3e4a3']
const nb = neighbors(topo.objects.countries.geometries)
const colors: string[] = []
countries.forEach((_, i) => {
  const used = new Set(nb[i].map((j: number) => colors[j]))
  colors[i] = PALETTE.find(c => !used.has(c)) ?? PALETTE[0]
})
const LABELS: [string, number, number][] = [
  ['Greenland', -41, 74], ['Canada', -100, 56], ['United States', -98, 34], ['Brazil', -53, -9],
  ['Russia', 95, 62], ['China', 103, 34], ['India', 79, 22], ['Australia', 134, -25],
  ['DR Congo', 23, -3], ['Antarctica', 20, -78],
]

// Frankfurt -> San Francisco
const FRA: LonLat = [8.68, 50.11], SFO: LonLat = [-122.42, 37.77]
const EARTH_KM = 6371
const rad = Math.PI / 180
// A straight line on Mercator keeps one compass bearing (rhumb line): linear in Mercator x and y
const mercY = (lat: number) => Math.log(Math.tan(Math.PI / 4 + lat * rad / 2))
const rhumb: LonLat[] = Array.from({ length: 121 }, (_, i) => {
  const t = i / 120
  const y = mercY(FRA[1]) + (mercY(SFO[1]) - mercY(FRA[1])) * t
  return [FRA[0] + (SFO[0] - FRA[0]) * t, (2 * Math.atan(Math.exp(y)) - Math.PI / 2) / rad]
})
const rhumbKm = Math.round(rhumb.slice(1).reduce((s, p, i) => s + geoDistance(rhumb[i], p), 0) * EARTH_KM)
const greatKm = Math.round(geoDistance(FRA, SFO) * EARTH_KM)
const km = (v: number) => `${v.toLocaleString('en-US')} km`

// Equal-size circles (500 km radius) for comparing distortion
const circles = [-60, -30, 0, 30, 60].flatMap(lat => [-150, -90, -30, 30, 90, 150].map(lon =>
  geoCircle().center([lon + (lat / 30) % 2 * 30, lat]).radius(500 / EARTH_KM / rad)()))

const projection = ref<'mercator' | 'equalearth' | 'globe'>('mercator')
const showRhumb = ref(true)
const showGreat = ref(false)
const showCircles = ref(false)
const rotation = ref<LonLat>([-57, 55])

const W = 1000
const view = computed(() => {
  if (projection.value === 'globe') {
    const p = geoOrthographic().scale(W / 2 - 4).translate([W / 2, W / 2]).rotate([-rotation.value[0], -rotation.value[1]])
    return { p, w: W, h: W, visible: (ll: LonLat) => geoDistance(ll, rotation.value) < Math.PI / 2 - 0.25 }
  }
  if (projection.value === 'equalearth') {
    const p = geoEqualEarth().fitWidth(W - 8, sphere)
    const [[, y0], [, y1]] = geoPath(p).bounds(sphere)
    p.translate([p.translate()[0] + 4, p.translate()[1] - y0 + 4])
    return { p, w: W, h: Math.ceil(y1 - y0 + 8), visible: () => true }
  }
  // Mercator from 84° N to 80° S (it can never reach the poles)
  const p = geoMercator().scale(W / (2 * Math.PI)).translate([W / 2, 0])
  p.translate([W / 2, -p([0, 84])![1]])
  const h = Math.round(p([0, -80])![1])
  p.clipExtent([[0, 0], [W, h]])
  return { p, w: W, h, visible: (ll: LonLat) => ll[1] < 84 && ll[1] > -80 }
})

const drawn = computed(() => {
  const { p, visible } = view.value
  const path = geoPath(p)
  const at = (ll: LonLat) => visible(ll) ? p(ll) : null
  return {
    sphere: path(sphere) ?? '',
    graticule: path(graticule) ?? '',
    countries: countries.map((f, i) => ({ d: path(f) ?? '', fill: colors[i] })),
    circles: circles.map(c => path(c) ?? '').join(''),
    rhumb: path({ type: 'LineString', coordinates: rhumb } as any) ?? '',
    great: path({ type: 'LineString', coordinates: [FRA, SFO] } as any) ?? '',
    labels: LABELS.map(([t, lon, lat]) => ({ t, xy: at([lon, lat]) })).filter(l => l.xy),
    fra: at(FRA), sfo: at(SFO),
    // Distance labels over the North Atlantic, clear of the country labels
    rhumbMid: at(rhumb[40]),
    greatMid: at(geoInterpolate(FRA, SFO)(0.3) as LonLat),
  }
})

// Buttons give focus back to the slide, so the arrow keys keep navigating
function press(action: () => void, e: MouseEvent) {
  action()
  ;(e.currentTarget as HTMLElement).blur()
}

// On the globe, dragging turns it
const svg = ref<SVGSVGElement>()
let last: DOMPoint | undefined
function drag(e: PointerEvent) {
  if (projection.value !== 'globe' || (e.type === 'pointermove' && !e.buttons)) return
  const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.value!.getScreenCTM()!.inverse())
  if (e.type === 'pointermove' && last) {
    const k = 180 / Math.PI / (W / 2)
    rotation.value = [rotation.value[0] - (pt.x - last.x) * k, Math.max(-89, Math.min(89, rotation.value[1] + (pt.y - last.y) * k))]
  }
  last = pt
}
</script>

<template>
  <div class="routemap">
    <svg
      ref="svg" :viewBox="`0 0 ${view.w} ${view.h}`" preserveAspectRatio="xMidYMid meet"
      class="map" :class="{ turnable: projection === 'globe' }"
      @pointerdown="drag" @pointermove="drag"
    >
      <path :d="drawn.sphere" class="sea" />
      <path :d="drawn.graticule" class="graticule" />
      <g class="countries">
        <path v-for="(c, i) in drawn.countries" :key="i" :d="c.d" :fill="c.fill" />
      </g>
      <path v-if="showCircles" :d="drawn.circles" class="circles" />
      <g class="labels">
        <text v-for="l in drawn.labels" :key="l.t" :x="l.xy![0]" :y="l.xy![1]">{{ l.t }}</text>
      </g>
      <template v-if="showRhumb">
        <path :d="drawn.rhumb" class="route rhumb" />
        <text v-if="drawn.rhumbMid" :x="drawn.rhumbMid[0]" :y="drawn.rhumbMid[1] + 30" class="route-label rhumb">{{ km(rhumbKm) }}</text>
      </template>
      <template v-if="showGreat">
        <path :d="drawn.great" class="route great" />
        <text v-if="drawn.greatMid" :x="drawn.greatMid[0]" :y="drawn.greatMid[1] + 30" class="route-label great">{{ km(greatKm) }}</text>
      </template>
      <g v-if="drawn.fra" class="city">
        <circle :cx="drawn.fra[0]" :cy="drawn.fra[1]" r="5" />
        <text :x="drawn.fra[0] + 8" :y="drawn.fra[1] - 8">Frankfurt</text>
      </g>
      <g v-if="drawn.sfo" class="city">
        <circle :cx="drawn.sfo[0]" :cy="drawn.sfo[1]" r="5" />
        <text :x="drawn.sfo[0] - 8" :y="drawn.sfo[1] + 26" text-anchor="end">San Francisco</text>
      </g>
      <path :d="drawn.sphere" class="rim" />
    </svg>

    <div class="controls">
      <span class="switch">
        <button :class="{ on: projection === 'mercator' }" @click="press(() => projection = 'mercator', $event)">Mercator</button>
        <button :class="{ on: projection === 'equalearth' }" @click="press(() => projection = 'equalearth', $event)">Equal Earth</button>
        <button :class="{ on: projection === 'globe' }" @click="press(() => projection = 'globe', $event)">Globe</button>
      </span>
      <span class="switch">
        <button :class="{ on: showRhumb }" @click="press(() => showRhumb = !showRhumb, $event)"><i class="key rhumb" />Straight on Mercator</button>
        <button :class="{ on: showGreat }" @click="press(() => showGreat = !showGreat, $event)"><i class="key great" />Shortest</button>
      </span>
      <span class="switch">
        <button :class="{ on: showCircles }" @click="press(() => showCircles = !showCircles, $event)">Equal-size circles</button>
      </span>
    </div>
  </div>
</template>

<style scoped>
.routemap {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.map {
  flex: 1;
  min-height: 0;
  width: 100%;
  user-select: none;
  touch-action: none;
}
.map.turnable {
  cursor: grab;
}
.sea {
  fill: #cfe6f3;
}
.graticule {
  fill: none;
  stroke: #fff;
  stroke-width: 0.6;
  opacity: 0.8;
}
.countries path {
  stroke: #fff;
  stroke-width: 0.5;
}
.rim {
  fill: none;
  stroke: #333;
  stroke-width: 1;
}
.circles {
  fill: #7a4fa3;
  fill-opacity: 0.35;
  stroke: #7a4fa3;
  stroke-width: 1;
}
text {
  font-family: 'Nunito Sans', 'Avenir Next', system-ui, sans-serif;
  paint-order: stroke;
  stroke: #fff;
  stroke-width: 3px;
  stroke-linejoin: round;
}
.labels text {
  font-size: 22px;
  fill: #333;
  text-anchor: middle;
}
.route {
  fill: none;
  stroke-width: 2.5;
}
.route.rhumb {
  stroke: #c0392b;
  stroke-dasharray: 7 4;
}
.route.great {
  stroke: #1f5f8b;
}
.route-label {
  font-size: 22px;
  font-weight: 600;
  text-anchor: middle;
}
.route-label.rhumb {
  fill: #c0392b;
}
.route-label.great {
  fill: #1f5f8b;
}
.city circle {
  fill: #333;
}
.city text {
  font-size: 20px;
  fill: #333;
}
.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem 1rem;
}
.switch {
  display: flex;
}
.switch button {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.1rem 0.6rem;
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
.key {
  display: inline-block;
  width: 1.1rem;
  border-top: 2px solid;
}
.key.rhumb {
  border-color: #c0392b;
  border-top-style: dashed;
}
.key.great {
  border-color: #1f5f8b;
}
.on .key.rhumb {
  border-color: #f08a7e;
}
.on .key.great {
  border-color: #8cc3e8;
}
</style>
