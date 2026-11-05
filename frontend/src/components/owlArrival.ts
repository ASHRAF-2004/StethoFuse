import {useEffect,type RefObject} from 'react';
import './owl-arrival.css';

type Pose={asset:string;rect:number[];eyes:number[];eyeSpan:number};
type Manifest={version:number;flightCycle:string[];poses:Record<string,Pose>;assets:Record<string,{url:string}>};
let played=false;
export const isOwlArriving=(element:HTMLElement)=>['approach','landing','settling'].includes(element.dataset.arrivalStage||'');

/** One real winged arrival per document; the approved perch handles all later gaze. */
export function useOwlArrival(root:RefObject<HTMLDivElement|null>,canvas:RefObject<HTMLCanvasElement|null>,enabled:boolean) {
  useEffect(()=>{
    const element=root.current,layer=canvas.current;
    if(!element||!layer||!enabled||played)return;
    const motion=matchMedia('(prefers-reduced-motion: reduce)');
    const connection=(navigator as Navigator&{connection?:{saveData?:boolean}}).connection;
    if(motion.matches||connection?.saveData){element.dataset.arrivalStage='skipped';return;}
    const ctx=layer.getContext('2d');if(!ctx)return;
    const abort=new AbortController(),images=new Map<string,ImageBitmap>();
    let disposed=false,finished=false,frame=0,elapsed=0,last=0,visible=false,started=false;
    let manifest:Manifest|null=null;
    const finish=(stage:string)=>{
      finished=true;
      cancelAnimationFrame(frame);frame=0;last=0;
      element.dataset.arrivalStage=stage;layer.hidden=true;
      layer.width=1;layer.height=1;
      element.dispatchEvent(new Event('sf-owl-arrived'));
      for(const image of images.values())image.close();images.clear();
    };
    const draw=(pose:Pose,scale:number,x:number,y:number,opacity=1)=>{
      const source=images.get(pose.asset);if(!source)return;
      const bounds=element.getBoundingClientRect();
      const width=bounds.width,height=bounds.height;
      // Match actual iris landmarks, not the generated frame's bounding box.
      const zoom=width/1163*195/pose.eyeSpan*scale;
      const [sx,sy,sw,sh]=pose.rect;
      const targetX=width+width*497.5/1163+x,targetY=height*.5+height*260/1353+y;
      ctx.globalAlpha=opacity;
      ctx.drawImage(source,sx,sy,sw,sh,targetX-pose.eyes[0]*zoom,targetY-pose.eyes[1]*zoom,sw*zoom,sh*zoom);
      ctx.globalAlpha=1;
    };
    const tick=(time:number)=>{
      frame=0;if(disposed||finished||!manifest)return;
      if(motion.matches){finish('skipped');return;}
      if(document.hidden||!visible)return;
      if(last)elapsed+=Math.min(50,time-last);last=time;
      const bounds=element.getBoundingClientRect(),ratio=Math.min(devicePixelRatio,2);
      const w=Math.max(1,Math.round(bounds.width*3*ratio)),h=Math.max(1,Math.round(bounds.height*2*ratio));
      if(layer.width!==w||layer.height!==h){layer.width=w;layer.height=h;}
      ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,w/ratio,h/ratio);
      const t=Math.min(1,elapsed/1150),ease=1-Math.pow(1-t,3);
      const x=bounds.width*1.2*(1-ease),y=-bounds.height*.48*(1-ease)+Math.sin(t*Math.PI)*-bounds.height*.06;
      let pose:string,scale:number,nextPose:string|undefined,blend=0;
      if(elapsed<1150){
        element.dataset.arrivalStage='approach';
        const cycle=manifest.flightCycle;
        const phase=elapsed/1150*cycle.length*2,step=Math.floor(phase);
        pose=cycle[step%cycle.length];
        scale=.26+.48*ease;
      }else if(elapsed<1400){element.dataset.arrivalStage='landing';pose='landing-upstroke';scale=.74+.16*(elapsed-1150)/250;}
      else if(elapsed<1580){element.dataset.arrivalStage='landing';pose='landing-upstroke';nextPose='landing-perch';blend=(elapsed-1400)/180;scale=.9+.1*blend;}
      else{
        element.dataset.arrivalStage='settling';pose='landing-perch';scale=1;
        element.style.setProperty('--owl-arrival-handoff',String(Math.min(1,(elapsed-1580)/180)));
      }
      const opacity=elapsed>=1580?Math.max(0,1-(elapsed-1580)/180):1;
      draw(manifest.poses[pose],scale,x,y,opacity*(nextPose?1-blend:1));
      if(nextPose)draw(manifest.poses[nextPose],scale,x,y,opacity*blend);
      element.dataset.arrivalPose=nextPose&&blend>=.5?nextPose:pose;element.dataset.arrivalProgress=(elapsed/1760).toFixed(3);
      if(elapsed>=1760){finish('landed');return;}
      frame=requestAnimationFrame(tick);
    };
    const wake=()=>{if(!frame&&manifest&&visible&&!document.hidden&&!disposed&&!finished)frame=requestAnimationFrame(tick);};
    const start=async()=>{
      if(started||disposed||played)return;started=true;played=true;
      element.dataset.arrivalStage='loading';
      const timeout=setTimeout(()=>abort.abort(),2500);
      try{
        const response=await fetch('/assets/owl/arrival-v2/manifest.json',{signal:abort.signal});
        if(!response.ok)throw new Error('Missing arrival manifest');
        const value=await response.json() as Manifest;
        if(value.version!==2||value.flightCycle.length<12||!value.poses['landing-upstroke']||!value.poses['landing-perch']||value.flightCycle.some(key=>!value.poses[key]))throw new Error('Invalid arrival manifest');
        await Promise.all(Object.entries(value.assets).map(async([key,asset])=>{
          if(!/^\/assets\/owl\/arrival-v[12]\/[a-z-]+\.webp$/.test(asset.url))throw new Error('Invalid arrival asset');
          const result=await fetch(asset.url,{signal:abort.signal});if(!result.ok)throw new Error('Missing arrival asset');
          const image=await createImageBitmap(await result.blob());
          if(disposed||abort.signal.aborted){image.close();return;}images.set(key,image);
        }));
        if(disposed||abort.signal.aborted){if(!disposed&&!finished)finish('fallback');return;}
        manifest=value;layer.hidden=false;element.dataset.arrivalStage='approach';wake();
      }catch{if(!disposed&&!finished)finish('fallback');}
      finally{clearTimeout(timeout);}
    };
    const visibility=()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;last=0;}else wake();};
    const preference=()=>{if(motion.matches){abort.abort();finish('skipped');}};
    const observer=new IntersectionObserver(entries=>{
      visible=entries[0].isIntersecting;
      if(visible){void start();wake();}else{cancelAnimationFrame(frame);frame=0;last=0;}
    },{threshold:.1});observer.observe(element);
    document.addEventListener('visibilitychange',visibility);motion.addEventListener('change',preference);
    return()=>{disposed=true;abort.abort();finish('cancelled');observer.disconnect();document.removeEventListener('visibilitychange',visibility);motion.removeEventListener('change',preference);};
  },[enabled,root,canvas]);
}
