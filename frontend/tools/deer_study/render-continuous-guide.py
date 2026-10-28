"""Continuous joint/timing diagram ONLY, not final deer artwork or anatomical certification.
Creates new diagram frames from fixed-length links; never deforms a photograph.
"""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import math,json,subprocess
ROOT=Path(__file__).resolve().parents[2]
out=ROOT/'evidence/deer-frame-study/continuous-control';out.mkdir(parents=True,exist_ok=True)
font=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',20);small=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',16)
def ease(x):
 x=max(0,min(1,x));return x*x*x*(x*(x*6-15)+10)
def lift(t):
 if t<.5:return 0
 if t<1.8:return ease((t-.5)/1.3)
 if t<2:return 1
 return 1-ease((t-2)/1.4)
def endpoint(p,length,deg):
 a=math.radians(deg);return (p[0]+length*math.cos(a),p[1]+length*math.sin(a))
poses=[]
for n in range(97):
 t=n/24;q=lift(t);shoulder=(420,700-sum(length*math.sin(math.radians(angle)) for length,angle in [(80,110),(128,104),(155,93),(24,97)]));elbow=endpoint(shoulder,80,110+3*q);carpus=endpoint(elbow,128,104+41*q);fetlock=endpoint(carpus,155,93-73*q);hoof=endpoint(fetlock,24,97-67*q)
 pts=[shoulder,elbow,carpus,fetlock,hoof];poses.append({'frame':n+1,'time':t,'lift':q,'points':pts,'hoof_angle_degrees':-25*q})
 im=Image.new('RGB',(768,864),'#132d29');d=ImageDraw.Draw(im)
 d.text((30,22),'CONTINUOUS JOINT / OCCLUSION STUDY',font=font,fill='#e9f5e5');d.text((30,54),'Technical diagram — NOT the approved deer character.',font=small,fill='#b9d2c6')
 d.line((65,710,730,710),fill='#a2b9a6',width=3)
 # Context silhouette is diagrammatic. Far limb is drawn before near support.
 d.ellipse((365,253,700,412),fill='#455e58');d.polygon([(365,330),(322,160),(352,148),(440,290)],fill='#455e58');d.ellipse((310,111,393,181),fill='#455e58');d.line((327,120,297,73),fill='#71867a',width=5);d.line((350,115,361,73),fill='#71867a',width=5)
 d.line(pts,fill='#7ddfcf',width=14,joint='curve')
 for p in pts:d.ellipse((p[0]-8,p[1]-8,p[0]+8,p[1]+8),fill='#d4f6e8')
 a=math.radians(-25*q);shape=[(-12,-4),(12,-4),(13,10),(-14,10)];poly=[(hoof[0]+x*math.cos(a)-y*math.sin(a),hoof[1]+x*math.sin(a)+y*math.cos(a))for x,y in shape];d.polygon(poly,fill='#e7bb77')
 # Near foreleg occludes the lifted far leg. The three support contacts do not move.
 for chain in [[(445,345),(434,510),(425,700)],[(590,360),(615,495),(580,700)],[(657,365),(675,530),(704,700)]]:
  d.line(chain,fill='#81948a',width=17,joint='curve');x,y=chain[-1];d.rectangle((x-12,y,x+12,710),fill='#d6e1d3')
 d.text((38,748),f'Frame {n+1:02d}/97    t={t:.3f}s    24 fps',font=font,fill='#ecf1d8');d.text((38,784),'Fixed-length links · continuous angles · fixed support contacts',font=small,fill='#b9d2c6');d.text((38,810),'Motion guide only; final generated anatomy still requires inspection.',font=small,fill='#b9d2c6')
 im.save(out/f'frame-{n+1:03d}.png')
max_step=max(math.dist(a['points'][-1],b['points'][-1])for a,b in zip(poses,poses[1:]));result={'status':'UNQUALIFIED_TECHNICAL_CONTROL_ONLY','fps':24,'frames':97,'distinct_evaluated_joint_positions':len(set(tuple(round(x,6) for p in f['points']for x in p)for f in poses)),'max_adjacent_hoof_step_px':max_step,'frame35_to36_hoof_step_px':math.dist(poses[34]['points'][-1],poses[35]['points'][-1]),'source_image_deformation':False,'product_character_art':False,'motion_acceptance':False,'points':poses};(out/'continuous-joint-study.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-framerate','24','-i',str(out/'frame-%03d.png'),'-c:v','libx264','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart',str(out/'continuous-joint-study.mp4')],check=True)
print(json.dumps({k:v for k,v in result.items() if k!='points'}))
