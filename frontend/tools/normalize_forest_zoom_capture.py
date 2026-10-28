"""Remove Chromium's empty CSS-sized capture padding at native 67% page zoom."""
from pathlib import Path
from PIL import Image
import json

out = Path('evidence/forest-world/final')
metrics = json.loads((out / 'zoom-capture-metrics.json').read_text())
assert abs(metrics['dpr'] - 2/3) < .02 and metrics['pinchScale'] == 1
raw = out / 'night-actual-browser-zoom-67-raw.png'
im = Image.open(raw)
width, height = round(im.width * metrics['dpr']), round(im.height * metrics['dpr'])
# Empty capture padding must actually be empty; never crop painted scene pixels.
padding = im.crop((width + 3, 3, im.width - 3, min(height, im.height) - 3)).convert('RGB')
assert all(hi - lo < 3 for lo, hi in padding.getextrema()), 'Nonuniform right region: inspect capture manually.'
im.crop((0, 0, width, height)).save(out / 'night-actual-browser-zoom-67.png')
(out / 'zoom-capture-normalization.json').write_text(json.dumps({
    'browser_page_zoom': metrics['dpr'], 'pinch_scale': metrics['pinchScale'],
    'raw': raw.name, 'raw_dimensions': im.size,
    'normalized': 'night-actual-browser-zoom-67.png', 'normalized_dimensions': [width, height],
    'operation': 'Crop verified empty capture padding only; no resizing, repainting or synthesized scene pixels.'
}, indent=2), encoding='utf-8', newline='\n')
