import {useEffect,useState} from 'react';
import type {Theme} from './contracts';

// Only the appearance choice is shared with public pages, never an account ID.
export const PUBLIC_THEME_KEY='sf-public-theme';
export function readPublicTheme():Theme {
  try {const theme=localStorage.getItem(PUBLIC_THEME_KEY);if(theme==='frost'||theme==='midnight'||theme==='system')return theme;}catch{/* Device storage may be unavailable. */}
  return 'system';
}
export function rememberPublicTheme(theme:Theme) {
  try{localStorage.setItem(PUBLIC_THEME_KEY,theme);}catch{/* The in-memory choice still works. */}
  window.dispatchEvent(new Event('sf-theme-change'));
}
export function usePublicTheme() {
  const [theme,setChoice]=useState(readPublicTheme);
  const [dark,setDark]=useState(()=>matchMedia('(prefers-color-scheme: dark)').matches);
  useEffect(()=>{
    const media=matchMedia('(prefers-color-scheme: dark)');
    const changed=()=>setDark(media.matches),stored=()=>setChoice(readPublicTheme());
    media.addEventListener('change',changed);
    window.addEventListener('storage',stored);window.addEventListener('sf-theme-change',stored);
    return()=>{media.removeEventListener('change',changed);window.removeEventListener('storage',stored);window.removeEventListener('sf-theme-change',stored);};
  },[]);
  const resolved=theme==='system'?(dark?'midnight':'frost'):theme;
  return {resolved,setTheme:(value:Theme)=>{setChoice(value);rememberPublicTheme(value);}};
}
