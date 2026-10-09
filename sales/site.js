(()=>{
"use strict";
const el=id=>document.getElementById(id), qs=new URLSearchParams(location.search);
const here=document.body.dataset.kind, productId=document.body.dataset.offer, upsellId=document.body.dataset.step;
const money=n=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(n);
const esc=s=>String(s).replace(/[&<>"']/g,x=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[x]));
const validCheckout=url=>{try{const u=new URL(url);return u.protocol==="https:"&&u.hostname==="go.perfectpay.com.br"&&!u.username&&!u.password&&u.pathname!=="/"}catch{return false}};
const urlStep=(step,product)=>step==="complete"?"/obrigado/?produto="+encodeURIComponent(product):"/offer/"+encodeURIComponent(step)+".html?produto="+encodeURIComponent(product);
const load=async url=>{const response=await fetch(url,{cache:"no-store"});if(!response.ok)throw Error("Configuration not available");return response.json()};
const note=text=>{el("status").textContent=text};
const setHtml=(id,html)=>{if(el(id))el(id).innerHTML=html};
const setText=(id,s)=>{if(el(id))el(id).textContent=s};
(async()=>{
try{
const cfg=await load("/sales/config.json");const products=cfg.products||[];
const currentProduct=here==="product"?products.find(p=>p.id===productId):products.find(p=>p.id===qs.get("produto"));
const fmtSupport=cfg.supportEmail?'<a href="mailto:'+encodeURIComponent(cfg.supportEmail)+'">'+esc(cfg.supportEmail)+'</a>':"Email support not configured.";
setHtml("support",fmtSupport);
setText("guarantee",String(cfg.guaranteeDays||7));
const lead=document.querySelector(".grid .hero .lead");
if(lead)lead.textContent="GainFlow is a digital members-area experience, with a complete Reels Academy and access to eligible online tools. Each purchase unlocks access after payment approval.";
const delivery=document.querySelector(".smallcard p.mini");
if(delivery&&here==="product")delivery.textContent="Digital delivery: access to the member dashboard after approved payment. Includes 24 Reels classes across eight modules, with optional extra lessons unlocked by purchased add-ons. Daily requests begin at 10, configurable up to 15 after technical/provider validation.";
const memberLink=document.querySelector(".smallcard");
if(memberLink&&here==="product"){const a=document.createElement("a");a.href="/members/";a.textContent="Open my digital member area →";a.className="mini";memberLink.appendChild(a)}

if(here==="product"){
if(!currentProduct)throw Error("Unknown product page");
document.title=currentProduct.name+" | GainFlow";setText("tag",currentProduct.mode==="niche"?"NICHE FOLLOWERS PLAN":"STANDARD FOLLOWERS PLAN");setText("product-name",currentProduct.name);setText("product-title","Choose the "+currentProduct.planName+" package");
setText("quantity",currentProduct.totalFollowers.toLocaleString("en-US"));setText("price",money(currentProduct.priceUSD));
setText("type",currentProduct.mode==="niche"?"Audience niche selected in the sales flow":"Standard audience option");
setText("quantity-note",currentProduct.quantityReviewRequired?"Package quantities are being reviewed; please confirm the final terms with support before ordering.":"Quantity based on the published plan.");
const buy=el("buy");buy.textContent="Continue to PerfectPay";
const links=await load("/perfectpay-checkouts.json");
const raw=links?.[currentProduct.productKey]?.[currentProduct.mode];
if(!validCheckout(raw)){buy.disabled=true;buy.textContent="Checkout not configured yet";note("Digital membership: 7-day guarantee. Checkout not yet configured.");}
else{buy.addEventListener("click",()=>{const u=new URL(raw);u.searchParams.set("upsell","true");const keys=["utm_source","utm_medium","utm_campaign","utm_content","utm_term","fbclid","gclid"];for(const k of keys){const v=qs.get(k);if(v&&!u.searchParams.has(k))u.searchParams.set(k,v.slice(0,160))}location.assign(u.toString())})}
}
else if(here==="upsell"){
const offer=(cfg.upsells||[]).find(o=>o.slug===upsellId);
if(!offer)throw Error("Unknown upsell page");
const context=currentProduct?.id||"";
document.title=offer.name+" | GainFlow";setText("tag",offer.label.toUpperCase());setText("offer-name",offer.name);setText("price",money(offer.priceUSD));setText("offer-description",offer.description);
setText("product-context",currentProduct?"Optional add-on for "+currentProduct.name:"Optional post-purchase offer");
setText("offer-note","This add-on is pending verification. No payment will be initiated from this page until the product is fully configured.");
const buy=el("buy"),skip=el("skip");
skip.href=urlStep(offer.decline,context);skip.textContent="No thanks — see next step";
const links=await load("/sales/upsell-checkouts.json");
const raw=links?.[offer.slug]||"";
if(offer.status!=="active"||!validCheckout(raw)){buy.disabled=true;buy.textContent="Additional offer not available";note("The checkout for this extra offer is not active yet.");}
else{buy.textContent="Continue to secure checkout";buy.addEventListener("click",()=>{const u=new URL(raw);u.searchParams.set("upsell","true");location.assign(u.toString())})}
}
else if(here==="complete"){
document.title="Order information | GainFlow";
setText("product-context",currentProduct?"Package: "+currentProduct.name:"Your GainFlow order");
setText("support-caption","If you completed a purchase, check your payment provider's receipt and order status. Visiting this page alone does not confirm payment or authorize delivery.");
}
else throw Error("Unknown page type")
}catch(err){note("Page configuration is incomplete. Please check back after setup.");if(el("buy")){el("buy").disabled=true;el("buy").textContent="Unavailable";} console.error(err)}
})();})();