"""Keep the approved planted feet/terrain while compositing genuine upper-body motion."""
import argparse
import hashlib
import json
import shutil
import subprocess
from pathlib import Path

import cv2
import numpy as np
from PIL import Image
from prepare_cloud_idle import matting

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--source',type=Path,required=True)
parser.add_argument('--original',type=Path,required=True)
parser.add_argument('--out',type=Path,required=True)
args=parser.parse_args()
if args.out.exists():raise RuntimeError('Preserve previous studies; use a fresh directory')
args.out.mkdir(parents=True)
for folder in ['forward','packed','inspection']:(args.out/folder).mkdir()
shutil.copy2(__file__,args.out/'finalize-source.py')
manifest=json.loads((args.source/'manifest.json').read_text(encoding='utf-8'))
width,height=manifest['native_dimensions'];target_height=width*3//2;top=(target_height-height)//2
original=np.array(Image.open(args.original).convert('RGBA').resize((width,target_height),Image.Resampling.LANCZOS)).astype(np.float32)
old_alpha=original[...,3:4]/255;old_premul=original[...,:3]*old_alpha
blend=np.clip((np.arange(target_height)/target_height-.60)/.08,0,1)[:,None,None];blend=blend*blend*(3-2*blend)
for i in range(1,50):
 rgb=np.array(Image.open(args.source/'raw'/f'frame-{i:03}.png').convert('RGB'))
 coverage=np.array(Image.open(args.source/'coverage'/f'frame-{i:03}.png'))>0
 rgba=np.zeros((target_height,width,4),np.float32)
 rgba[top:top+height]=matting(rgb,coverage).astype(np.float32);a=rgba[...,3:4]/255
 alpha=a*(1-blend)+old_alpha*blend
 premul=rgba[...,:3]*a*(1-blend)+old_premul*blend
 colour=np.clip(premul/np.maximum(alpha,1e-4),0,255)
 solid=alpha[...,0]>.95
 _,labels=cv2.distanceTransformWithLabels((~solid).astype(np.uint8),cv2.DIST_L2,5,labelType=cv2.DIST_LABEL_PIXEL)
 nearest=colour[solid][np.maximum(labels-1,0)]
 edge=cv2.dilate((alpha[...,0]>.02).astype(np.uint8),np.ones((9,9),np.uint8))>0
 transparent=alpha[...,0]<.02;colour[transparent]=nearest[transparent];colour[~edge]=0
 final=np.dstack((colour,alpha*255)).round().astype(np.uint8)
 Image.fromarray(final).save(args.out/'forward'/f'frame-{i:03}.png')
sequence=list(range(1,50))+list(range(48,0,-1))
for i,pose in enumerate(sequence,1):
 rgba=np.array(Image.open(args.out/'forward'/f'frame-{pose:03}.png'));packed=np.concatenate((rgba[...,:3],np.repeat(rgba[...,3:4],3,2)),1)
 Image.fromarray(packed).save(args.out/'packed'/f'frame-{i:03}.png')
Image.open(args.out/'forward/frame-001.png').save(args.out/'poster.webp',quality=95,method=6)
subprocess.run(['ffmpeg','-v','error','-framerate','24','-i',str(args.out/'packed/frame-%03d.png'),'-c:v','libx264','-crf','17','-preset','slow','-pix_fmt','yuv420p','-movflags','+faststart','-an',str(args.out/'idle-packed.mp4')],check=True)
manifest.update(status='PREVIEW_CANDIDATE_OWNER_APPROVAL_REQUIRED',owner_approved=False,original_lower_body_and_ground_preserved=True,original_ground_registration='approved original resized directly to final 560x840 display coordinates; no added ground padding',lower_body_blend_range=[.60,.68],genuine_motion_scope='generated head, ears, neck and upper chest; approved source below torso',source_native_fps=16,presentation_fps=24,video_sha256=hashlib.sha256((args.out/'idle-packed.mp4').read_bytes()).hexdigest(),video_bytes=(args.out/'idle-packed.mp4').stat().st_size)
(args.out/'manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in manifest.items() if k!='mapping'}),flush=True)
