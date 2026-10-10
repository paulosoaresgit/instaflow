// GainFlow Members API — Supabase Edge Function, JWT required.
// Secrets: SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL, WORLDSMM_API_KEY,
// WORLDSMM_SERVICE_ID, WORLDSMM_MIN_QTY_VERIFIED (validated against provider).
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const supabaseUrl=Deno.env.get("SUPABASE_URL")||"";
const serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const admin=createClient(supabaseUrl,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
const allowedOrigins=(Deno.env.get("GF_ALLOWED_ORIGINS")||"https://instaflow-preview.onrender.com,https://followergrowth.site").split(",").map(x=>x.trim()).filter(Boolean);
const extras=[
 {slug:"upsell-1",title:"Viral Content Factory",description:"30 Reels briefs and an editable 30-day publishing calendar."},
 {slug:"downsell-1",title:"Prompt Vault+",description:"18 editable creative prompts for ideas, hooks and reviews."},
 {slug:"upsell-2",title:"PersonaLab AI Studio",description:"Create original AI characters and videos with your own compatible API key."},
 {slug:"upsell-3",title:"Follower Retention Playbook",description:"A 30-day analytics and audience tracking toolkit."}
];
const studioUrl="https://personalab-ai-gainflow.vercel.app/";
const assetFiles={
 "viral-kit-pdf":"GainFlow_Viral_Content_Factory_30_Day_Kit.pdf",
 "viral-calendar-xlsx":"GainFlow_Viral_Content_Calendar.xlsx",
 "viral-calendar-csv":"GainFlow_Viral_Content_30_Day_Calendar.csv",
 "prompts-pdf":"GainFlow_Prompt_Vault_Plus_Mini_Pack.pdf",
 "prompts-editable":"GainFlow_Prompt_Vault_Plus_Editable_Prompts.md",
 "retention-pdf":"GainFlow_Follower_Retention_Playbook.pdf",
 "retention-xlsx":"GainFlow_Audience_Tracker.xlsx",
 "studio-guide":"GainFlow_PersonaLab_AI_Studio_Onboarding_Guide.pdf",
 "studio-brief":"GainFlow_PersonaLab_Creative_Brief_Template.md"
};
const isMainSku=(sku:string)=>/^(starter|growth|pro|authority|influencer|scale|dominance|ultimate)-(standard|niche)$/.test(sku);
const result=(status,data,origin)=>new Response(JSON.stringify(data),{status,headers:{
 "Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store",
 "Access-Control-Allow-Origin":allowedOrigins.includes(origin)?origin:allowedOrigins[0],
 "Access-Control-Allow-Headers":"authorization, apikey, content-type",
 "Access-Control-Allow-Methods":"POST, OPTIONS",Vary:"Origin"
}});
const dbError=(r,label)=>{if(r.error)throw Error(label+": "+r.error.message);return r.data;};
const validHandle=s=>/^[A-Za-z0-9._]{1,30}$/.test(s||"");
const utcDate=()=>new Date().toISOString().slice(0,10);
async function getActiveOrders(email){
 // Isolated storefront orders + verified PersonaLab PerfectPay payments.
 // Both tables are writable only by server-side authenticated payment handlers.
 const [main,studio]=await Promise.all([
  admin.from("gf_orders").select("sale_code,sku,payment_status").eq("email",email).eq("payment_status","approved"),
  admin.from("gf_personalab_orders").select("provider_order_id").eq("purchaser_email",email).eq("status","approved")
 ]);
 const orders=dbError(main,"GainFlow orders")||[];
 const studioOrders=dbError(studio,"PersonaLab orders")||[];
 return [...orders,...studioOrders.map(o=>({sale_code:o.provider_order_id,sku:"upsell-2",payment_status:"approved"}))];
}
async function ensureProfile(userId,email){
 const r=await admin.from("gf_profiles").select("*").eq("user_id",userId).maybeSingle();
 if(r.error)throw Error(r.error.message);
 if(r.data)return r.data;
 const created=await admin.from("gf_profiles").upsert({user_id:userId,email,daily_limit:10},{onConflict:"user_id"}).select("*").single();
 return dbError(created,"profile");
}
async function providerService(qty){
 const key=Deno.env.get("WORLDSMM_API_KEY"),id=Deno.env.get("WORLDSMM_SERVICE_ID");
 const allowedMin=Number(Deno.env.get("WORLDSMM_MIN_QTY_VERIFIED")||0);
 if(!key||!id||!allowedMin||allowedMin>qty)throw Error("Entrega indisponível: serviço de 10/15 por dia ainda não validado.");
 const args=new URLSearchParams({key,action:"services"});
 const ctrl=new AbortController();const t=setTimeout(()=>ctrl.abort(),13000);
 try{
  const r=await fetch("https://worldsmm.com.br/api/v2",{method:"POST",body:args,signal:ctrl.signal});
  if(!r.ok)throw Error("Não foi possível verificar as regras do fornecedor.");
  const data=await r.json();
  if(!Array.isArray(data))throw Error("O fornecedor não retornou catálogo válido.");
  const svc=data.find(s=>String(s.service)===String(id));
  if(!svc)throw Error("O serviço configurado não está disponível.");
  if(!(Number(svc.min)<=qty&&Number(svc.max)>=qty&&Number(svc.min)>0))throw Error("A API não aceita esta quantidade diária. Nenhum pedido foi enviado.");
  return {key,id:String(id)};
 } finally {clearTimeout(t)}
}
async function submitOrder(provider,handle,quantity){
 const ctrl=new AbortController();const t=setTimeout(()=>ctrl.abort(),20000);
 try{
  const r=await fetch("https://worldsmm.com.br/api/v2",{method:"POST",body:new URLSearchParams({key:provider.key,action:"add",service:provider.id,link:"https://www.instagram.com/"+handle+"/",quantity:String(quantity)}),signal:ctrl.signal});
  if(!r.ok)throw Error("Resposta HTTP "+r.status);
  return await r.json();
 } finally{clearTimeout(t)}
}
Deno.serve(async req=>{
 const origin=req.headers.get("origin")||"";
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:{"Access-Control-Allow-Origin":allowedOrigins.includes(origin)?origin:allowedOrigins[0],"Access-Control-Allow-Headers":"authorization, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"}});
 if(req.method!=="POST")return result(405,{message:"Method not allowed"},origin);
 if(origin&&!allowedOrigins.includes(origin))return result(403,{message:"Origem não autorizada"},origin);
 if(!supabaseUrl||!serviceKey)return result(503,{message:"Servidor ainda não configurado"},origin);
 try{
  const bearer=req.headers.get("authorization")||"";
  if(!bearer.startsWith("Bearer "))return result(401,{message:"É necessário fazer login"},origin);
  const {data:verified,error:authError}=await admin.auth.getUser(bearer.substring(7));
  const user=verified?.user;
  if(authError||!user?.id||!user.email||!user.email_confirmed_at)return result(401,{message:"Sessão ou e-mail não verificado"},origin);
  const email=user.email.trim().toLowerCase();
  const body=await req.json().catch(()=>({}));
  const action=String(body?.action||"overview");
  const orders=await getActiveOrders(email);
  if(!orders.length)return result(200,{ok:true,hasAccess:false,email},origin);
  const hasGrowthPlan=orders.some(o=>isMainSku(o.sku));
  const profile=await ensureProfile(user.id,email);
  if(action==="set_profile"){
   const username=String(body.instagram_username||"").replace(/^@+/,"").trim();
   if(!validHandle(username))return result(400,{message:"Use um @ válido com até 30 caracteres"},origin);
   const changed=profile.instagram_username!==username;
   const update=await admin.from("gf_profiles").update({
    instagram_username:username,handle_verified:changed?false:profile.handle_verified,
    verified_at:changed?null:profile.verified_at,updated_at:new Date().toISOString()
   }).eq("user_id",user.id).select("*").single();
   const p=dbError(update,"profile");
   return result(200,{ok:true,profile:{instagram_username:p.instagram_username,handle_verified:p.handle_verified}},origin);
  }
  if(action==="set_auto"){
   if(typeof body.enabled!=="boolean")return result(400,{message:"Opção inválida"},origin);
   if(!profile.instagram_username)return result(400,{message:"Cadastre seu @ antes de ativar"},origin);
   dbError(await admin.from("gf_profiles").update({auto_delivery_enabled:body.enabled,updated_at:new Date().toISOString()}).eq("user_id",user.id),"auto");
   return result(200,{ok:true,auto_delivery_enabled:body.enabled},origin);
  }
  if(action==="library_download"){
   const asset=String(body?.asset||"");
   const filename=Object.prototype.hasOwnProperty.call(assetFiles,asset)?assetFiles[asset as keyof typeof assetFiles]:null;
   if(!filename)return result(400,{message:"Arquivo não autorizado"},origin);
   const signed=await admin.storage.from("gf-club-files").createSignedUrl(filename,120,{download:filename});
   if(signed.error||!signed.data?.signedUrl)
    return result(409,{message:"Este material ainda está sendo disponibilizado. Entre em contato com o suporte."},origin);
   return result(200,{ok:true,url:signed.data.signedUrl,expiresIn:120},origin);
  }
  if(action==="complete_lesson"){
   const id=Number(body.lesson_id);
   if(!Number.isSafeInteger(id)||id<1)return result(400,{message:"Aula inválida"},origin);
   const l=dbError(await admin.from("gf_lessons").select("id,upsell_slug").eq("id",id).maybeSingle(),"lesson");
   if(!l||l.upsell_slug)return result(403,{message:"Aula não disponível neste curso"},origin);
   dbError(await admin.from("gf_lesson_progress").upsert({user_id:user.id,lesson_id:id},{onConflict:"user_id,lesson_id"}),"progress");
   return result(200,{ok:true},origin);
  }
  if(action==="claim"){
   if(!hasGrowthPlan)return result(403,{message:"As solicitações de seguidores dependem de um plano principal contratado."},origin);
   if(!profile.instagram_username||!profile.handle_verified)return result(403,{message:"Seu perfil precisa passar pela verificação de titularidade"},origin);
   const qty=profile.daily_limit;
   const today=utcDate();
   const old=dbError(await admin.from("gf_claims").select("id,status").eq("user_id",user.id).eq("request_day",today).maybeSingle(),"quota");
   if(old&&old.status!=="failed")return result(409,{message:"Você já fez a solicitação deste dia. Acompanhe o histórico."},origin);
   // Check provider limits BEFORE reserving. Some services have minimum order quantities >15.
   const provider=await providerService(qty);
   const reserve=dbError(await admin.rpc("gf_reserve_daily",{p_user_id:user.id,p_quantity:qty}),"daily quota");
   let reply;
   try{reply=await submitOrder(provider,profile.instagram_username,qty);}
   catch(e){
    await admin.from("gf_claims").update({status:"manual_review",error_detail:"Provider response uncertain; manual review required",updated_at:new Date().toISOString()}).eq("id",reserve.id);
    return result(502,{message:"A resposta do fornecedor foi inconclusiva. O pedido está em revisão para evitar duplicidade."},origin);
   }
   if(!reply?.order){
    await admin.from("gf_claims").update({status:"failed",error_detail:String(reply?.error||"order rejected").slice(0,250),updated_at:new Date().toISOString()}).eq("id",reserve.id);
    return result(422,{message:"O fornecedor recusou esta solicitação. Nenhum pedido foi confirmado."},origin);
   }
   dbError(await admin.from("gf_claims").update({status:"submitted",provider_order_id:String(reply.order),updated_at:new Date().toISOString()}).eq("id",reserve.id),"claim update");
   return result(200,{ok:true,quantity:qty,status:"submitted"},origin);
  }
  if(action!=="overview")return result(400,{message:"Ação inválida"},origin);
  const day=utcDate();
  const [claimsResult,allLessonsResult,progressResult]=await Promise.all([
   admin.from("gf_claims").select("request_day,quantity,status,provider_order_id").eq("user_id",user.id).order("request_day",{ascending:false}).limit(30),
   admin.from("gf_lessons").select("id,module_title,module_title_en,position,title,title_en,body,body_en,upsell_slug").order("id"),
   admin.from("gf_lesson_progress").select("lesson_id").eq("user_id",user.id)
  ]);
  const claims=dbError(claimsResult,"claims")||[];
  const doneSet=new Set((dbError(progressResult,"progress")||[]).map(x=>x.lesson_id));
  const lessons=(dbError(allLessonsResult,"lessons")||[]).filter(l=>!l.upsell_slug).map(l=>{
   const lang=body?.lang==="en"?"en":"pt";
   return {id:l.id,module_title:lang==="en"?(l.module_title_en||l.module_title):l.module_title,
    position:l.position,title:lang==="en"?(l.title_en||l.title):l.title,
    body:lang==="en"?(l.body_en||l.body):l.body,upsell_slug:l.upsell_slug,completed:doneSet.has(l.id)};
  });
  const active=claims.find(c=>c.request_day===day&&c.status!=="failed");
  const used=active?active.quantity:0;
  const minConfigured=Number(Deno.env.get("WORLDSMM_MIN_QTY_VERIFIED")||0);
  const configured=!!(Deno.env.get("WORLDSMM_API_KEY")&&Deno.env.get("WORLDSMM_SERVICE_ID")&&minConfigured>=1&&minConfigured<=profile.daily_limit);
  return result(200,{ok:true,hasAccess:true,email,
   accessPolicy:"all_digital_content_with_any_approved_gainflow_purchase",
   hasGrowthPlan,studioUrl,
   library: Object.entries(assetFiles).map(([id,name])=>({id,name})),
   profile:{instagram_username:profile.instagram_username,handle_verified:profile.handle_verified,auto_delivery_enabled:profile.auto_delivery_enabled,daily_limit:profile.daily_limit},
   quota:{limit:profile.daily_limit,used,remaining:Math.max(0,profile.daily_limit-used),day},
   providerReady:configured&&hasGrowthPlan,claims,lessons,extras:extras.map(e=>({...e,unlocked:true})),
   purchases:orders.map(x=>({sku:x.sku,status:x.payment_status}))},origin);
 } catch(e){
  console.error("members-portal",e instanceof Error?e.message:"unexpected");
  return result(500,{message:"Não foi possível completar a operação. Entre em contato com o suporte."},origin);
 }
});