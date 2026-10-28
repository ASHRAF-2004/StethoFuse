import {useEffect,useRef} from 'react';

type Spark={x:number;y:number;vx:number;vy:number;life:number;age:number;size:number;hue:number;phase:number};
type NavigatorWithConnection=Navigator & {connection?:{saveData?:boolean}};

/** A small, pointer-following shimmer. It stays off touch and reduced-motion devices. */
export default function ForestPointer(){
  const canvas=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{
    const node=canvas.current;
    if(!node)return;
    const motion=matchMedia('(pointer:fine) and (prefers-reduced-motion: no-preference)');
    const context=node.getContext('2d',{alpha:true});
    if(!context)return;
    const particles:Spark[]=[];
    let frame=0,lastEmit=0,active=false;
    const resize=()=>{
      const ratio=Math.min(window.devicePixelRatio||1,1.5);
      node.width=Math.round(innerWidth*ratio);node.height=Math.round(innerHeight*ratio);
      node.style.width=`${innerWidth}px`;node.style.height=`${innerHeight}px`;
      context.setTransform(ratio,0,0,ratio,0,0);
    };
    const stop=()=>{if(frame)cancelAnimationFrame(frame);frame=0;particles.length=0;context.clearRect(0,0,innerWidth,innerHeight);active=false;};
    const draw=(now:number)=>{
      frame=0;context.clearRect(0,0,innerWidth,innerHeight);
      for(let i=particles.length-1;i>=0;i--){
        const p=particles[i];p.age+=1;p.x+=p.vx;p.y+=p.vy;p.vx*=.986;p.vy-=.006;
        const t=p.age/p.life;if(t>=1){particles.splice(i,1);continue;}
        const pulse=.62+.38*Math.sin(now*.006+p.phase);
        context.globalAlpha=(1-t)*(1-t)*pulse;
        context.fillStyle=p.hue<0.5?'#dcffe8':'#bdeed6';
        context.shadowColor='#a8ffd3';context.shadowBlur=p.size*3;
        context.beginPath();context.arc(p.x,p.y,p.size*(.7+.3*pulse),0,Math.PI*2);context.fill();
      }
      context.globalAlpha=1;context.shadowBlur=0;
      if(particles.length){frame=requestAnimationFrame(draw);active=true;}else active=false;
    };
    const schedule=()=>{if(!frame)frame=requestAnimationFrame(draw);};
    const move=(event:PointerEvent)=>{
      if(!motion.matches||(navigator as NavigatorWithConnection).connection?.saveData||document.hidden||document.querySelector('.reduce-motion'))return;
      if(event.pointerType&&event.pointerType!=='mouse')return;
      const now=performance.now();if(now-lastEmit<42)return;const count=now-lastEmit>120?2:1;lastEmit=now;
      for(let i=0;i<count&&particles.length<34;i++)particles.push({x:event.clientX+(Math.random()-.5)*8,y:event.clientY+(Math.random()-.5)*8,vx:(Math.random()-.5)*.4,vy:-.25-Math.random()*.5,life:30+Math.random()*25,age:0,size:.8+Math.random()*1.6,hue:Math.random(),phase:Math.random()*6.28});
      schedule();
    };
    const visibility=()=>{if(document.hidden)stop();};
    if(motion.matches&&!(navigator as NavigatorWithConnection).connection?.saveData){resize();window.addEventListener('pointermove',move,{passive:true});window.addEventListener('resize',resize);document.addEventListener('visibilitychange',visibility);}
    const change=()=>{if(!motion.matches||(navigator as NavigatorWithConnection).connection?.saveData)stop();else resize();};
    motion.addEventListener('change',change);
    return()=>{stop();window.removeEventListener('pointermove',move);window.removeEventListener('resize',resize);document.removeEventListener('visibilitychange',visibility);motion.removeEventListener('change',change);};
  },[]);
  return <canvas ref={canvas} className="forest-pointer" aria-hidden="true"/>;
}
