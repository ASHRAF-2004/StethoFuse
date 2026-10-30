import React,{useEffect,useRef,useState,lazy,Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import {ArrowRight,Headphones,UploadSimple,Waveform,ShieldCheck,LockKey,Sun,Moon,List,X,Plus,ArrowUpRight} from '@phosphor-icons/react';
import {createOwlSurface,type Surface} from '../components/owlSurface';
import {OwlEyeMaterial} from '../frost/OwlEyeMaterial';
import './world.css';
import {ForestCursor as CursorDust} from './ForestCursor';
import {ForestDeer as Deer} from './ForestDeer';

const A='/assets/forest-world/';
// An isolated public review host links to the real app instead of imitating login.
const appHref=(path:string)=>location.hostname==='stethofuse.ashraf-alsaloul.com'||['localhost','127.0.0.1'].includes(location.hostname)?path:'https://stethofuse.ashraf-alsaloul.com'+path;
type Theme='day'|'night';

/** Prototype-only adapter. The approved renderer, textures and displacement meshes are unchanged. */
function ApprovedOwl(){
 const root=useRef<HTMLDivElement>(null),canvas=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{
  const el=root.current!,node=canvas.current!,abort=new AbortController(),work=document.createElement('canvas'),display=node.getContext('2d')!;
  const motion=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(pointer:fine)');
  let surface:Surface|null=null,loading=false,disposed=false,visible=true,frame=0,previous=0,yaw=0,pitch=0,ty=0,tp=0;
  const resize=()=>{const r=el.getBoundingClientRect(),width=Math.min(900,Math.round(r.width*Math.min(devicePixelRatio,1.5)));if(work.width!==width){work.width=node.width=width;work.height=node.height=Math.round(width*1353/1163);surface?.resize();}wake();};
  // Snapshot the unchanged WebGL surface immediately into a persistent display canvas.
  // This avoids CSS SVG-filter compositing losing a non-preserved GL back buffer at rest.
  const draw=(time:number)=>{frame=0;if(!surface||disposed||!visible||document.hidden||motion.matches)return;const dt=previous?Math.min(.05,(time-previous)/1000):1/60;previous=time;const gain=-Math.expm1(-dt*13);yaw+=(ty-yaw)*gain;pitch+=(tp-pitch)*gain;surface.draw(yaw,pitch);display.clearRect(0,0,node.width,node.height);display.drawImage(work,0,0);el.classList.add('is-ready');el.dataset.yaw=yaw.toFixed(3);el.dataset.pitch=pitch.toFixed(3);if(Math.abs(ty-yaw)+Math.abs(tp-pitch)>.001)wake();};
  function wake(){if(surface&&!frame&&visible&&!document.hidden&&!motion.matches)frame=requestAnimationFrame(draw);}
  const start=()=>{if(surface||loading||motion.matches||!fine.matches)return;loading=true;resize();void createOwlSurface(work,abort.signal).then(s=>{if(disposed){s.dispose();return;}surface=s;el.dataset.renderer='approved-connected-neck';resize();wake();}).catch(()=>{el.dataset.renderer='approved-poster-fallback';});};
  const move=(e:PointerEvent)=>{if(e.pointerType==='touch'||!visible||motion.matches)return;start();const b=el.getBoundingClientRect();let x=(e.clientX-b.left-b.width*.428)/Math.max(280,innerWidth*.55),y=(b.top+b.height*.192-e.clientY)/Math.max(180,innerHeight*.6);const l=Math.hypot(x,y);if(l>1){x/=l;y/=l;}ty=x*30;tp=y*18;wake();};
  const leave=()=>{ty=tp=0;wake();};
  const change=()=>{if(motion.matches){cancelAnimationFrame(frame);frame=0;el.classList.remove('is-ready');}else wake();};
  const io=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)wake();else{cancelAnimationFrame(frame);frame=0;previous=0;} });io.observe(el);
  const ro=new ResizeObserver(resize);ro.observe(el);
  window.addEventListener('pointermove',move,{passive:true});document.addEventListener('pointerleave',leave);motion.addEventListener('change',change);document.addEventListener('visibilitychange',change);
  return()=>{disposed=true;abort.abort();cancelAnimationFrame(frame);surface?.dispose();io.disconnect();ro.disconnect();window.removeEventListener('pointermove',move);document.removeEventListener('pointerleave',leave);motion.removeEventListener('change',change);document.removeEventListener('visibilitychange',change);};
 },[]);
 return <div ref={root} className="forest-owl" data-flight="unapproved-disabled" data-pointer-scope="page" aria-hidden="true"><OwlEyeMaterial/><img src="/assets/owl-poster-1163.webp" width="1163" height="1353" alt="" fetchPriority="high"/><canvas ref={canvas}/><i className="claw-anchor" data-anchor="owl-claws"/></div>;
}


