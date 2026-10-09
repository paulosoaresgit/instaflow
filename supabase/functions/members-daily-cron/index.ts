// Hourly/daily scheduler target. Supabase Edge Function verify_jwt=false;
// authenticate ONLY with X-GF-CRON-SECRET and keep this function off public web pages.
import { createClient } from "npm:@supabase/supabase-js@2.58.0";
const url=Deno.env.get("SUPABASE_URL")||"";
const key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const supa=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const reply=(status,obj)=>Response.json(obj,{status,headers:{"Cache-Control":"no-store"}});
const constantEqual=(a,b)=>{const x=new TextEncoder().encode(a),y=new TextEncoder().encode(b);if(!x.length||x.length!==y.length)return false;let z=0;for(let i=0;i<x.length;i++)z|=x[i]^y[i];return z===0};
function requireData(r){if(r.error)throw Error(r.error.message);return r.data}
async function postProvider(payload,timeout=20000){
 const ctl=new AbortController(),id=setTimeout(()=>ctl.abort(),timeout);
 try{const result=await fetch("https://worldsmm.com.br/api/v2",{method:"POST",body:new URLSearchParams(payload),signal:ctl.signal});
 if(!result.ok)throw Error("HTTP "+result.status);
 return await result.json();
 }finally{clearTimeout(id)}
}
Deno.serve(async request=>{
 if(request.method!=="POST")return reply(405,{ok:false,error:"POST_only"});
 const expected=Deno.env.get("GF_CRON_SECRET")||"";
 if(!constantEqual(expected,request.headers.get("x-gf-cron-secret")||""))return reply(401,{ok:false,error:"unauthorized"});
 const serviceId=Deno.env.get("WORLDSMM_SERVICE_ID")||"";
 const providerKey=Deno.env.get("WORLDSMM_API_KEY")||"";
 const validatedMinimum=Number(Deno.env.get("WORLDSMM_MIN_QTY_VERIFIED")||0);
 if(!url||!key||!serviceId||!providerKey||![10,15].includes(validatedMinimum))
  return reply(503,{ok:false,error:"delivery_provider_not_validated"});
 const date=new Date().toISOString().slice(0,10);
 const maxPerRun=Math.max(1,Math.min(30,Number(Deno.env.get("GF_AUTO_MAX_PER_RUN")||10)));
 const globalDailyLimit=Math.max(1,Math.min(10000,Number(Deno.env.get("GF_GLOBAL_DAILY_CAP")||300)));
 try{
  const services=await postProvider({key:providerKey,action:"services"},15000);
  if(!Array.isArray(services))return reply(503,{ok:false,error:"invalid_provider_catalog"});
  const item=services.find(s=>String(s.service)===serviceId);
  if(!item)return reply(503,{ok:false,error:"configured_service_not_found"});
  const min=Number(item.min),max=Number(item.max);
  if(!Number.isFinite(min)||min<1||min>15||max<10)return reply(503,{ok:false,error:"service_does_not_support_daily_10_or_15"});
  const counted=await supa.from("gf_claims").select("id",{head:true,count:"exact"}).eq("request_day",date).neq("status","failed");
  if(counted.error)throw counted.error;
  if((counted.count||0)>=globalDailyLimit)return reply(200,{ok:true,processed:0,reason:"global_daily_cap"});
  const result=await supa.from("gf_profiles").select("user_id,email,instagram_username,daily_limit").eq("auto_delivery_enabled",true).eq("handle_verified",true).not("instagram_username","is",null).order("user_id").limit(500);
  const profiles=requireData(result)||[];
  let processed=0,skipped=0,invalid=0,rejected=0;
  for(const p of profiles){
   if(processed>=maxPerRun||processed+(counted.count||0)>=globalDailyLimit)break;
   if(![10,15].includes(p.daily_limit)||min>p.daily_limit||max<p.daily_limit){invalid++;continue}
   const daily=await supa.from("gf_claims").select("status").eq("user_id",p.user_id).eq("request_day",date).maybeSingle();
   if(daily.error){skipped++;continue}
   if(daily.data&&daily.data.status!=="failed"){skipped++;continue}
   const approved=await supa.from("gf_orders").select("sale_code").eq("email",p.email.toLowerCase()).eq("payment_status","approved").limit(1);
   if(approved.error||!approved.data?.length){skipped++;continue}
   const reserved=await supa.rpc("gf_reserve_daily",{p_user_id:p.user_id,p_quantity:p.daily_limit});
   if(reserved.error){skipped++;continue}
   try{
    const order=await postProvider({key:providerKey,action:"add",service:serviceId,link:"https://www.instagram.com/"+p.instagram_username+"/",quantity:String(p.daily_limit)},20000);
    if(order?.order){
     requireData(await supa.from("gf_claims").update({status:"submitted",provider_order_id:String(order.order),updated_at:new Date().toISOString()}).eq("id",reserved.data.id));
     processed++;
    }else{
     await supa.from("gf_claims").update({status:"failed",error_detail:String(order?.error||"provider_rejected").slice(0,160),updated_at:new Date().toISOString()}).eq("id",reserved.data.id);
     rejected++;
    }
   }catch{
    // Network status is ambiguous: never retry automatically, avoid duplicate paid orders.
    await supa.from("gf_claims").update({status:"manual_review",error_detail:"provider_response_uncertain",updated_at:new Date().toISOString()}).eq("id",reserved.data.id);
    skipped++;
   }
  }
  return reply(200,{ok:true,processed,skipped,providerRejected:rejected,unsupportedQuota:invalid,day:date,scanned:profiles.length});
 }catch(e){
  console.error("gainflow_daily_dispatch",e instanceof Error?e.message:"internal");
  return reply(500,{ok:false,error:"processing_failed"});
 }
});