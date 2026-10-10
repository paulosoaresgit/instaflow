# GainFlow — PerfectPay One Click rollout / 10 Oct 2026

## Status and boundary

- Hostinger domain: https://followergrowth.site/ (source: `paulosoaresgit/instaflow`, branch `main`).
- Producer reports that PerfectPay manager approved all 22 registered GainFlow products and enabled One Click for 4 post-purchase products. **This is the manager's report, not independent account or payment-test validation.**
- PerfectPay reports that no-popup One Click requires review of final offer pages; **any HTML change after approval cancels that specific approval**.
- The 4 digital products' materials (Viral Content Factory, Prompt Vault+, PersonaLab onboarding materials, Follower Retention Playbook) are **already included** with every approved purchase of a primary GainFlow product. Identical member-library access is always given whether an additional offer is selected or not.
- Do not market included material as an exclusive paid add-on; additional One Click charges are disabled pending a real, separately deliverable, verifiable benefit and revised PerfectPay SKUs/descriptions.
- `sales/config.json` sets `oneClickEnabled: false`. The four member-resource pages currently provide **non-charging navigation**. This is not a live One Click implementation.
- Never infer approval, successful payment, or entitlements from query strings or redirect visits; only verified PerfectPay webhook/payment status.

## Current recorded checkout map

| Sequence | Registered item | PPP | Full offer URL | USD |
| --- | --- | --- | --- | --- |
| Front example | Scale Standard | PPPBFIHI | https://go.centerpag.com/PPU38CQGTET | 199.90 |
| Upsell 1 | Viral Content Factory | PPPBFIHC | https://followergrowth.site/offer/upsell-1.html | 27.00 |
| Downsell if decline Upsell 1 | Prompt Vault+ | PPPBFIHD | https://followergrowth.site/offer/downsell-1.html | 9.90 |
| Upsell 2 | PersonaLab AI Studio | PPPBFIHF | https://followergrowth.site/offer/upsell-2.html | 39.97 |
| Upsell 3 | Follower Retention Playbook | PPPBFIHE | https://followergrowth.site/offer/upsell-3.html | 19.90 |
| Final | GainFlow | — | https://followergrowth.site/obrigado/ | — |

Registered order bumps: VIP Express Delivery (PPPBFIG2, USD 7); Engagement Toolkit (PPPBFIG4, USD 9.90). VIP priority needs provider capacity/SLA proof; Engagement Toolkit PDF is already included in the member library, so **must not be charged as if exclusive**.

## PerfectPay setup checklist (not completed by GitHub changes)

1. Confirm product **PPPBFIHI**, plan **PPLQQQOIS**, amount USD 199.90 and exact checkout URL. Make sure the `sales/config.json` front gate remains off until validation.
2. In the PerfectPay Upsell section on the **front product**, select **PPPBFIHC**, URL `https://followergrowth.site/offer/upsell-1.html`, and an appropriate thank-you/follow-up URL. For the current test-only digital-included flow, don't activate paid charge.
3. In the Viral Content Factory Upsell section, set next product **PPPBFIHF**, page `.../offer/upsell-2.html` and next page `.../offer/upsell-3.html`; in PersonaLab set next product **PPPBFIHE**, page `.../offer/upsell-3.html`, final `.../obrigado/`. The initial decline goes to `.../offer/downsell-1.html`. Validate actual PerfectPay decline behavior before approval.
4. In Scale Checkout settings > Tools > Order Bump, add the two **approved** products and corresponding plans only after confirming plan IDs, fulfillment, price, and default **unchecked** choice. Save test settings without promoting duplicates.
5. With final, materially distinct paid services and honest pages in place, obtain manager's no-popup One Click review **after all HTML edits**, and confirm the correct PerfectPay mechanism for button acceptance; don't assume an ordinary checkout redirect with `upsell=true` automatically charges the saved card.
6. Only then validate the PerfectPay's documented `upsell=true` parameter on the primary checkout, card behavior, successful acceptance, decline, and next-offer redirects. Keep launch disabled until every required test passes.
7. Test approved, denied, refunded and canceled notifications, server-side verification/deduplication, matching of all authorized PPP/PPL pairs, absence of double charges, correct refunds, and exactly one member-library entitlement for any approved primary GainFlow plan. Other projects remain isolated.
8. Repeat checkout + bump mapping for each additional primary product **only when specifically verified**, not by assuming the Scale settings propagate across 16 plans.

Official docs: https://help.perfectpay.com.br/article/144-upsell-one-clickbuy and https://help.perfectpay.com.br/article/151-order-bump

## Site gates

- Frontend primary-checkout One Click parameter is controlled by `sales/config.json -> oneClickEnabled`.
- Included digital offers are rendered as Club benefits, with navigation only, in `sales/site.js`.
- The feature stays **OFF**. PerfectPay reports that the products are approved but no-popup page review, fulfillment, and live payment QA are not complete.
