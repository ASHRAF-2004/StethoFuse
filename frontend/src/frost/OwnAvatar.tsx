import {useLive} from '../data/live';
export function OwnAvatar({name,compact=false}:{name:string;compact?:boolean}) {
  const {avatar}=useLive();
  return avatar?<img src={'data:image/png;base64,'+avatar.base64} width={128} height={128} alt="" aria-hidden="true"/>:<>{compact?(name||'Account')[0]:(name||'Account').split(' ').map(n=>n[0]).slice(0,2).join('')}</>;
}
