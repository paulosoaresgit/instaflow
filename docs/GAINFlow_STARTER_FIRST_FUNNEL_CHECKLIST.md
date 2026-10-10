# GainFlow Starter (USD 14.90) — First PerfectPay Funnel

Status: **configuration in progress, no validated live One Click**. Use this as the single pilot before copying settings to any other primary plan.

## Main checkout — verified catalog details (live transaction not yet tested)

- Product: **GainFlow Starter**, PPP: **PPPBFIEG**
- PerfectPay **PPL code: not yet captured**; must confirm in Plans screen for USD 14.90.
- Checkout: https://go.centerpag.com/PPU38CQGSPG
- Sales page: https://followergrowth.site/p/starter-standard.html
- One Click parameter on primary checkout: **not yet applied** while post-purchase charging remains blocked. After PerfectPay review and QA, use correct URL with `upsell=true` as documented by PerfectPay, without modifying other products.

## Post-purchase sequence (current registered products)

| Step | Product | Code | Price | Offer page |
| --- | --- | --- | --- | --- |
| Upsell 1 | Viral Content Factory | PPPBFIHC | USD 27.00 | https://followergrowth.site/offer/upsell-1.html?produto=starter-standard |
| If decline Upsell 1 | Prompt Vault+ (downsell) | PPPBFIHD | USD 9.90 | https://followergrowth.site/offer/downsell-1.html?produto=starter-standard |
| Upsell 2 | PersonaLab AI Studio | PPPBFIHF | USD 39.97 | https://followergrowth.site/offer/upsell-2.html?produto=starter-standard |
| Upsell 3 | Follower Retention Playbook | PPPBFIHE | USD 19.90 | https://followergrowth.site/offer/upsell-3.html?produto=starter-standard |
| Final | GainFlow Club | — | Included | https://followergrowth.site/obrigado/?produto=starter-standard |

Important: **all underlying digital assets are already included** for any approved GainFlow primary purchase; post-purchase pages must not collect an additional fee for those same assets. Distinct additional services require verified fulfillment, correct written terms in PerfectPay and separate authorization of charge.

## Order bumps in Starter checkout

PerfectPay > GainFlow Starter > Configurações Checkout > edit existing standard checkout > Ferramentas > Order Bump > Adicionar. Only add after confirming product and its actual approved Plan/Coupon in PerfectPay.

1. **VIP Express Delivery**: PPPBFIG2; USD 7.00; confirmed plan code: **pending**. Service availability/SLA and priority handling implementation **not verified**; do not promise guaranteed 3-hour delivery or charge until it can be fulfilled.
2. **Engagement Toolkit**: PPPBFIG4; USD 9.90; confirmed plan code: **pending**. Its PDF is included in all memberships; do not charge for library access or an identical PDF. For an optional paid add-on, define an independently deliverable benefit and get an approved updated offer.
3. Verify bumps **unchecked by default**, explicit opt-in, correct final checkout total and one successful + one rejected payment test; no bump must block basic membership.

## Setup order for PerfectPay One Click

1. Verify main Starter PPL code, product approval and checkout currency/price.
2. Review and finalize truthful copy/prices/accept/decline flow for each separately chargeable offer. State explicitly that accepting authorizes an **additional charge** at the shown amount.
3. Confirm official PerfectPay upsell topology, decline and downsell routes on dashboard and card-only requirements. Existing dashboard setups for Scale **do not automatically apply** to Starter.
4. The provider's `upsell=true` belongs to the **primary checkout URL**, after tests; no assumption that linking to an upsell checkout URL creates a safe One Click transaction.
5. Send final HTML URLs to manager for approval of One Click without popup. **After that approval, modifying offer HTML invalidates approval.**
6. Run controlled end-to-end tests with a real approved payment and authorized refunds/cancel events, inspecting PerfectPay charges, price, order IDs, deduplication, webhook and member entitlements.
7. Only then activate Starter paid add-ons and flip site feature flags in a reviewed and tested deployment. Never globally enable all 16 primary products from this one pilot.

## Starter first UI action

Open PerfectPay product **PPPBFIEG** and send screenshot of **Planos** showing PPL and USD 14.90, plus the **Configurações Checkout** overview and **Upsell** configuration. This distinguishes what is already set from what is missing without duplicating or activating paid offers.

Official help:
- https://help.perfectpay.com.br/article/144-upsell-one-clickbuy
- https://help.perfectpay.com.br/article/151-order-bump
