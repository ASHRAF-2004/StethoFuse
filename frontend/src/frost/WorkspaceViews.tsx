import {useLocale,localeTag} from '../studio/locale';
import {lt} from '../studio/locale';
import {tx} from '../studio/locale';
import {useMemo,useState} from 'react';
import {Link,useSearchParams} from 'react-router-dom';
import {ArrowRight,CaretLeft,CaretRight,Check,Circle,Clock,LockSimple,MagnifyingGlass,Plus,ShareNetwork,SpinnerGap,Waveform,X} from '@phosphor-icons/react';
import {useLive} from '../data/live';
import {Button,CopyId,GlassPanel,Notice,SectionHeading,Segments,StatusChip} from './primitives';
import {dateLabel,useLibrary,type LibraryItem} from './data';
import {timeLabel} from './contracts';
import {PerchedOwl} from './PerchedOwl';
import {AnalystOverview} from './AnalystOverview';


export function RequestState({loading,error,reload}:{loading:boolean;error:string;reload:()=>void}){
  if(error)return <div role="alert"><Notice danger>{lt(error)}</Notice><Button variant="secondary" onClick={reload}>{tx("Retry request")}</Button></div>;
  return loading?<div className="sf-loading" role="status"><SpinnerGap size={24}/>{tx("Loading your workspace…")}</div>:null;
}
export function EmptyState({title,description,action}:{title:string;description:string;action?:React.ReactNode}){return <div className="sf-empty"><Waveform size={36}/><h2>{lt(title)}</h2><p>{lt(description)}</p>{lt(action)}</div>;}
export function RecordingRows({items,compact=false}:{items:LibraryItem[];compact?:boolean}){
  return <div className={`sf-recordings ${compact?"sf-recordings--compact":''}`}>
    {!compact&&<div className="sf-list-head" aria-hidden="true"><span>{tx("Recording")}</span><span>{tx("Added")}</span><span>{tx("Duration")}</span><span>{tx("Status")}</span><span>{tx("Access")}</span><span/></div>}
    <ul aria-label={tx("Recordings")}>{items.map(({recording:r,status})=><li key={r.id}>
      <div className="sf-recording-title"><span className="sf-recording-symbol"><Waveform size={22}/></span><div><strong>{r.title}</strong><div className="sf-recording-reference">{r.public_id?<CopyId value={r.public_id}/>:<span className="sf-subtle">{lt(compact?dateLabel(r.created_at):r.is_owner?tx("Saved recording"):tx("Shared recording"))}</span>}</div></div></div>
      {!compact&&<span className="sf-recording-date">{lt(dateLabel(r.created_at))}</span>}
      <span className="sf-recording-duration">{lt(Number.isFinite(r.duration_sec)?timeLabel(r.duration_sec):'—')}</span>
      {status?<StatusChip status={status}/>:<span className="sf-status sf-status--recorded">{tx("Shared audio")}</span>}
      <span className="sf-recording-access">{r.is_owner?<LockSimple size={15}/>:<ShareNetwork size={15}/>}<span>{lt(r.is_owner?tx("Private"):tx("Shared"))}</span></span>
      <Link to={`/app/recordings/${r.id}`} className="sf-row-action" aria-label={`Open ${r.title}`}>{compact?<ArrowRight size={21}/>:<>{tx("Open")}<ArrowRight size={17}/></>}</Link>
    </li>)}</ul>
  </div>;
}
export function Progress({status,title,stage}:{status:string;title?:string;stage?:string}){
  const {locale}=useLocale(),analyzing=status==='processing'&&stage==='analysis',analysisLabel=locale==='ar'?"جارٍ تحليل الأصوات المفصولة":"Analyzing separated sounds";
  const ready=status==='succeeded',failed=status==='failed',processing=status==='processing',queued=status==='queued',requesting=status==='requesting',working=processing||queued||requesting;
  return <div role="status" aria-live="polite"><GlassPanel className={`sf-progress-panel ${working?"sf-progress-panel--working":''}`} label={tx("Recording progress")}><div><div className="sf-progress-title"><span className="sf-progress-icon">{working?<span className="sf-working-wave" aria-hidden="true"><i/><i/><i/><i/><i/></span>:ready?<Check size={22}/>:<Circle size={22}/>}</span><div><h2>{lt(requesting?tx("Starting separation"):failed?tx("Separation needs attention"):ready?tx("Ready to listen"):analyzing?analysisLabel:queued?tx("Waiting to separate"):tx("Separation in progress"))}</h2><p>{lt(analyzing?analysisLabel:processing?tx("Separating heart and lung audio"):requesting?tx("Sending your separation request"):title)}</p></div></div><p className="sf-progress-copy">{lt(requesting?tx("Creating your processing job. Your original stays unchanged."):ready?tx("Your separated sounds are saved privately."):failed?tx("Your original is unchanged. See the saved failure details below."):tx("You can leave this page. Progress is saved in your Library."))}</p></div><ol className="sf-progress-steps" aria-label={tx("Recording progress")}><li className="is-complete"><span><Check size={17}/></span><strong>{tx("Recorded")}</strong><small>{tx("Saved privately")}</small></li><li className={ready?"is-complete":working?"is-current":''} aria-current={working?"step":undefined}><span>{ready?<Check size={17}/>:<SpinnerGap className={working?"sf-working-spinner":''} size={18}/>}</span><strong>{lt(requesting?tx("Starting"):queued?tx("Queued"):tx("Processing"))}</strong><small>{lt(requesting?tx("Requesting job"):queued?tx("Waiting for worker"):analyzing?analysisLabel:processing?tx("Separating sounds"):failed?tx("Not completed"):tx("Completed"))}</small></li><li className={ready?"is-complete":''} aria-current={ready?"step":undefined}><span>{ready?<Check size={17}/>:<Circle size={17}/>}</span><strong>{tx("Ready")}</strong><small>{tx("Listen & review")}</small></li></ol></GlassPanel></div>;
}
export function Overview(){
  const {session,preferences}=useLive(),data=useLibrary();
  const analyst=session!.user.role==='audio_analyst';
  const own=data.items.filter(i=>i.recording.is_owner),shared=data.items.filter(i=>!i.recording.is_owner);
  const unfinished=own.filter(i=>i.job&&['queued','processing'].includes(i.job.status));
  const week=Date.now()/1000-7*86400,weekly=own.filter(i=>i.recording.created_at>=week);
  const recentReady=own.filter(i=>i.result&&i.result.created_at>=week).length;
  const hour=new Date().getHours(),greeting=hour<12?tx("Good morning"):hour<18?tx("Good afternoon"):tx("Good evening");
  return <><header className="sf-page-heading sf-greeting"><div><p className="sf-date">{lt(new Date().toLocaleDateString(localeTag(),{weekday:'long',day:'numeric',month:'long'}))}</p><h1>{lt(greeting)}{session!.user.display_name&&<>{document.documentElement.dir==='rtl'?'، ':', '}<bdi dir="auto">{session!.user.display_name.split(' ')[0]}</bdi></>}.</h1><p>{session!.user.handle&&<span className="sf-greeting-handle"><bdi dir="ltr">@{session!.user.handle}</bdi> · </span>}{lt(analyst?tx("A focused place for your assigned reviews."):tx("A clear place for every recording."))}</p><div className="sf-greeting-actions"><Link className="sf-button sf-button--primary" to={analyst?'/app/shared?view=assigned':'/app/recordings/new'}>{analyst?<ArrowRight size={20}/>:<Plus size={20}/>} {lt(analyst?tx("Open assigned reviews"):tx("New recording"))}</Link>{analyst&&<Link className="sf-button sf-button--secondary" to="/app/recordings/new"><Plus size={18}/>{tx("New recording")}</Link>}</div></div><div className="sf-greeting-art" aria-hidden="true"><PerchedOwl reducedMotion={preferences.appearance?.reducedMotion===true}/></div></header>
  <RequestState {...data}/>
  {data.collection&&<>{unfinished.length>0&&<><Progress status={unfinished[0].job!.status} title={unfinished[0].recording.title}/><Link className="sf-text-link sf-progress-open" to={`/app/recordings/${unfinished[0].recording.id}`}>{tx("Open in-progress recording")}<ArrowRight size={17}/></Link></>}
  {!analyst&&<div className="sf-overview-grid"><GlassPanel className="sf-recent-panel"><SectionHeading title={tx("Recent recordings")} description={tx("From first capture to a closer listen.")} action={<Link className="sf-text-link" to="/app/library">{tx("View library")}<ArrowRight size={16}/></Link>}/>{own.length?<RecordingRows compact items={own.slice(0,4)}/>:<EmptyState title={tx("Your next recording starts here")} description={tx("Record from your microphone or upload a WAV to begin your private Library.")} action={<Link className="sf-text-link" to="/app/recordings/new">{tx("Add a recording")}<ArrowRight size={17}/></Link>}/>}<div className="sf-recent-footer"><Clock size={16}/><span>{tx("Your complete recording history stays in the Library.")}</span></div></GlassPanel>
  <GlassPanel className="sf-overview-rail" label={tx("Shared work and weekly activity")}><section className="sf-attention-panel"><SectionHeading title={tx("Shared with you")}/><div className="sf-shared-icon"><ShareNetwork size={25}/></div><h3>{lt(shared.length?tx("A second pair of ears"):tx("A quieter shared workspace"))}</h3><p>{lt(shared.length?tx("Recordings currently shared with your account."):tx("Nothing has been shared with you yet."))}</p>{shared[0]&&<><div className="sf-shared-recording"><strong>{shared[0].recording.title}</strong><span>{lt(timeLabel(shared[0].recording.duration_sec))} {tx(" · Explicit access")}</span>{shared[0].status&&<StatusChip status={shared[0].status}/>}</div><Link to={`/app/recordings/${shared[0].recording.id}`} className="sf-text-link">{tx("Open recording")}<ArrowRight size={17}/></Link></>}</section><section className="sf-week-summary"><h2>{tx("Your week, at a glance.")}</h2><div><span><strong>{lt(weekly.length)}</strong> {tx(" recordings saved")}</span><span><strong>{lt(recentReady)}</strong> {tx(" separations completed")}</span></div><p>{tx("Your own activity in the last seven days.")}</p></section></GlassPanel></div>}</>}
  {analyst&&<AnalystOverview/>}
  </>;
}
type Filter='all'|'ready'|'processing'|'shared';
export function Library({sharedOnly=false,embedded=false}:{sharedOnly?:boolean;embedded?:boolean}){
  const data=useLibrary(),[params,setParams]=useSearchParams();
  const search=params.get('q')||'',f=params.get('filter'),filter:Filter=sharedOnly?"shared":['all','ready','processing','shared'].includes(f||'')?f as Filter:"all";
  const sort=params.get('sort')==='oldest'?"oldest":"newest";
  const [page,setPage]=useState(0);
  const rows=useMemo(()=>{
    const matching=data.items.filter(i=>(filter==='all'||filter==='shared'&&!i.recording.is_owner||i.status===filter)&&`${i.recording.title} ${i.recording.public_id||''}`.toLowerCase().includes(search.toLowerCase().trim()));
    return matching.sort((a,b)=>(sort==='oldest'?1:-1)*(a.recording.created_at-b.recording.created_at)||a.recording.id.localeCompare(b.recording.id));
  },[data.items,search,filter,sort]);
  const currentPage=Math.min(page,Math.max(0,Math.ceil(rows.length/6)-1));
  function change(key:string,value:string){const next=new URLSearchParams(params);next.set(key,value);setParams(next,{replace:true});setPage(0);}
  const count=(id:Filter)=>id==='all'?data.items.length:id==='shared'?data.items.filter(i=>!i.recording.is_owner).length:data.items.filter(i=>i.status===id).length;
  return <>{!embedded&&<header className="sf-page-heading"><div><h1>{lt(sharedOnly?tx("Shared & assigned"):tx("Your sound library"))}</h1><p>{tx("One place for recordings, from capture to review.")}</p></div><Link className="sf-button sf-button--primary" to="/app/recordings/new"><Plus size={20}/>{tx("New recording")}</Link></header>}
  <GlassPanel className="sf-library-panel"><div className="sf-library-tools"><label className="sf-search-field"><MagnifyingGlass size={20}/><span className="sf-sr">{tx("Search recordings by title or public reference")}</span><input id="library-search" type="search" placeholder={tx("Search by title or REC reference")} value={search} onChange={e=>change('q',e.target.value)}/>{search&&<Button variant="icon" aria-label={tx("Clear search")} onClick={()=>change('q','')}><X size={18}/></Button>}</label><label className="sf-sort"><span className="sf-sr">{tx("Sort recordings")}</span><select value={sort} onChange={e=>change('sort',e.target.value)}><option value="newest">{tx("Newest first")}</option><option value="oldest">{tx("Oldest first")}</option></select></label></div><div className="sf-library-filters">{!sharedOnly&&<Segments<Filter> label={tx("Library filters")} value={filter} onChange={id=>change('filter',id)} items={(['all','ready','processing','shared'] as Filter[]).map(id=>({id,label:id[0].toUpperCase()+id.slice(1),count:data.collection?count(id):undefined}))}/>}<span>{tx("All recordings stay private by default.")}</span><Button variant="ghost" onClick={data.reload}>{tx("Refresh access")}</Button></div><RequestState {...data}/>{data.collection&&(rows.length?<RecordingRows items={rows.slice(currentPage*6,currentPage*6+6)}/>:<EmptyState title={lt(search||filter!=='all'?tx("No matching recordings"):tx("Your Library is ready"))} description={search||filter!=='all'?tx("Try another title or filter. Only currently authorized recordings are included."):tx("Upload a WAV to start. No demonstration recordings are loaded.")}/>)}{data.collection&&<div className="sf-library-footer"><span role="status">{lt(rows.length?`${currentPage*6+1}–${Math.min(currentPage*6+6,rows.length)} of ${rows.length}`:'0')} {tx(" recordings · complete authorized collection")}</span>{rows.length>6&&<nav className="sf-pagination" aria-label={tx("Library pages")}><Button variant="icon" aria-label={tx("Previous page")} disabled={currentPage===0} onClick={()=>setPage(currentPage-1)}><CaretLeft size={18}/></Button><Button variant="icon" aria-label={tx("Next page")} disabled={(currentPage+1)*6>=rows.length} onClick={()=>setPage(currentPage+1)}><CaretRight size={18}/></Button></nav>}</div>}</GlassPanel><div className="sf-library-bottom"><span>{tx("PCM WAV · up to 25 MiB per upload")}</span><p>{tx("Only people you explicitly share with can access your recordings.")}</p></div></>;
}
