from pathlib import Path
root=Path(__file__).resolve().parent
s=(root/'index.html').read_text().replace('__GEOCLAW_LICENSE__',(root/'LICENSE-GEOCLAW.txt').read_text())
for name in ['data','model']:
 s=s.replace(f'<script id="{name}-code" src="{name}.js"></script>',f'<script id="{name}-code">'+(root/f'{name}.js').read_text()+'</script>')
s=s.replace('<script src="app.js"></script>','<script>'+(root/'app.js').read_text()+'</script>')
s=s.replace('<title>Cascadia Lab — A moving margin</title>','<title>Cascadia Lab — Earthquake & Tsunami Explorer</title><meta name="description" content="Explore Cascadia earthquake scenarios with NOAA bathymetry, elastic fault deformation, and an interactive two-dimensional tsunami simulation. Educational regional model."><link rel="icon" type="image/svg+xml" href="icon.svg">')
(root.parent/'index.html').write_text(s)
print('Standalone app:',root.parent/'index.html')