function Brand(){return <a className="world-brand" href="/forest-prototype.html" aria-label="StethoFuse home"><img className="brand-symbol" src={A+'owl-mark.svg'} width="419" height="360" alt=""/><span>StethoFuse</span></a>;}

function ActionLabel({children}:{children:React.ReactNode}){return <span className="action-label"><span>{children}</span><span aria-hidden="true">{children}</span></span>;}

/** One registered coordinate system. The foreground is the SAME branch, not a new drawing. */
function Tree(){return <>
 <div className="trunk-spine" data-anchor="tree-axis" aria-hidden="true"/>
 <div className="tree-crown" aria-hidden="true">
  <img className="crown-art tree-light" src={A+'tree-crown.webp'} width="1254" height="1254" alt="" fetchPriority="high"/>
  <span className="perch-marker" data-anchor="branch"/>
  <div className="owl-stage"><ApprovedOwl/></div>
  <svg className="branch-foreground tree-light" viewBox="0 0 1254 1254">
   <defs><clipPath id="moss-in-front"><path d="M420 727 Q550 704 630 728 Q730 748 840 773 L970 801 L970 940 L420 855Z"/></clipPath></defs>
   <image href={A+'tree-crown.webp'} width="1254" height="1254" clipPath="url(#moss-in-front)"/>
  </svg>
 </div>
</>;}

/** SVG crops are texture windows. All artwork keeps its native proportions. */
function Earth(){return <div className="earth-scene" aria-hidden="true">
 <svg className="soil-texture" width="100%" height="100%">
  <defs>
   <pattern id="soil-grain" patternUnits="userSpaceOnUse" width="420" height="218.4"><svg width="420" height="218.4" viewBox="0 360 700 364" overflow="hidden"><image href={A+'earth-roots.webp'} width="2172" height="724"/></svg></pattern>
   <pattern id="surface-plants" patternUnits="userSpaceOnUse" width="420" height="120"><svg width="420" height="120" viewBox="0 120 700 200" overflow="hidden"><image href={A+'earth-roots.webp'} width="2172" height="724"/></svg></pattern>
  </defs>
  <rect y="70" width="100%" height="100%" fill="url(#soil-grain)"/>
  <rect width="100%" height="120" fill="url(#surface-plants)"/>
 </svg>
 <img className="earth-art" src={A+'earth-roots.webp'} width="2172" height="724" alt="" loading="lazy"/>
</div>;}

