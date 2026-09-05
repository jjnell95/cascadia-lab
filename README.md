# Cascadia Lab

**[Launch the public app](https://jjnell95.github.io/cascadia-lab/)**

An interactive earthquake-source and tsunami-propagation explorer for the Pacific Northwest. Runs entirely in your browser, with embedded data and no account, API key, or server computation.

- Two-dimensional linear shallow-water propagation over NOAA ETOPO 2022 bathymetry.
- Okada elastic seafloor deformation using twenty archived NOAA SIFT fault-patch geometries.
- Full, northern, and southern rupture scenarios with moment-preserving slip distributions.
- Fine and fast ocean grids, three-hour playback, shaded terrain, peak and source layers, and map pan/zoom.
- Six virtual offshore stations, arbitrary ocean-point inspection, wave charts, and CSV export.

## Scientific scope

This is an **uncalibrated educational regional model**, not an operational warning system or coastal flood forecast. Slip and rupture timing are assumptions. The model omits inundation, wetting/drying, breaking, nonlinear advection, harbor detail, tides, friction, and Coriolis effects. Shallow cells and domain edges use documented numerical boundary treatments.

“First 10 cm signal” includes local source deformation and must not be interpreted as coastal arrival time or an evacuation interval. The app flags scenarios and sampled cells that exceed its small-amplitude assumptions. Grid sensitivity is substantial at some locations; see [validation results](src/validation.json).

For current U.S. tsunami warnings, use [tsunami.gov](https://www.tsunami.gov/).

## Run locally

Open `index.html` directly in a modern browser, or serve the repository with:

```sh
python3 -m http.server 8765
```

## Develop and validate

Edit the files in `src/`, then rebuild the self-contained public entry point:

```sh
python3 src/build-standalone.py
node src/test-model.cjs --report
```

The browser test requires Playwright. Set `CHROME_PATH` to an installed Chrome executable if using it instead of Playwright's bundled Chromium:

```sh
node src/test-browser.cjs
```

The numerical checks cover reference agreement with GeoClaw, seismic moment, still-water equilibrium, analytical wave behavior, water-volume conservation, time-step sensitivity, grid sensitivity, and finite outputs under extreme scenarios. Passing these checks does not establish operational hazard accuracy.

## Publishing

GitHub Pages serves `main` from the repository root. Rebuild and commit `index.html` along with source changes, then push to `main`; GitHub republishes the site automatically.

## Data and attribution

See [data sources](src/SOURCES.md), [provenance and hashes](src/data-provenance.json), and the [model guide](src/README.md). Adapted GeoClaw formulas retain their [BSD 3-Clause license](src/LICENSE-GEOCLAW.txt), also embedded in the app. Use of NOAA data and GeoClaw methods does not imply endorsement by those organizations.
