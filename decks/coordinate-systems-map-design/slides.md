---
theme: default
title: Coordinate Systems & Map Design
info: |
  Interactive session: projections, scale and map design
colorSchema: light
routerMode: hash
canvasWidth: 980
highlighter: shiki
lineNumbers: false
drawings:
  persist: false
fonts:
  sans: Source Sans 3
  serif: Source Serif 4
  mono: Fira Code
  weights: '400,600'
  italic: true
---

# Coordinate Systems & Map Design

<p class="course">Exercise 2 · Geoinformationssysteme (AI-GeoInf-B)</p>
<p class="meta">Lukas Panzer, Madhav Poddar · Winter semester 2026/27 · 28.10.2026</p>

---
layout: figure
credit: 'Data: Natural Earth'
---

# Dig straight through the Earth from Bamberg. What coordinates do you enter to come out on the other side?

::plate::

<Antipode />

<!--
- 4326: −lat, lon ± 180° → −49.89, −169.11
- CRS84: same rule, but lon comes first!
- 25832: 364,245 / −14,467,817: computable, but meaningless so far from zone 32
-->




---
layout: figure
credit: 'Left: Chris Gorringe, “The Prime Meridian line at the Greenwich Royal Observatory”, CC BY-SA 2.0, via Geograph / Wikimedia Commons. Right: Google Maps'
---

# Your phone puts 0° about 100 m east of this line. Who is wrong?

::plate::

<div class="pair">
  <img src="/greenwich-meridian.jpg" alt="Prime Meridian line and sign at the Royal Observatory, Greenwich" />
  <img src="/greenwich-phone.jpg" alt="Phone map showing the location 51.478590, 0.000000 in the park east of the observatory" />
</div>

<!--
- Nobody: different reference systems
- Line = astronomical (plumb line), GPS = WGS 84 ellipsoid
-->


---
layout: figure
image: /mercator-world.svg
credit: 'Data: Natural Earth'
---

# What's wrong with this map?

<!--
- Greenland ≈ Africa? Really 1/14
- No Antarctica (cut at 60° S)
- Straight line ≠ shortest; 9,130 km = great circle
- Scale bar only true at the equator
-->


---
layout: figure
credit: 'Data: Natural Earth'
---

# What happens when you switch?

::plate::

<RouteMap />

<!--
- Circles: Mercator inflates towards the poles; Equal Earth keeps area; globe = truth
- Straight on Mercator: 10,528 km (constant bearing); shortest: 9,134 km (great circle, via Greenland)
- On the globe the shortest route is the straight one
-->


---
layout: prompt
---

# Where is the train right now?

<p class="lede">A map on a shared screen in the carriage. Sketch it twice.</p>

<div class="grid grid-cols-2 gap-6 mt-6">
  <div class="sketch">Whole journey</div>
  <div class="sketch">Zoomed in</div>
</div>

<p v-click class="then">What's different?</p>

<!--
- Whole: small scale, all stops, generalised
- Zoomed: local detail, next stop, map follows the train
- Shared screen: readable from afar, no interaction
-->


---
layout: figure
image: /ice-screen-in.jpg
---

# List every element on the screen.

<!--
- Train no., coach no., clock
- Route, position + direction, stations
- Towns, river, roads, rail lines
- Missing: legend, scale, next stop
-->


---
layout: figure
image: /ice-screen-out.jpg
---

# What changed?

<p v-click class="then">Any other issues?</p>

<!--
- Smaller scale, whole route, less detail
- Würzburg unlabelled; Frankfurt labels overlap
- Upcoming route not highlighted
-->


---
layout: figure
image: /tube-map-1933.jpg
credit: 'Harry Beck, 1933. Public domain, via Wikimedia Commons'
---

# Why do we need geometrically accurate maps at all?

<p v-click class="then">Why not topological maps everywhere?</p>

<!--
- Topology = connections + order only
- Geometry: distances, walking, combining layers
- Leicester Sq → Covent Garden ≈ 250 m
-->


---
layout: prompt
---

# Design a world map that shows which airports are nearby.

<!--
- Nearby = straight-line distance? Flight time? Travel time to the airport?
- World map distorts distance: Mercator circles balloon; use azimuthal equidistant centred on the user
- Interactive: pick a location, rings or isochrones, list sorted by distance
-->

---
layout: prompt
---

# Global sea level rises by <i>x</i> metres.

<p class="lede">Design an interactive map that shows what this means.</p>

<!--
- Slider for x → flooded areas (elevation model)
- Global equal-area view + zoom/search
- Caveats: dykes, vertical datum, resolution
-->


---
layout: figure
credit: 'Source: Office for National Statistics, Countries (Dec 2023) BFC, OGL v3.0. Contains OS data © Crown copyright and database right 2023'
---

# How long is the coastline of Great Britain?

<p v-click="2" class="then">How <em>should</em> we measure a coastline?</p>

::plate::

<Coastline />

<!--
- Coastline paradox: shorter ruler → longer coast
- 100 km: 3,292 · 1 km: ~11,400 · 10 m: 19,308
- Published: CIA 12,429 · OS 17,820 · WRI 19,717. Different scale and scope
- Always state scale + reference line
-->


---
layout: figure
image: /blue-marble.jpg
credit: 'NASA, Apollo 17, AS17-148-22727. Public domain'
---

# Anything wrong?

<!--
- Nothing: original orientation, south up
- No "up" in space
-->


---
layout: figure
image: /world-upside-down.svg
wide: true
credit: 'Nicoguaro, derived from World map.svg. CC0, via Wikimedia Commons (curid=41434234)'
---

<!--
- Equally correct; north-up = convention
- "Orient": medieval maps were east-up
-->

