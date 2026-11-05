"""Extract the existing seven owl contours, with padding and no CSS cropping."""
from pathlib import Path
import re
import xml.etree.ElementTree as ET

frontend = Path(__file__).resolve().parents[1]
source = frontend / 'public/assets/logo.svg'
path = ET.fromstring(source.read_text(encoding='utf-8')).find('.//{http://www.w3.org/2000/svg}path')
assert path is not None
contours = []
for part in re.findall(r'M[^M]+', path.attrib['d']):
    points = re.findall(r'[ML]\s+(-?[\d.]+)\s+(-?[\d.]+)', part)
    if points and max(float(x) for x, _ in points) < 420:
        contours.append(part)
assert len(contours) == 7, 'Source mark changed; inspect its contours before extraction.'
target = frontend / 'public/assets/forest-world/owl-mark.svg'
target.write_text(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="8 8 419 360" fill="currentColor">'
    '<title>StethoFuse owl mark</title><path d="' + ''.join(contours) + '"/></svg>',
    encoding='utf-8', newline='\n',
)
print(target)
