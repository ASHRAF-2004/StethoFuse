import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,Play,Pause,ArrowCounterClockwise} from '@phosphor-icons/react';
import './study.css';

export const FPS=24,FRAME_COUNT=96,CONTACT_FRAME=72;
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const smooth=(n:number)=>{n=clamp(n);return n*n*(3-2*n);};
const mix=(a:number,b:number,n:number)=>a+(b-a)*n;
const rad=(d:number)=>d*Math.PI/180;
type Pose={frame:number;t:number;phase:string;x:number;y:number;shoulder:number;elbow:number;wrist:number;tail:number;legExtension:number;bodyPitch:number;contact:boolean;toeY:number;fold:number};
/** Authored channels evaluated at 24 fps. Inferred choreography, not measured snowy-owl flight. */
export function evaluate(frame:number):Pose{
 const t=frame/FPS,travel=smooth(t/3),brake=smooth((t-1.9)/.9),fold=smooth((t-3.04)/.72),beat=t*2.15*Math.PI*2;
 const contact=frame>=CONTACT_FRAME,settle=contact?4.5*Math.exp(-(t-3)*6)*Math.sin((t-3)*12):0;
 return {frame,t,phase:t<1.9?'approach / downstroke-upstroke':t<2.6?'braking / tail fan':t<3?'legs extend / reach':t<3.5?'contact / wing fold':'settle / idle boundary',x:mix(140,760,1-(1-travel)**1.7),y:mix(185,330,travel)+(contact?settle:Math.sin(beat)*3.4*(1-brake)),shoulder:mix(Math.sin(beat)*55-8,-47,brake)*(1-fold)+78*fold,elbow:mix(22+Math.sin(beat-.45)*22,38,brake)*(1-fold)-132*fold,wrist:mix(Math.sin(beat-.8)*18,19,brake)*(1-fold)+37*fold,tail:mix(10+Math.sin(beat-1)*5,36,brake)*(1-fold)+9*fold,legExtension:smooth((t-2.08)/.78),bodyPitch:mix(-8,5,brake)*(1-fold),contact,toeY:contact?435:mix(268,435,travel),fold};
}
export const poses=Array.from({length:FRAME_COUNT},(_,i)=>evaluate(i));

