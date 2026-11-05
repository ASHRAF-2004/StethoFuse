import {lt} from '../studio/locale';
import {tx} from '../studio/locale';
import {useCallback,useMemo,useState} from 'react';
import {CheckCircle,Clock,Info,ShieldCheck,SpeakerHigh,WarningCircle,Waveform} from '@phosphor-icons/react';
import type {MediaResource} from '../data/liveTypes';
import {AudioPlayer} from './AudioPlayer';
import {sourceLabels,type MediaProvider,type SourceKind} from './contracts';
import {measureSignal,type AudioSignal,type SignalMetrics} from './signal';
import {BeforeAfter} from './BeforeAfter';
import {usePlayback} from './usePlayback';
import {useFrostPreferences} from './preferences';
import {SignalChart} from './SignalChart';
import {GlassPanel,MetricCard,Notice,SectionHeading,Segments} from './primitives';

function sourceKind(resource:MediaResource):SourceKind|null{
  return resource.kind==='heart_audio'?"heart":resource.kind==='lung_audio'?"lung":['original_audio','assigned_resource'].includes(resource.kind)?"original":null;
}
export function AudioWorkspace({resources,provider,filenames,analysis=true}:{resources:MediaResource[];provider:MediaProvider;filenames?:Partial<Record<SourceKind,string>>;analysis?:boolean}){
  const {gain,setGain}=useFrostPreferences(),playback=usePlayback(gain);
  const [selected,setSelected]=useState<SourceKind>('original'),[mode,setMode]=useState<'spectrogram'|'waveform'>('spectrogram');
  const [signals,setSignals]=useState<Partial<Record<SourceKind,AudioSignal>>>({});
  const sources=resources.map(resource=>({resource,kind:sourceKind(resource)})).filter((entry):entry is {resource:MediaResource;kind:SourceKind}=>entry.kind!==null);
  const source=sources.some(entry=>entry.kind===selected)?selected:sources[0]?.kind;
  const signal=source?signals[source]:undefined;
  const measurements=useMemo(()=>{
    const result:Partial<Record<SourceKind,SignalMetrics>>={};
    for(const kind of ['original','heart','lung'] as const){const loaded=signals[kind];if(loaded)result[kind]=measureSignal(loaded);}
    return result;
  },[signals]);
  const metrics=source?measurements[source]:undefined;
  const onLoaded=useCallback((kind:SourceKind,value:AudioSignal|null)=>setSignals(current=>{const next={...current};if(value)next[kind]=value;else delete next[kind];return next;}),[]);
  const select=(kind:SourceKind)=>{playback.pause();setSelected(kind);};
  const items=sources.map(entry=>({id:entry.kind,label:sourceLabels[entry.kind]}));
  if(!sources.length)return <GlassPanel><SectionHeading title={tx("Audio access")}/><Notice>{tx("No audio is included in your current access. A result or review grant does not automatically share its audio files.")}</Notice></GlassPanel>;
  return <div className="sf-detail-grid"><div className="sf-detail-main">
    <GlassPanel className="sf-audio-panel" label={tx("Audio workspace")}><SectionHeading title={lt(sources.length>1?tx("Listen to the difference"):tx("Listen closer"))} description={tx("Your available sounds, each with its own access.")} action={signal?<span className="sf-format">{lt(signal.duration.toFixed(1))}{tx("s · ")}{lt(signal.rate.toLocaleString())} {tx(" Hz · ")}{lt(signal.channels===1?"mono":"stereo")}</span>:undefined}/>
      <div className="sf-mobile-source"><Segments<SourceKind> label={tx("Audio source")} value={source!} onChange={select} items={items}/></div>
      {sources.map(({resource,kind})=><div className="sf-audio-lane" key={`${kind}:${resource.id}`} data-selected={source===kind}><AudioPlayer source={kind} resourceId={resource.id} provider={provider} playback={playback} gain={gain} setGain={setGain} onLoaded={onLoaded} filename={filenames?.[kind]}/></div>)}
      <div className="sf-playback-note"><SpeakerHigh size={15}/><span id="sf-playback-help">{tx("Playback volume up to 200%. Saved files stay unchanged.")}</span></div>{playback.error&&<Notice danger>{lt(playback.error)}</Notice>}
    </GlassPanel>
    {analysis&&sources.length>1&&sources.some(entry=>entry.kind!=='original')&&<BeforeAfter kinds={sources.map(entry=>entry.kind)} signals={signals} measurements={measurements}/>}
    {analysis&&<GlassPanel className="sf-analysis-panel" label={tx("Technical signal analysis")}><div className="sf-analysis-heading" id="analysis"><h2>{tx("Look closer")}</h2><Segments label={tx("Analysis view")} value={mode} onChange={setMode} items={[{id:'waveform',label:tx("Waveform")},{id:'spectrogram',label:tx("Spectrogram")}]}/></div><div className="sf-analysis-subhead"><Segments<SourceKind> label={tx("Analysis source")} value={source!} onChange={select} items={items}/><span><Info size={14}/>{tx("Technical measurements, not diagnosis")}</span></div>{signal?<><SignalChart signal={signal} source={source!} mode={mode}/><p className="sf-subtle">{lt(sourceLabels[source!])} · {lt(signal.rate.toLocaleString())} {tx(" Hz stored WAV · ")}{lt(signal.channels===1?tx("unboosted mono samples"):tx("unboosted stereo mean-mix samples for playback and analysis"))}</p></>:<div className="sf-chart-loading" role="status"><Waveform size={24}/>{tx("Analysis unavailable until this audio is authorized and loaded.")}</div>}</GlassPanel>}
  </div>
  {analysis&&<aside className="sf-detail-rail"><GlassPanel className="sf-quality-panel"><SectionHeading title={tx("Signal checks")} description={source?`${sourceLabels[source]} · ${source==='original'?tx("before separation"):tx("after separation")}`:tx("Audio unavailable")}/>{metrics&&signal?<>
    <ul className="sf-quality-list"><li>{metrics.lowLevel?<WarningCircle className="sf-check-warning" size={21} weight="fill"/>:<CheckCircle size={21} weight="fill"/>}<div><strong>{lt(metrics.lowLevel?tx("Low signal level"):tx("Usable signal level"))}</strong><span>{lt(metrics.lowLevel?tx("Consider playback boost"):tx("Above the −35 dBFS review threshold"))}</span></div></li><li>{metrics.clipped?<WarningCircle className="sf-check-warning" size={21} weight="fill"/>:<CheckCircle size={21} weight="fill"/>}<div><strong>{lt(metrics.clipped?tx("Clipping to review"):tx("No clipping detected"))}</strong><span>{lt(metrics.clipped)} {tx(" samples at |amplitude| ≥ 0.999")}</span></div></li><li><Clock size={21}/><div><strong>{lt(signal.duration.toFixed(1))} {tx(" seconds")}</strong><span>{lt(signal.rate.toLocaleString())} {tx(" Hz · ")}{lt(signal.channels===1?tx("Mono"):tx("Stereo mean mix"))}</span></div></li></ul>
    <dl className="sf-measurements"><MetricCard label={tx("RMS level")} value={`${metrics.rmsDb.toFixed(1)} dBFS`}/><MetricCard label={tx("Peak level")} value={`${metrics.peakDb.toFixed(1)} dBFS`}/><MetricCard label={tx("Crest factor")} value={metrics.crestDb===null?tx("Unavailable (silence)"):`${metrics.crestDb.toFixed(1)} dB`}/></dl><p className="sf-crest-explanation">{tx("Crest factor describes peaks above average energy. It is not an accuracy score.")}</p>
    <details className="sf-check-rules"><summary>{tx("How checks are measured")}</summary><p>{tx("Low level: RMS below −35 dBFS. Clipping: |sample| ≥ 0.999. Near-silence: 250 ms windows below −50 dBFS. These are technical checks, not clinical judgments.")}</p><p>{tx("Near-silence ")}{lt((metrics.nearSilence*100).toFixed(1))}{tx("% · DC offset ")}{lt(metrics.dc.toFixed(5))}{tx(". Silence is shown at the −160 dBFS display floor.")}</p></details>
    </>:<p className="sf-subtle">{tx("Measurements are unavailable. No check is marked passed.")}</p>}</GlassPanel><GlassPanel className="sf-share-panel"><ShieldCheck size={27}/><h2>{tx("Private, by default.")}</h2><p>{tx("Access to one sound does not unlock the others.")}</p><p>{tx("Revocation blocks later requests. It cannot recall bytes already downloaded.")}</p></GlassPanel></aside>}
  </div>;
}
