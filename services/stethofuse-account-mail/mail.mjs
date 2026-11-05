import {htmlEmail,escapeHTML} from '../stethofuse-support/email-theme.mjs';
export const SENDER='stethofuse@notify.stethofuse.ashraf-alsaloul.com';

export function accountMessage({kind,locale,email,link,reference}){
 const ar=locale==='ar',reset=kind==='reset';
 const title=ar?(reset?'كلمة مرور جديدة.':'أكّد بريدك الإلكتروني.'):(reset?'Reset your password.':'Verify your email.');
 const description=ar?(reset?'طلبت إعادة تعيين كلمة المرور لحسابك في StethoFuse. افتح الرابط الآمن لاختيار كلمة مرور جديدة.':'أكّد عنوان بريدك الإلكتروني لفتح مساحة عملك الخاصة في StethoFuse.'):(reset?'You requested a new password for your StethoFuse account. Use the secure link below to choose one.':'Confirm your email address to open your private StethoFuse workspace.');
 const label=ar?(reset?'إعادة تعيين كلمة المرور':'تأكيد البريد الإلكتروني'):(reset?'Reset password':'Verify email');
 const safety=ar?(reset?'إذا لم تطلب ذلك، تجاهل هذه الرسالة. ستبقى كلمة المرور كما هي.':'إذا لم تنشئ هذا الحساب، تجاهل هذه الرسالة.'):(reset?'If you did not request this, ignore this email. Your password stays unchanged.':'If you did not create this account, ignore this email.');
 const fallback=ar?'يمكنك نسخ هذا الرابط الآمن إلى متصفحك:':'You can also copy this secure link into your browser:';
 const body=`<p style="margin:0 0 16px">${description}</p><p class="email-muted" style="color:#53615a;font-size:13px">${safety}</p><p class="email-muted" style="color:#53615a;font-size:12px;margin-top:24px">${fallback}<br><a href="${escapeHTML(link)}" style="color:#3e6451;word-break:break-all" dir="ltr">${escapeHTML(link)}</a></p><p class="email-muted" style="font-size:11px;color:#53615a" dir="ltr">${escapeHTML(reference)}</p>`;
 return {from:{email:SENDER,name:'StethoFuse'},to:email,subject:ar?(reset?'إعادة تعيين كلمة المرور — StethoFuse':'تأكيد بريدك الإلكتروني — StethoFuse'):(reset?'Reset your StethoFuse password':'Verify your StethoFuse email'),text:[title,description,label+': '+link,safety,'StethoFuse · '+(ar?'للبحث والتعليم. ليست أداة للتشخيص.':'For research and education. Not a diagnostic tool.'),reference].join('\n\n'),html:htmlEmail({eyebrow:ar?'حسابك في STETHOFUSE':'YOUR STETHOFUSE ACCOUNT',title,body,action:{url:link,label},locale})};
}