function useSceneInteractions(root:React.RefObject<HTMLDivElement|null>){
 useEffect(()=>{
  const world=root.current!;const reserve=world.querySelector<HTMLElement>('.perch-reserve')!;
  const position=()=>{const size=parseFloat(getComputedStyle(world).getPropertyValue('--resolved-crown'))||world.querySelector('.tree-crown')!.getBoundingClientRect().width;world.style.setProperty('--crown-top',innerWidth<=900?`${reserve.getBoundingClientRect().top-world.getBoundingClientRect().top-size*.15}px`:'0px');};
  const resize=new ResizeObserver(position);resize.observe(reserve);resize.observe(world);position();
  const reduced=matchMedia('(prefers-reduced-motion:reduce)'),fine=matchMedia('(pointer:fine)');
  const observed=world.querySelectorAll<HTMLElement>('.world-step,.purpose-glass,.world-faq>header');
  // Content is visible by default. A class is added only to elements below the viewport.
  observed.forEach(el=>{if(el.getBoundingClientRect().top>innerHeight)el.classList.add('will-reveal');});
  const reveal=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-revealed');reveal.unobserve(e.target);}}),{threshold:.08});observed.forEach(el=>reveal.observe(el));
  const sections=world.querySelectorAll<HTMLElement>('main>section[id]');
  const active=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){world.querySelectorAll('.world-nav nav a').forEach(a=>a.setAttribute('aria-current',a.getAttribute('href')===`#${e.target.id}`?'location':'false'));}},{rootMargin:'-15% 0px -55% 0px'});sections.forEach(el=>active.observe(el));
  const pointer=(event:PointerEvent)=>{if(!fine.matches||reduced.matches||event.pointerType==='touch')return;const el=(event.target as Element).closest<HTMLElement>('.world-step');if(!el)return;const b=el.getBoundingClientRect(),x=(event.clientX-b.left)/b.width-.5,y=(event.clientY-b.top)/b.height-.5;el.style.setProperty('--tilt-x',`${-y*2}deg`);el.style.setProperty('--tilt-y',`${x*2}deg`);el.style.setProperty('--light-x',`${(x+.5)*100}%`);el.style.setProperty('--light-y',`${(y+.5)*100}%`);};
  const reset=(event:PointerEvent)=>{const el=(event.target as Element).closest<HTMLElement>('.world-step');if(el&&!el.contains(event.relatedTarget as Node)){el.style.setProperty('--tilt-x','0deg');el.style.setProperty('--tilt-y','0deg');}};
  world.addEventListener('pointermove',pointer,{passive:true});world.addEventListener('pointerout',reset,{passive:true});window.addEventListener('resize',position);
  document.fonts.ready.then(position);
  return()=>{resize.disconnect();reveal.disconnect();active.disconnect();world.removeEventListener('pointermove',pointer);world.removeEventListener('pointerout',reset);window.removeEventListener('resize',position);};
 },[root]);
}
const steps=[{icon:UploadSimple,title:'Bring the recording',text:'Upload a PCM WAV recording, up to 25 MiB. Use a pseudonymous title without patient identifiers. Live microphone capture is coming soon.'},{icon:Waveform,title:'Separate the components',text:'Request sound separation and keep working while the job runs. Each result stays linked to its source and processing version.'},{icon:Headphones,title:'Listen with context',text:'Compare original, heart and lung signals. Inspect waveforms and share a recording with an explicitly assigned analyst.'}];
const questions=[['Can I use this for diagnosis?','No. StethoFuse is a research and educational prototype for sound separation, recording organization and audio review. Outputs are not diagnostic findings or treatment advice.'],['How do I access my workspace?','Sign in with your email and password or Google account. Verify your email before opening the private workspace. Your handle is used for sharing, not for signing in.'],['Will my file or password be sent anywhere?','Firebase handles authentication. Uploaded recordings and separation results are stored privately by StethoFuse. Audio access follows ownership and explicit permissions; administrators do not automatically receive access.'],['How do I get help with a recording?','Signed-in users can open Help for upload, device and review guidance. For access restrictions, contact the project owner through your existing contact channel. A public support inbox has not been configured.']];

