import {useEffect,useRef,useState,type FormEvent} from 'react';
import {animate,stagger} from 'animejs';
import {CaretDown,Heartbeat,LockSimple,LockSimpleOpen,Waveform} from '@phosphor-icons/react';
import {useLocale} from '../studio/locale';
import {useLive} from '../data/live';
import type {CaseContextSpec,CaseContextState,CaseContextValues,CaseField,ClinicalStatus,ClinicalTarget,Localized} from '../data/liveTypes';
import {Button,GlassPanel,Notice} from './primitives';
import {errorMessage,useResource} from './data';
import './patient-board.css';

type Say=(en:string,ar:string)=>string;
type TileState='validated'|'locked'|'age'|'needs_age'|'untested';

/** Evidence scale shown on every condition tile: AUROC from chance (0.5) to perfect (1.0). */
const SCALE_MIN=.5,SCALE_MAX=1;
const position=(v:number)=>Math.max(0,Math.min(100,(v-SCALE_MIN)/(SCALE_MAX-SCALE_MIN)*100));
const percent=(v:number|null|undefined)=>v==null?'—':`${Math.round(v*100)}%`;
const fixed=(v:number|null|undefined)=>v==null?'—':v.toFixed(2);
/** Keeps a numeric range in reading order inside right-to-left text. */
const range=(low:number,high:number)=>`⁦${fixed(low)}–${fixed(high)}⁩`;

export function PatientBoard({recordingId}:{recordingId:string}){
 const {locale}=useLocale(),lang:keyof Localized=locale==='ar'?'ar':'en';
 const say:Say=(en,ar)=>lang==='ar'?ar:en;
 const spec=useResource<CaseContextSpec>('/case-context/spec');
 const context=useResource<CaseContextState>(`/recordings/${recordingId}/context`);
 const status=useResource<ClinicalStatus>('/clinical-targets');
 const age=typeof context.value?.context.age_group==='string'?context.value.context.age_group:null;
 return <GlassPanel className="sf-patient" label={say('Patient board','لوحة المريض')}>
  <header className="sf-patient-header"><h2>{say('Patient board','لوحة المريض')}</h2><p className="sf-subtle">{say('Case details and specific condition checks for this recording. A condition is checked only after its model passes a test on patients it never saw.','تفاصيل الحالة وفحوص الأمراض المحددة لهذا التسجيل. لا يُفحص المرض إلا بعد أن يجتاز نموذجه اختبارًا على مرضى لم يرهم.')}</p></header>
  {(spec.error||context.error||status.error)&&<Notice danger>{spec.error||context.error||status.error}</Notice>}
  {spec.value&&context.value&&<CaseDetails spec={spec.value} state={context.value} recordingId={recordingId} lang={lang} say={say} onSaved={context.reload}/>}
  {status.value&&<ConditionBoard status={status.value} age={age} lang={lang} say={say}/>}
 </GlassPanel>;
}

