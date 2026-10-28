# Research diagnostics only. No production or character activation.
from pathlib import Path
import json,subprocess,hashlib
from PIL import Image,ImageDraw
root=Path(__file__).resolve().parents[2]/'evidence/deer-frame-study/continuity-test';video=root/'generated-candidate.mp4';out=root/'generated-frames';out.mkdir(exist_ok=True)
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-count_frames','-show_streams','-show_format','-of','json',str(video)]))
v=next(s for s in probe['streams'] if s['codec_type']=='video');subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-i',str(video),'-fps_mode','passthrough',str(out/'frame-%03d.png')],check=True)
frames=sorted(out.glob('frame-*.png'));hashes=[hashlib.sha256(p.read_bytes()).hexdigest() for p in frames]
report={'job_id':'797daa7b-3f49-4f00-bac0-24062ec99758','source':'one explicitly authorized free hf_mult_motion_control run','video_sha256':hashlib.sha256(video.read_bytes()).hexdigest(),'video_bytes':video.stat().st_size,'native_fps':v.get('avg_frame_rate'),'dimensions':[v['width'],v['height']],'duration':probe['format']['duration'],'decoded_frames':len(frames),'unique_png_hashes':len(set(hashes)),'accepted':False,'verdict':'AWAITING_VISUAL_INSPECTION','local_anatomical_warp':False}
(root/'output-metadata.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
for page,start in enumerate(range(0,len(frames),24)):
 sheet=Image.new('RGB',(6*180,4*300),'#132f26');draw=ImageDraw.Draw(sheet)
 for n,p in enumerate(frames[start:start+24]):
  im=Image.open(p);im.thumbnail((174,272));x=(n%6)*180;y=(n//6)*300;sheet.paste(im,(x+(180-im.width)//2,y+24));draw.text((x+6,y+4),f'{start+n+1:03d}',fill='#eff8dc')
 sheet.save(root/f'generated-contact-sheet-{page:02d}.jpg',quality=93)
print(json.dumps(report))
