// GainFlow Club — PerfectPay webhook with strict server-side product+plan allowlist.
// Other projects sharing the same PerfectPay account cannot create access.
// Keep GF_MEMBERS_WEBHOOK_ENABLED=false until rotated token and paid/refund QA pass.
import {createClient} from "npm:@supabase/supabase-js@2.58.0";
const json=(status:number,data:unknown)=>Response.json(data,{status,headers:{"Cache-Control":"no-store"}});
const encoder=new TextEncoder();
async function equalToken(received:string,expected:string):Promise<boolean>{
 if(!received||expected.length<16||received.length>256)return false;
 // Constant-size digest comparison limits avoidable timing differences.
 const [a,b]=await Promise.all([crypto.subtle.digest("SHA-256",encoder.encode(received)),crypto.subtle.digest("SHA-256",encoder.encode(expected))]);
 const aa=new Uint8Array(a),bb=new Uint8Array(b);let diff=0;
 for(let i=0;i<aa.length;i++)diff|=aa[i]^bb[i];
 return diff===0;
}
const statusOf=(input:number):string|undefined=>{
 if(input===2||input===10)return "approved";
 if(input===7)return "refunded";
 if(input===9)return "chargeback";
 if(input===6)return "cancelled";
 if(input===5)return "rejected";
 if([3,4,8,16].includes(input))return "review";
 if([0,1,11,12,13].includes(input))return "pending";
};
const clean=(v:unknown)=>typeof v==="string"?v.trim():"";
Deno.serve(async(req:Request)=>{
 if(req.method!=="POST")return json(405,{ok:false,error:"POST_only"});
 if(Deno.env.get("GF_MEMBERS_WEBHOOK_ENABLED")!=="true")
  return json(503,{ok:false,error:"membership_webhook_not_enabled"});
 const url=Deno.env.get("SUPABASE_URL")||"",key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
 const token=Deno.env.get("GF_PERFECTPAY_POSTBACK_TOKEN")||"";
 if(!url||!key||token.length<16)return json(503,{ok:false,error:"webhook_configuration_missing"});
 let body:Record<string,unknown>;
 try{
  if(Number(req.headers.get("content-length")||0)>40000)return json(413,{ok:false,error:"payload_too_large"});
  const raw=await req.text();
  if(raw.length>40000)return json(413,{ok:false,error:"payload_too_large"});
  body=JSON.parse(raw) as Record<string,unknown>;
  if(!body||Array.isArray(body)||typeof body!=="object")throw Error("invalid_object");
 }catch{return json(400,{ok:false,error:"invalid_json"});}
 if(!await equalToken(clean(body.token),token))return json(401,{ok:false,error:"unauthorized"});
 const prod=body.product as Record<string,unknown>|undefined;
 const plan=body.plan as Record<string,unknown>|undefined;
 const productCode=clean(prod?.code),planCode=clean(plan?.code);
 if(!productCode||!planCode||productCode.length>120||planCode.length>120)
  return json(422,{ok:false,error:"missing_product_or_plan"});
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 // IMPORTANT: only records manually authorized as GainFlow by exact provider
 // product+plan codes. No name, affiliate code, PPU checkout or product-only fallback.
 const{data:mapping,error:mapError}=await db.from("gf_authorized_plans")
  .select("sku").eq("product_code",productCode).eq("plan_code",planCode).eq("is_active",true).maybeSingle();
 if(mapError)return json(503,{ok:false,error:"gainflow_allowlist_unavailable"});
 if(!mapping)return json(202,{ok:true,ignored:true,reason:"not_a_gainflow_plan"});
 const rawStatus=body.sale_status_enum;
 if(rawStatus===null||rawStatus===undefined||rawStatus==="")
  return json(422,{ok:false,error:"missing_status"});
 const parsed=Number(rawStatus),state=Number.isInteger(parsed)?statusOf(parsed):undefined;
 if(!state)return json(202,{ok:true,ignored:true,reason:"status_not_supported"});
 const buyer=body.customer as Record<string,unknown>|undefined;
 const email=clean(buyer?.email).toLowerCase();
 const order=clean(body.code);
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254||order.length<6||order.length>255)
  return json(422,{ok:false,error:"invalid_order_identity"});
 const rawApproval=clean(body.date_approved);
 const paid=rawApproval&&Number.isFinite(Date.parse(rawApproval))?new Date(rawApproval).toISOString():null;
 try{
  const {error}=await db.rpc("gf_ingest_sale",{
   p_code:order,p_email:email,p_product_code:productCode,p_plan_code:planCode,
   p_sku:mapping.sku,p_status:state,p_paid_at:paid
  });
  if(error){
   console.error("GainFlow Club: verified sale could not be reconciled");
   return json(503,{ok:false,error:"sale_reconciliation_failed"});
  }
  return json(200,{ok:true,status:state});
 }catch{
  console.error("GainFlow Club: payment processing temporarily unavailable");
  return json(503,{ok:false,error:"processing_unavailable"});
 }
});
