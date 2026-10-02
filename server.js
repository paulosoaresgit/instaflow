import http from "node:http";
import { createReadStream } from "node:fs";
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
  const filePath = safePathFromUrl(requestedFile);

  if (filePath.startsWith(__dirname) && (await serveFile(req, res, filePath))) {
    return;
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
