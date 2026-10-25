---
theme: default
title: Map Projections
info: |
  Why every flat map lies — and how to pick the right lie
colorSchema: light
routerMode: hash
canvasWidth: 980
highlighter: shiki
lineNumbers: false
drawings:
  persist: false
fonts:
  sans: Avenir Next,Nunito Sans
  mono: Fira Code
  weights: '200,400,600'
class: text-center
---

# Map Projections

Why every flat map lies — and how to pick the right lie

---

# Why project at all?

The Earth is (roughly) an ellipsoid. Screens and paper are flat.

<v-clicks>

- A projection maps latitude/longitude → x/y on a plane
- No projection can preserve everything at once:
  - **Area** (equal-area)
  - **Shape / angles** (conformal)
  - **Distance** (equidistant, along some lines)
  - **Direction** (azimuthal, from one point)
- Choosing a projection = choosing which distortion you can live with

</v-clicks>

---

# Web Mercator in action

Every red circle has a radius of **500 km** on the ground. Pan and zoom: Mercator inflates them toward the poles.

<LeafletMap class="h-90 mt-4 rounded shadow" />

<div class="text-sm opacity-70 mt-2">
Greenland looks about as big as Africa, but Africa is ~14× larger.
</div>

---

# Coordinate reference systems you will meet

| EPSG | Name | Type | Typical use |
|---|---|---|---|
| 4326 | WGS 84 | Geographic (lat/lon) | GPS, data exchange |
| 3857 | Web Mercator | Conformal (approx.) | Web map tiles |
| 25832 | ETRS89 / UTM zone 32N | Conformal, metres | German/European survey data |
| 3035 | ETRS89 / LAEA Europe | Equal-area | Pan-European statistics |

---

# Reprojecting in code

```python {all|4|6-7}
import geopandas as gpd

districts = gpd.read_file("districts.gpkg")
print(districts.crs)                      # EPSG:4326

# Areas in degrees are meaningless – reproject to an equal-area CRS
districts = districts.to_crs(epsg=3035)
districts["area_km2"] = districts.area / 1e6
```

---
class: text-center
---

# Takeaway

Every flat map distorts something.<br>
Pick the projection whose distortion doesn't hurt **your** question.
