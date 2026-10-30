import {useEffect,useRef,useState} from 'react';
import {createPackedDeerVideo} from './packedDeerVideo';

const A='/assets/forest-world/';

/** Owner-preview idle. The approved original remains the loading/error fallback. */
export function GeneratedForestDeer(){
  const figure=useRef<HTMLElement>(null),canvas=useRef<HTMLCanvasElement>(null),movie=useRef<HTMLVideoElement>(null);
  const greet=useRef<()=>void>(()=>{});
  const [resting,setResting]=useState(false);
  useEffect(()=>{
    const root=figure.current,cel=canvas.current,video=movie.current;
    if(!root||!cel||!video)return;
    const preference=matchMedia('(prefers-reduced-motion: reduce)');
    let visible=false,disposed=false,loaded=false,failed=false,frame=0,fallbackFrame=0,restTimer=0;
    let surface:ReturnType<typeof createPackedDeerVideo>|undefined;
    let lastTime=-1,draws=0;
    const clearFrames=()=>{
      if(frame&&video.cancelVideoFrameCallback)video.cancelVideoFrameCallback(frame);
      cancelAnimationFrame(fallbackFrame);frame=0;fallbackFrame=0;
    };
    const stop=()=>{video.pause();clearFrames();clearTimeout(restTimer);restTimer=0;};
    const fallback=()=>{
      failed=true;stop();setResting(true);root.classList.remove('art-ready');
      root.dataset.renderer='approved-original-still';root.dataset.playState='fallback-still';
    };
    const draw=()=>{
      if(disposed||preference.matches)return;
      try{if(surface?.draw()){
        root.classList.add('art-ready');root.dataset.renderer='generated-idle-packed-video';
        root.dataset.frame=String(Math.min(96,Math.floor(video.currentTime*24)));
        root.dataset.draws=String(++draws);
      }}catch{fallback();}
    };
    const render=()=>{
      if(disposed||!visible||preference.matches||video.paused||failed)return;
      if(video.requestVideoFrameCallback){
        frame=video.requestVideoFrameCallback(()=>{frame=0;draw();render();});
      }else{
        fallbackFrame=requestAnimationFrame(()=>{fallbackFrame=0;if(video.currentTime!==lastTime){lastTime=video.currentTime;draw();}render();});
      }
    };
    const start=()=>{
      if(disposed||failed||preference.matches||!visible||document.hidden)return;
      clearTimeout(restTimer);restTimer=0;
      if(!loaded){
        if(!video.hasAttribute('src')){video.src=A+'deer-idle/idle-packed.mp4';video.load();}
        return;
      }
      if(video.ended)video.currentTime=0;
      void video.play().then(()=>{
        if(disposed||!visible||preference.matches||document.hidden){stop();return;}
        root.dataset.playState='looking-around';clearFrames();render();
      }).catch(error=>{
        if(error instanceof DOMException&&error.name==='AbortError')return;
        root.dataset.playState='awaiting-greeting';
      });
    };
    const ready=()=>{
      if(disposed||failed)return;
      try{surface=createPackedDeerVideo(cel,video);loaded=true;draw();start();}catch{fallback();}
    };
    const ended=()=>{
      clearFrames();draw();root.dataset.playState='resting';
      if(visible&&!preference.matches&&!document.hidden)restTimer=window.setTimeout(start,12000);
    };
    const changed=()=>{
      stop();setResting(preference.matches||failed);
      if(preference.matches){root.classList.remove('art-ready');root.dataset.renderer='approved-original-still';root.dataset.playState='reduced-motion-still';}
      else start();
    };
    const visibility=()=>{if(document.hidden)stop();else start();};
    const lost=(event:Event)=>{event.preventDefault();fallback();};
    const observer=new IntersectionObserver(entries=>{
      visible=entries[0].isIntersecting;if(visible)start();else stop();
    },{rootMargin:'80px',threshold:0.05});
    video.muted=true;video.playsInline=true;
    video.addEventListener('loadeddata',ready,{once:true});video.addEventListener('ended',ended);video.addEventListener('error',fallback);video.addEventListener('seeked',draw);video.addEventListener('pause',clearFrames);
    cel.addEventListener('webglcontextlost',lost);preference.addEventListener('change',changed);document.addEventListener('visibilitychange',visibility);
    greet.current=start;setResting(preference.matches);observer.observe(root);
    return()=>{
      disposed=true;stop();greet.current=()=>{};observer.disconnect();
      preference.removeEventListener('change',changed);document.removeEventListener('visibilitychange',visibility);
      video.removeEventListener('loadeddata',ready);video.removeEventListener('ended',ended);video.removeEventListener('error',fallback);video.removeEventListener('seeked',draw);video.removeEventListener('pause',clearFrames);
      cel.removeEventListener('webglcontextlost',lost);surface?.dispose();video.removeAttribute('src');video.load();
    };
  },[]);
  return <figure ref={figure} className="deer-clearing" data-renderer="approved-original-still" data-play-state="preview-idle-loading" data-authored-fps="24">
    <img src={A+'deer-clearing.webp'} alt="" width="1024" height="1536" loading="lazy" aria-hidden="true"/>
    <canvas ref={canvas} width="560" height="840" aria-hidden="true"/>
    <video ref={movie} muted playsInline preload="none" aria-hidden="true" tabIndex={-1}/>
    <button className="deer-greeting" aria-label="Greet the forest deer" title={resting?'The deer is resting':'Greet the deer'} disabled={resting} onClick={()=>greet.current()}/>
    <i className="hoof-anchor" data-anchor="deer-ground" aria-hidden="true"/>
  </figure>;
}
