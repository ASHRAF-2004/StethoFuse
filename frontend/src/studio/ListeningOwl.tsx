import {useEffect,useRef} from 'react';
import {createOwlSurface,type Surface} from '../components/owlSurface';
import {OwlEyeMaterial} from '../frost/OwlEyeMaterial';
import {useLocale} from './locale';
import criticalAssets from './criticalAssets.json';

/** The existing approved 18-view surface, textures and displacement meshes. No flight. */
export default function ListeningOwl({reducedMotion=false}:{reducedMotion?:boolean}){
 const {locale}=useLocale();
 const root=useRef<HTMLDivElement>(null),canvas=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{
  const el=root.current!,node=canvas.current!,abort=new AbortController(),work=document.createElement('canvas'),display=node.getContext('2d')!;
  const motion=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(pointer:fine)');
  let surface:Surface|null=null,loading=false,disposed=false,visible=true,frame=0,previous=0,yaw=0,pitch=0,ty=0,tp=0,draws=0;
  const resize=()=>{const r=el.getBoundingClientRect(),width=Math.min(1163,Math.round(r.width*Math.min(devicePixelRatio,2)));if(work.width!==width){work.width=node.width=width;work.height=node.height=Math.round(width*1353/1163);surface?.resize();}wake();};
  const draw=(time:number)=>{frame=0;if(!surface||disposed||!visible||document.hidden||motion.matches||reducedMotion)return;const dt=previous?Math.min(.05,(time-previous)/1000):1/60;previous=time;const gain=-Math.expm1(-dt*13);yaw+=(ty-yaw)*gain;pitch+=(tp-pitch)*gain;try{surface.draw(yaw,pitch);display.clearRect(0,0,node.width,node.height);display.drawImage(work,0,0);if(draws===0){const pixels=display.getImageData(0,0,node.width,node.height).data;let painted=false;for(let i=3;i<pixels.length;i+=1024)if(pixels[i]>20){painted=true;break;}if(!painted)throw Error('The owl did not produce a visible first frame.');}el.classList.add('is-ready');el.dataset.yaw=yaw.toFixed(4);el.dataset.pitch=pitch.toFixed(4);el.dataset.drawCount=String(++draws);if(draws===1)window.__sfOwlFrameReady?.(true);if(Math.abs(ty-yaw)+Math.abs(tp-pitch)>.001)wake();}catch(error){surface?.dispose();surface=null;el.classList.remove('is-ready');el.dataset.renderer='approved-poster-fallback';window.__sfOwlFailed?.(error);}};
  function wake(){if(surface&&!frame&&visible&&!document.hidden&&!motion.matches&&!reducedMotion)frame=requestAnimationFrame(draw);}
  const start=()=>{if(surface||loading||motion.matches||reducedMotion||!fine.matches||window.__sfOwlBoot?.skipped||(navigator as Navigator&{connection?:{saveData?:boolean}}).connection?.saveData)return;loading=true;resize();void createOwlSurface(work,abort.signal).then(s=>{if(disposed||window.__sfOwlBoot?.skipped){s.dispose();return;}surface=s;el.dataset.renderer='approved-connected-neck';el.dataset.sourceViews=String(s.info.sourceViews);resize();wake();}).catch(error=>{if(!disposed){el.dataset.renderer='approved-poster-fallback';if(!abort.signal.aborted)window.__sfOwlFailed?.(error);}});};
  const move=(e:PointerEvent)=>{if(e.pointerType==='touch'||!visible||motion.matches||reducedMotion)return;start();const b=el.getBoundingClientRect(),mirrored=document.documentElement.dir==='rtl';let x=(e.clientX-b.left-b.width*(mirrored?.572:.428))/Math.max(280,innerWidth*.55),y=(b.top+b.height*.192-e.clientY)/Math.max(180,innerHeight*.6);if(mirrored)x=-x;const l=Math.hypot(x,y);if(l>1){x/=l;y/=l;}ty=x*30;tp=y*18;wake();};
  const leave=()=>{ty=tp=0;wake();};
  const skip=()=>{abort.abort();cancelAnimationFrame(frame);frame=0;surface?.dispose();surface=null;el.classList.remove('is-ready');el.dataset.renderer='approved-poster-fallback';};
  const change=()=>{if(motion.matches||document.hidden){cancelAnimationFrame(frame);frame=0;if(motion.matches)el.classList.remove('is-ready');}else{start();wake();}};
  const io=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){start();wake();}else{cancelAnimationFrame(frame);frame=0;previous=0;} });io.observe(el);
  const ro=new ResizeObserver(resize);ro.observe(el);
  window.addEventListener('pointermove',move,{passive:true});document.addEventListener('pointerleave',leave);motion.addEventListener('change',change);document.addEventListener('visibilitychange',change);
  document.addEventListener('sf-owl-skip',skip);
  return()=>{disposed=true;abort.abort();cancelAnimationFrame(frame);surface?.dispose();io.disconnect();ro.disconnect();window.removeEventListener('pointermove',move);document.removeEventListener('pointerleave',leave);motion.removeEventListener('change',change);document.removeEventListener('visibilitychange',change);document.removeEventListener('sf-owl-skip',skip);};
 },[reducedMotion]);
 return <div ref={root} className="listening-owl" data-mirrored={locale==='ar'} data-flight="disabled" data-pointer-scope="page" aria-hidden="true"><OwlEyeMaterial/><img src={criticalAssets.owl.src} srcSet={criticalAssets.owl.srcSet} sizes={criticalAssets.owl.sizes} width="1163" height="1353" alt="" fetchPriority="high"/><canvas ref={canvas}/><i className="studio-claw-anchor" data-anchor="owl-claws"/></div>;
}
