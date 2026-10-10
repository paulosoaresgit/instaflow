import http from "node:http";
import { createReadStream, readFileSync } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT || 3000);

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2"
};

function sendJson(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(body));
}

function safePathFromUrl(urlPath) {
  const decoded = decodeURIComponent(urlPath);
  const normalized = path.normalize(decoded).replace(/^(\.\.(\/|\\|$))+/, "");
  return path.join(__dirname, normalized);
}

async function serveFile(req, res, filePath) {
  try {
    const info = await stat(filePath);
    if (!info.isFile()) return false;

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    const isAsset = filePath.includes(`${path.sep}assets${path.sep}`);

    res.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": isAsset
        ? "public, max-age=31536000, immutable"
        : "public, max-age=300"
    });

    if (req.method === "HEAD") {
      res.end();
      return true;
    }

    createReadStream(filePath)
      .on("error", () => {
        if (!res.headersSent) res.writeHead(500);
        res.end();
      })
      .pipe(res);

    return true;
  } catch {
    return false;
  }
}


const PERFECTPAY_PLANS = ["starter","growth","pro","authority","influencer","scale","dominance","ultimate"];
let perfectPayLinks = {};
let oneClickEnabled = false;
try {
  const file = readFileSync(path.join(__dirname, "perfectpay-checkouts.json"), "utf8");
  perfectPayLinks = JSON.parse(file);
  if (process.env.PERFECTPAY_CHECKOUTS_JSON) {
    const overrides = JSON.parse(process.env.PERFECTPAY_CHECKOUTS_JSON);
    for (const [plan, options] of Object.entries(overrides)) {
      perfectPayLinks[plan] = { ...(perfectPayLinks[plan] || {}), ...options };
    }
  }
} catch (error) {
  console.warn("PerfectPay checkout configuration unavailable:", error.message);
}
try {
  const policy = JSON.parse(readFileSync(path.join(__dirname, "sales/config.json"), "utf8"));
  oneClickEnabled = policy.oneClickEnabled === true;
} catch { /* Remain disabled until the validated configuration is authorized. */ }

function isPerfectPayLink(link) {
  if (typeof link !== "string" || !link.trim()) return false;
  try {
    const url = new URL(link);
    return url.protocol === "https:" && ["go.perfectpay.com.br", "go.centerpag.com"].includes(url.hostname) &&
      !url.username && !url.password && url.pathname !== "/";
  } catch { return false; }
}

async function parseJsonBody(req) {
  let raw = "";
  for await (const chunk of req) {
    raw += chunk.toString("utf8");
    if (raw.length > 12000) throw new Error("payload_too_large");
  }
  return JSON.parse(raw);
}

function getPlanUrl(plan, mode) {
  const value = perfectPayLinks[plan]?.[mode];
  return isPerfectPayLink(value) ? value : null;
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const pathname = requestUrl.pathname;

  if (pathname === "/api/health") {
    return sendJson(res, 200, {
      ok: true,
      service: "instaflow",
      runtime: "node",
      timestamp: new Date().toISOString()
    });
  }


  if (pathname === "/api/perfectpay/status") {
    if (req.method !== "GET") return sendJson(res, 405, { ok: false, message: "Method not allowed" });
    return sendJson(res, 200, {
      ok: true, gateway: "perfectpay", oneClickEnabled,
      plans: Object.fromEntries(PERFECTPAY_PLANS.map(plan => [plan, {
        standard: Boolean(getPlanUrl(plan, "standard")), niche: Boolean(getPlanUrl(plan, "niche"))
      }]))
    });
  }

  if (pathname === "/api/perfectpay/checkout") {
    if (req.method !== "POST") return sendJson(res, 405, { ok: false, message: "Method not allowed" });
    let input;
    try { input = await parseJsonBody(req); }
    catch { return sendJson(res, 400, { ok: false, message: "Invalid request" }); }
    const plan = String(input?.plan || "").toLowerCase();
    const mode = String(input?.mode || "");
    const username = String(input?.instagramUsername || "").replace(/^@+/, "").trim();
    const email = String(input?.email || "").trim().toLowerCase();
    const customerName = String(input?.customerName || "").trim().slice(0, 100);
    if (!PERFECTPAY_PLANS.includes(plan) || !["standard","niche"].includes(mode) ||
        !/^[a-zA-Z0-9._]{1,30}$/.test(username) ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return sendJson(res, 400, { ok: false, message: "Please check your Instagram username and email." });
    }
    const base = getPlanUrl(plan, mode);
    if (!base) return sendJson(res, 503, {
      ok: false, message: "PerfectPay checkout isn't configured for this plan yet. Please contact support."
    });
    const url = new URL(base);
    if (oneClickEnabled) url.searchParams.set("upsell", "true");
    else url.searchParams.delete("upsell");
    if (!url.searchParams.has("email")) url.searchParams.set("email", email);
    if (customerName && !url.searchParams.has("name")) url.searchParams.set("name", customerName);
    if (!url.searchParams.has("src")) url.searchParams.set("src", "instaflow");
    if (!url.searchParams.has("sck")) url.searchParams.set("sck", "ig_" + plan + "_" + mode + "_" + username);
    const tracking = input?.tracking;
    if (tracking && typeof tracking === "object" && !Array.isArray(tracking)) {
      for (const key of ["utm_source","utm_medium","utm_campaign","utm_content","utm_term","fbclid","gclid"]) {
        const value = tracking[key];
        if (typeof value === "string" && value.length <= 250 && !url.searchParams.has(key)) {
          url.searchParams.set(key, value);
        }
      }
    }
    return sendJson(res, 200, { ok: true, redirectUrl: url.toString() });
  }

  if (pathname.startsWith("/api/")) {
    return sendJson(res, 404, {
      ok: false,
      error: "API route not configured on this server yet."
    });
  }

  if (!["GET", "HEAD"].includes(req.method || "GET")) {
    res.writeHead(405, { Allow: "GET, HEAD" });
    return res.end("Method Not Allowed");
  }

  const requestedFile = pathname === "/" ? "/index.html" : pathname;
  let filePath;
  try { filePath = safePathFromUrl(requestedFile); }
  catch {
    res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    return res.end("Invalid path");
  }

  if (filePath === __dirname || filePath.startsWith(__dirname + path.sep)) {
    if (await serveFile(req, res, filePath)) return;
    // Resolve directory pages before the SPA fallback used by the main funnel.
    try {
      if ((await stat(filePath)).isDirectory()) {
        if (!pathname.endsWith("/")) {
          res.writeHead(308, { Location: pathname + "/" + requestUrl.search });
          return res.end();
        }
        if (await serveFile(req, res, path.join(filePath, "index.html"))) return;
      }
    } catch { /* Not a directory; continue to the fallback below. */ }
  }

  const indexPath = path.join(__dirname, "index.html");
  if (await serveFile(req, res, indexPath)) {
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Not Found");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`InstaFlow listening on port ${PORT}`);
});
