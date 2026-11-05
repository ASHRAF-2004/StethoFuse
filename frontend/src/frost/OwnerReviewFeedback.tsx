import {lt} from '../studio/locale';
import {tx} from '../studio/locale';
import {useId,useState} from 'react';
import {CaretDown,CaretUp,ClipboardText,SpinnerGap} from '@phosphor-icons/react';
import type {OwnerReview} from '../data/liveTypes';
import {Button,CopyId,GlassPanel,Notice,ProfileIdentity,SectionHeading} from './primitives';
import {ReviewStatus} from './AssignmentRows';
import {dateLabel} from './data';
import {useReviewPage} from './useReviewPage';
export function FeedbackNotes({notes,saved}:{notes:string;saved:boolean}){
  const [expanded,setExpanded]=useState(false),id=useId();
  if(!notes)return <p className="sf-subtle">{lt(saved?tx("No notes were added."):tx("Waiting for the analyst’s saved observations."))}</p>;
  return <div><p className="sf-feedback-notes" id={id}>{lt(notes.length>300&&!expanded?notes.slice(0,300)+'…':notes)}</p>{notes.length>300&&<Button variant="ghost" aria-controls={id} aria-expanded={expanded} onClick={()=>setExpanded(value=>!value)}>{lt(expanded?tx("Read less"):tx("Read more notes"))}</Button>}</div>;
}
const states={active:'Current assignment',revoked:'Access revoked',expired:'Assignment expired',reviewer_unavailable:'Reviewer unavailable'};
export function OwnerReviewFeedback({id,onRequest}:{id:string;onRequest:()=>void}){
  const data=useReviewPage<OwnerReview>(`/recordings/${id}/reviews`),listId=useId();
  return <GlassPanel className="sf-owner-feedback" label={tx("Analyst feedback")}>
    <SectionHeading title={tx("Analyst feedback")} description={tx("A second pair of ears, with observations saved for you.")} action={<Button variant="secondary" onClick={onRequest}><ClipboardText size={18}/>{tx("Request review")}</Button>}/>
    {data.error?<div role="alert"><Notice danger>{lt(data.error)}</Notice><Button variant="ghost" onClick={data.reload}>{tx("Retry feedback")}</Button></div>:data.loading?<p className="sf-feedback-loading" role="status"><SpinnerGap size={18}/>{tx("Loading feedback…")}</p>:data.value&&<>
      {data.value.items.length?<ul className="sf-feedback-list" id={listId}>{data.value.items.map(item=><li key={item.assignment_id} data-feedback-id={item.assignment_id}>
        <div className="sf-feedback-heading"><ProfileIdentity compact name={item.reviewer_display_name||'Reviewer name unavailable'} handle={item.reviewer_handle}/><ReviewStatus value={item.updated_at===null?"pending":item.decision}/></div>
        <div className="sf-feedback-context"><span>{lt(item.resource_kind==='original_audio'?tx("Original audio review"):tx("Result details review"))}</span><span>{lt(item.updated_at===null?`Assigned ${dateLabel(item.assigned_at)}`:`Saved ${dateLabel(item.updated_at)}`)}</span><span>{lt(states[item.assignment_state])}</span></div>
        <FeedbackNotes notes={item.notes} saved={item.updated_at!==null}/>
        {item.assignment_public_id&&<div className="sf-feedback-reference"><CopyId value={item.assignment_public_id}/></div>}
      </li>)}</ul>:<div className="sf-feedback-empty"><ClipboardText size={24}/><h3>{tx("No analyst feedback yet")}</h3><p>{tx("Request a review through sharing: find their @handle, choose Analyst review, then an exact original or result.")}</p></div>}
      <div className="sf-assignment-footer"><span role="status">{lt(data.value.items.length)} {tx(" of ")}{lt(data.value.total)} {tx(" reviews & current assignments")}</span><div>{data.value.items.length<data.value.total&&<Button variant="ghost" disabled={data.more} aria-controls={listId} aria-expanded={data.value.items.length>3} onClick={()=>void data.loadMore()}><CaretDown size={16}/>{lt(data.more?tx("Loading…"):tx("See more"))}</Button>}{data.value.items.length>3&&<Button variant="ghost" disabled={data.more} aria-controls={listId} aria-expanded onClick={data.collapse}><CaretUp size={16}/>{tx("See less")}</Button>}<Button variant="ghost" disabled={data.more} onClick={data.reload}>{tx("Refresh feedback")}</Button></div></div>
    </>}
    <p className="sf-sharing-footnote">{tx("Saved observations stay in your recording history after access is revoked. They are technical reviews, not diagnoses.")}</p>
  </GlassPanel>;
}
