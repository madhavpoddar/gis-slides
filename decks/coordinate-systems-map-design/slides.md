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
image: /mercator-world.svg
credit: 'Data: Natural Earth'
---

# What's wrong with this map?

---
layout: figure
image: /mercator-corrected.svg
credit: 'Data: Natural Earth'
---

# What changed?

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

---
layout: figure
image: /ice-screen-out.jpg
---

# Find the issue.

<p v-click class="then">List every element on the screen.</p>

---
layout: figure
image: /ice-screen-in.jpg
---

# What changed?

---
layout: figure
image: /tube-map-1933.jpg
credit: 'Harry Beck, 1933. Public domain, via Wikimedia Commons'
---

# Why do we need geometrically accurate maps at all?

<p v-click class="then">Why not topological maps everywhere?</p>

---
layout: prompt
---

# Global sea level rises by <i>x</i> metres.

<p class="lede">Design an interactive map that shows what this means.</p>

---
layout: figure
credit: 'Source: Office for National Statistics, Countries (Dec 2023) BFC, OGL v3.0. Contains OS data © Crown copyright and database right 2023'
---

# How long is the coastline of Great Britain?

<p v-click="2" class="then">How <em>should</em> we measure a coastline?</p>

::plate::

<Coastline />

---
layout: figure
image: /blue-marble.jpg
credit: 'NASA, Apollo 17, AS17-148-22727. Public domain'
---

# Anything wrong?

---
layout: figure
image: /world-upside-down.svg
wide: true
credit: 'Nicoguaro, derived from World map.svg. CC0, via Wikimedia Commons (curid=41434234)'
---
