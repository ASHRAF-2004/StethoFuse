import {useEffect,useRef,useState} from 'react';
import {Play,Pause,Heart,Wind,Waveform,SpeakerHigh} from '@phosphor-icons/react';
import {tx,useLocale} from './locale';
import recording from './listeningSample.json';
import assets from './criticalAssets.json';

type Channel='original'|'heart'|'lung';
const DURATION=recording.duration;
const channels=[{id:'original' as Channel,name:'Original',icon:Waveform},{id:'heart' as Channel,name:'Heart',icon:Heart},{id:'lung' as Channel,name:'Lung',icon:Wind}];
export default function SoundDesk(){
 useLocale();const [channel,setChannel]=useState<Channel>('original'),[playing,setPlaying]=useState(false),[loading,setLoading]=useState(false),[position,setPosition]=useState(0),[error,setError]=useState('');
 const audio=useRef<AudioContext|null>(null),source=useRef<AudioBufferSourceNode|null>(null),gain=useRef<GainNode|null>(null),buffers=useRef(new Map<Channel,Promise<AudioBuffer>>()),abort=useRef<AbortController|null>(null),clock=useRef({start:0,offset:0}),raf=useRef(0),generation=useRef(0);
 function stop(){generation.current++;if(source.current){source.current.onended=null;try{source.current.stop();source.current.disconnect();}catch{}source.current=null;}cancelAnimationFrame(raf.current);setPlaying(false);setLoading(false);}
 async function buffer(ctx:AudioContext,next:Channel){
  let pending=buffers.current.get(next);if(!pending){abort.current??=new AbortController();pending=fetch(recording.channels[next].path,{signal:abort.current.signal}).then(async response=>{if(!response.ok)throw new Error('audio_unavailable');const decoded=await ctx.decodeAudioData(await response.arrayBuffer());if(Math.abs(decoded.duration-DURATION)>.01||decoded.numberOfChannels!==1)throw new Error('audio_contract');return decoded;});buffers.current.set(next,pending);pending.catch(()=>buffers.current.delete(next));}return pending;
 }
 async function begin(next=channel,offset=position){
  stop();const ticket=generation.current;setLoading(true);
  try{const ctx=audio.current||(audio.current=new AudioContext());await ctx.resume();const decoded=await buffer(ctx,next);if(ticket!==generation.current)return;
   if(!gain.current){gain.current=ctx.createGain();gain.current.gain.value=recording.playbackGain;gain.current.connect(ctx.destination);}
   const node=ctx.createBufferSource();node.buffer=decoded;node.connect(gain.current);source.current=node;const start=offset>=DURATION-.01?0:offset;clock.current={start:ctx.currentTime,offset:start};node.start(0,start);setPlaying(true);setError('');
   node.onended=()=>{source.current=null;node.disconnect();setPlaying(false);setPosition(0);cancelAnimationFrame(raf.current);};
   const tick=()=>{if(source.current){setPosition(Math.min(DURATION,clock.current.offset+ctx.currentTime-clock.current.start));raf.current=requestAnimationFrame(tick);}};raf.current=requestAnimationFrame(tick);
  }catch{if(ticket===generation.current)setError('Audio could not start. Check your browser sound settings.');}
  finally{if(ticket===generation.current)setLoading(false);}
 }
 useEffect(()=>()=>{generation.current++;abort.current?.abort();if(source.current){source.current.onended=null;try{source.current.stop();}catch{}source.current.disconnect();}gain.current?.disconnect();cancelAnimationFrame(raf.current);void audio.current?.close();},[]);
 function select(next:Channel){setChannel(next);if(playing||loading)void begin(next,position);}
 return <section className="sound-desk" data-ui="sound-demo" data-sample="hls-cmds-M0111" aria-label={tx('Listening sample')}>
  <div className="desk-heading"><div><span className="desk-live-dot"/><strong>{tx('Listening sample')}</strong><span className="desk-caption">{tx('Compare the same moment')}</span></div><span className="desk-duration" dir="ltr">00:08</span></div>
  <div className="desk-tracks" role="group" aria-label={tx('Sound separation')}>{channels.map(({id,name,icon:Icon})=><button className={`desk-track ${channel===id?'selected':''}`} type="button" key={id} onClick={()=>select(id)} aria-pressed={channel===id}><span className={`track-label ${id}`}><Icon size={22} weight="regular"/><span>{tx(name)}</span></span><span className="track-wave"><svg viewBox="0 0 1000 80" preserveAspectRatio="none" aria-hidden="true"><use href={assets.sampleWaveforms+"#"+id}/><line x1={position/DURATION*1000} x2={position/DURATION*1000} y1="0" y2="80" className="desk-playhead"/></svg></span><span className="track-select" aria-hidden="true">{channel===id?'●':'○'}</span></button>)}</div>
  <div className="desk-player"><button type="button" className="desk-play" disabled={loading} aria-label={loading?tx('Loading audio…'):`${tx(playing?'Pause':'Listen')} ${tx(channels.find(c=>c.id===channel)!.name)}`} onClick={()=>playing?stop():void begin()}>{playing?<Pause size={20} weight="fill"/>:<Play size={20} weight="fill"/>}</button><time dir="ltr">00:{String(Math.floor(position)).padStart(2,'0')}</time><input type="range" aria-label={tx('Playback position')} min="0" max={DURATION} step=".01" value={position} onChange={e=>{const time=Number(e.target.value);setPosition(time);if(playing||loading)void begin(channel,time);}}/><SpeakerHigh size={19} aria-hidden="true"/><span className="desk-synthetic">{tx('Dataset sample · HLS-CMDS')}</span></div>
  {error&&<p role="alert">{tx(error)}</p>}
  <details className="desk-attribution"><summary>{tx('About this sample')}</summary><p>{tx('Recorded on a clinical manikin. Heart and lung tracks are outputs of the current StethoFuse model.')} {tx('Development-set demonstration, not independent validation.')}<br/>Torabi, Shirani &amp; Reilly · HLS-CMDS v3 · CC BY 4.0 · <a href="https://data.mendeley.com/datasets/8972jxbpmp/3" target="_blank" rel="noopener noreferrer">{tx('Dataset and attribution')}</a></p></details>
 </section>;
}
