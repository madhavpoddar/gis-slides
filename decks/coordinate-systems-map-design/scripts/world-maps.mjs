// Generates the Mercator world map for the first slide into ../public/mercator-world.svg,
// with planted issues: a single scale bar, a straight route labelled with the
// great-circle distance, and Antarctica cut off at 60°S.
// (The interactive comparison on the next slide is components/RouteMap.vue.)
//
//   node world-maps.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { geoDistance, geoGraticule10, geoMercator, geoPath } from 'd3-geo'
import { feature, neighbors } from 'topojson-client'

const require = createRequire(import.meta.url)
const topo = JSON.parse(readFileSync(require.resolve('world-atlas/countries-110m.json'), 'utf8'))
const countries = feature(topo, topo.objects.countries).features
const nb = neighbors(topo.objects.countries.geometries)
const PUBLIC = join(import.meta.dirname, '..', 'public')

// Greedy colouring so neighbours differ
const palette = ['#e9dcb8', '#cfe1c4', '#f1cba9', '#d9cfe7', '#f3e4a3']
const color = []
countries.forEach((_, i) => {
  const used = new Set(nb[i].map(j => color[j]))
  color[i] = palette.find(c => !used.has(c)) ?? palette[0]
})

const FRA = [8.68, 50.11], SFO = [-122.42, 37.77]
// Great-circle distance, rounded to 10 km
const routeKm = Math.round(geoDistance(FRA, SFO) * 6371 / 10) * 10

const W = 1000, NORTH = 84, SOUTH = -60
const proj = geoMercator().scale(W / (2 * Math.PI)).translate([W / 2, 0])
proj.translate([W / 2, -proj([0, NORTH])[1]])
const H = Math.round(proj([0, SOUTH])[1])
proj.clipExtent([[0, 0], [W, H]])
const path = geoPath(proj)
const P = ([lon, lat]) => proj([lon, lat]).map(v => v.toFixed(1))

const labels = [
  ['Greenland', -41, 74], ['Canada', -105, 60], ['United States', -98, 34],
  ['Brazil', -53, -9], ['Argentina', -65, -36], ['Russia', 95, 62],
  ['China', 103, 34], ['India', 79, 22], ['Australia', 134, -25],
  ['DR Congo', 23, -3], ['Algeria', 2, 27], ['Kazakhstan', 68, 48],
].map(([t, lon, lat]) => {
  const [x, y] = P([lon, lat])
  return `<text x="${x}" y="${y}" font-size="17" text-anchor="middle">${t}</text>`
}).join('\n')

// Route Frankfurt -> San Francisco as a straight line, labelled above its middle
const fra = P(FRA), sfo = P(SFO)
const mid = [(+fra[0] + +sfo[0]) / 2, (+fra[1] + +sfo[1]) / 2]
const route = `
<line x1="${fra[0]}" y1="${fra[1]}" x2="${sfo[0]}" y2="${sfo[1]}" stroke="#c0392b" stroke-width="2.5" stroke-dasharray="7 4"/>
<circle cx="${fra[0]}" cy="${fra[1]}" r="4" fill="#c0392b"/><circle cx="${sfo[0]}" cy="${sfo[1]}" r="4" fill="#c0392b"/>
<text x="${+fra[0] + 6}" y="${+fra[1] - 8}" font-size="15" fill="#c0392b">Frankfurt</text>
<text x="${+sfo[0] - 6}" y="${+sfo[1] + 20}" font-size="15" fill="#c0392b" text-anchor="end">San Francisco</text>
<text x="${mid[0]}" y="${+mid[1] - 8}" font-size="15" fill="#c0392b" text-anchor="middle">${routeKm.toLocaleString('en-US')} km</text>`

// Scale bar, true only at the equator
const pxPerKm = W / 40075
const seg = 1000 * pxPerKm
const sx = 30, sy = H - 30
const scaleBar = `
<g font-size="14">
${[0, 1, 2, 3].map(i => `<rect x="${(sx + i * seg).toFixed(1)}" y="${sy}" width="${seg.toFixed(1)}" height="5" fill="${i % 2 ? '#fff' : '#333'}" stroke="#333" stroke-width="0.8"/>`).join('')}
${[0, 2000, 4000].map(km => `<text x="${(sx + km * pxPerKm).toFixed(1)}" y="${sy - 4}" text-anchor="middle">${km}</text>`).join('')}
<text x="${(sx + 4 * seg + 6).toFixed(1)}" y="${sy + 5}">km</text>
</g>`

writeFileSync(join(PUBLIC, 'mercator-world.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="Nunito Sans, Avenir Next, system-ui, sans-serif" fill="#333">
<style>text{paint-order:stroke;stroke:#fff;stroke-width:3px;stroke-linejoin:round}</style>
<rect width="${W}" height="${H}" fill="#cfe6f3"/>
<path d="${path(geoGraticule10())}" fill="none" stroke="#fff" stroke-width="0.6" opacity="0.8"/>
<g stroke="#fff" stroke-width="0.5">
${countries.map((f, i) => `<path d="${path(f)}" fill="${color[i]}"/>`).join('\n')}
</g>
${labels}
${route}
${scaleBar}
<rect width="${W}" height="${H}" fill="none" stroke="#333" stroke-width="1"/>
</svg>
`)
console.log('Wrote public/mercator-world.svg')
