import {lt} from '../studio/locale';
import {tx} from '../studio/locale';
import {useEffect,useMemo,useRef,useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {Button,ErrorState,Field,Notice,PageHeading,Panel,UnsavedGuard} from './ui';
import {useLive} from '../data/live';
import type {LiveRecording} from '../data/liveTypes';
import {AudioWorkspace} from '../frost/AudioWorkspace';
import captureWorkletUrl from '../audio/capture-worklet.js?url&no-inline';

function pcmWav(chunks:Float32Array[],count:number,rate:number):File {
 const bytes=new ArrayBuffer(44+2*count),view=new DataView(bytes);
 const text=(at:number,value:string)=>{for(let i=0;i<value.length;i++)view.setUint8(at+i,value.charCodeAt(i));};
 text(0,'RIFF');view.setUint32(4,36+count*2,true);text(8,'WAVEfmt ');view.setUint32(16,16,true);
 view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,rate,true);view.setUint32(28,rate*2,true);
 view.setUint16(32,2,true);view.setUint16(34,16,true);text(36,'data');view.setUint32(40,count*2,true);
 let at=44;for(const chunk of chunks)for(const value of chunk){const sample=Math.max(-1,Math.min(1,value));view.setInt16(at,Math.round(sample*(sample<0?32768:32767)),true);at+=2;}
 return new File([bytes],'device-recording.wav',{type:'audio/wav'});
}

export default function LiveCapture(){
 const {api}=useLive(),navigate=useNavigate();
 const [phase,setPhase]=useState<'idle'|'starting'|'recording'|'stopping'|'review'|'saving'>('idle');
 const [error,setError]=useState(''),[seconds,setSeconds]=useState(0),[title,setTitle]=useState(''),[preview,setPreview]=useState('');
 const file=useRef<File|null>(null),cleanup=useRef<()=>void>(()=>{}),stop=useRef<()=>void>(()=>{}),url=useRef(''),mounted=useRef(true);
 const media=useMemo(()=>({media:async()=>{if(!file.current)throw new Error('Record audio before reviewing it.');return file.current;}}),[preview]);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;cleanup.current();if(url.current)URL.revokeObjectURL(url.current);};},[]);
 async function start(){
  setError('');setPhase('starting');setSeconds(0);file.current=null;
  if(url.current){URL.revokeObjectURL(url.current);url.current='';setPreview('');}
  let stream:MediaStream|undefined,context:AudioContext|undefined,node:AudioWorkletNode|undefined;
  try{
   if(!navigator.mediaDevices?.getUserMedia)throw new Error('Device capture requires HTTPS or localhost and browser microphone support.');
   stream=await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:false,noiseSuppression:false,autoGainControl:false},video:false});
   if(!mounted.current){stream.getTracks().forEach(t=>t.stop());return;}
   context=new AudioContext();await context.resume();
   if(!context.audioWorklet)throw new Error('Recording is not supported in this browser. Use a current browser or upload a WAV.');
   cleanup.current=()=>{stream?.getTracks().forEach(t=>t.stop());node?.disconnect();void context?.close().catch(()=>{});};
   await context.audioWorklet.addModule(captureWorkletUrl);
   if(!mounted.current){cleanup.current();return;}
   node=new AudioWorkletNode(context,'stethofuse-pcm-capture');
   const source=context.createMediaStreamSource(stream),mute=context.createGain();mute.gain.value=0;source.connect(node);node.connect(mute);mute.connect(context.destination);
   const rate=context.sampleRate,limit=Math.min(rate*120,Math.floor((25*1024*1024-44)/2));
   const chunks:Float32Array[]=[];let count=0,stopping=false;
   stop.current=()=>{if(stopping)return;stopping=true;setPhase('stopping');node?.port.postMessage('stop');};
   stream.getTracks().forEach(track=>track.addEventListener('ended',()=>stop.current(),{once:true}));
   node.port.onmessage=({data})=>{
    if(!mounted.current)return;
    if(data.samples&&count<limit){const chunk=(data.samples as Float32Array).slice(0,limit-count);chunks.push(chunk);count+=chunk.length;setSeconds(count/rate);if(count>=limit)stop.current();}
    if(data.stopped){cleanup.current();if(!count){setError(tx("No audio was captured. Check the device and try again."));setPhase('idle');return;}
     file.current=pcmWav(chunks,count,rate);url.current=URL.createObjectURL(file.current);setPreview(url.current);setPhase('review');}
   };
   setPhase('recording');
  }catch(failure){stream?.getTracks().forEach(t=>t.stop());void context?.close().catch(()=>{});if(mounted.current){setError(failure instanceof DOMException?(failure.name==='NotAllowedError'?tx("Microphone permission was denied. Allow access in your browser or upload a WAV."):failure.name==='NotFoundError'?tx("No microphone was found. Connect a device or upload a WAV."):failure.name==='NotReadableError'?tx("Your microphone is busy or unavailable. Close other recording apps and try again."):tx("This browser could not record audio. Check your input device or upload a WAV.")):failure instanceof Error?failure.message:tx("The recording device could not be opened."));setPhase('idle');}}
 }
 async function save(){if(!file.current)return;setPhase('saving');setError('');try{const body=new FormData();body.set('file',file.current);body.set('title',title.trim()||'Device recording');const record=await api.json<LiveRecording>('/recordings',{method:'POST',body});navigate(`/app/recordings/${record.id}`);}catch(failure){setError(failure instanceof Error?failure.message:tx("The recording could not be saved."));setPhase('review');}}
 return <><PageHeading title={tx("Record audio")} description={tx("Capture from your browser's selected microphone or connected audio device.")}/><Panel title={tx("Device recording")}><p aria-live="polite">{lt(phase==='recording'?tx("Recording"):phase==='stopping'?tx("Finishing recording"):phase==='review'?tx("Ready to review"):tx("Device capture"))} · {lt(seconds.toFixed(1))} {tx(" seconds")}</p>{error&&<ErrorState message={error}/>}<div className="toolbar product-capture-controls">{['idle','review'].includes(phase)&&<Button onClick={()=>void start()}>{lt(phase==='review'?tx("Record again"):tx("Start recording"))}</Button>}{phase==='recording'&&<Button onClick={()=>stop.current()}>{tx("Stop recording")}</Button>}<Button to="/app/recordings/new/upload" variant="secondary">{tx("Upload a file instead")}</Button></div>{preview&&<AudioWorkspace key={preview} resources={[{id:"device-review",kind:"original_audio",media_type:"audio/wav",url:null}]} provider={media} filenames={{original:"device-recording.wav"}} analysis={false}/>}{['review','saving'].includes(phase)&&<><Field label={tx("Recording title")}><input maxLength={200} value={title} onChange={e=>setTitle(e.target.value)}/></Field><p className="note-text">{tx("PCM WAV · mono · ")}{lt(file.current?.size.toLocaleString())} {tx(" bytes. Listen before saving. Separation starts only after you review the saved recording.")}</p><Button disabled={phase==='saving'} onClick={()=>void save()}>{lt(phase==='saving'?tx("Saving…"):tx("Save recording"))}</Button></>}<Notice>{tx("Capture stops after two minutes or the upload size limit. Use only audio you are authorized to record. Device quality affects the recording; no medical interpretation is provided.")}</Notice></Panel><UnsavedGuard when={['recording','review'].includes(phase)}/></>;
}
