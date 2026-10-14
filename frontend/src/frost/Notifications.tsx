import {createContext,useCallback,useContext,useEffect,useMemo,useRef,useState,type ReactNode} from 'react';
import {Bell,Check,ShareNetwork,Waveform} from '@phosphor-icons/react';
import {Link} from 'react-router-dom';
import {useLive} from '../data/live';
import type {WorkflowUpdateFeed} from '../data/liveTypes';
import {dateLabel,errorMessage} from './data';
import {Button,GlassPanel,Notice,SectionHeading} from './primitives';

type FeedState={value:WorkflowUpdateFeed|null;error:string;loading:boolean;busy:boolean;enabled:boolean;refresh:()=>void;markRead:()=>Promise<void>};
const Updates=createContext<FeedState|null>(null);
function useUpdates(){const value=useContext(Updates);if(!value)throw new Error('Notifications require the account shell.');return value;}

export function NotificationProvider({children}:{children:ReactNode}){
  const {api,session,preferences}=useLive();
  const enabled=!!session?.capabilities.in_app_notifications;
  const options=preferences.notifications;
  const filter=`${options?.jobNotifications!==false}:${options?.reviewNotifications!==false}`;
  const [response,setResponse]=useState<{client:typeof api;filter:string;value:WorkflowUpdateFeed}|null>(null);
  const [error,setError]=useState(''),[loading,setLoading]=useState(enabled),[busy,setBusy]=useState(false),[revision,setRevision]=useState(0);
  const mutation=useRef<AbortController|null>(null),generation=useRef(0);
  const value=response?.client===api&&response.filter===filter?response.value:null;
  const refresh=useCallback(()=>setRevision(n=>n+1),[]);
  useEffect(()=>{generation.current++;setBusy(false);return()=>{generation.current++;mutation.current?.abort();};},[api,filter]);
  useEffect(()=>{
    if(!enabled){setResponse(null);setLoading(false);setError('');return;}
    const controller=new AbortController();
    setLoading(true);setError('');
    void api.json<WorkflowUpdateFeed>('/notifications',{signal:controller.signal}).then(value=>{if(!controller.signal.aborted)setResponse({client:api,filter,value});}).catch(failure=>{if(!controller.signal.aborted){setResponse(null);setError(errorMessage(failure));}}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return()=>controller.abort();
  },[api,enabled,filter,revision]);
  useEffect(()=>{
    if(!enabled)return;
    const visible=()=>{if(!document.hidden)refresh();};
    const timer=setInterval(visible,45000);
    window.addEventListener('focus',visible);document.addEventListener('visibilitychange',visible);
    return()=>{clearInterval(timer);window.removeEventListener('focus',visible);document.removeEventListener('visibilitychange',visible);};
  },[enabled,refresh]);
  async function markRead(){
    if(!value||busy)return;
    const version=generation.current,controller=new AbortController();
    mutation.current?.abort();mutation.current=controller;setBusy(true);setError('');
    try{
      const result=await api.json<WorkflowUpdateFeed>('/notifications/read',{method:'POST',signal:controller.signal,body:JSON.stringify({ids:value.items.map(item=>item.id)})});
      if(!controller.signal.aborted&&version===generation.current){setResponse({client:api,filter,value:result});refresh();}
    }catch(failure){if(!controller.signal.aborted&&version===generation.current)setError(errorMessage(failure));}
    finally{if(!controller.signal.aborted&&version===generation.current)setBusy(false);}
  }
  return <Updates.Provider value={{value,error,loading,busy,enabled,refresh,markRead}}>{children}</Updates.Provider>;
}

export function NotificationBell(){
  const {value,enabled}=useUpdates();
  if(!enabled)return null;
  const unread=value?.unread||0;
  return <Link to="/app/notifications" className="sf-button sf-button--icon sf-notification-bell" aria-label={`Notifications${unread?`, ${unread} unread`:''}`}><Bell size={21}/>{unread>0&&<span className="sf-notification-count" aria-hidden="true">{unread>9?'9+':unread}</span>}</Link>;
}

export function Notifications(){
  const {value,error,loading,busy,enabled,refresh,markRead}=useUpdates();
  return <><header className="sf-page-heading"><div><h1>Your workspace updates.</h1><p>Recent processing, review and sharing activity for your account.</p></div><Link className="sf-button sf-button--secondary" to="/app/settings?section=notifications">Notification settings</Link></header>
    {!enabled?<Notice>In-app notifications are not available on this server yet.</Notice>:<GlassPanel className="sf-notifications" label="Recent notifications"><SectionHeading title="Recent updates" description="Up to 30 updates. Refreshes while StethoFuse is open."/>
      <div className="sf-notification-tools"><Button variant="secondary" disabled={loading||busy} onClick={refresh}>{loading?'Checking…':'Refresh'}</Button><Button variant="ghost" disabled={busy||!value?.unread} onClick={()=>void markRead()}><Check size={17}/>{busy?'Saving…':'Mark displayed as read'}</Button></div>
      {error&&<Notice danger>{error} <Button variant="ghost" onClick={refresh}>Retry</Button></Notice>}
      {!value&&loading&&<p role="status">Loading your updates…</p>}
      {value?.items.length===0&&<div className="sf-notifications-empty"><Bell size={30}/><h3>You’re up to date.</h3><p>Enabled updates appear here when processing or sharing activity is saved.</p></div>}
      {value&&value.items.length>0&&<ul className="sf-notification-list">{value.items.map(item=>{const Icon=item.kind==='processing'?Waveform:item.kind==='sharing'?ShareNetwork:Check;const href=/^\/app\/(shared|recordings\/[a-z0-9_-]+|results\/[a-z0-9_-]+)$/.test(item.href)?item.href:'/app/overview';return <li key={item.id} data-unread={item.unread}><Icon size={22} aria-hidden="true"/><div><Link to={href}>{item.title}</Link><time dateTime={new Date(item.occurred_at*1000).toISOString()}>{dateLabel(item.occurred_at)}</time></div>{item.unread&&<span className="sf-unread-dot" aria-label="Unread"/>}</li>;})}</ul>}
    </GlassPanel>}</>;
}

export function NotificationSettings(){
  const {preferences,savePreferences,session}=useLive();
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  const [pending,setPending]=useState<Record<string,boolean>>({});
  const active=useRef(true);
  useEffect(()=>{active.current=true;return()=>{active.current=false;};},[]);
  const enabled=!!session?.capabilities.in_app_notifications,options=preferences.notifications||{};
  async function save(key:string,value:boolean){setPending({[key]:value});setBusy(true);setError('');try{await savePreferences({notifications:{...options,[key]:value}});}catch(failure){if(active.current)setError(errorMessage(failure));}finally{if(active.current){setBusy(false);setPending({});}}}
  const choices=useMemo(()=>[{key:'jobNotifications',title:'Processing updates',note:'Queued, running, ready and failed separation jobs.'},{key:'reviewNotifications',title:'Reviews and sharing',note:'Saved feedback on your recordings and changes to shared access.'}],[]);
  return <><SectionHeading title="Notifications" description="Updates inside StethoFuse, while you use your workspace."/>{enabled?<><div className="sf-account-toggles">{choices.map(option=><label key={option.key} className="sf-setting-row"><span><strong>{option.title}</strong><small>{option.note}</small></span><input type="checkbox" checked={pending[option.key]??options[option.key]!==false} disabled={busy} onChange={e=>void save(option.key,e.target.checked)}/></label>)}</div><p><Link className="sf-button sf-button--secondary" to="/app/notifications">View your updates</Link></p><p className="sf-account-copy">These preferences filter your in-app feed. Email and browser push delivery are not enabled for this release.</p></>:<Notice>In-app notifications are not available on this server yet.</Notice>}{error&&<Notice danger>{error}</Notice>}</>;
}
