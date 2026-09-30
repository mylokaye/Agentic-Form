import http from "node:http";
import { readFile, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Local development adapter — Serve the form and same-origin TypeSafe route.
const projectDir = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 8001);
const inquiryTypes = {
  new_business: "New Business",
  service: "Service",
  parts: "Parts",
  other: "Other"
};

// Local configuration — Read ignored env files without replacing exported variables.
function loadLocalEnvironment() {
  [".env.local", ".env"].forEach((fileName) => {
    const filePath = path.join(projectDir, fileName);
    if (!existsSync(filePath)) return;

    readFileSync(filePath, "utf8").split(/\r?\n/).forEach((line) => {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith("#")) return;

      const separatorIndex = trimmedLine.indexOf("=");
      if (separatorIndex < 1) return;

      const key = trimmedLine.slice(0, separatorIndex).trim();
      if (!key || process.env[key]) return;

      const rawValue = trimmedLine.slice(separatorIndex + 1).trim();
      process.env[key] = rawValue.replace(/^(["'])(.*)\1$/, "$2");
    });
  });
}

loadLocalEnvironment();

function sendJson(response, statusCode, payload, extraHeaders = {}) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    ...extraHeaders
  });
  response.end(JSON.stringify(payload));
}

async function readJsonBody(request) {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    size += chunk.length;
    if (size > 10000) {
      const error = new Error("Request body is too large.");
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
  } catch {
    const error = new Error("Request body must be valid JSON.");
    error.statusCode = 400;
    throw error;
  }
}

// F15 — Send only the visitor's Inquiry text to TypeSafe and return an allowlisted label.
async function classifyInquiry(request, response) {
  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Method not allowed." }, { Allow: "POST" });
    return;
  }

  const requestOrigin = request.headers.origin;
  const expectedOrigin = `http://${request.headers.host}`;
  if (requestOrigin !== expectedOrigin) {
    sendJson(response, 403, { error: "Request origin is not allowed." });
    return;
  }
  if (!request.headers["content-type"]?.includes("application/json")) {
    sendJson(response, 415, { error: "Content-Type must be application/json." });
    return;
  }

  let body;
  try {
    body = await readJsonBody(request);
  } catch (error) {
    sendJson(response, error.statusCode || 400, {
      error: error.statusCode === 413 ? "Inquiry is too long." : "Request must be valid JSON."
    });
    return;
  }

  const inquiry = typeof body?.inquiry === "string" ? body.inquiry.trim() : "";
  if (!inquiry) {
    sendJson(response, 400, { error: "Inquiry text is required." });
    return;
  }
  if (inquiry.length > 8000) {
    sendJson(response, 413, { error: "Inquiry is too long." });
    return;
  }

  const apiKey = process.env.TYPESAFE_API_KEY;
  if (typeof apiKey !== "string" || !apiKey.trim()) {
    sendJson(response, 503, { error: "Classification is unavailable." });
    return;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const upstreamResponse = await fetch("https://api.typesafe.ai/v1/systemone", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        state: { inquiry },
        model: "jev-latest",
        questions: {
          inquiry_type: {
            type: "choice",
            instructions: "Classify the primary reason for this inquiry. Choose the closest category based on what the person wants.",
            criteria: {
              new_business: "A prospective customer asks about becoming a customer, a new purchase, pricing, a quote, or a business partnership. Examples: becoming a customer; requesting a quote for a new system.",
              service: "The person needs technical help, maintenance, repair, troubleshooting, warranty support, or another service for an existing product. Examples: repairing a system; troubleshooting a problem.",
              parts: "The person asks to buy, identify, replace, or get information about spare parts or components. Examples: requesting a replacement part; identifying a spare component.",
              other: "The primary request does not fit new business, service, or parts. Examples: updating an account contact; asking a general question about the company."
            }
          }
        }
      })
    });

    if (!upstreamResponse.ok) {
      sendJson(response, 502, { error: "Classification is unavailable." });
      return;
    }

    const result = await upstreamResponse.json();
    const choice = result?.answers?.inquiry_type?.choice;
    if (typeof choice !== "string" || !Object.hasOwn(inquiryTypes, choice)) {
      sendJson(response, 502, { error: "Classification response was invalid." });
      return;
    }

    sendJson(response, 200, { inquiryType: inquiryTypes[choice] });
  } catch {
    sendJson(response, 502, { error: "Classification is unavailable." });
  } finally {
    clearTimeout(timeoutId);
  }
}

const server = http.createServer(async (request, response) => {
  const pathname = new URL(request.url, "http://localhost").pathname;

  if (pathname === "/api/classify-inquiry") {
    await classifyInquiry(request, response);
    return;
  }

  const isIcon = pathname === "/assets/agentic-form-icon.png";
  if (request.method === "GET" && (pathname === "/" || pathname === "/index.html" || isIcon)) {
    const fileName = isIcon ? "assets/agentic-form-icon.png" : "index.html";
    readFile(path.join(projectDir, fileName), (error, asset) => {
      if (error) {
        response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
        response.end("Preview unavailable.");
        return;
      }

      response.writeHead(200, {
        "Content-Type": isIcon ? "image/png" : "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "strict-origin-when-cross-origin"
      });
      response.end(asset);
    });
    return;
  }

  sendJson(response, 404, { error: "Not found." });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Agentic Form preview running at http://localhost:${port}`);
});
