import {useEffect,type ReactNode} from 'react';
import {Moon,Sun} from '@phosphor-icons/react';
import {usePublicTheme} from './frost/publicTheme';
export function ForestTheme({children}:{children:ReactNode}){
 const {resolved,setTheme}=usePublicTheme();
 useEffect(()=>{document.documentElement.dataset.forestTheme=resolved==='midnight'?'night':'day';},[resolved]);
 return <>{children}<button className="forest-site-toggle" aria-label={`Switch to forest ${resolved==='midnight'?'Day':'Night'} theme`} onClick={()=>setTheme(resolved==='midnight'?'frost':'midnight')}>{resolved==='midnight'?<Sun size={20}/>:<Moon size={20}/>}<span>{resolved==='midnight'?'Daylight':'Moonlight'}</span></button></>;
}