function World(){
 const root=useRef<HTMLDivElement>(null);
 const [theme,setTheme]=useState<Theme>(()=>new URLSearchParams(location.search).get('theme')==='day'?'day':'night'),[menu,setMenu]=useState(false),[changing,setChanging]=useState(false);
 useSceneInteractions(root);
 const switchTheme=async()=>{if(changing)return;setChanging(true);const next=theme==='night'?'day':'night',image=new Image();image.src=A+`valley-${next}.webp`;try{await image.decode();setTheme(next);}catch{/* Retain the complete current scene if the alternate artwork cannot load. */}finally{setChanging(false);}};
 useEffect(()=>{if(menu)root.current?.querySelector<HTMLAnchorElement>('.world-nav nav a')?.focus();},[menu]);
 useEffect(()=>{document.documentElement.dataset.forestTheme=theme;const u=new URL(location.href);u.searchParams.set('theme',theme);history.replaceState(null,'',u);},[theme]);
 return <div ref={root} className="forest-world" data-theme={theme}>
  <a className="world-skip" href="#main">Skip to content</a>
  <div className="valley-layer" aria-hidden="true"><picture><img src={A+`valley-${theme}.webp`} alt="" width="1024" height="1536" fetchPriority="high"/></picture></div>
  <div className="reading-atmosphere" aria-hidden="true"/>
  <Tree/>
  <div className="forest-lights" aria-hidden="true">{Array.from({length:12},(_,i)=><i key={i} style={{left:`${12+(i*29)%78}%`,top:`${9+(i*17)%78}%`,'--delay':`${i*-.9}s`,'--duration':`${5+i%4}s`} as React.CSSProperties}/>)}</div>
  <header className="world-nav"><Brand/><nav id="forest-main-nav" onKeyDown={e=>{if(e.key==='Escape'){setMenu(false);root.current?.querySelector<HTMLButtonElement>('.menu-toggle')?.focus();}}} aria-label="Main navigation" className={menu?'is-open':''}><a href="#how" onClick={()=>setMenu(false)}>How it works</a><a href="#purpose" onClick={()=>setMenu(false)}>Our purpose</a><a href="#support" onClick={()=>setMenu(false)}>FAQ</a></nav><div className="nav-actions"><button className="theme-control" aria-label={`Switch to ${theme==='night'?'day':'night'} theme`} aria-busy={changing} disabled={changing} onClick={()=>void switchTheme()}>{theme==='night'?<Sun size={19}/>:<Moon size={19}/>}<ActionLabel>{theme==='night'?'Daylight':'Moonlight'}</ActionLabel></button><a className="glass-button nav-signin" href={appHref('/login')}><ActionLabel>Sign in</ActionLabel></a><button className="round-control menu-toggle" aria-label={menu?'Close menu':'Open menu'} aria-expanded={menu} aria-controls="forest-main-nav" onClick={()=>setMenu(v=>!v)}>{menu?<X size={23}/>:<List size={23}/>}</button></div></header>
  <main id="main">
   <section className="world-hero content-width" aria-labelledby="hero-title"><div className="hero-words"><p className="world-eyebrow">Cardiopulmonary sound separation</p><h1 id="hero-title">Hear the<br/><em>signals within.</em></h1><p className="hero-description">Separate mixed chest recordings into heart and lung components,<br className="desktop-break"/> with space to listen, compare and review.</p><div className="hero-actions"><a className="glass-button primary" href={appHref('/register')}><ActionLabel>Get started</ActionLabel><ArrowRight size={19}/></a><a className="glass-button" href={appHref('/login')}><ActionLabel>Sign in</ActionLabel></a></div><ul className="trust-notes"><li><ShieldCheck size={21}/>Research-focused</li><li><Waveform size={21}/>Sound analysis</li><li><LockKey size={21}/>Private by design</li></ul></div><div className="perch-reserve" aria-hidden="true"/><a className="forest-scroll" href="#how"><span>Explore the workflow</span><ArrowRight size={18}/></a></section>
   <section className="world-workflow content-width" id="how" aria-labelledby="how-title"><header><p className="world-eyebrow">One recording.</p><h2 id="how-title">Room for every signal.</h2><p>A considered workflow, from first capture to a shared review.<br className="desktop-break"/> Keep your original recording and each processing run together.</p></header><div className="world-steps">{steps.map(({icon:Icon,title,text},i)=><article className="world-step glass" key={title}><div className="step-top"><span className="icon-medallion"><Icon size={30}/></span><span className="step-number">0{i+1}</span></div><h3>{title}</h3><p>{text}</p>{i<2&&<ArrowRight className="step-arrow" size={24} aria-hidden="true"/>}</article>)}</div></section>
   <section className="world-purpose content-width" id="purpose" aria-labelledby="purpose-title"><div className="purpose-layout"><div><p className="world-eyebrow">A focused tool.</p><h2 id="purpose-title">A thoughtful<br/>boundary.</h2><p>StethoFuse is a university research application for recording management and cardiopulmonary sound separation. It does not diagnose conditions, recommend treatment or replace professional judgment.</p><a className="text-link" href={appHref('/privacy')}>How access is intended to work <ArrowUpRight size={17}/></a></div><div className="purpose-glass glass"><div><span className="icon-medallion"><ShieldCheck size={27}/></span><section><h3>Your workspace, your recordings</h3><p>Each account has its own history. Sharing is explicit and can be revoked.</p></section></div><div><span className="icon-medallion"><LockKey size={27}/></span><section><h3>Access follows permission</h3><p>Analysts review assigned files. Administration does not automatically grant access to private audio.</p></section></div></div></div><img className="purpose-bank" src={A+'clearing-bank.webp'} width="2172" height="724" alt="" loading="lazy" aria-hidden="true"/><Deer/></section>
   <section className="world-faq content-width" id="support" aria-labelledby="faq-title"><header><p className="world-eyebrow">Before you begin.</p><h2 id="faq-title">Common questions.</h2><p>A few practical details about this research workspace.</p></header><div className="faq-list">{questions.map(([q,a])=><details className="glass" key={q}><summary>{q}<Plus size={19} aria-hidden="true"/></summary><p>{a}</p></details>)}</div></section>
  </main>
  <footer className="earth-footer"><Earth/><div className="footer-content content-width"><div><Brand/><p>For research and education.<br/>Not a diagnostic system.</p></div><nav aria-label="Footer"><a href={appHref('/privacy')}>Privacy</a><a href={appHref('/terms')}>Terms</a><a href={appHref('/login?returnTo=%2Fapp%2Fhelp')}>Help</a><a href="#main" className="back-to-canopy" aria-label="Back to the canopy"><ArrowRight size={19}/></a></nav></div><span className="root-marker" data-anchor="root-crown" aria-hidden="true"/></footer>
  <CursorDust theme={theme}/>
 </div>;
}
const MotionStudy=lazy(()=>import('./motion-study'));
const study=import.meta.env.DEV&&new URLSearchParams(location.search).get('study')==='owl';
createRoot(document.getElementById('root')!).render(study?<Suspense fallback={<p>Loading motion study…</p>}><MotionStudy/></Suspense>:<World/>);
