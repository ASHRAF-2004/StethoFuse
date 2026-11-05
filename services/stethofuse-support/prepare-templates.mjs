import {writeFile,mkdir} from 'node:fs/promises';
import {accountEmail} from './email-theme.mjs';
await mkdir(new URL('./templates/',import.meta.url),{recursive:true});
for(const kind of ['resetPassword','verifyEmail','changeEmail'])await writeFile(new URL('./templates/'+kind+'.html',import.meta.url),accountEmail(kind));
console.log('Prepared three branded HTML templates; password recovery remains one Firebase flow.');