function line(ctx:CanvasRenderingContext2D,a:number[],b:number[],color='#d3d9cc',width=2){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();}
function ellipse(ctx:CanvasRenderingContext2D,x:number,y:number,rx:number,ry:number,rotation=0,fill='#cad8d0',stroke='#8eafa4'){ctx.fillStyle=fill;ctx.strokeStyle=stroke;ctx.lineWidth=1.3;ctx.beginPath();ctx.ellipse(x,y,rx,ry,rotation,0,Math.PI*2);ctx.fill();ctx.stroke();}
export function drawPose(ctx:CanvasRenderingContext2D,p:Pose,{world=true,labels=true}={}){
 if(world){ctx.fillStyle='#0d2523';ctx.fillRect(0,0,1000,600);ctx.strokeStyle='#36564a';ctx.lineWidth=1;for(let x=0;x<=1000;x+=50)line(ctx,[x,0],[x,600],'#193833',.6);for(let y=0;y<=600;y+=50)line(ctx,[0,y],[1000,y],'#193833',.6);line(ctx,[600,449],[970,449],'#708b62',24);line(ctx,[600,437],[970,437],'#b1ba8d',5);ctx.fillStyle='#a9c6b7';ctx.font='13px Manrope';ctx.fillText('Registered perch plane y=435',650,483);ctx.setLineDash([5,5]);line(ctx,[760,90],[760,435],'#8dbe7d',1);ctx.setLineDash([]);}
 const x=p.x,y=p.y;
 // Tail and broad fingered wings have independent shoulder, elbow and wrist channels.
 for(let i=-2;i<=2;i++)ellipse(ctx,x+i*10,y+71,9,42,rad(i*p.tail/2),'#becbc4');
 for(const side of [-1,1]){
  const upper=mix(83,50,p.fold),lower=mix(83,22,p.fold);
  const s=[x+side*33,y-13],e=[s[0]+side*upper*Math.cos(rad(p.shoulder)),s[1]+upper*Math.sin(rad(p.shoulder))],w=[e[0]+side*lower*Math.cos(rad(p.shoulder+p.elbow)),e[1]+lower*Math.sin(rad(p.shoulder+p.elbow))];
  ctx.fillStyle='#c8d7cf';ctx.strokeStyle='#91ab9f';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(s[0],s[1]);ctx.quadraticCurveTo(e[0],e[1]-18,w[0],w[1]);ctx.lineTo(w[0]-side*20,w[1]+38);ctx.quadraticCurveTo(e[0]-side*15,e[1]+50,s[0],s[1]+35);ctx.closePath();ctx.fill();ctx.stroke();
  for(let i=0;i<10;i++){
   const a=rad(mix(p.shoulder+p.elbow+p.wrist-18+i*6,78+i*1.2,p.fold)),len=(80-i*3)*mix(1,.4,p.fold);
   const bx=mix(e[0],w[0],.32+i*.068),by=mix(e[1],w[1],.32+i*.068);
   const tx=bx+side*len*Math.cos(a),ty=by+len*Math.sin(a)+20;
   ctx.beginPath();ctx.moveTo(bx,by);ctx.quadraticCurveTo((bx+tx)/2-side*10,(by+ty)/2+10,tx,ty);ctx.quadraticCurveTo((bx+tx)/2+side*6,(by+ty)/2-3,bx+side*9,by-6);ctx.fillStyle=i%2?'#e2e7da':'#cedacf';ctx.fill();ctx.strokeStyle='#8da89b';ctx.lineWidth=.8;ctx.stroke();
  }
  line(ctx,s,e,'#d39a5e',2);line(ctx,e,w,'#d39a5e',2);for(const a of [s,e,w])ellipse(ctx,a[0],a[1],4,4,0,'#e7b371','#e7b371');
 }
 ellipse(ctx,x,y+22,46,70,rad(p.bodyPitch),'#d9e0d2');
 for(let i=0;i<5;i++)for(let j=0;j<3;j++)line(ctx,[x-24+j*22,y+8+i*15],[x-16+j*22,y+11+i*15],'#789383',2);
 const hipY=y+65,toe=p.contact?435:Math.min(435,y+mix(77,105,p.legExtension));
 for(const side of [-1,1]){const hx=x+side*18,kx=hx+side*8,ky=mix(hipY,toe,.55);line(ctx,[hx,hipY],[kx,ky],'#c2bc9a',5);line(ctx,[kx,ky],[hx,toe-3],'#c2bc9a',4);for(let i=-1;i<=1;i++){ctx.strokeStyle='#ccb98e';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(hx,toe-4);ctx.quadraticCurveTo(hx+i*9,toe-5,hx+i*12,toe+2);ctx.stroke();}}
 ellipse(ctx,x,y-49,43,40,0,'#e5e9dc');ellipse(ctx,x-19,y-47,17,20,0,'#f0f1e4');ellipse(ctx,x+19,y-47,17,20,0,'#f0f1e4');
 for(const side of [-1,1]){ellipse(ctx,x+side*18,y-48,7,7,0,'#64a28a','#36795b');ellipse(ctx,x+side*18,y-48,3.5,5,0,'#102d27','#102d27');}
 ctx.fillStyle='#263d32';ctx.beginPath();ctx.moveTo(x-5,y-38);ctx.lineTo(x+5,y-38);ctx.lineTo(x,y-24);ctx.fill();
 if(p.contact){ellipse(ctx,x-18,435,5,3,0,'#e9c484');ellipse(ctx,x+18,435,5,3,0,'#e9c484');}
 if(world&&labels){ctx.fillStyle='#d6e8d7';ctx.font='18px Manrope';ctx.fillText(`Frame ${String(p.frame).padStart(2,'0')} / 95  ·  ${p.t.toFixed(2)}s`,30,38);ctx.font='14px Manrope';ctx.fillText(p.phase,30,67);ctx.fillStyle='#d7ad77';ctx.fillText('ANATOMICAL BLOCKOUT · NOT FINAL OWL ART',30,568);}
}

