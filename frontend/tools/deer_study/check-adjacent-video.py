# Research diagnostics only. No production or character activation.
from pathlib import Path
import cv2,numpy as np,json
root=Path(__file__).resolve().parents[2]/'evidence/deer-frame-study/continuity-test';frames=sorted((root/'stabilized-frames').glob('frame-*.png'));rows=[]
for i in range(1,len(frames)):
 a=cv2.imread(str(frames[i-1]));b=cv2.imread(str(frames[i]));diff=cv2.absdiff(a,b);leg=diff[525:900,200:500];whole=diff[70:1030,70:770];rows.append({'from_frame':i,'to_frame':i+1,'leg_rgb_mae':float(leg.mean()),'character_rgb_mae':float(whole.mean()),'leg_fraction_pixels_changed_gt_24':float((leg.max(axis=2)>24).mean())})
ordered=sorted(rows,key=lambda r:r['leg_rgb_mae'],reverse=True);result={'method':'Adjacent-frame difference after a single whole-frame terrain registration; measures appearance discontinuity, not anatomy acceptance','top_leg_discontinuities':ordered[:10],'rows':rows};(root/'adjacent-continuity.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result['top_leg_discontinuities']))
