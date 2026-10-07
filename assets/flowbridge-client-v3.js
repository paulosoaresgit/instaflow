/* FlowBridge handoff: select on Site 01, confirm customer details on Site 02. */
(function () {
  "use strict";

  const PROJECT = "90a89f09113845d599235e8a795e2ad7";
  const SOURCE = "seguidores-inta";
  const DESTINATION_HOST = "instaflow-preview.onrender.com";
  const API = "https://iqtzqwegqrquijmqbwwp.supabase.co/functions/v1/";
  const STORAGE_KEY = "instaflow_flowbridge_handoff_v3";
  const PLAN_IDS = [
    "plan_rTJ6wGNZPjHuQ", "plan_mTsIEY8VVxPLu", "plan_dPeW4toRO0YZR",
    "plan_zU4CJaWGpt52j", "plan_0oTHi9rutHVN5", "plan_HbcI7vKmqZ1TQ",
    "plan_G6Bq6cDZigrWV", "plan_rK49gowfDgs3k"
  ];
  const params = new URLSearchParams(location.search);
  const isDestination = location.hostname === DESTINATION_HOST;
  let handoff = null;
  let checkoutPromise = null;
  let resolvedCheckoutUrl = null;
  let routing = false;

  function readStoredHandoff() {
    try {
      return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null");
    } catch {
      return null;
    }
  }

  function validHandoff(value) {
    return value && /^[A-Za-z0-9_-]{32,128}$/.test(value.token) &&
      Number.isInteger(value.bundle) && value.bundle >= 1 && value.bundle <= PLAN_IDS.length &&
      Number.isFinite(value.createdAt) && Date.now() - value.createdAt < 5 * 60 * 1000;
  }

  if (isDestination) {
    const token = params.get("flowbridge_handoff");
    const bundle = Number(params.get("flowbridge_bundle"));
    const incoming = { token, bundle, createdAt: Date.now() };
    handoff = token ? incoming : readStoredHandoff();
    if (!validHandoff(handoff)) handoff = null;
    try {
      if (handoff) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(handoff));
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch { /* In-memory handoff still works when browser storage is disabled. */ }
    if (token) {
      const cleanUrl = new URL(location.href);
      cleanUrl.searchParams.delete("flowbridge_handoff");
      cleanUrl.searchParams.delete("flowbridge_bundle");
      history.replaceState(history.state, "", cleanUrl);
    }
  }

  async function post(endpoint, body) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    try {
      const response = await fetch(API + endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
        referrerPolicy: "no-referrer"
      });
      const responseText = await response.text();
      let data;
      try { data = JSON.parse(responseText); }
      catch { data = { error: "invalid_response" }; }
      const diagnostic = { ...data };
      if (diagnostic.handoffToken) diagnostic.handoffToken = "[redacted]";
      const message = `[FlowBridge] POST ${API + endpoint} HTTP ${response.status} ${JSON.stringify(diagnostic)}`;
      if (!response.ok || data.ok !== true) {
        console.error(message);
        const error = new Error(data.error === "handoff_expired_or_used"
          ? "Your selection has expired. Please return to the plans and choose again."
          : "Checkout could not be started. Please try again.");
        error.status = response.status;
        error.response = data;
        throw error;
      }
      console.info(message);
      return data;
    } catch (error) {
      if (error.name === "AbortError") throw new Error("Checkout took too long. Please try again.");
      if (error instanceof TypeError) throw new Error("Checkout could not be reached. Please try again.");
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  function showRoutingError(button, message) {
    const previous = document.getElementById("flowbridge-routing-error");
    if (previous) previous.remove();
    const alert = document.createElement("p");
    alert.id = "flowbridge-routing-error";
    alert.setAttribute("role", "alert");
    alert.style.cssText = "color:#fca5a5;font-size:14px;line-height:1.5;margin-top:12px";
    alert.textContent = message;
    button.insertAdjacentElement("afterend", alert);
  }

  async function route(button) {
    if (routing) return;
    const bundle = Number(button.getAttribute("data-flowbridge-bundle"));
    if (!Number.isInteger(bundle) || !PLAN_IDS[bundle - 1]) return;
    routing = true;
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = "Opening your plan…";
    try {
      let tracking = {};
      try { tracking = JSON.parse(localStorage.getItem("vy_utm") || "{}"); } catch {}
      for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid", "ttclid"]) {
        if (params.get(key)) tracking[key] = params.get(key);
      }
      const result = await post("bridge-config", {
        project: PROJECT, source: SOURCE, bundle: String(bundle),
        mode: "once", origin: location.origin, tracking
      });
      const target = new URL(result.destination);
      if (target.protocol !== "https:" || target.hostname !== DESTINATION_HOST ||
          !/^[A-Za-z0-9_-]{32,128}$/.test(result.handoffToken)) {
        throw new Error("The selected plan is unavailable. Please try again.");
      }
      target.searchParams.set("flowbridge_handoff", result.handoffToken);
      target.searchParams.set("flowbridge_bundle", String(bundle));
      target.searchParams.set("front", "v1");
      target.searchParams.set("lang", params.get("lang") || "en");
      if (params.has("fbtest")) target.searchParams.set("fbtest", params.get("fbtest"));
      location.assign(target.toString());
    } catch (error) {
      console.error("[FlowBridge] Routing failed", error.message);
      showRoutingError(button, error.message);
      button.disabled = false;
      button.textContent = originalText;
      routing = false;
    }
  }

  async function checkout(details, expectedPlanId) {
    if (!isDestination || !handoff) throw new Error("Please choose a plan again before continuing.");
    if (expectedPlanId !== PLAN_IDS[handoff.bundle - 1]) {
      throw new Error("Please return to the plans and select this package again.");
    }
    if (!details.instagramUsername || !details.email) throw new Error("Please enter your Instagram username and email.");
    if (resolvedCheckoutUrl) return resolvedCheckoutUrl;
    if (checkoutPromise) return checkoutPromise;
    checkoutPromise = (async () => {
      // Whop redirect gateways use resolve-gateway. create-checkout is Stripe-only.
      const result = await post("resolve-gateway", { project: PROJECT, handoffToken: handoff.token });
      if (typeof result.redirectUrl !== "string") throw new Error("The selected checkout is unavailable. Please return to the plans.");
      const target = new URL(result.redirectUrl);
      if (result.provider !== "whop" || result.action !== "redirect" ||
          String(result.context?.bundle) !== String(handoff.bundle) ||
          target.protocol !== "https:" || target.hostname !== "whop.com" || target.username || target.password ||
          target.pathname.replace(/\/$/, "") !== "/checkout/" + expectedPlanId) {
        throw new Error("The selected checkout is unavailable. Please return to the plans.");
      }
      try {
        sessionStorage.setItem("instaflow_pending_customer", JSON.stringify({
          instagramUsername: details.instagramUsername, email: details.email,
          customerName: details.customerName || "", bundle: handoff.bundle, planId: expectedPlanId
        }));
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {}
      resolvedCheckoutUrl = target.toString();
      return resolvedCheckoutUrl;
    })();
    try { return await checkoutPromise; }
    finally { checkoutPromise = null; }
  }

  window.FlowBridgeCheckout = { handoff, checkout };
  if (!isDestination) {
    document.addEventListener("click", function (event) {
      const button = event.target.closest?.("[data-flowbridge-bundle]");
      if (!button) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      route(button);
    });
  }
})();