function CaseDetails({spec,state,recordingId,lang,say,onSaved}:{spec:CaseContextSpec;state:CaseContextState;recordingId:string;lang:keyof Localized;say:Say;onSaved:()=>void}){
 const {api}=useLive();
 const [editing,setEditing]=useState(false),[draft,setDraft]=useState<CaseContextValues>(state.context),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const supplied=spec.fields.filter(f=>state.context[f.key]!==undefined);
 const label=(field:CaseField,value:string)=>field.options?.find(o=>o.value===value)?.label[lang]??value;
 const shown=(field:CaseField)=>{const v=state.context[field.key];return Array.isArray(v)?v.map(x=>label(field,x)).join(lang==='ar'?'، ':', '):label(field,v as string);};
 async function save(event:FormEvent){
  event.preventDefault();setBusy(true);setError('');
  try{await api.json(`/recordings/${recordingId}/context`,{method:'PUT',body:JSON.stringify({context:draft})});setEditing(false);onSaved();}
  catch(failure){setError(errorMessage(failure));}finally{setBusy(false);}
 }
 if(editing)return <form className="sf-case-form" onSubmit={e=>void save(e)}>
  <p className="sf-subtle">{say('Optional and pseudonymous. Do not enter names, ID numbers or contact details.','اختيارية ومستعارة. لا تُدخل أسماء أو أرقام هوية أو بيانات اتصال.')}</p>
  <div className="sf-case-fields">{spec.fields.map(field=><CaseInput key={field.key} field={field} lang={lang} say={say} value={draft[field.key]} onChange={value=>setDraft(d=>{const next={...d};if(value===undefined||(Array.isArray(value)&&!value.length)||value==='')delete next[field.key];else next[field.key]=value;return next;})}/>)}</div>
  {error&&<Notice danger>{error}</Notice>}
  <div className="sf-case-actions"><Button type="submit" disabled={busy}>{busy?say('Saving…','جارٍ الحفظ…'):say('Save case details','حفظ تفاصيل الحالة')}</Button><Button variant="secondary" onClick={()=>{setDraft(state.context);setEditing(false);setError('');}}>{say('Cancel','إلغاء')}</Button></div>
 </form>;
 return <section className="sf-case" aria-label={say('Case details','تفاصيل الحالة')}>
  {supplied.length?<dl className="sf-case-list">{supplied.map(f=><div key={f.key}><dt>{f.label[lang]}</dt><dd>{shown(f)}</dd></div>)}</dl>
   :<p className="sf-case-empty">{say('No case details yet. Adding the age group lets each condition check know whether it applies.','لا توجد تفاصيل للحالة بعد. تتيح إضافة الفئة العمرية لكل فحص معرفة ما إذا كان ينطبق.')}</p>}
  {state.can_edit&&<Button variant="secondary" onClick={()=>{setDraft(state.context);setEditing(true);}}>{supplied.length?say('Edit case details','تعديل تفاصيل الحالة'):say('Add case details','إضافة تفاصيل الحالة')}</Button>}
 </section>;
}

function CaseInput({field,lang,say,value,onChange}:{field:CaseField;lang:keyof Localized;say:Say;value:string|string[]|undefined;onChange:(v:string|string[]|undefined)=>void}){
 if(field.type==='multi_choice'){
  const chosen=Array.isArray(value)?value:[];
  return <fieldset className="sf-case-chips"><legend>{field.label[lang]}</legend>{field.options!.map(o=><label key={o.value} className="sf-chip-toggle"><input type="checkbox" checked={chosen.includes(o.value)} onChange={e=>onChange(e.target.checked?[...chosen,o.value]:chosen.filter(v=>v!==o.value))}/><span>{o.label[lang]}</span></label>)}</fieldset>;
 }
 if(field.type==='choice')return <label className="sf-field"><span>{field.label[lang]}</span><select value={typeof value==='string'?value:''} onChange={e=>onChange(e.target.value||undefined)}><option value="">{say('Not supplied','لم يُذكر')}</option>{field.options!.map(o=><option key={o.value} value={o.value}>{o.label[lang]}</option>)}</select></label>;
 return <label className="sf-field"><span>{field.label[lang]}</span><input dir="ltr" value={typeof value==='string'?value:''} maxLength={field.max_length} onChange={e=>onChange(e.target.value)}/>{field.help&&<small>{field.help[lang]}</small>}</label>;
}

function tileState(target:ClinicalTarget,age:string|null):TileState{
 if(target.status==='not_run')return 'untested';
 if(target.status==='not_activated'||target.status==='passed')return 'locked';
 if(!age)return 'needs_age';
 return target.supported_population.includes(age)?'validated':'age';
}

