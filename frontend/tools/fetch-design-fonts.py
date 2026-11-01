"""Download only the two licensed families selected for the listening studio."""
import json,re,urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/assets/fonts/studio';OUT.mkdir(parents=True,exist_ok=True)
def get(url):
 if url.startswith('//'):url='https:'+url
 return urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'}),timeout=30).read()
records=[]
for family,url in [('Chillax','https://api.fontshare.com/v2/css?f[]=chillax@400,500,600&display=swap'),('IBM Plex Sans Arabic','https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap')]:
 css=get(url).decode();faces=[]
 for block in re.findall(r'@font-face\s*\{[^}]+\}',css):
  urls=re.findall(r'url\([\"\']?([^\)\"\']+)',block)
  if not urls:continue
  chosen=next((u for u in urls if 'woff2' in u),urls[-1]);stem=('chillax' if family=='Chillax' else 'plex-arabic')+f'-{len(faces)}.woff2'
  data=get(chosen);(OUT/stem).write_bytes(data)
  block=re.sub(r'src:[^;]+;',f"src:url('/assets/fonts/studio/{stem}') format('woff2');",block)
  faces.append(block);records.append({'family':family,'file':stem,'bytes':len(data),'source':chosen})
 (OUT/('chillax.css' if family=='Chillax' else 'arabic.css')).write_text('\n'.join(faces),encoding='utf-8')
(OUT/'IBM-OFL.txt').write_bytes(get('https://raw.githubusercontent.com/google/fonts/main/ofl/ibmplexsansarabic/OFL.txt'))
(OUT/'FONT-SOURCES.json').write_text(json.dumps(records,indent=2),encoding='utf-8')
print(json.dumps(records,indent=2))
