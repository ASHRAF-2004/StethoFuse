import {useEffect,useRef} from 'react';

type Particle={x:number;y:number;vx:number;vy:number;age:number;life:number;size:number;phase:number;turn:number};

/** One bounded canvas: luminous fireflies at night, outlined woodland birds by day. */
export function ForestCursor({theme}:{theme:'day'|'night'}){
 const canvas=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{
  const node=canvas.current!,ctx=node.getContext('2d');if(!ctx)return;
  const allowed=matchMedia('(pointer:fine) and (prefers-reduced-motion:no-preference)');
  const night=theme==='night',cap=night?144:36,particles:Particle[]=[];
  let frame=0,previous=0,lastEmit=0,lastX=0,lastY=0,hasPointer=false;
  node.dataset.style=night?'golden-fireflies':'woodland-birds';node.dataset.cap=String(cap);
  const resize=()=>{const d=Math.min(devicePixelRatio,1.5);node.width=allowed.matches?Math.round(innerWidth*d):1;node.height=allowed.matches?Math.round(innerHeight*d):1;ctx.setTransform(d,0,0,d,0,0);};
  const tick=(now:number)=>{
   frame=0;const dt=previous?Math.min(.05,(now-previous)/1000):1/60;previous=now;
   ctx.clearRect(0,0,innerWidth,innerHeight);
   for(let i=particles.length-1;i>=0;i--){
    const p=particles[i];p.age+=dt;if(p.age>=p.life){particles.splice(i,1);continue;}
    p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy-=dt*(night?3:5);
    const fade=Math.min(1,p.age/.055)*Math.pow(1-p.age/p.life,.8);
    ctx.save();ctx.translate(p.x,p.y);ctx.globalAlpha=fade;
    if(night){
     const shimmer=.78+.22*Math.sin(now*.011+p.phase),r=p.size*shimmer;
     ctx.shadowColor='#ffda83';ctx.shadowBlur=12;ctx.fillStyle=i%4?'#ffe5a2':'#e8ffd2';
     ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();
     if(i%5===0){ctx.strokeStyle='#fff6cf';ctx.lineWidth=.85;ctx.beginPath();ctx.moveTo(-r*2.7,0);ctx.lineTo(r*2.7,0);ctx.moveTo(0,-r*2.7);ctx.lineTo(0,r*2.7);ctx.stroke();}
    }else{
     // A moving wing silhouette, with a light outline so it survives dark bark too.
     ctx.rotate(p.turn+Math.sin(now*.002+p.phase)*.1);
     const flap=Math.sin(now*.018+p.phase),span=p.size,tip=-2.4-flap*span*.55;
     const wings=new Path2D();wings.moveTo(-span,tip);wings.quadraticCurveTo(-span*.4,-3,0,1);wings.quadraticCurveTo(span*.4,-3,span,tip);
     ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#fffde8';ctx.lineWidth=3.6;ctx.stroke(wings);ctx.strokeStyle='#164737';ctx.lineWidth=1.9;ctx.stroke(wings);
     ctx.fillStyle='#164737';ctx.beginPath();ctx.ellipse(0,1,1.45,2.3,0,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
   }
   node.dataset.particles=String(particles.length);
   if(particles.length)frame=requestAnimationFrame(tick);else previous=0;
  };
  const move=(e:PointerEvent)=>{
   if(!allowed.matches||e.pointerType==='touch'||document.hidden)return;
   const now=performance.now(),dx=e.clientX-lastX,dy=e.clientY-lastY,distance=hasPointer?Math.hypot(dx,dy):0;
   if(now-lastEmit<(night?12:35))return;
   if(hasPointer&&distance<(night?2:9))return;
   lastEmit=now;const count=night?Math.min(6,Math.max(2,Math.ceil(distance/7))):Math.min(3,Math.max(1,Math.ceil(distance/26)));
   for(let i=0;i<count&&particles.length<cap;i++){
    const f=hasPointer?(i+1)/count:1;
    particles.push({x:hasPointer?lastX+dx*f:e.clientX,y:hasPointer?lastY+dy*f:e.clientY,vx:(Math.random()-.5)*(night?29:38),vy:-12-Math.random()*(night?15:22),age:0,life:night?1.1+Math.random()*.9:1.15+Math.random()*.8,size:night?1.3+Math.random()*1.5:5.5+Math.random()*3,phase:Math.random()*Math.PI*2,turn:(Math.random()-.5)*.5});
   }
   lastX=e.clientX;lastY=e.clientY;hasPointer=true;if(!frame)frame=requestAnimationFrame(tick);
  };
  const clear=()=>{cancelAnimationFrame(frame);frame=0;previous=0;hasPointer=false;particles.length=0;node.dataset.particles='0';ctx.clearRect(0,0,innerWidth,innerHeight);};
  const changed=()=>{clear();resize();};
  resize();window.addEventListener('pointermove',move,{passive:true});window.addEventListener('resize',changed);window.addEventListener('blur',clear);document.addEventListener('visibilitychange',clear);allowed.addEventListener('change',changed);
  return()=>{clear();window.removeEventListener('pointermove',move);window.removeEventListener('resize',changed);window.removeEventListener('blur',clear);document.removeEventListener('visibilitychange',clear);allowed.removeEventListener('change',changed);};
 },[theme]);
 return <canvas ref={canvas} className="cursor-dust" aria-hidden="true"/>;
}
