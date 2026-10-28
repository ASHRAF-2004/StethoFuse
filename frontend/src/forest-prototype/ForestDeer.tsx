import {useEffect,useRef,useState} from 'react';
import {createDeerRig,makeDeerLayers,sampleDeerPose,deformDeerPoint,hoof} from './deerRig';

const A='/assets/forest-world/';
export function ForestDeer(){
 const root=useRef<HTMLElement>(null),canvas=useRef<HTMLCanvasElement>(null),play=useRef(()=>{});
 const [reduced,setReduced]=useState(()=>matchMedia('(prefers-reduced-motion:reduce)').matches);
 const [available,setAvailable]=useState(false);
 useEffect(()=>{
  const el=root.current!,node=canvas.current!,ctx=node.getContext('2d')!;
  const motion=matchMedia('(prefers-reduced-motion:reduce)');
  let disposed=false,visible=false,loading=false,frame=0,lastPaint=0,poses=0,start=-1,nextPlay=0,rig:ReturnType<typeof createDeerRig>|undefined,ground:HTMLCanvasElement|undefined;
  const paint=(now:number)=>{
   frame=0;if(disposed||!visible||document.hidden||motion.matches||!rig||!ground)return;
   if(now-lastPaint>=1000/30){
    lastPaint=now-((now-lastPaint)%(1000/30));if(now>=nextPlay){start=now;nextPlay=now+23000;}
    const t=start<0?-1:(now-start)/1000,pose=sampleDeerPose(t,now/1000);rig.draw(pose);ctx.clearRect(0,0,512,768);ctx.drawImage(ground,0,0,512,768);ctx.drawImage(rig.canvas,0,0);
    if(pose.playing){
     const fade=Math.min(1,t/.5,(7.4-t)/.7);ctx.save();ctx.scale(.5,.5);ctx.translate(195+Math.sin(t*1.7)*39,600-Math.sin(Math.min(1,t/2)*Math.PI/2)*90+Math.sin(t*2.4)*25);ctx.globalAlpha=fade;const wing=12+Math.abs(Math.sin(t*14))*20;ctx.fillStyle='#d7f5b2';ctx.strokeStyle='#2a6556';ctx.lineWidth=2;ctx.shadowColor='#f6df8b';ctx.shadowBlur=8;ctx.beginPath();ctx.ellipse(-wing*.5,0,wing*.6,20,-.45,0,Math.PI*2);ctx.ellipse(wing*.5,0,wing*.6,20,.45,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.strokeStyle='#8b642e';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,-11);ctx.lineTo(0,13);ctx.stroke();ctx.restore();
    }
    el.classList.add('art-ready');el.dataset.playState=pose.playing?'playing':'idle';el.dataset.pawLift=pose.lift.toFixed(2);el.dataset.pawY=deformDeerPoint(hoof,pose).y.toFixed(2);el.dataset.time=t.toFixed(3);el.dataset.evaluatedPoses=String(++poses);
   }
   frame=requestAnimationFrame(paint);
  };
  const wake=()=>{if(!frame&&visible&&!disposed&&!motion.matches&&rig)frame=requestAnimationFrame(paint);};
  const load=async()=>{
   if(loading||rig||motion.matches)return;loading=true;
   const image=new Image(),bank=new Image();image.src=A+'deer-clearing.webp';bank.src=A+'clearing-bank.webp';
   try{await Promise.all([image.decode(),bank.decode()]);if(disposed)return;const layers=makeDeerLayers(image,bank);ground=layers.ground;rig=createDeerRig(image,layers.mask);node.width=512;node.height=768;el.dataset.renderer='original-texture-articulated-rig';setAvailable(true);nextPlay=performance.now()+650;wake();}catch{if(!disposed){el.dataset.renderer='approved-static-fallback';setAvailable(false);}}
  };
  play.current=()=>{if(!motion.matches){const now=performance.now();if(start<0||now-start>7400){start=now;nextPlay=now+23000;wake();}}};
  const io=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){void load();wake();}else{cancelAnimationFrame(frame);frame=0;}},{threshold:.08});io.observe(el);
  const changed=()=>{setReduced(motion.matches);if(motion.matches){cancelAnimationFrame(frame);frame=0;el.classList.remove('art-ready');el.dataset.playState='reduced-motion';}else{void load();wake();}};
  const visibility=()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else wake();};motion.addEventListener('change',changed);document.addEventListener('visibilitychange',visibility);
  return()=>{disposed=true;cancelAnimationFrame(frame);rig?.dispose();io.disconnect();motion.removeEventListener('change',changed);document.removeEventListener('visibilitychange',visibility);play.current=()=>{};};
 },[]);
 return <figure ref={root} className="deer-clearing"><img src={A+'deer-clearing.webp'} alt="" width="1024" height="1536" loading="lazy" aria-hidden="true"/><canvas ref={canvas} aria-hidden="true"/><i className="hoof-anchor" data-anchor="deer-ground" aria-hidden="true"/><button type="button" className="deer-play" aria-label="Play with the forest deer" disabled={reduced||!available} onClick={()=>play.current()}><span>Say hello <span aria-hidden="true">↗</span></span></button></figure>;
}