export default function MotionStudy(){
 const canvas=useRef<HTMLCanvasElement>(null),atlas=useRef<HTMLCanvasElement>(null);const [frame,setFrame]=useState(0),[playing,setPlaying]=useState(false);
 useEffect(()=>{const c=canvas.current!.getContext('2d')!;drawPose(c,poses[frame]);},[frame]);
 useEffect(()=>{if(!playing)return;let raf=0,start=0;const begin=frame;const tick=(now:number)=>{if(!start)start=now;const next=Math.min(FRAME_COUNT-1,begin+Math.floor((now-start)*FPS/1000));setFrame(next);if(next<FRAME_COUNT-1)raf=requestAnimationFrame(tick);else setPlaying(false);};raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf);},[playing]);
 useEffect(()=>{const c=atlas.current!.getContext('2d')!;c.fillStyle='#0d2523';c.fillRect(0,0,1680,1120);poses.forEach((p,i)=>{const x=(i%12)*140,y=Math.floor(i/12)*140;c.save();c.translate(x+70,y+72);c.scale(.25,.25);c.translate(-p.x,-p.y);drawPose(c,p,{world:false,labels:false});c.restore();c.fillStyle='#a7c7b4';c.font='10px Manrope';c.fillText(`${String(i).padStart(2,'0')}  ${p.contact?'contact':'air'}`,x+10,y+132);});},[]);
 const data=JSON.stringify({fps:FPS,frames:FRAME_COUNT,contact_frame:CONTACT_FRAME,status:'KINEMATIC_STUDY_UNAPPROVED_FINAL_FLIGHT_ART_REQUIRED',poses},null,2);
 return <main className="motion-study"><a className="text-link" href="/forest-prototype.html?theme=night"><ArrowLeft/>Return to forest composition</a><header><p className="world-eyebrow">Separate animation quality gate</p><h1>Flight, contact, settle.</h1><p>A 24 fps anatomical blockout with 96 distinct evaluated poses. This is a choreography study, <strong>unapproved for the website</strong>. The forest prototype retains the approved perched owl.</p></header><canvas className="motion-player" ref={canvas} width="1000" height="600" data-frame={frame} data-status="unapproved-anatomical-study"/><div className="motion-controls"><button onClick={()=>{if(frame===95)setFrame(0);setPlaying(v=>!v);}}>{playing?<Pause/>:<Play/>}{playing?'Pause':'Play study'}</button><button onClick={()=>{setPlaying(false);setFrame(0);}}><ArrowCounterClockwise/>Reset</button><input aria-label="Animation frame" type="range" min="0" max="95" value={frame} onChange={e=>{setPlaying(false);setFrame(Number(e.target.value));}}/><output>{frame+1} / 96</output></div><section className="study-notes"><article><h2>What is evaluated</h2><p>Shoulder, elbow and wrist lag; primary-feather fan; tail compensation; stabilized face; deceleration; leg reach; pinned toes; wing folding; damped body settle. Time-based frame selection runs independently of display refresh.</p></article><article><h2>What blocks acceptance</h2><p>This blockout is not the approved photographic owl. Identity-consistent final feather/wing artwork and a visually seamless handoff into its actual idle surface have not passed review. No final flight is mounted in the forest. Reduced motion always keeps the perch.</p></article></section><section><h2>Pose atlas</h2><p>Each pose has independent evaluated channels; this is not a repeated two-image loop. Registration keeps the contact plane fixed from frame 72 onward.</p><canvas ref={atlas} className="pose-atlas" width="1680" height="1120"/><a className="text-link" download="owl-24fps-pose-study.json" href={'data:application/json;charset=utf-8,'+encodeURIComponent(data)}>Download pose and registration data <ArrowRightIcon/></a></section><section className="study-sources"><h2>Study sources</h2><p>Snowy-owl broad-wing proportions and feather pattern: <a href="https://www.allaboutbirds.org/guide/snowy_owl/id">Cornell Lab of Ornithology</a>. Wing/torso stabilization and shoulder response: <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC7661293/">Cheney et al., 2020</a>. These inform the study; the trajectory and joint timing are authored hypotheses, not biological measurements. No reference footage is embedded in the product.</p></section></main>;
}
function ArrowRightIcon(){return <span aria-hidden="true">↗</span>;}
