import {lt} from '../studio/locale';
import {tx} from '../studio/locale';
import {useMemo,useRef,useState,type FormEvent} from 'react';
import {Link,useNavigate} from 'react-router-dom';
import {ArrowRight,LockSimple,UploadSimple} from '@phosphor-icons/react';
import recordingLock from './assets/recording-locked-v1.png';
import {useLive} from '../data/live';
import type {LiveRecording} from '../data/liveTypes';
import {Button,GlassPanel,Notice,SectionHeading} from './primitives';
import {AudioWorkspace} from './AudioWorkspace';
import {errorMessage} from './data';
import {UnsavedGuard} from '../components/ui';


// Live capture waits for a qualified USB/Type-C digital stethoscope (owner decision 20 Nov 2026).
function RecordingLock(){return <div className="sf-recording-lock" aria-label={tx("Recording coming soon")}><img src={recordingLock} alt="" width={160} height={160}/><span className="sf-soon-badge"><LockSimple size={14}/>{tx("Soon!")}</span></div>;}
export function RecordingComingSoon(){return <><header className="sf-page-heading"><div><h1>{tx("Live recording is coming soon.")}</h1><p>{tx("Live chest recording needs a digital stethoscope connected by USB or Type-C.")}</p></div></header><GlassPanel className="sf-recording-soon"><RecordingLock/><h2>{tx("Start with a file today.")}</h2><p>{tx("Upload an existing WAV to use separation and analysis. No microphone is activated here.")}</p><Link className="sf-button sf-button--primary" to="/app/recordings/new/upload">{tx("Choose a WAV")}<ArrowRight size={18}/></Link><Link className="sf-text-link" to="/app/library">{tx("Back to Library")}</Link></GlassPanel></>;}
export function NewRecording(){return <><header className="sf-page-heading"><div><h1>{tx("Start with a sound.")}</h1><p>{tx("Bring an existing recording, or capture a new one. Your original stays unchanged.")}</p></div></header><div className="sf-create-grid"><GlassPanel className="sf-create-upload"><span className="sf-create-symbol"><UploadSimple size={29}/></span><h2>{tx("Upload a recording")}</h2><p>{tx("Have a file ready? Review your WAV and save it to your private Library.")}</p><Link className="sf-button sf-button--primary" to="/app/recordings/new/upload">{tx("Choose a WAV")}<ArrowRight size={18}/></Link><span className="sf-create-format">{tx("PCM WAV · up to 25 MiB · up to two minutes")}</span></GlassPanel><GlassPanel className="sf-create-locked"><RecordingLock/><h2>{tx("Record a new sound")}</h2><p>{tx("Live chest recording needs a digital stethoscope connected by USB or Type-C.")}</p><span className="sf-subtle">{tx("Upload an existing WAV for now.")}</span></GlassPanel></div><Notice>{tx("Use only audio you are authorized to upload. Sound separation is not a diagnosis.")}</Notice></>;}
export function Upload(){
  const {api}=useLive(),navigate=useNavigate();
  const [file,setFile]=useState<File|null>(null),[title,setTitle]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const submitting=useRef(false);
  const provider=useMemo(()=>({media:async(_id:string,signal?:AbortSignal)=>{if(signal?.aborted)throw new DOMException('Aborted','AbortError');if(!file)throw new Error('Choose a WAV to review.');return file;}}),[file]);
  async function submit(e:FormEvent){
    e.preventDefault();if(submitting.current)return;setError('');
    if(!file){setError(tx("Choose a WAV file."));return;}
    if(file.size>25*1024*1024||!file.name.toLowerCase().endsWith('.wav')){setError(tx("Choose a WAV file no larger than 25 MiB."));return;}
    submitting.current=true;setBusy(true);
    try{const body=new FormData();body.set('file',file);if(title.trim())body.set('title',title.trim());const record=await api.json<LiveRecording>('/recordings',{method:'POST',body});navigate(`/app/recordings/${record.id}`);}
    catch(failure){setError(errorMessage(failure));}finally{submitting.current=false;setBusy(false);}
  }
  return <><header className="sf-page-heading"><div><h1>{tx("Bring a recording.")}</h1><p>{tx("Review your file, then save it to your private Library.")}</p></div></header><GlassPanel className="sf-upload-panel"><form onSubmit={submit}><label className="sf-upload-drop"><UploadSimple size={32}/><strong>{tx("Choose a WAV recording")}</strong><span>{tx("Mono or stereo PCM WAV · up to 25 MiB · up to two minutes")}</span><input type="file" accept=".wav,audio/wav" disabled={busy} onChange={e=>{setFile(e.target.files?.[0]||null);setError('');}}/></label><label className="sf-field"><span>{tx("Recording title")}</span><input maxLength={200} value={title} onChange={e=>setTitle(e.target.value)} placeholder={tx("A neutral name for your recording")} disabled={busy}/></label>{file&&<p className="sf-subtle">{lt(file.name)} · {lt((file.size/1024).toFixed(1))} {tx(" KiB · not uploaded yet")}</p>}{error&&<div role="alert"><Notice danger>{lt(error)}</Notice></div>}<div className="sf-toolbar"><Button type="submit" disabled={busy}>{lt(busy?tx("Uploading…"):tx("Upload recording"))}</Button><Link className="sf-button sf-button--secondary" to="/app/library">{tx("Cancel")}</Link></div><Notice>{tx("Only you and people you explicitly share with can access the saved recording. Separation starts after you review it.")}</Notice></form></GlassPanel>{file&&<div className="sf-upload-review"><AudioWorkspace key={`${file.name}:${file.lastModified}:${file.size}`} resources={[{id:'selected-file',kind:'original_audio',media_type:'audio/wav',url:null}]} provider={provider} filenames={{original:file.name}}/></div>}<UnsavedGuard when={!!file&&!busy}/></>;
}
