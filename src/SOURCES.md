# Data and scientific provenance

Retrieved September 5, 2026. Exact downloaded-file SHA-256 hashes are recorded in data-provenance.json. No external data are fetched by the standalone app while it runs.

## NOAA bathymetry / terrain

- Dataset: ETOPO 2022 v1, 60 Arc-Second, Global (Ice Surface), NOAA NCEI; heights in meters, EGM2008, positive up.
- Metadata: https://oceanwatch.pifsc.noaa.gov/erddap/griddap/ETOPO_2022_v1_60s.html
- Retrieval query: `https://oceanwatch.pifsc.noaa.gov/erddap/griddap/ETOPO_2022_v1_60s.json?z[(39):2:(52)][(226.5):2:(239)]`
- 376 longitude × 391 latitude samples, 2 arc-minutes apart. Rounded to integer meters and packed little-endian int16 for distribution. Fine mode uses these samples; Fast mode averages 2 × 2 blocks. A last incomplete latitude block is omitted in Fast mode.
- Display relief, coastlines, and contours derive from this data. Model cells with average elevation >= -20 m are masked. This is a numerical shoreline, not an observed wet/dry boundary.

## Fault geometry

- NOAA SIFT archived unit-source metadata distributed by GeoClaw:
  https://github.com/clawpack/geoclaw/blob/master/src/python/geoclaw/data/info_sz.dat.txt
- Raw retrieval: https://raw.githubusercontent.com/clawpack/geoclaw/master/src/python/geoclaw/data/info_sz.dat.txt
- NOAA unit-source explanation: https://nctr.pmel.noaa.gov/propagation-database.html
- Retained acsza56–65 and acszb56–65 only. Geometry convention: longitude/latitude at bottom-center of the patch, depth at top. Each patch is 100 × 50 km. The two bands span 100 km down dip. Northern mode uses rows 56–60; southern uses 61–65.
- Source shapes and slip amplitudes are generated here, not NOAA's precomputed propagation output. This is not an official SIFT forecast.

## Elastic deformation

- Okada (1985), rectangular dislocation in a homogeneous elastic half-space, using the vertical formulas adapted from GeoClaw's dtopotools.py:
  https://raw.githubusercontent.com/clawpack/geoclaw/master/src/python/geoclaw/dtopotools.py
- Documentation: https://www.clawpack.org/v5.12.x/okada.html
- BSD-3-Clause attribution: LICENSE-GEOCLAW.txt. The same license is embedded in the standalone app.
- Poisson ratio 0.25; rigidity 40 GPa; local geographic distance conversion uses Earth radius 6,371 km. The JavaScript routine was compared at 27 points with the original GeoClaw methods evaluated independently with the same Earth radius and patch convention. Maximum absolute difference was below 1e-9 m for unit slip.

## Regional context

- USGS Pacific Northwest earthquake hazards: https://pubs.usgs.gov/publication/fs20253050/full
- Official U.S. tsunami information: https://www.tsunami.gov/

The app is an independent educational model and is not endorsed or validated by these organizations.
