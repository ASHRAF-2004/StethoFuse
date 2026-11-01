import {lt} from '../studio/locale';
import {tx} from '../studio/locale';
import {ChartBar,FolderSimple,GearSix,House,List,MagnifyingGlass,Moon,Question,ShareNetwork,ShieldCheck,SignOut,Sun} from '@phosphor-icons/react';
import {useEffect,useRef,useState,type ReactNode} from 'react';
import {Link,NavLink,useLocation,useNavigate} from 'react-router-dom';
import {useLive} from '../data/live';
import {useApp} from '../data/store';
import {liveRoleLabel} from '../data/liveTypes';
import {Button,Modal} from './primitives';
import {FrostPreferences,useFrostPreferences} from './preferences';
import {OwnAvatar} from './OwnAvatar';
import {NotificationBell,NotificationProvider} from './Notifications';
import ForestPointer from '../components/ForestPointer';
import './frost.css';
import {BrandMark} from '../components/BrandMark';
import {usePageMotion} from '../components/usePageMotion';
import {LanguageSwitch,useLocale} from '../studio/locale';

function ShellContent({children}:{children:ReactNode}){
  useLocale();
  const {session,logout,preferences}=useLive(),{toast,notify}=useApp();
  const {resolved,setTheme}=useFrostPreferences(),location=useLocation(),navigate=useNavigate();
  const [drawer,setDrawer]=useState(false);const user=session!.user;const motionRoot=useRef<HTMLDivElement>(null);usePageMotion(motionRoot,location.pathname);
  const label=location.pathname.startsWith('/app/recordings/new')?tx("New recording"):location.pathname.startsWith('/app/recordings/')||location.pathname.startsWith('/app/results/')||location.pathname.startsWith('/app/audio/')?tx("Recording"):location.pathname==='/app/library'?tx("Library"):location.pathname==='/app/overview'?tx("Overview"):location.pathname==='/app/insights'?tx("Insights"):location.pathname==='/app/notifications'?tx("Notifications"):location.pathname==='/app/review-history'?tx("Saved reviews"):location.pathname.startsWith('/app/settings')||location.pathname==='/app/profile'?tx("Profile & settings"):location.pathname.includes('/admin')?tx("Administration"):location.pathname.includes('/help')?tx("Help"):tx("Shared & assigned");
  function search(){navigate('/app/library');requestAnimationFrame(()=>requestAnimationFrame(()=>document.querySelector<HTMLInputElement>('#library-search')?.focus()));}
  useEffect(()=>{setDrawer(false);window.scrollTo(0,0);document.getElementById('sf-main')?.focus({preventScroll:true});document.title=`StethoFuse · ${label}`;},[location.pathname,label]);
  useEffect(()=>{const key=(e:KeyboardEvent)=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();search();}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[navigate]);
  const links=<><NavLink to="/app/overview"><House size={21}/>{tx("Overview")}</NavLink><NavLink to="/app/library"><FolderSimple size={21}/>{tx("Library")}</NavLink><NavLink to="/app/shared"><ShareNetwork size={21}/>{tx("Shared & assigned")}</NavLink><NavLink to="/app/insights"><ChartBar size={21}/>{tx("Insights")}</NavLink>{user.role==='admin'&&<><NavLink to="/app/admin" end><ShieldCheck size={21}/>{tx("Administration")}</NavLink><NavLink to="/app/admin/users">{tx("Users")}</NavLink><NavLink to="/app/admin/audit">{tx("Audit log")}</NavLink></>}</>;
  return <div ref={motionRoot} className={`sf-app sf-live ${preferences.appearance?.reducedMotion?"reduce-motion":''}`} data-theme={resolved}>

    <a href="#sf-main" className="sf-skip" onClick={e=>{e.preventDefault();document.getElementById('sf-main')?.focus();}}>{tx("Skip to content")}</a>
    <aside className="sf-sidebar"><Link to="/app/overview" className="sf-logo" aria-label={tx("StethoFuse Overview")}><BrandMark className="sf-brand-symbol" width={38} height={38}/><span>StethoFuse</span></Link><div className="sf-workspace-label">{lt(liveRoleLabel(user.role))}</div><nav aria-label={tx("Main navigation")}>{lt(links)}</nav><div className="sf-sidebar-bottom"><div className="sf-private-note"><ShieldCheck size={22}/><span>{tx("Private workspace")}</span></div><nav aria-label={tx("Personal navigation")}><NavLink to="/app/settings"><GearSix size={21}/>{tx("Profile & settings")}</NavLink><NavLink to="/app/help"><Question size={21}/>{tx("Help")}</NavLink></nav><Link to="/app/profile" className="sf-sidebar-account"><div className="sf-identity sf-identity--compact"><span className="sf-avatar"><OwnAvatar name={user.display_name}/></span><span><strong>{user.display_name||'Your account'}</strong><small dir="ltr">{user.handle?`@${user.handle}`:liveRoleLabel(user.role)}</small></span></div></Link><button className="sf-signout" onClick={async()=>{try{await logout();navigate('/login');}catch{notify(tx("Sign-out could not be completed. Please retry."));}}}><SignOut size={18}/>{tx("Sign out")}</button></div></aside>
    <div className="sf-main-column"><header className="sf-topbar"><Button variant="icon" className="sf-mobile-menu" aria-label={tx("Open navigation")} onClick={()=>setDrawer(true)}><List size={23}/></Button><div className="sf-location"><Link to="/app/overview">{tx("Workspace")}</Link><span>/</span><strong>{lt(label)}</strong></div><div className="sf-topbar-actions"><NotificationBell/><LanguageSwitch/><Button variant="ghost" className="sf-search-shortcut" onClick={search}><MagnifyingGlass size={18}/><span>{tx("Find a recording")}</span><kbd>{lt(/Mac|iPhone|iPad/.test(navigator.platform)?'⌘':tx("Ctrl"))} {tx(" K")}</kbd></Button><Button variant="icon" aria-label={lt(resolved==='midnight'?tx("Switch to light mode"):tx("Switch to dark mode"))} onClick={()=>setTheme(resolved==='midnight'?"frost":"midnight")}>{resolved==='midnight'?<Sun size={20}/>:<Moon size={20}/>}</Button><Link to="/app/profile" className="sf-header-avatar" aria-label={tx("Open your profile")}><OwnAvatar name={user.display_name} compact/></Link></div></header>
    <main className="sf-main" id="sf-main" tabIndex={-1} data-live-workspace="true" data-entrance>{lt(children)}<footer className="sf-live-footer"><span>{tx("For research and education. Not a diagnostic tool.")}</span><nav aria-label={tx("Workspace footer")}><Link to="/privacy">{tx("Privacy")}</Link><Link to="/terms">{tx("Terms")}</Link><Link to="/app/help">{tx("Help")}</Link></nav></footer></main></div>
    <nav className="sf-mobile-nav" aria-label={tx("Mobile navigation")}><NavLink to="/app/overview"><House size={21}/>{tx("Overview")}</NavLink><NavLink to="/app/library"><FolderSimple size={21}/>{tx("Library")}</NavLink><NavLink to="/app/profile"><GearSix size={21}/>{tx("Profile")}</NavLink><Button variant="ghost" onClick={()=>setDrawer(true)}><List size={21}/>{tx("More")}</Button></nav>
    {drawer&&<Modal title={tx("Your workspace")} onClose={()=>setDrawer(false)} className="sf-navigation-dialog"><nav>{lt(links)}<Link to="/app/profile">{tx("Your profile")}</Link><Link to="/app/settings">{tx("Settings")}</Link><Link to="/app/help">{tx("Help")}</Link><Button variant="ghost" onClick={async()=>{try{await logout();navigate('/login');}catch{notify(tx("Sign-out could not be completed. Please retry."));}}}>{tx("Sign out")}</Button></nav></Modal>}
    {toast&&<div className="sf-toast" role="status">{lt(toast)}</div>}
  </div>;
}
export default function FrostShell({children}:{children:ReactNode}){const {session}=useLive();return <FrostPreferences key={session!.user.uid} uid={session!.user.uid}><NotificationProvider><ShellContent>{lt(children)}</ShellContent></NotificationProvider></FrostPreferences>;}
