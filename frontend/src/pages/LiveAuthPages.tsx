import {lt} from '../studio/locale';
import {tx} from '../studio/locale';
import {useEffect,useRef,useState,type FormEvent} from 'react';
import {Link,Navigate,useNavigate,useSearchParams,useLocation} from 'react-router-dom';
import {ArrowRight,EnvelopeSimple} from '@phosphor-icons/react';
import {AuthLayout,AuthTitle,PasswordInput,safeReturn} from './PublicPages';
import {Button,Field,Notice} from '../components/ui';
import {AuthGoogleMark} from '../components/AuthScenery';
import {authAdapter} from '../data/adapters';
import {liveAuth,authErrorMessage} from '../auth/firebase';
import {firebaseConfigurationError} from '../config/runtime';
import {useLive} from '../data/live';
import {useLocale} from '../studio/locale';

const paths=new Set(['/login','/register','/forgot-password','/reset-password','/verify-email','/auth/action','/auth/callback','/account-disabled','/session-expired']);
export const isLiveAuthPath=(path:string)=>paths.has(path);
const validEmail=(email:string)=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const strongPassword=(value:string)=>value.length>=12&&/[A-Za-z]/.test(value)&&/[0-9]/.test(value);
function ConfigurationNotice(){return firebaseConfigurationError?<Notice tone="warning" title={tx("Authentication setup required")}><p>{lt(firebaseConfigurationError)}</p></Notice>:null;}
function AccountDeletionNotice(){const {state}=useLocation(),{accountDeletion}=useLive();const receipt=accountDeletion||(state?.accountDeleted?state:null);return receipt?<Notice><p role="status">{tx("Your StethoFuse account and its owned live recordings and results have been deleted.")}{lt(receipt.providerCleanupPending?tx(" Firebase account removal was not confirmed. Contact the project owner to finish provider cleanup."):'')}</p></Notice>:null;}
function Feedback({error,message}:{error?:string;message?:string}){return <>{error&&<Notice tone="danger"><p>{lt(error)}</p></Notice>}{message&&<Notice><p role="status">{lt(message)}</p></Notice>}</>;}
function GoogleButton(){
 const [busy,setBusy]=useState(false),[error,setError]=useState('');const navigate=useNavigate();const [params]=useSearchParams();
 async function begin(){setBusy(true);setError('');try{await authAdapter.signInWithGoogle();navigate(safeReturn(params.get('returnTo')));}catch(failure){setError(authErrorMessage(failure));}finally{setBusy(false);}}
 return <><Button variant="secondary" disabled={busy||!!firebaseConfigurationError} onClick={begin}><AuthGoogleMark/>{lt(busy?tx("Connecting…"):tx("Continue with Google"))}</Button><Feedback error={error}/></>;
}
function SignIn({register=false}:{register?:boolean}){
 const {status,error:sessionError,refreshAccount}=useLive();const [params]=useSearchParams();const navigate=useNavigate();
 const [name,setName]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[confirmation,setConfirmation]=useState('');
 const [accepted,setAccepted]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [errors,setErrors]=useState<Record<string,string>>({});const form=useRef<HTMLFormElement>(null);
 const destination=safeReturn(params.get('returnTo'));
 if(status==='ready')return <Navigate replace to={destination}/>;
 if(status==='unverified'&&!register)return <Navigate replace to="/verify-email"/>;
 async function submit(event:FormEvent){
  event.preventDefault();const next={email:validEmail(email.trim())?'':tx("Enter a valid email address."),password:register?(strongPassword(password)?'':tx("Use at least 12 characters with a letter and a number.")):(password?'':tx("Enter your password.")),name:!register||name.trim().length>=2?'':tx("Enter your name."),confirmation:!register||password===confirmation?'':tx("Passwords must match."),terms:!register||accepted?'':tx("Please read and accept the terms and privacy notice.")};
  setErrors(next);if(Object.values(next).some(Boolean)){requestAnimationFrame(()=>form.current?.querySelector<HTMLElement>('[aria-invalid=true]')?.focus());return;}
  setBusy(true);setError('');
  try{if(register){await authAdapter.register(name.trim(),email.trim(),password);navigate('/verify-email');}else{await authAdapter.signIn(email.trim(),password);navigate(destination);}}
  catch(failure){setError(authErrorMessage(failure));}finally{setPassword('');setConfirmation('');setBusy(false);}
 }
 return <AuthLayout><AuthTitle title={lt(register?tx("A place for every signal."):tx("Welcome back."))} description={register?tx("Create your account to record, separate and listen."):tx("Sign in to continue to your workspace.")}/><ConfigurationNotice/><AccountDeletionNotice/>
  {status==='error'&&!firebaseConfigurationError&&<><Feedback error={sessionError}/><Button variant="secondary" onClick={()=>void refreshAccount()}>{tx("Retry account connection")}</Button></>}
  <form ref={form} noValidate onSubmit={submit} aria-busy={busy}>
   {register&&<Field label={tx("Full name")} error={errors.name}><input name="name" autoComplete="name" maxLength={200} value={name} onChange={e=>setName(e.target.value)} required/></Field>}
   <Field label={tx("Email address")} error={errors.email}><div className="auth-input-icon"><EnvelopeSimple size={18} aria-hidden="true"/><input name="email" aria-label={tx("Email address")} type="email" autoComplete="username" placeholder={tx("you@domain.com")} value={email} onChange={e=>setEmail(e.target.value)} aria-invalid={!!errors.email} required/></div></Field>
   <PasswordInput id={register?"new-password":"password"} label={tx("Password")} autoComplete={register?"new-password":"current-password"} value={password} onChange={setPassword} error={errors.password} hint={register?tx("Use at least 12 characters, including a letter and a number."):undefined}/>
   {register?<><PasswordInput id="confirm-password" label={tx("Confirm password")} value={confirmation} onChange={setConfirmation} error={errors.confirmation}/><label className="auth-consent"><input type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)}/><span>{tx("I have read the ")}<Link to="/terms">{tx("draft terms")}</Link> {tx(" and ")}<Link to="/privacy">{tx("privacy notice")}</Link>.</span></label>{errors.terms&&<p role="alert" className="field-error">{lt(errors.terms)}</p>}<p className="auth-account-scope">{tx("Your account starts with a personal workspace. Analyst access is assigned separately.")}</p></>:<><div className="auth-links"><span className="session-hint">{tx("Private browser session")}</span><Link to="/forgot-password">{tx("Forgot password?")}</Link></div></>}
   <Feedback error={error}/><Button type="submit" disabled={busy||!!firebaseConfigurationError}>{lt(busy?(register?tx("Creating account…"):tx("Signing in…")):(register?tx("Create account"):tx("Sign in")))}<ArrowRight size={17}/></Button>
  </form><div className="form-divider">{tx("or")}</div><GoogleButton/><p className="auth-meta">{lt(register?tx("Already have an account? "):tx("New here? "))}<Link to={register?'/login':'/register'}>{lt(register?tx("Sign in"):tx("Create an account"))}</Link></p></AuthLayout>;
}
function Forgot(){
 const [email,setEmail]=useState(''),[error,setError]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 async function submit(e:FormEvent){e.preventDefault();setError('');if(!validEmail(email.trim())){setError(tx("Enter a valid email address."));return;}setBusy(true);try{await authAdapter.sendPasswordReset(email.trim());setMessage(tx("If an account uses this address, you’ll receive a reset link. Check your inbox and spam folder."));}catch(failure){setError(authErrorMessage(failure));}finally{setBusy(false);}}
 return <AuthLayout><AuthTitle title={lt(message?tx("Check your inbox."):tx("A fresh start."))} description={tx("Enter your email and we’ll help you get back to your workspace.")}/><ConfigurationNotice/><AccountDeletionNotice/><form noValidate onSubmit={submit}><Field label={tx("Email address")}><input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required/></Field><Feedback error={error} message={message}/><Button type="submit" disabled={busy||!!message||!!firebaseConfigurationError}>{lt(busy?tx("Requesting…"):tx("Request reset link"))}</Button></form><p className="auth-meta"><Link to="/login">{tx("Back to sign in")}</Link></p></AuthLayout>;
}
function EmailAction({mode}:{mode:'resetPassword'|'verifyEmail'|null}){
 const [params,setParams]=useSearchParams();
 // Read once into component memory, then replace the sensitive URL. Never log,
 // forward, render or persist action codes. Reload requires reopening the email.
 const [code]=useState(()=>params.get('oobCode')||'');
 const [stage,setStage]=useState<'checking'|'ready'|'success'|'invalid'>('checking');
 const [error,setError]=useState(''),[password,setPassword]=useState(''),[confirmation,setConfirmation]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{setParams({}, {replace:true});let cancelled=false;
  if(!code||!mode||firebaseConfigurationError){setStage('invalid');return;}
  const operation=mode==='resetPassword'?liveAuth.checkReset(code):liveAuth.verifyEmail(code);
  void operation.then(()=>{if(!cancelled)setStage(mode==='resetPassword'?"ready":"success");}).catch(failure=>{if(!cancelled){setStage('invalid');setError(authErrorMessage(failure));}});
  return()=>{cancelled=true;};
 // Code consumption must not repeat when removing the query changes router state.
 },[code,mode]);
 async function reset(e:FormEvent){e.preventDefault();setError('');if(!strongPassword(password)||password!==confirmation){setError(tx("Use at least 12 characters with a letter and a number, and matching passwords."));return;}setBusy(true);try{await liveAuth.reset(code,password);setStage('success');}catch(failure){setError(authErrorMessage(failure));setStage('invalid');}finally{setPassword('');setConfirmation('');setBusy(false);}}
 return <AuthLayout><AuthTitle title={lt(stage==='success'?(mode==='verifyEmail'?tx("Your email is verified."):tx("Your password has been reset.")):stage==='invalid'?tx("This link cannot be used."):mode==='resetPassword'?tx("Choose a new password."):tx("Checking your verification link…"))} description={stage==='success'?tx("You’re all set. Sign in to continue."):tx("This link keeps your account secure. It can only be used once.")}/><ConfigurationNotice/><AccountDeletionNotice/><Feedback error={error}/>{stage==='checking'?<p role="status">{tx("Checking the account link…")}</p>:stage==='ready'?<form onSubmit={reset}><PasswordInput id="new-password" label={tx("New password")} value={password} onChange={setPassword}/><PasswordInput id="confirm-password" label={tx("Confirm new password")} value={confirmation} onChange={setConfirmation}/><Button type="submit" disabled={busy}>{lt(busy?tx("Updating…"):tx("Reset password"))}</Button></form>:stage==='invalid'?<><Notice tone="warning">{tx("The link is missing, expired, already used or invalid. Request a fresh link; no success is assumed.")}</Notice><Button to={mode==='verifyEmail'?'/verify-email':'/forgot-password'}>{tx("Request a new link")}</Button></>:null}<p className="auth-meta"><Link to="/login">{tx("Return to sign in")}</Link></p></AuthLayout>;
}
function Verification(){
 const {status,refreshIdentity,logout}=useLive();const [error,setError]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[remaining,setRemaining]=useState(0);
 useEffect(()=>{if(!remaining)return;const timer=setTimeout(()=>setRemaining(x=>x-1),1000);return()=>clearTimeout(timer);},[remaining]);
 async function run(action:()=>Promise<void>,sent=false){setBusy(true);setError('');try{await action();if(sent){setMessage(tx("Verification email requested. Check your inbox and spam folder."));setRemaining(30);}}catch(failure){setError(authErrorMessage(failure));}finally{setBusy(false);}}
 if(status==='ready')return <Navigate replace to="/app/dashboard"/>;
 if(status==='signed-out'||status==='expired')return <Navigate replace to="/login"/>;
 return <AuthLayout><AuthTitle title={tx(message?'Check your inbox.':'Verify your email.')} description={tx("Verify your email to open your private workspace.")}/><ConfigurationNotice/><AccountDeletionNotice/><Feedback error={error} message={message}/><Notice>{tx('Choose Send verification email, open the link in your inbox, then return here. Sending is requested only when you choose the button.')}</Notice><Button disabled={busy||remaining>0||!!firebaseConfigurationError} onClick={()=>void run(()=>liveAuth.sendVerification(),true)}>{lt(remaining?`Resend available in ${remaining}s`:tx("Send verification email"))}</Button><Button variant="secondary" disabled={busy||!!firebaseConfigurationError} onClick={()=>void run(refreshIdentity)}>{tx("I have verified my email")}</Button><p className="auth-meta"><button className="inline-link" onClick={()=>void logout().catch(failure=>setError(authErrorMessage(failure)))}>{tx("Sign out to use a different account")}</button><span> · </span><Link to="/login">{tx("Back to sign in")}</Link></p></AuthLayout>;
}
function AccountState({expired=false}:{expired?:boolean}){
 const {logout}=useLive(),navigate=useNavigate();const [params]=useSearchParams();const [error,setError]=useState('');
 return <AuthLayout><AuthTitle title={lt(expired?tx("Let’s reconnect."):tx("This account is restricted."))} description={expired?tx("Your identity session has expired. Sign in again to continue."):tx("Contact your workspace administrator to restore access.")}/><Notice>{tx("Your session is closed. Sign in again with an active, verified account to open your workspace.")}</Notice><Feedback error={error}/><Button onClick={async()=>{try{await logout();navigate(`/login?returnTo=${encodeURIComponent(safeReturn(params.get('returnTo')))}`);}catch(failure){setError(authErrorMessage(failure));}}}>{tx("Sign out and return to sign in")}</Button></AuthLayout>;
}
export default function LiveAuthPages({path}:{path:string}){
 useLocale();
 const [params]=useSearchParams();const [actionMode]=useState(()=>params.get('mode'));const [hasActionCode]=useState(()=>params.has('oobCode'));
 if(path==='/login')return <SignIn/>;
 if(path==='/register')return <SignIn register/>;
 if(path==='/forgot-password')return <Forgot/>;
 if(path==='/reset-password')return <EmailAction mode="resetPassword"/>;
 if(path==='/auth/action')return <EmailAction mode={actionMode==='resetPassword'||actionMode==='verifyEmail'?actionMode:null}/>;
 if(path==='/verify-email')return hasActionCode?<EmailAction mode="verifyEmail"/>:<Verification/>;
 if(path==='/account-disabled')return <AccountState/>;
 if(path==='/session-expired')return <AccountState expired/>;
 return <AuthLayout><AuthTitle title={tx("Return to sign in.")} description={tx("Google authentication completes through the official popup. This route is not a Firebase OAuth handler.")}/><Button to="/login">{tx("Back to sign in")}</Button></AuthLayout>;
}
