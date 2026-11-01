import {createContext,useContext,useEffect,useState,type ReactNode} from 'react';
import {GlobeHemisphereWest} from '@phosphor-icons/react';
import arabic from './messages-ar';
import {useInitialView} from './InitialView';
export type Locale='en'|'ar';
const KEY='sf-language';
let serverLocale:Locale='en';
function read():Locale{try{return localStorage.getItem(KEY)==='ar'?'ar':'en';}catch{return 'en';}}
const LocaleContext=createContext<{locale:Locale;setLocale:(next:Locale)=>void}>({locale:'en',setLocale:()=>{}});
export function useLocale(){return useContext(LocaleContext);}
export function tx(text:string):string{
 if((typeof document==='undefined'?serverLocale:document.documentElement.lang)!=='ar')return text;
 const key=text.trim(),exact=arabic[key];if(exact)return text.replace(key,exact);
 const patterns:[RegExp,(...groups:string[])=>string][]=[
  [/^Resend available in (\d+)s$/,n=>`إعادة الإرسال بعد ${n} ث`],
  [/^(\d+)–(\d+) of (\d+)$/, (a,b,total)=>`${a}–${b} من ${total}`],
  [/^Copy (.+)$/,id=>`نسخ ${id}`],
  [/^Open (.+)$/,title=>`فتح ${title}`],
  [/^Play (Original|Heart|Lung|original|heart|lung)$/,source=>`تشغيل ${tx(source[0].toUpperCase()+source.slice(1))}`],
  [/^Pause (Original|Heart|Lung|original|heart|lung)$/,source=>`إيقاف ${tx(source[0].toUpperCase()+source.slice(1))} مؤقتًا`],
 ];
 for(const [pattern,translate] of patterns){const match=key.match(pattern);if(match)return text.replace(key,translate(...match.slice(1)));}
 return text;
}
/** Localize only rendered text. IDs, enum values, URLs and user data remain unchanged. */
export function lt<T>(value:T):T{return (typeof value==='string'?tx(value):value) as T;}
export function LocaleProvider({children}:{children:ReactNode}){
 const initial=useInitialView();const [locale,setLocale]=useState<Locale>(()=>typeof document==='undefined'?initial.locale:read());
 // Set synchronously as well as before paint: translations never wait for an effect.
 if(typeof document==='undefined')serverLocale=locale;
 else{document.documentElement.lang=locale;document.documentElement.dir=locale==='ar'?'rtl':'ltr';}
 useEffect(()=>{try{localStorage.setItem(KEY,locale);}catch{};document.title=locale==='ar'?'StethoFuse · أصغِ بوضوح':'StethoFuse · Listen clearly';},[locale]);
 return <LocaleContext.Provider value={{locale,setLocale}}>{children}</LocaleContext.Provider>;
}
export function LanguageSwitch(){const {locale,setLocale}=useLocale();return <button type="button" className="studio-language" lang={locale==='en'?'ar':'en'} aria-label={locale==='en'?'Switch language to Arabic':'تغيير اللغة إلى الإنجليزية'} onClick={()=>setLocale(locale==='en'?'ar':'en')}><GlobeHemisphereWest size={18}/><span>{locale==='en'?'العربية':'English'}</span></button>;}
export const localeTag=()=>document.documentElement.lang==='ar'?'ar':'en-GB';
