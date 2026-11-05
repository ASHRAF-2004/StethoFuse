import {useState} from 'react';

const heart=(t:number)=>Math.sin(t*76)*Math.exp(-(((t%1-.18)/.075)**2))*.75+Math.sin(t*68)*Math.exp(-(((t%1-.38)/.05)**2))*.4;
const lung=(t:number)=>(.1+.18*Math.sin(t*2.7)**2)*(Math.sin(t*140)+.4*Math.sin(t*223));
const curve=(kind:string)=>Array.from({length:480},(_,i)=>{const t=i/80;const value=kind==='heart'?heart(t):kind==='lung'?lung(t):heart(t)+lung(t);return `${i?'L':'M'}${(i*600/479).toFixed(2)} ${(48-value*30).toFixed(2)}`;}).join(' ');
const paths={mixed:curve('mixed'),heart:curve('heart'),lung:curve('lung')};
type Channel=keyof typeof paths;

export default function SignalStudy(){
 const [channel,setChannel]=useState<Channel>('mixed');
 return <div className="signal-study" aria-label="Interactive illustration of sound separation">
  <div className="signal-study-heading"><span>A closer listen</span><small>Illustrative signals</small></div>
  <div className="signal-study-controls" role="group" aria-label="Choose a signal">{(['mixed','heart','lung'] as Channel[]).map(key=><button key={key} type="button" aria-pressed={channel===key} onClick={()=>setChannel(key)}>{key==='mixed'?'Original':key==='heart'?'Heart':'Lung'}</button>)}</div>
  <svg viewBox="0 0 600 96" role="img" aria-label={`${channel==='mixed'?'Mixed heart and lung':channel} illustrative waveform`}><path className="signal-baseline" d="M0 48H600"/>{Object.entries(paths).map(([key,path])=><path key={key} d={path} className={`signal-trace ${channel===key?'is-selected':''}`}/>)}</svg>
  <p aria-live="polite">{channel==='mixed'?'One recording can contain overlapping sounds.':channel==='heart'?'Short, rhythmic pulses represent the heart component.':'A broader, textured pattern represents the lung component.'} <span>Illustration only; no audio or model result is used.</span></p>
 </div>;
}
