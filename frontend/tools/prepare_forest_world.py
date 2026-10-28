"""Copy selected generated art and encode web derivatives without altering the artwork."""
from pathlib import Path
from PIL import Image
import hashlib, json, shutil

FRONTEND = Path(__file__).resolve().parents[1]
GENERATED = Path(r'C:\Users\thalt\.codex\generated_images\01a15579-b82b-7010-babe-ce16106043ba')
SOURCE = FRONTEND / 'assets/forest-world/source'
PUBLIC = FRONTEND / 'public/assets/forest-world'
ASSETS = {
    'valley-day': 'exec-4503bdd8-9aba-44d5-b0d4-d52f5d89e730.png',
    'valley-night': 'exec-61086f2f-47ef-48df-89f9-d5ffd057471d.png',
    'tree-crown': 'exec-fb9d1357-bd4b-43c2-983e-79cac9e2ef5f.png',
    'tree-trunk': 'exec-752bdbbf-cc5e-41bf-909a-a0a6706be5d3.png',
    'earth-roots': 'exec-c0aeb7a8-c18c-4fbe-8119-872e9be4b579.png',
    'deer-clearing': 'exec-6cd57ee2-b264-4833-8818-b45abdc5b840.png',
    'clearing-bank': 'exec-f0e287f5-8296-467f-9c4a-bed613806abc.png',
}

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def main():
    SOURCE.mkdir(parents=True, exist_ok=True)
    PUBLIC.mkdir(parents=True, exist_ok=True)
    inventory=[]
    for name, generated in ASSETS.items():
        src=SOURCE/f'{name}.png'
        if not src.exists(): shutil.copy2(GENERATED/generated, src)
        im=Image.open(src)
        out=PUBLIC/f'{name}.webp'
        im.save(out,'WEBP',quality=89,method=6,alpha_quality=100)
        alpha=im.getchannel('A') if 'A' in im.getbands() else None
        record={'id':name,'source':str(src.relative_to(FRONTEND)).replace('\\','/'),
                'url':'/assets/forest-world/'+out.name,'width':im.width,'height':im.height,
                'source_sha256':digest(src),'runtime_sha256':digest(out),'bytes':out.stat().st_size,
                'alpha':bool(alpha),'transparent_pixel_fraction':round(alpha.histogram()[0]/(im.width*im.height),4) if alpha else 0}
        if name.startswith('valley'):
            small=im.resize((640,960),Image.Resampling.LANCZOS)
            small.save(PUBLIC/f'{name}-640.webp','WEBP',quality=86,method=6)
            record['mobile_url']=f'/assets/forest-world/{name}-640.webp'
        inventory.append(record)
    manifest={'version':1,'status':'PROTOTYPE_ART_REQUIRES_OWNER_REVIEW',
              'reference_mapping':{'visible_day':'C:/Users/thalt/Pictures/Forest-night.png','visible_night':'C:/Users/thalt/Pictures/Forest-morning.png'},
              'lighting_geometry':'Night valley is an edit of day valley; tree, deer and earth geometry are shared in both themes.',
              'assets':inventory,
              'anchors':{'crown_axis':[.88,1],'perch':[.54,.562], 'owl_claw_source':[.445,.925],
                         'trunk_axis':.5,'earth_root_crown':[.88,.12], 'deer_hoof_plane':.85},
              'flight':'UNAPPROVED_SEPARATE_KINEMATIC_STUDY_NOT_ENABLED_IN_SCENE'}
    (PUBLIC/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
    (SOURCE.parent/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'assets':len(inventory),'runtime_bytes':sum(a['bytes'] for a in inventory),'source_bytes':sum((SOURCE/f'{n}.png').stat().st_size for n in ASSETS)},indent=2))

if __name__=='__main__':main()
