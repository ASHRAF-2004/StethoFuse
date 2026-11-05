import {tx,useLocale} from '../studio/locale';

export function SiteCredit(){
 const {locale}=useLocale();
 return <span className="site-credit"><span dir="ltr">© 2026</span> {tx('Designed and developed by:')} <bdi>{locale==='ar'?'أشرف علي حسين الصلول':'Ashraf Ali Hussain Al-Saloul'}</bdi></span>;
}
