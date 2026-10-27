<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useIsSlideActive } from '@slidev/client'
import { geoGraticule10, geoOrthographic, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import world from 'world-atlas/land-110m.json'

const SIZE = 600
const DEG_PER_SEC = 4

const land = feature(world as any, (world as any).objects.land)
const graticule = geoGraticule10()
const sphere = { type: 'Sphere' } as const
const proj = geoOrthographic().scale(SIZE / 2 - 2).translate([SIZE / 2, SIZE / 2]).clipAngle(90)
const path = geoPath(proj)

const d = ref({ graticule: '', land: '', sphere: path(sphere) ?? '' })
const isActive = useIsSlideActive()
let lambda = -10
let last = 0
let frame = 0

function draw() {
  proj.rotate([lambda, -35])
  d.value = { graticule: path(graticule) ?? '', land: path(land) ?? '', sphere: d.value.sphere }
}

function tick(t: number) {
  // Only spin while this slide is on screen
  if (isActive.value && last)
    lambda += (t - last) / 1000 * DEG_PER_SEC
  last = t
  draw()
  frame = requestAnimationFrame(tick)
}

onMounted(() => {
  draw()
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches)
    frame = requestAnimationFrame(tick)
})
onBeforeUnmount(() => cancelAnimationFrame(frame))
</script>

<template>
  <svg :viewBox="`0 0 ${SIZE} ${SIZE}`" fill="none" stroke="#1d2a35">
    <path :d="d.graticule" stroke-width="0.6" opacity="0.5" />
    <path :d="d.land" fill="#1d2a35" fill-opacity="0.06" stroke-width="0.9" />
    <path :d="d.sphere" stroke-width="1.2" />
  </svg>
</template>