function ConditionBoard({status,age,lang,say}:{status:ClinicalStatus;age:string|null;lang:keyof Localized;say:Say}){
 const root=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const node=root.current;
  if(!node||matchMedia('(prefers-reduced-motion: reduce)').matches||node.closest('.reduce-motion'))return;
  // One orchestrated reveal: each measured range grows from the chance line, then its estimate lands.
  const ranges=animate(node.querySelectorAll('.sf-track-range'),{scaleX:[0,1],duration:720,delay:stagger(70),ease:'outCubic'});
  const marks=animate(node.querySelectorAll('.sf-track-dot'),{opacity:[0,1],scale:[.4,1],duration:360,delay:stagger(70,{start:520}),ease:'outBack'});
  return()=>{ranges.revert();marks.revert();};
 },[status]);
 const unlocked=status.targets.filter(t=>tileState(t,age)==='validated').length;
 return <div ref={root} className="sf-conditions">
  <div className="sf-conditions-head"><h3>{say('Condition checks','فحوص الأمراض')}</h3><p className="sf-unlock-count"><span className="sf-pips" aria-hidden="true">{status.targets.map((t,i)=><i key={t.key} data-on={i<unlocked}/>)}</span><strong>{unlocked}</strong> {say(`of ${status.targets.length} unlocked`,`من ${status.targets.length} مفتوحة`)}</p></div>
  {(['heart','lung']as const).map(organ=>{const Icon=organ==='heart'?Heartbeat:Waveform;return <section key={organ} className="sf-organ" data-organ={organ}>
   <h4><Icon size={18}/>{organ==='heart'?say('Heart','القلب'):say('Lungs','الرئتان')}</h4>
   <ul className="sf-tiles">{status.targets.filter(t=>t.organ===organ).map(t=><ConditionTile key={t.key} target={t} state={tileState(t,age)} lang={lang} say={say}/>)}</ul>
  </section>;})}
  <p className="sf-gate-line">{status.gate.status==='activated'?say('Automatic chest-sound check is active.','الفحص التلقائي لأصوات الصدر مُفعَّل.'):status.gate.status==='passed'?say('Automatic chest-sound check passed testing on research recordings; it is not switched on in processing yet.','اجتاز الفحص التلقائي لأصوات الصدر الاختبار على تسجيلات بحثية، لكنه غير مُشغَّل في المعالجة بعد.'):say('Automatic chest-sound check is still being tested and is not active yet.','الفحص التلقائي لأصوات الصدر ما زال قيد الاختبار وغير مُفعَّل بعد.')}</p>
 </div>;
}

function ConditionTile({target,state,lang,say}:{target:ClinicalTarget;state:TileState;lang:keyof Localized;say:Say}){
 const [open,setOpen]=useState(false);
 const panelId=`sf-tile-${target.key}`;
 const badge={validated:say('Unlocked','مفتوح'),locked:say('Locked','مقفل'),age:say('Not for this age group','لا يشمل هذه الفئة العمرية'),needs_age:say('Add age group','أضف الفئة العمرية'),untested:say('Not tested yet','لم يُختبر بعد')}[state];
 return <li className="sf-tile" data-state={state}>
  <button type="button" className="sf-tile-face" aria-expanded={open} aria-controls={panelId} onClick={()=>setOpen(o=>!o)}>
   <span className="sf-tile-title">{target.title[lang]}</span>
   <span className="sf-tile-badge">{state==='validated'?<LockSimpleOpen size={14}/>:<LockSimple size={14}/>}{badge}</span>
   <EvidenceTrack target={target} say={say}/>
   <CaretDown className="sf-tile-caret" size={16}/>
  </button>
  {open&&<div id={panelId} className="sf-tile-detail"><UnlockDetail target={target} say={say}/></div>}
 </li>;
}

function EvidenceTrack({target,say}:{target:ClinicalTarget;say:Say}){
 const bar=target.bar.min_auroc_ci_low,test=target.test;
 const low=test?.auroc_ci_low,high=test?.auroc_ci_high,point=test?.auroc;
 const description=test&&low!=null&&high!=null?say(`Measured accuracy range ${fixed(low)} to ${fixed(high)}; unlocks when the lower end reaches ${fixed(bar)}.`,`نطاق الدقة المقاسة من ${fixed(low)} إلى ${fixed(high)}؛ يُفتح عندما يبلغ الحد الأدنى ${fixed(bar)}.`):say('No measured range yet.','لا يوجد نطاق مقاس بعد.');
 return <span className="sf-track" dir="ltr">
  <svg viewBox="0 0 100 20" preserveAspectRatio="none" role="img" aria-label={description}>
   <rect className="sf-track-rail" x="0" y="8" width="100" height="4" rx="2"/>
   {low!=null&&high!=null&&<rect className="sf-track-range" x={position(low)} y="6" width={Math.max(1,position(high)-position(low))} height="8" rx="4" data-pass={low>=bar}/>}
   <line className="sf-track-bar" x1={position(bar)} x2={position(bar)} y1="1" y2="19"/>
   {point!=null&&<circle className="sf-track-dot" cx={position(point)} cy="10" r="3.2"/>}
  </svg>
  <span className="sf-track-caption" aria-hidden="true">{test&&low!=null&&high!=null?say(`Measured ${range(low,high)}, needs ${fixed(bar)}`,`المقاس ${range(low,high)}، المطلوب ${fixed(bar)}`):say(`Not measured yet, needs ${fixed(bar)}`,`لم يُقَس بعد، المطلوب ${fixed(bar)}`)}</span>
 </span>;
}

