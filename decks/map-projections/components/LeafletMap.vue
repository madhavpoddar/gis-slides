<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const el = ref<HTMLElement>()
let map: L.Map | undefined
let observer: ResizeObserver | undefined

onMounted(() => {
  map = L.map(el.value!, { worldCopyJump: true }).setView([45, 10], 1)
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 8,
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map)

  // Equal-sized circles on the ground (Tissot-style) along a meridian
  for (const lat of [0, 20, 40, 60, 75])
    L.circle([lat, 20], { radius: 500_000, color: '#dc2626', weight: 1, fillOpacity: 0.25 }).addTo(map)

  // Slides are hidden/scaled until shown, so re-measure when the size changes
  observer = new ResizeObserver(() => map?.invalidateSize())
  observer.observe(el.value!)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  map?.remove()
})
</script>

<template>
  <div ref="el" />
</template>
