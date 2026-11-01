import {useEffect,useRef,useState} from 'react';
import {Play,Pause,Heart,Wind,Waveform,SpeakerHigh} from '@phosphor-icons/react';
import {tx,useLocale} from './locale';
type Channel='original'|'heart'|'lung';
const RATE=16000,DURATION=8;
function sample(t:number,channel:Channel){
 const phase=t%(.82),beat=Math.exp(-(((phase-.1)/.04)**2))*Math.sin(t*2*Math.PI*72)+.64*Math.exp(-(((phase-.28)/.05)**2))*Math.sin(t*2*Math.PI*100);
 const breath=(.5+.5*Math.sin(t*Math.PI*.6))**2*(Math.sin(t*2*Math.PI*397)+.55*Math.sin(t*2*Math.PI*571)+.3*Math.sin(t*2*Math.PI*911))*.16;
 return channel==='heart'?beat*.42:channel==='lung'?breath:(beat*.42+breath)*.85;
}
function trace(channel:Channel){return Array.from({length:700},(_,i)=>{const t=i/699*DURATION;const peak=Math.max(...Array.from({length:6},(_,j)=>Math.abs(sample(t+j/900,channel))));return `${i?'L':'M'}${(i/699*1000).toFixed(1)} ${(40-peak*64*(i%2?1:-1)).toFixed(1)}`;}).join(' ');}
const paths=Object.fromEntries(['original','heart','lung'].map(k=>[k,trace(k as Channel)]));
const channels=[{id:'original' as Channel,name:'Original',icon:Waveform},{id:'heart' as Channel,name:'Heart',icon:Heart},{id:'lung' as Channel,name:'Lung',icon:Wind}];
export default function SoundDesk(){
 useLocale();const [channel,setChannel]=useState<Channel>('original'),[playing,setPlaying]=useState(false),[position,setPosition]=useState(0),[error,setError]=useState('');
 const audio=useRef<AudioContext|null>(null),source=useRef<AudioBufferSourceNode|null>(null),clock=useRef({start:0,offset:0}),raf=useRef(0),generation=useRef(0);
 function stop(){generation.current++;if(source.current){source.current.onended=null;try{source.current.stop();source.current.disconnect();}catch{}source.current=null;}cancelAnimationFrame(raf.current);setPlaying(false);}
 async function begin(next=channel,offset=position){
  stop();const ticket=generation.current;try{const ctx=audio.current||(audio.current=new AudioContext());await ctx.resume();if(ticket!==generation.current)return;const buffer=ctx.createBuffer(1,RATE*DURATION,RATE),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=sample(i/RATE,next)*Math.min(1,i/160,(data.length-i)/320);
   const node=ctx.createBufferSource(),gain=ctx.createGain();gain.gain.value=.2;node.buffer=buffer;node.connect(gain).connect(ctx.destination);source.current=node;const start=offset>=DURATION-.01?0:offset;clock.current={start:ctx.currentTime,offset:start};node.start(0,start);setPlaying(true);setError('');
   node.onended=()=>{source.current=null;setPlaying(false);setPosition(0);cancelAnimationFrame(raf.current);};
   const tick=()=>{if(source.current){setPosition(Math.min(DURATION,clock.current.offset+ctx.currentTime-clock.current.start));raf.current=requestAnimationFrame(tick);}};raf.current=requestAnimationFrame(tick);
  }catch{setError('Audio could not start. Check your browser sound settings.');}
 }
 useEffect(()=>()=>{generation.current++;source.current?.stop();cancelAnimationFrame(raf.current);void audio.current?.close();},[]);
 function select(next:Channel){setChannel(next);if(playing)void begin(next,position);}
 return <section className="sound-desk" data-ui="sound-demo" aria-label={tx('Listening sample')}>
  <div className="desk-heading"><div><span className="desk-live-dot"/><strong>{tx('Listening sample')}</strong><span className="desk-caption">{tx('Compare the same moment')}</span></div><span className="desk-duration" dir="ltr">00:08</span></div>
  <div className="desk-tracks" role="group" aria-label={tx('Sound separation')}>{channels.map(({id,name,icon:Icon})=><button className={`desk-track ${channel===id?'selected':''}`} type="button" key={id} onClick={()=>select(id)} aria-pressed={channel===id}><span className={`track-label ${id}`}><Icon size={22} weight="regular"/><span>{tx(name)}</span></span><span className="track-wave"><svg viewBox="0 0 1000 80" preserveAspectRatio="none" aria-hidden="true"><path d={paths[id]}/><line x1={position/DURATION*1000} x2={position/DURATION*1000} y1="0" y2="80" className="desk-playhead"/></svg></span><span className="track-select" aria-hidden="true">{channel===id?'●':'○'}</span></button>)}</div>
  <div className="desk-player"><button type="button" className="desk-play" aria-label={`${tx(playing?'Pause':'Listen')} ${tx(channels.find(c=>c.id===channel)!.name)}`} onClick={()=>playing?stop():void begin()}>{playing?<Pause size={20} weight="fill"/>:<Play size={20} weight="fill"/>}</button><time dir="ltr">00:{String(Math.floor(position)).padStart(2,'0')}</time><input type="range" aria-label={tx('Playback position')} min="0" max={DURATION} step=".01" value={position} onChange={e=>{const time=Number(e.target.value);setPosition(time);if(playing)void begin(channel,time);}}/><SpeakerHigh size={19} aria-hidden="true"/><span className="desk-synthetic">{tx('Synthetic audio · not a model result')}</span></div>
  {error&&<p role="alert">{tx(error)}</p>}
 </section>;
}