function UnlockDetail({target,say}:{target:ClinicalTarget;say:Say}){
 const t=target.test,b=target.bar;
 if(target.status==='passed')return <p>{say('Passed testing on new patients from its own research dataset. Not switched on: it has not yet held up on recordings from another hospital or device.','اجتاز الاختبار على مرضى جدد من مجموعة بياناته البحثية. غير مُشغَّل: لم يثبت بعد على تسجيلات من مستشفى أو جهاز آخر.')}</p>;
 if(target.status==='not_run')return <p>{say('This model has not been tested yet','لم يُختبر هذا النموذج بعد')}{target.missing_datasets?.length?say(`: waiting for ${target.missing_datasets.join(', ')} data.`,`: بانتظار بيانات ${target.missing_datasets.join('، ')}.`):'.'}</p>;
 const checks:Record<string,string>={
  enough_test_positive_subjects:say(`Needs more test patients with the condition: ${t?.positive_subjects} of ${b.min_test_positive_subjects}.`,`يحتاج إلى مزيد من مرضى الاختبار المصابين: ${t?.positive_subjects} من ${b.min_test_positive_subjects}.`),
  enough_test_negative_subjects:say('Needs more test patients without the condition.','يحتاج إلى مزيد من مرضى الاختبار غير المصابين.'),
  auroc_ci_low:say(`Accuracy lower bound ${fixed(t?.auroc_ci_low)} is under ${fixed(b.min_auroc_ci_low)}.`,`الحد الأدنى للدقة ${fixed(t?.auroc_ci_low)} أقل من ${fixed(b.min_auroc_ci_low)}.`),
  beats_baseline:say('Not clearly better than guessing.','ليس أفضل بوضوح من التخمين.'),
  sensitivity:say(`Finds ${percent(t?.sensitivity)} of patients with the condition; needs ${percent(b.min_test_sensitivity)}.`,`يكتشف ${percent(t?.sensitivity)} من المصابين؛ المطلوب ${percent(b.min_test_sensitivity)}.`),
  specificity:say(`Correctly clears ${percent(t?.specificity)} of patients without it; needs ${percent(b.min_test_specificity)}.`,`يستبعد بشكل صحيح ${percent(t?.specificity)} من غير المصابين؛ المطلوب ${percent(b.min_test_specificity)}.`),
  calibration:say(`Confidence is off by ${fixed(t?.expected_calibration_error)} on average; limit ${fixed(b.max_expected_calibration_error)}.`,`تنحرف الثقة بمقدار ${fixed(t?.expected_calibration_error)} في المتوسط؛ الحد ${fixed(b.max_expected_calibration_error)}.`),
 };
 return <>
  <p className="sf-tile-numbers">{say(`Tested on ${t?.subjects} patients it never saw (${t?.positive_subjects} with the condition).`,`اختُبر على ${t?.subjects} مريضًا لم يرهم (${t?.positive_subjects} منهم مصابون).`)}</p>
  {target.failed_checks?.length?<><p>{say('Still needed to unlock:','المطلوب للفتح:')}</p><ul>{target.failed_checks.map(c=><li key={c}>{checks[c]??c}</li>)}</ul></>:<p>{say('Passed every check in the declared test.','اجتاز جميع فحوص الاختبار المعلن.')}</p>}
  {target.external_test&&<p>{say(`Second dataset check: accuracy ${fixed(target.external_test.auroc)} on ${target.external_test.subjects} recordings.`,`فحص مجموعة بيانات ثانية: دقة ${fixed(target.external_test.auroc)} على ${target.external_test.subjects} تسجيلًا.`)}</p>}
 </>;
}
