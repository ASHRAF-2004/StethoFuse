import {lt} from '../studio/locale';
import {tx} from '../studio/locale';
import {useId,useState,type ReactNode} from 'react';
import {CaretDown,CaretUp} from '@phosphor-icons/react';
import type {LiveJob,LiveRecording,LiveResult} from '../data/liveTypes';
import {Button,CopyId} from './primitives';
import {dateLabel} from './data';

function Fact({label,children}:{label:string;children:ReactNode}){
  return <div><dt>{lt(label)}</dt><dd>{lt(children)}</dd></div>;
}

export function TechnicalDetails({record,result,job}:{record?:LiveRecording;result?:LiveResult;job?:LiveJob}){
  const [expanded,setExpanded]=useState(false),receiptId=useId();
  const receipt:Record<string,unknown>=result?.provenance||{};
  const runtime=receipt.runtime_seconds;
  const completed=job?.completed_at||result?.created_at;
  const status=job?.status==='succeeded'||result?tx("Ready"):job?.status==='failed'?tx("Failed"):job?.status==='processing'?tx("Processing"):job?.status==='queued'?tx("Queued"):record?tx("Recorded"):null;
  return <details className="sf-technical sf-core-technical">
    <summary>{tx("Technical details & processing history")}</summary>
    <dl className="sf-technical-facts">
      {record&&<Fact label={tx("Original format")}>{lt(record.sample_rate_hz.toLocaleString())} {tx(" Hz · ")}{lt(record.channels===1?tx("Mono"):`${record.channels} channels`)} · {lt(record.duration_sec.toFixed(1))} {tx(" seconds")}</Fact>}
      {status&&<Fact label={tx("Status")}>{lt(status)}</Fact>}
      {completed&&<Fact label={tx("Completed")}>{lt(dateLabel(completed))}</Fact>}
      {typeof runtime==='number'&&Number.isFinite(runtime)&&<Fact label={tx("Processing time")}>{lt(runtime.toFixed(3))} {tx(" seconds")}</Fact>}
      {typeof receipt.model_name==='string'&&<Fact label={tx("Separator")}>{lt(receipt.model_name)}</Fact>}
      {result?.public_id&&<Fact label={tx("Result reference")}><CopyId value={result.public_id}/></Fact>}
      {job?.error_code&&<Fact label={tx("Failure category")}>{lt(job.error_code)}</Fact>}
    </dl>
    <div className="sf-details-disclosure">
      <Button variant="ghost" aria-expanded={expanded} aria-controls={receiptId} onClick={()=>setExpanded(value=>!value)}>
        {expanded?<CaretUp size={16}/>:<CaretDown size={16}/>} {lt(expanded?tx("See less"):tx("See more"))}
      </Button>
      <span>{tx("Full processing receipt & references")}</span>
    </div>
    <div id={receiptId} hidden={!expanded}>
      {expanded&&<dl className="sf-technical-receipt">
        {record&&<>
          {record.public_id&&<Fact label={tx("Recording reference")}><CopyId value={record.public_id}/></Fact>}
          <Fact label={tx("Internal recording identifier")}><CopyId value={record.id}/></Fact>
        </>}
        {job&&<>
          {job.public_id&&<Fact label={tx("Processing reference")}><CopyId value={job.public_id}/></Fact>}
          <Fact label={tx("Internal processing identifier")}><CopyId value={job.id}/></Fact>
          <Fact label={tx("Created / completed")}>{lt(dateLabel(job.created_at))} / {lt(dateLabel(job.completed_at))}</Fact>
        </>}
        {result&&<Fact label={tx("Internal result identifier")}><CopyId value={result.id}/></Fact>}
        {Object.entries(receipt).map(([key,value])=><Fact key={key} label={key.replaceAll('_',' ')}>{lt(typeof value==='object'?JSON.stringify(value):String(value))}</Fact>)}
      </dl>}
    </div>
  </details>;
}
