import {useEffect,useRef} from 'react';
import {createOwlSurface,type Surface} from '../components/owlSurface';
import {OwlEyeMaterial} from '../frost/OwlEyeMaterial';
import {useLocale} from './locale';
import criticalAssets from './criticalAssets.json';

/** Original native views and renderer, prepared in two verified stages. */
export default function ListeningOwl({reducedMotion=false}:{reducedMotion?:boolean}){
 const {locale}=useLocale(),root=useRef<HTMLDivElement>(null),canvas=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{
  const el=root.current!,node=canvas.current!,abort=new AbortController(),display=node.getContext('2d')!;
  let work=document.createElement('canvas');
  const motion=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(pointer:fine)');
  let surface:Surface|null=null,loading=false,upgrading=false,disposed=false,visible=true,frame=0,previous=0,yaw=0,pitch=0,inputYaw=0,inputPitch=0,draws=0,reach=criticalAssets.owl.runtime.initialReach,targetReach=reach;
  function painted(source:HTMLCanvasElement){const check=document.createElement('canvas');check.width=source.width;check.height=source.height;const c=check.getContext('2d')!;c.drawImage(source,0,0);const pixels=c.getImageData(0,0,check.width,check.height).data;let yes=false;for(let i=3;i<pixels.length;i+=1024)if(pixels[i]>20){yes=true;break;}check.width=check.height=1;if(!yes)throw Error('The owl did not produce a visible frame.');}
  const resize=()=>{const r=el.getBoundingClientRect(),width=Math.min(1163,Math.round(r.width*Math.min(devicePixelRatio,2)));if(work.width!==width){work.width=node.width=width;work.height=node.height=Math.round(width*1353/1163);surface?.resize();}wake();};
  const upgrade=async()=>{
   if(upgrading||disposed||abort.signal.aborted)return;upgrading=true;el.dataset.preparation='extending';
   const nextWork=document.createElement('canvas');nextWork.width=work.width;nextWork.height=work.height;let next:Surface|null=null;
   try{next=await createOwlSurface(nextWork,abort.signal,'complete');if(disposed||abort.signal.aborted||window.__sfOwlBoot?.skipped){next.dispose();return;}
    nextWork.width=work.width;nextWork.height=work.height;next.resize();next.draw(yaw,pitch);painted(nextWork);
    const old=surface,oldWork=work;surface=next;work=nextWork;old?.dispose();oldWork.width=oldWork.height=1;targetReach=1;
    el.dataset.sourceViews=String(next.info.sourceViews);el.dataset.preparation='complete';el.dataset.fullReadyAt=String(performance.now());document.dispatchEvent(new Event('sf-owl-full-ready'));wake();
   }catch(error){next?.dispose();nextWork.width=nextWork.height=1;if(!disposed&&!abort.signal.aborted){el.dataset.preparation='initial-ready';el.dataset.upgradeError=String(error);}}
  };
  const draw=(time:number)=>{frame=0;if(!surface||disposed||!visible||document.hidden||motion.matches||reducedMotion)return;
   const dt=previous?Math.min(.05,(time-previous)/1000):1/60;previous=time;const gain=-Math.expm1(-dt*13);reach+=(targetReach-reach)*gain;
   const ty=inputYaw*reach,tp=inputPitch*reach;yaw+=(ty-yaw)*gain;pitch+=(tp-pitch)*gain;
   try{surface.draw(yaw,pitch);if(draws===0)painted(work);display.clearRect(0,0,node.width,node.height);display.drawImage(work,0,0);el.classList.add('is-ready');el.dataset.yaw=yaw.toFixed(4);el.dataset.pitch=pitch.toFixed(4);el.dataset.drawCount=String(++draws);
    if(draws===1){window.__sfOwlFrameReady?.(true);void upgrade();}
    if(Math.abs(ty-yaw)+Math.abs(tp-pitch)+Math.abs(targetReach-reach)>.001)wake();
   }catch(error){surface?.dispose();surface=null;el.classList.remove('is-ready');el.dataset.renderer='approved-poster-fallback';window.__sfOwlFailed?.(error);}
  };
  function wake(){if(surface&&!frame&&visible&&!document.hidden&&!motion.matches&&!reducedMotion)frame=requestAnimationFrame(draw);}
  const start=()=>{if(surface||loading||motion.matches||reducedMotion||!fine.matches||window.__sfOwlBoot?.skipped||(navigator as Navigator&{connection?:{saveData?:boolean}}).connection?.saveData)return;loading=true;resize();
   void createOwlSurface(work,abort.signal,'initial').then(s=>{if(disposed||window.__sfOwlBoot?.skipped){s.dispose();return;}surface=s;el.dataset.renderer='approved-connected-neck';el.dataset.sourceViews=String(s.info.sourceViews);el.dataset.preparation='initial-ready';resize();wake();}).catch(error=>{if(!disposed){el.dataset.renderer='approved-poster-fallback';if(!abort.signal.aborted)window.__sfOwlFailed?.(error);}});
  };
  const move=(e:PointerEvent)=>{if(e.pointerType==='touch'||!visible||motion.matches||reducedMotion)return;start();const b=el.getBoundingClientRect(),mirrored=document.documentElement.dir==='rtl';let x=(e.clientX-b.left-b.width*(mirrored?.572:.428))/Math.max(280,innerWidth*.55),y=(b.top+b.height*.192-e.clientY)/Math.max(180,innerHeight*.6);if(mirrored)x=-x;const l=Math.hypot(x,y);if(l>1){x/=l;y/=l;}inputYaw=x*30;inputPitch=y*18;wake();};
  const leave=()=>{inputYaw=inputPitch=0;wake();};
  const skip=()=>{abort.abort();cancelAnimationFrame(frame);frame=0;surface?.dispose();surface=null;el.classList.remove('is-ready');el.dataset.renderer='approved-poster-fallback';};
  const change=()=>{if(motion.matches||document.hidden){cancelAnimationFrame(frame);frame=0;if(motion.matches)el.classList.remove('is-ready');}else{start();wake();}};
  const io=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){start();wake();}else{cancelAnimationFrame(frame);frame=0;previous=0;}});io.observe(el);
  const ro=new ResizeObserver(resize);ro.observe(el);window.addEventListener('pointermove',move,{passive:true});document.addEventListener('pointerleave',leave);motion.addEventListener('change',change);document.addEventListener('visibilitychange',change);document.addEventListener('sf-owl-skip',skip);
  return()=>{disposed=true;abort.abort();cancelAnimationFrame(frame);surface?.dispose();work.width=work.height=1;io.disconnect();ro.disconnect();window.removeEventListener('pointermove',move);document.removeEventListener('pointerleave',leave);motion.removeEventListener('change',change);document.removeEventListener('visibilitychange',change);document.removeEventListener('sf-owl-skip',skip);};
 },[reducedMotion]);
 return <div ref={root} className="listening-owl" data-mirrored={locale==='ar'} data-flight="disabled" data-pointer-scope="page" aria-hidden="true"><OwlEyeMaterial/><img src={criticalAssets.owl.src} srcSet={criticalAssets.owl.srcSet} sizes={criticalAssets.owl.sizes} width="1163" height="1353" alt="" fetchPriority="high"/><canvas ref={canvas}/><i className="studio-claw-anchor" data-anchor="owl-claws"/></div>;
}
