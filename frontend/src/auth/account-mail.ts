type MailKind='reset'|'verify';
const unavailable=()=>Object.assign(new Error('Account email is temporarily unavailable.'),{code:'auth/network-request-failed'});

/** Public capability only: never cache a user's email, ID token or action link. */
export async function requestAccountMail(kind:MailKind,email?:string,idToken?:string):Promise<boolean>{
 let health:Response;
 try{health=await fetch('/api/account-mail/health',{cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(4000)});}catch{throw unavailable();}
 // The existing provider remains active until the dedicated service is installed.
 if(health.status===404||health.status===410)return false;
 let capability:{service?:string;status?:string;version?:string};
 try{capability=await health.json();}catch{throw unavailable();}
 if(!health.ok||capability.service!=='stethofuse-account-mail'||capability.status!=='configured'||capability.version!=='1')throw unavailable();
 let result:Response;
 try{result=await fetch('/api/account-mail/'+kind,{method:'POST',cache:'no-store',credentials:'omit',headers:{'Content-Type':'application/json',...(kind==='verify'&&idToken?{Authorization:'Bearer '+idToken}:{})},body:JSON.stringify({locale:document.documentElement.lang==='ar'?'ar':'en',...(kind==='reset'?{email}:{})}),signal:AbortSignal.timeout(25000)});}catch{throw unavailable();}
 if(result.status===429)throw Object.assign(new Error('Please wait before requesting another email.'),{code:'auth/too-many-requests'});
 if(result.status===401)throw Object.assign(new Error('Sign in again.'),{code:'auth/user-token-expired'});
 let value:{ok?:boolean;reference?:string};try{value=await result.json();}catch{throw unavailable();}
 if(result.status!==202||value.ok!==true||typeof value.reference!=='string'||!/^[a-f0-9-]{36}$/.test(value.reference))throw unavailable();
 return true;
}
