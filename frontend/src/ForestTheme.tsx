import {useEffect,type ReactNode} from 'react';
import {Moon,Sun} from '@phosphor-icons/react';
import {usePublicTheme} from './frost/publicTheme';
export function ForestTheme({children}:{children:ReactNode}){
 const {resolved,setTheme}=usePublicTheme();
 useEffect(()=>{
  const root=document.documentElement,night=resolved==='midnight',color=night?'#101f1c':'#f3f5ef';
  root.dataset.forestTheme=night?'night':'day';root.style.backgroundColor=color;root.style.colorScheme=night?'dark':'light';
  const meta=document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');if(meta)meta.content=color;
 },[resolved]);
 return <>{children}<button className="forest-site-toggle" aria-label={`Switch to forest ${resolved==='midnight'?'Day':'Night'} theme`} onClick={()=>setTheme(resolved==='midnight'?'frost':'midnight')}>{resolved==='midnight'?<Sun size={20}/>:<Moon size={20}/>}<span>{resolved==='midnight'?'Daylight':'Moonlight'}</span></button></>;
}
