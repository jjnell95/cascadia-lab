# Cascadia Lab 2

A portable, offline earthquake-source and tsunami-propagation explorer. The self-contained build is `../index.html` at the repository root; open it in any modern browser. This directory's `index.html` also runs locally (using a cooperative main-thread fallback if browser file security prevents workers).

## What changed from version 1

- Replaced a one-dimensional synthetic ocean with two-dimensional spherical linear shallow-water propagation over NOAA ETOPO 2022 bathymetry.
- Replaced a Gaussian uplift source with rectangular-fault Okada elastic deformation on twenty published NOAA SIFT patch geometries. Slip is normalized to the specified seismic moment.
- Added finite rupture propagation and smooth slip rise time; full, northern, and southern scenarios; and moment-preserving uniform, tapered, and shallow-emphasis slip distributions.
- The map now displays the solver's wave field, not unrelated rings. Terrain relief, coastlines, and depth contours come from the downloaded relief grid.
- Added fine 2 arc-minute mode (default) and fast 4 arc-minute mode, virtual offshore stations, comparative wave traces, arbitrary ocean-point inspection, map pan/zoom, peak and source layers, and CSV export.
- Moved computation into a Web Worker, with progress and cancellation on rerun. The map animates a live preview of the water level while the run computes. The standalone app contains its own data and worker source.

## Use

1. The initial view previews the default M9 scenario 20 minutes after origin. Press Restart to see the beginning.
2. Choose a preset, or adjust source assumptions and press Run scenario. Pending edits are labeled.
3. Play, scrub through three hours, or switch map layers. Peak and seafloor layers show full-run peak or final deformation; only the water-level layer follows playback.
4. Choose one of the offshore station buttons, or click an ocean cell. Coordinates and depth identify the actual sampled cell.
5. Export all six station traces (plus a clicked ocean point, if selected) with scenario metadata and full-precision peak/threshold results.

Keyboard: with the map focused, arrow keys pan, `+`/`−` zoom and `0` resets the view. Space plays or pauses from anywhere outside a form control. Presets restore every source assumption (slip, origin, rise time, rupture speed) but keep the chosen ocean resolution.

## Scientific limits

This is an uncalibrated educational regional model. It does not simulate inundation, wetting/drying, nonlinear advection, breaking, friction, harbor detail, tides, Coriolis or a particular future rupture. Cells shallower than 20 m are masked and reflect; a 100 km boundary sponge reduces outgoing-wave reflections. Native NOAA data are sampled at 2 arc-minutes; Fine mode does not restore the omitted 1 arc-minute detail.

The Okada source is more physically grounded than a prescribed Gaussian, but its slip and rupture timing are assumptions. SIFT geometry is used; no SIFT forecast or official NOAA scenario is reproduced. The source archive is identified in the provenance file.

First 10 cm signal means the first modeled |water level| >= 0.10 m, including local seafloor motion. It is not a coastal arrival time. Offshore absolute level is not runup or flood depth. Fine mode remains far too coarse for site-specific coastal decisions.

In a first-hour resolution comparison at co-located ocean points, coarse-grid peaks differed from finer-grid peaks by approximately 0.2–52%, with the largest discrepancy near Seaside. See validation.json for exact values, assumptions and numerical checks. This sensitivity is why Fine mode is the default. Neither grid has been validated against an observed Cascadia event.

## Rebuild and test

- `node test-model.cjs --report` runs the dependency-free scientific checks and writes validation.json.
- `python3 build-standalone.py` rebuilds the standalone `../index.html` and embeds the GeoClaw license.
- `python3 -m http.server 8765` in this directory serves the multi-file source at http://localhost:8765/ (optional; no server is needed for the standalone app).
- Browser smoke tests are included as `test-browser.cjs`. Install Playwright in a development environment and set `CHROME_PATH` if Chromium is not bundled. Run `node test-browser.cjs` with `APP_PATH` optionally pointing to a different build. A full Fine run takes roughly 15–30 seconds depending on the machine, so the test allows up to three minutes per step.

## Files

- `index.html`, `app.js`: interface, terrain rendering, controls and worker orchestration
- `model.js`: source mechanics and numerical solver
- `data.js`: embedded regional terrain and fault patches
- `data-provenance.json`, `SOURCES.md`: dataset details, original URLs and downloaded-file hashes
- `okada-reference.json`, `test-model.cjs`, `validation.json`: independent reference values, numerical checks and results
- `LICENSE-GEOCLAW.txt`: BSD 3-Clause license for adapted formulas
- `build-standalone.py`: portable single-file builder

Software checks establish consistency and numerical behavior within the documented assumptions. They are not operational hazard certification.
