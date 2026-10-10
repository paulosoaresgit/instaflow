(() => {
"use strict";
const $ = id => document.getElementById(id);
const hide = (id, yes) => $(id)?.classList.toggle("hidden", yes);
const safe = s => String(s ?? "").replace(/[&<>"']/g, ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
let config=null, session=null, model=null, selectedLesson=null, busy=false;
const storage="gf_member_session_v1";
const english=document.documentElement.lang.startsWith("en");
const dictionary={
 "Não foi possível completar a solicitação.":"Unable to complete this request.",
 "Configuração da área de membros indisponível.":"Members area configuration is unavailable.",
 "A conexão da área de membros ainda não foi ativada. Entre em contato com o suporte.":"Member login has not been activated yet. Contact support.",
 "Sua sessão expirou. Entre novamente.":"Your session has expired. Please sign in again.",
 "Enviando código...":"Sending login code...",
 "Código enviado. Confira o e-mail (inclusive spam).":"Code sent. Check inbox and spam.",
 "Validando seu código...":"Verifying code...",
 "Salvando perfil...":"Saving profile...",
 "Processando solicitação...":"Processing your request...",
 "Solicitação registrada.":"Request recorded.",
 "Entrega diária automática solicitada. Ela depende da aprovação da conta e do provedor.":"Automatic daily delivery selected, pending verification and provider availability.",
 "Entrega automática desativada.":"Automatic delivery disabled."
};
const translate=s=>english?(dictionary[s]||s):s;
const flash=(id,s)=>{if($(id))$(id).textContent=translate(s)||""};
const showing=name=>["login-view","app-view","pending-view"].forEach(id=>hide(id,id!==name));
const supa=(path)=>config.supabaseUrl.replace(/\/$/,"")+path;
const authHeaders=()=>({"Content-Type":"application/json","apikey":config.publishableKey,"Authorization":"Bearer "+(session?.access_token||config.publishableKey)});
async function jsonRequest(url, opts={}){
 const response=await fetch(url,{...opts});let data;try{data=await response.json()}catch{data={}};
 if(!response.ok)throw new Error(data?.error_description||data?.msg||data?.message||data?.error||"Não foi possível completar a solicitação.");
 return data;
}
async function loadConfig(){
 const resp=await fetch("/membros/config.json",{cache:"no-store"});
 if(!resp.ok)throw Error("Configuração da área de membros indisponível.");
 config=await resp.json();
 if(!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(config.supabaseUrl||"")||!config.publishableKey)throw Error("A conexão da área de membros ainda não foi ativada. Entre em contato com o suporte.");
}
async function verifySession(){
 if(!session?.access_token)return false;
 try{
  if(session.expires_at && (session.expires_at*1000)<Date.now()+60000&&session.refresh_token){
   const next=await jsonRequest(supa("/auth/v1/token?grant_type=refresh_token"),{method:"POST",headers:{"Content-Type":"application/json","apikey":config.publishableKey},body:JSON.stringify({refresh_token:session.refresh_token})});
   session=next;saveSession();
  }
  const r=await jsonRequest(supa("/auth/v1/user"),{headers:authHeaders()});
  if(!r?.email_confirmed_at)throw Error("Confirme seu e-mail antes de acessar.");
  $("who").textContent=r.email||"";hide("logout",false);return true;
 }catch{logout(false);return false}
}
function saveSession(){sessionStorage.setItem(storage,JSON.stringify(session))}
function logout(refresh=true){session=null;sessionStorage.removeItem(storage);hide("logout",true);$("who").textContent="";if(refresh){showing("login-view");hide("otp-form",true);hide("email-form",false);flash("login-msg","")}}
async function call(action, extra={}){
 if(!session?.access_token)throw Error("Sua sessão expirou. Entre novamente.");
 return jsonRequest(supa("/functions/v1/members-portal"),{
 method:"POST",headers:authHeaders(),body:JSON.stringify({action,lang:document.documentElement.lang.startsWith("en")?"en":"pt",...extra})});
}
async function renderDashboard(){
 model=await call("overview");
 if(!model?.hasAccess){$("pending-email").textContent=model?.email||session?.user?.email||"";showing("pending-view");return;}
 const q=model.quota||{limit:10,remaining:0,used:0};
 const growthAllowed=model.hasGrowthPlan===true;
 $("stat-limit").textContent=growthAllowed?q.limit:"—";$("stat-remaining").textContent=growthAllowed?q.remaining:"—";
 $("quota-left").textContent=q.remaining;
 $("quota-max").textContent=english?"out of "+q.limit+" available":"de "+q.limit+" disponíveis";
 $("quota-bar").style.width=Math.min(100,Math.max(0,100*(q.used||0)/(q.limit||10)))+"%";
 $("instagram-user").value=model.profile?.instagram_username||"";
 const verified=model.profile?.handle_verified===true;
 $("auto-switch").checked=model.profile?.auto_delivery_enabled===true;
 const providerReady=model.providerReady===true;
 $("profile-status").textContent=model.profile?.instagram_username?(verified?(english?"✓ Profile verified for requests.":"✓ Perfil validado para solicitações."):(english?"Profile saved; awaiting ownership verification.":"Perfil cadastrado; aguardando validação de titularidade.")):(english?"Enter your profile to get started.":"Cadastre seu perfil para começar.");
 $("request-btn").disabled=!(growthAllowed&&verified&&providerReady&&q.remaining>0);
 $("request-btn").textContent=!growthAllowed?(english?"Requires a main follower plan":"Requer plano principal de seguidores"):!providerReady?(english?"Delivery integration not configured":"Integração de entrega em configuração"):!verified?(english?"Waiting for profile verification":"Aguardando validação do perfil"):q.remaining<1?(english?"Daily limit reached":"Limite diário atingido"):(english?"Request "+q.remaining+" followers today":"Solicitar "+q.remaining+" seguidores hoje");
 const claims=model.claims||[];
 $("claim-list").innerHTML=claims.length?claims.map(c=>'<div class="history-row"><div><strong>'+safe(c.quantity)+' seguidores</strong><div><span>'+safe(c.request_day)+' · '+safe(c.status)+'</span></div></div><span>'+safe(c.provider_order_id?"#"+c.provider_order_id:"—")+'</span></div>').join(""):'<p class="muted">Nenhuma solicitação registrada.</p>';
 const lessons=model.lessons||[],done=lessons.filter(l=>l.completed).length;
 $("stat-lessons").textContent=done+" / "+lessons.length;
 $("account-summary").textContent=model.isOperator
  ?(english?"Operator preview enabled. Do not confuse this with a verified customer purchase.":"Prévia do administrador habilitada. Esse acesso não representa uma compra de cliente.")
  :(english?"Purchase verified. Your complete digital library is unlocked. External service delivery is governed by your purchased plan.":"Compra verificada. Sua biblioteca digital completa foi liberada. A entrega de serviços externos segue o plano contratado.");
 drawLessons(lessons);drawExtras(model.extras||[]);
 showing("app-view");tab("home");
}
function tab(which){
 document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("hidden",x.id!=="tab-"+which));
 document.querySelectorAll("[data-tab]").forEach(x=>x.classList.toggle("active",x.dataset.tab===which));
 window.scrollTo({top:0,behavior:"smooth"});
}
function drawLessons(list){
 const groups=new Map();
 for(const l of list){
  const title=l.module_title||"Aulas extras";
  if(!groups.has(title))groups.set(title,[]);
  groups.get(title).push(l);
 }
 $("lesson-nav").replaceChildren();
 for(const [title,items] of groups){
  const wrap=document.createElement("div");wrap.className="module";
  const head=document.createElement("h3");head.textContent=title;wrap.appendChild(head);
  for(const l of items.sort((a,b)=>a.position-b.position)){
   const btn=document.createElement("button");btn.textContent=(l.completed?"✓ ":"▷ ")+l.title;
   btn.addEventListener("click",()=>showLesson(l));wrap.appendChild(btn);
  }
  $("lesson-nav").appendChild(wrap);
 }
 if(list.length)showLesson(list[0]);
}
function showLesson(l){
 selectedLesson=l;
 $("lesson-meta").textContent=(l.upsell_slug?(english?"BONUS LESSON":"AULA EXTRA"):(english?"MAIN COURSE":"CURSO PRINCIPAL"))+" · "+(l.module_title||"");
 $("lesson-title").textContent=l.title;
 $("lesson-content").textContent=l.body;
 $("done-btn").classList.toggle("hidden",!!l.completed);
}
const downloadableResources={
 "upsell-1":[["viral-kit-pdf","PDF · 30 Reels briefs"],["viral-calendar-xlsx","Excel · Content calendar"],["viral-calendar-csv","CSV · Content calendar"]],
 "downsell-1":[["prompts-pdf","PDF · 18 prompts"],["prompts-editable","Editable prompts"]],
 "upsell-2":[["studio-guide","PDF · Getting started"],["studio-brief","Editable creative brief"]],
 "upsell-3":[["retention-pdf","PDF · Audience playbook"],["retention-xlsx","Excel · Audience tracker"]]
};
const resourceIcon={"upsell-1":"🎬","downsell-1":"✦","upsell-2":"🤖","upsell-3":"📈"};
function drawExtras(extras){
 const available=new Set((model?.library||[]).map(item=>item.id));
 $("extras-grid").innerHTML=extras.map(x=>{
  const links=(downloadableResources[x.slug]||[]).filter(([id])=>available.has(id))
   .map(([id,title])=>'<button type="button" class="resource-download" data-asset="'+safe(id)+'">↓ '+safe(title)+'</button>').join("");
  const studio=x.slug==="upsell-2"?'<a class="resource-studio" href="https://personalab-ai-gainflow.vercel.app/" target="_blank" rel="noopener noreferrer">'+(english?"Open PersonaLab Studio ↗":"Abrir PersonaLab AI Studio ↗")+'</a><p class="smallinfo">'+(english?"Sign in with your verified purchase email. Higgsfield provider fees are separate.":"Entre com o e-mail verificado da compra. A API Higgsfield é cobrada separadamente.")+'</p>':"";
  return '<article class="extra resource-card"><span class="resource-icon">'+safe(resourceIcon[x.slug]||"★")+'</span><div class="unlocked">'+(english?"✓ Included with your GainFlow purchase":"✓ Incluído com sua compra GainFlow")+'</div><h3>'+safe(x.title)+'</h3><p>'+safe(x.description)+'</p><div class="resource-actions">'+links+studio+'</div></article>';
 }).join("");
}

async function boot(){
 hide("boot",false);
 try{
  await loadConfig();
  const hash=new URLSearchParams(location.hash.replace(/^#/,""));
  if(hash.get("access_token")){session={access_token:hash.get("access_token"),refresh_token:hash.get("refresh_token"),expires_at:Date.now()/1000+Number(hash.get("expires_in")||3600)};saveSession();history.replaceState(null,"",location.pathname)}
  else if(new URLSearchParams(location.search).get("token_hash")){
   const params=new URLSearchParams(location.search);
   const answer=await jsonRequest(supa("/auth/v1/verify"),{method:"POST",headers:{"apikey":config.publishableKey,"Content-Type":"application/json"},body:JSON.stringify({token_hash:params.get("token_hash"),type:"email"})});
   session=answer;saveSession();history.replaceState(null,"",location.pathname);
  }else{try{session=JSON.parse(sessionStorage.getItem(storage)||"null")}catch{}}
  if(await verifySession())await renderDashboard();else showing("login-view");
 }catch(e){showing("login-view");flash("login-msg",e.message||"Configuração indisponível.");$("email-form").querySelector("button").disabled=true;}
 hide("boot",true);
}
$("email-form").addEventListener("submit",async e=>{
 e.preventDefault();const email=$("email").value.trim().toLowerCase();
 if(busy)return;busy=true;flash("login-msg","Enviando código...");
 try{await jsonRequest(supa("/auth/v1/otp"),{method:"POST",headers:{"apikey":config.publishableKey,"Content-Type":"application/json"},body:JSON.stringify({email,create_user:true,email_redirect_to:location.origin+location.pathname})});
 hide("email-form",true);hide("otp-form",false);flash("login-msg","Código enviado. Confira o e-mail (inclusive spam).");}
 catch(err){flash("login-msg",err.message)}finally{busy=false}
});
$("otp-form").addEventListener("submit",async e=>{
 e.preventDefault();const email=$("email").value.trim().toLowerCase(),token=$("otp").value.trim();
 flash("login-msg","Validando seu código...");
 try{const s=await jsonRequest(supa("/auth/v1/verify"),{method:"POST",headers:{"apikey":config.publishableKey,"Content-Type":"application/json"},body:JSON.stringify({email,token,type:"email"})});session=s;saveSession();await verifySession();await renderDashboard();}
 catch(err){flash("login-msg",err.message)}
});
$("back-login").addEventListener("click",()=>{hide("otp-form",true);hide("email-form",false)});
$("logout").addEventListener("click",()=>logout());
document.querySelectorAll("[data-tab]").forEach(btn=>btn.addEventListener("click",()=>tab(btn.dataset.tab)));
document.querySelectorAll("[data-go]").forEach(btn=>btn.addEventListener("click",()=>tab(btn.dataset.go)));
$("username-form").addEventListener("submit",async e=>{
 e.preventDefault();const instagram_username=$("instagram-user").value.trim().replace(/^@/,"");
 flash("profile-status","Salvando perfil...");
 try{await call("set_profile",{instagram_username});await renderDashboard();tab("growth");}catch(err){flash("profile-status",err.message)}
});
$("auto-switch").addEventListener("change",async e=>{
 const enabled=e.target.checked; e.target.disabled=true;
 try{await call("set_auto",{enabled});flash("profile-status",enabled?"Entrega diária automática solicitada. Ela depende da aprovação da conta e do provedor.":"Entrega automática desativada.");}
 catch(err){e.target.checked=!enabled;flash("profile-status",err.message)}finally{e.target.disabled=false;}
});
$("request-btn").addEventListener("click",async()=>{
 if(busy)return;busy=true;$("request-btn").disabled=true;flash("claim-status","Processando solicitação...");
 try{await call("claim");flash("claim-status","Solicitação registrada.");await renderDashboard();tab("growth");}catch(err){flash("claim-status",err.message)}
 finally{busy=false}
});
$("extras-grid").addEventListener("click",async e=>{
 const button=e.target.closest("[data-asset]");
 if(!button||!model?.hasAccess)return;
 button.disabled=true;
 flash("downloads-msg",english?"Preparing secure download…":"Preparando download protegido…");
 try{
  const answer=await call("library_download",{asset:button.dataset.asset});
  if(typeof answer?.url!=="string"||!answer.url.startsWith("https://"))throw Error("Link indisponível.");
  flash("downloads-msg","");
  location.assign(answer.url);
 }catch(err){flash("downloads-msg",err.message||"Arquivo ainda indisponível.");}
 finally{button.disabled=false;}
});
$("done-btn").addEventListener("click",async()=>{
 if(!selectedLesson)return;
 try{await call("complete_lesson",{lesson_id:selectedLesson.id});await renderDashboard();tab("academy");}
 catch(err){alert(err.message)}
});
boot();
})();