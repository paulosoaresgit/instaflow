# PerfectPay checkout (InstaFlow)

The frontend now goes directly to the PerfectPay checkout endpoint. FlowBridge and Whop are not used.

## Configure plans

Create the checkout URLs in PerfectPay for each plan and paste the real `https://go.perfectpay.com.br/...` checkout link in `perfectpay-checkouts.json`, or set the Render environment variable `PERFECTPAY_CHECKOUTS_JSON` to a JSON object with the same keys. The environment variable overrides nonempty fields in the file.

Keys: starter, growth, pro, authority, influencer, scale, dominance, ultimate. Each plan has a `standard` and an optional distinct `niche` checkout. Configure the correct USD price for every option in PerfectPay. Without a configured link, that option returns HTTP 503 (no old checkout fallback).

Main standard prices: Starter $14.90, Growth $29.90, Pro $39.90, Authority $69.90, Influencer $119.90, Scale $199.90, Dominance $299.90, Ultimate $499.90. Niche prices shown by the frontend may be higher; verify them against the links before enabling.

The website posts a validated customer email, Instagram username and selected plan to `POST /api/perfectpay/checkout`. The server chooses a configured PerfectPay URL and attaches source and campaign tracking. Status of plan checkout configuration: `GET /api/perfectpay/status`.

**Important:** this migration configures *checkout redirects only*. It does not verify paid orders, deliver followers or authorize upsell access. Configure and verify a PerfectPay sales webhook (approval, refund, chargeback) with a durable order database before automating fulfillment, and separately migrate upsells. Never treat a redirect or thank-you page as payment confirmation.
