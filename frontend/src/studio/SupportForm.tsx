import {useRef,useState,type FormEvent} from 'react';
import {Link} from 'react-router-dom';
import {ArrowRight,CheckCircle,EnvelopeSimple,ShieldCheck} from '@phosphor-icons/react';
import {Button,Field,Notice} from '../components/ui';
import {tx,useLocale} from './locale';

export default function SupportForm(){
 const {locale}=useLocale(),form=useRef<HTMLFormElement>(null);
 const [name,setName]=useState(''),[email,setEmail]=useState(''),[subject,setSubject]=useState(''),[message,setMessage]=useState(''),[website,setWebsite]=useState('');
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[reference,setReference]=useState(''),[errors,setErrors]=useState<Record<string,string>>({});
 async function submit(event:FormEvent){
  event.preventDefault();const next={name:name.trim().length>=2?'':tx('Enter your name.'),email:/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email.trim())?'':tx('Enter a valid email address.'),subject:subject.trim().length>=3?'':tx('Add a short subject.'),message:message.trim().length>=10?'':tx('Tell us a little more, using at least 10 characters.')};
  setErrors(next);setError('');if(Object.values(next).some(Boolean)){requestAnimationFrame(()=>form.current?.querySelector<HTMLElement>('[aria-invalid=true]')?.focus());return;}
  setBusy(true);const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
  try{
   const response=await fetch('/api/support',{method:'POST',credentials:'omit',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:name.trim(),email:email.trim(),subject:subject.trim(),message:message.trim(),website,locale}),signal:controller.signal});
   const value=await response.json().catch(()=>null);
   if(response.status===429){setError(tx('Please wait a minute before sending another message.'));return;}
   if(!response.ok||value?.ok!==true||typeof value.reference!=='string')throw new Error('support_not_confirmed');
   setReference(value.reference);
  }catch{setError(tx('We could not confirm delivery. Your message is still here. Please try again shortly.'));}
  finally{clearTimeout(timer);setBusy(false);}
 }
 return <div className="support-grid"><header><span className="support-eyebrow"><EnvelopeSimple size={20}/>{tx('Support')}</span><h1>{tx('A little help. A clear next step.')}</h1><p>{tx('Tell us what happened and what you were trying to do. We’ll receive your message directly from this page.')}</p><div className="support-guidance"><ShieldCheck size={22}/><p>{tx('Include useful details, but never passwords, patient information or private recordings.')}</p></div><p className="support-help-link"><Link to="/help">{tx('Browse workspace help')}<ArrowRight size={18}/></Link></p></header>
  {reference?<section className="support-confirmation" aria-live="polite"><CheckCircle size={40}/><h2>{tx('Your message is on its way.')}</h2><p>{tx('Support has accepted your message. We’ll reply to the email address you provided.')}</p><p className="muted">{tx('Message reference')}<br/><code dir="ltr">{reference}</code></p><Button to="/">{tx('Back to home')}<ArrowRight size={18}/></Button><button type="button" className="inline-link" onClick={()=>{setReference('');setSubject('');setMessage('');}}>{tx('Send another message')}</button></section>:<form ref={form} className="support-form" data-ui="support-form" noValidate onSubmit={submit} aria-busy={busy}>
   <Field label={tx('Full name')} error={errors.name}><input name="name" autoComplete="name" dir="auto" required maxLength={100} value={name} onChange={e=>setName(e.target.value)}/></Field>
   <Field label={tx('Email address')} error={errors.email}><input name="email" type="email" autoComplete="email" dir="ltr" required maxLength={254} placeholder="you@domain.com" value={email} onChange={e=>setEmail(e.target.value)}/></Field>
   <Field label={tx('Subject')} error={errors.subject}><input name="subject" dir="auto" required minLength={3} maxLength={140} value={subject} onChange={e=>setSubject(e.target.value)}/></Field>
   <Field label={tx('How can we help?')} error={errors.message}><textarea name="message" dir="auto" required minLength={10} maxLength={4000} rows={6} value={message} onChange={e=>setMessage(e.target.value)}/></Field>
   <div className="support-honeypot" aria-hidden="true"><label>Website<input name="website" autoComplete="off" tabIndex={-1} value={website} onChange={e=>setWebsite(e.target.value)}/></label></div>
   {error&&<Notice tone="danger"><p role="alert">{error}</p></Notice>}
   <p className="support-privacy">{tx('Your details and message are sent to the project owner for support.')} <Link to="/privacy">{tx('Privacy')}</Link></p>
   <Button type="submit" disabled={busy}>{tx(busy?'Sending your message…':'Send message')}<ArrowRight size={18}/></Button>
  </form>}
 </div>;
}
