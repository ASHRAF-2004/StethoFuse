import {lt} from '../studio/locale';
import {tx} from '../studio/locale';
import {useId,useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowRight,CaretDown,CaretUp,CheckCircle,Clock,FolderSimple,Plus} from '@phosphor-icons/react';
import type {WorkspaceInsights} from '../data/liveTypes';
import {Button,GlassPanel,SectionHeading} from './primitives';
import {dateLabel,useResource} from './data';
import {timeLabel} from './contracts';
import {EmptyState,RequestState} from './WorkspaceViews';

export function Insights(){
  const data=useResource<WorkspaceInsights>('/insights'),[expanded,setExpanded]=useState(false),id=useId();
  const value=data.value;
  return <>
    <header className="sf-page-heading sf-workspace-summary-heading"><div><h1>{tx("Your workspace, in perspective.")}</h1><p>{tx("Your own recording activity. No confidence scores or clinical judgments.")}</p></div><Link className="sf-button sf-button--primary" to="/app/recordings/new"><Plus size={20}/>{tx("New recording")}</Link></header>
    <RequestState {...data}/>
    {value&&!data.error&&<>
      <GlassPanel className="sf-insights-summary" label={tx("Own Library summary")}><SectionHeading title={tx("Your Library at a glance")} description={`Complete owned collection · updated ${dateLabel(value.as_of)}`} action={<Button variant="ghost" onClick={data.reload}>{tx("Refresh activity")}</Button>}/>
        <dl className="sf-insights-facts"><div><dt><FolderSimple size={20}/>{tx("Recordings saved")}</dt><dd>{lt(value.counts.total)}<small>{tx("Shared recordings are excluded.")}</small></dd></div><div><dt><CheckCircle size={20}/>{tx("Ready to review")}</dt><dd>{lt(value.counts.ready)}<small>{tx("Completed separation jobs.")}</small></dd></div><div><dt><Clock size={20}/>{tx("Recorded time")}</dt><dd>{lt(timeLabel(value.recorded_seconds))}<small>{tx("Stored durations, not listening time.")}</small></dd></div></dl>
      </GlassPanel>
      {!value.counts.total?<GlassPanel className="sf-assignment-panel"><EmptyState title={tx("Your next recording starts the story")} description={tx("Upload a WAV to begin. This view shows real activity only.")} action={<Link className="sf-text-link" to="/app/recordings/new">{tx("Add a recording")}<ArrowRight size={17}/></Link>}/></GlassPanel>:<div className="sf-insights-grid">
        <GlassPanel className="sf-assignment-panel" label={tx("Recent recording activity")}><SectionHeading title={tx("The last seven days")} description={tx("Recordings saved and separations completed. UTC calendar dates.")}/>
          <div className="sf-insights-trend" role="img" aria-label={lt(value.days.map(day=>`${day.date}: ${day.recordings} recordings saved and ${day.completed} separations completed`).join('; '))}>{value.days.map(day=>{
            const max=Math.max(1,...value.days.flatMap(item=>[item.recordings,item.completed]));
            return <div key={day.date}><div className="sf-trend-bars" aria-hidden="true"><span style={{height:`${day.recordings/max*100}%`}}/><span style={{height:`${day.completed/max*100}%`}}/></div><small>{lt(new Date(day.date+'T00:00:00Z').toLocaleDateString(undefined,{weekday:'short',timeZone:'UTC'}))}</small></div>;
          })}</div><p className="sf-trend-legend"><span>{tx("Recordings saved")}</span><span>{tx("Separations completed")}</span></p>
          <Button variant="ghost" aria-expanded={expanded} aria-controls={id} onClick={()=>setExpanded(value=>!value)}>{expanded?<CaretUp size={16}/>:<CaretDown size={16}/>} {lt(expanded?tx("See less"):tx("See daily counts"))}</Button>
          {expanded&&<table className="sf-comparison-table" id={id}><caption className="sf-sr">{tx("Own activity by UTC date")}</caption><thead><tr><th scope="col">{tx("Date (UTC)")}</th><th scope="col">{tx("Saved")}</th><th scope="col">{tx("Completed")}</th></tr></thead><tbody>{value.days.map(day=><tr key={day.date}><th scope="row">{lt(day.date)}</th><td>{lt(day.recordings)}</td><td>{lt(day.completed)}</td></tr>)}</tbody></table>}
        </GlassPanel>
        <GlassPanel className="sf-assignment-panel" label={tx("Current recording states")}><SectionHeading title={tx("Where things stand")} description={tx("Current states across your own Library.")}/><dl className="sf-insights-states">{([['recorded','Not separated'],['queued','Queued'],['processing','Processing'],['ready','Ready'],['failed','Failed']] as const).map(([key,label])=><div key={key}><dt>{lt(label)}</dt><dd>{lt(value.counts[key])}</dd></div>)}</dl><Link className="sf-text-link" to="/app/library">{tx("Open Library")}<ArrowRight size={17}/></Link><p className="sf-sharing-footnote">{tx("Signal checks and before/after measurements belong to each authorized recording. These activity counts do not measure separation accuracy.")}</p></GlassPanel>
      </div>}
    </>}
  </>;
}
