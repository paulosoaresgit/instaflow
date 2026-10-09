// PerfectPay members webhook; deploy with JWT verification DISABLED because provider sends signed token.
// Authorization happens by matching the configured GF_PERFECTPAY_POSTBACK_TOKEN and mapping exact purchased product codes.
import { createClient } from "npm:@supabase/supabase-js@2.58.0";
const project=Deno.env.get("SUPABASE_URL")||"";
const key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const admin=createClient(project,key,{auth:{persistSession:false,autoRefreshToken:false}});
const respond=(status,value)=>new Response(JSON.stringify(value),{status,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});
const fixedTimeEqual=(one,two)=>{const a=new TextEncoder().encode(one),b=new TextEncoder().encode(two);if(!a.length||a.length!==b.length)return false;let different=0;for(let i=0;i<a.length;i++)different|=a[i]^b[i];return different===0};
const toStatus=(value)=>{const n=Number(value);if(n===2||n===10)return "approved";if(n===7)return "refunded";if(n===9)return "chargeback";if(n===6)return "cancelled";if(n===5)return "rejected";if([3,4,8,16].includes(n))return "review";return "pending"};
Deno.serve(async req=>{
 if(req.method!=="POST")return respond(405,{ok:false,error:"method"});
 if(!project||!key)return respond(503,{ok:false,error:"server_not_configured"});
 const expected=Deno.env.get("GF_PERFECTPAY_POSTBACK_TOKEN");
 const rawMap=Deno.env.get("GF_PERFECTPAY_PRODUCT_MAP");
 if(!expected||!rawMap)return respond(503,{ok:false,error:"product_mapping_not_configured"});
 let payload;
 try{const raw=await req.text();if(raw.length>35000)return respond(413,{ok:false,error:"payload_too_large"});payload=JSON.parse(raw);}catch{return respond(400,{ok:false,error:"invalid_json"})}
 if(!fixedTimeEqual(String(payload?.token||""),expected))return respond(401,{ok:false,error:"unauthorized"});
 let codeMap;
 try{codeMap=JSON.parse(rawMap)}catch{return respond(503,{ok:false,error:"invalid_product_map"})}
 const productCode=String(payload?.product?.code||"").trim(),planCode=String(payload?.plan?.code||"").trim();
 // Map the official plan code if available; otherwise use product code.
 const entry=codeMap[planCode]||codeMap[productCode];
 if(!entry||typeof entry!=="object"||typeof entry.sku!=="string"){
  return respond(202,{ok:true,ignored:true,reason:"unmapped_product"});
 }
 const allowed=/^(starter|growth|pro|authority|influencer|scale|dominance|ultimate)-(standard|niche)$|^(upsell-[1-4]|downsell-1)$/;
 if(!allowed.test(entry.sku))return respond(422,{ok:false,error:"invalid_sku_mapping"});
 // Reject mismatches between the item code and a specifically pinned product in the map.
 if(entry.productCode && entry.productCode!==productCode)return respond(422,{ok:false,error:"product_code_mismatch"});
 if(entry.planCode && entry.planCode!==planCode)return respond(422,{ok:false,error:"plan_code_mismatch"});
 // Amounts can be converted or discounted in the payment provider; verify exact SKU against mapped codes.
 // Do not reject legitimate paid events by comparing currencies with the site's display price.
 const saleCode=String(payload?.code||"").trim();
 const email=String(payload?.customer?.email||"").trim().toLowerCase();
 if(!saleCode||saleCode.length>255||!productCode||!email||email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return respond(422,{ok:false,error:"incomplete_sale"});
 const status=toStatus(payload.sale_status_enum);
 const approved=payload.date_approved&&Number.isFinite(Date.parse(payload.date_approved))?new Date(payload.date_approved).toISOString():null;
 try{
  const {error}=await admin.rpc("gf_ingest_sale",{
   p_code:saleCode,p_email:email,p_product_code:productCode,p_plan_code:planCode||null,
   p_sku:entry.sku,p_status:status,p_paid_at:approved
  });
  if(error)throw error;
  return respond(200,{ok:true,status});
 }catch(err){
  console.error("gf_members_webhook",err instanceof Error?err.message:"db_failure");
  return respond(500,{ok:false,error:"db_failure"});
 }
});