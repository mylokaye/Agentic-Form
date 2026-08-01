import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = await readFile(path.join(projectDir, "index.html"), "utf8");
const encodedHtml = Buffer.from(html, "utf8").toString("base64");
const worker = `const assets = {"/":"${encodedHtml}","/index.html":"${encodedHtml}"};
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";
const MODEL = "deepseek-v4-flash";
const REQUEST_TIMEOUT_MS = 8000;
const MAX_BODY_BYTES = 10000;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 12;
const ENRICHMENT_RESPONSE_FIELDS = ["industry", "about", "urgency", "sentiment", "query"];
const rateLimits = new Map();

function decode(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff"
    }
  });
}

function getClientIp(request) {
  return request.headers.get("CF-Connecting-IP") || "unknown";
}

function isRateLimited(request) {
  const now = Date.now();
  const clientIp = getClientIp(request);
  const existing = rateLimits.get(clientIp);

  if (!existing || existing.resetAt <= now) {
    rateLimits.set(clientIp, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  existing.count += 1;

  if (rateLimits.size > 2000) {
    for (const [ip, entry] of rateLimits) {
      if (entry.resetAt <= now) rateLimits.delete(ip);
    }
  }

  return existing.count > RATE_LIMIT_MAX_REQUESTS;
}

function getCompanyPrompt(companyUrl) {
  return "Visit " + companyUrl + ", return a JSON result with two fields:\\n" +
    "- \\\"industry\\\": the company's industry in one or two broad words (e.g. \\\"Manufacturing\\\", \\\"Financial Services\\\")\\n" +
    "- \\\"about\\\": a short 1-2 sentence description of what the company does";
}

function getMessageAnalysisPrompt(message) {
  return "Analyse this customer message and classify it into exactly these three fields:\\n" +
    "- \\\"urgency\\\": one of \\\"Low\\\", \\\"Medium\\\", or \\\"High\\\"\\n" +
    "- \\\"sentiment\\\": one of \\\"Annoyed\\\", \\\"Content\\\", or \\\"Happy\\\"\\n" +
    "- \\\"query\\\": one of \\\"General\\\", \\\"Complaint\\\", \\\"New Business\\\", or \\\"Parts & Service\\\"\\n\\n" +
    "Message:\\n" + message;
}

function parseDeepSeekJson(content) {
  const trimmedContent = String(content || "").trim();
  const jsonMatch = trimmedContent.match(/\\{[\\s\\S]*\\}/);
  const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : trimmedContent);

  return ENRICHMENT_RESPONSE_FIELDS.reduce((result, fieldName) => {
    result[fieldName] = String(parsed[fieldName] || "").trim();
    return result;
  }, {});
}

function createEnrichmentResponse(companyResult, messageResult) {
  const merged = { ...companyResult, ...messageResult };

  return ENRICHMENT_RESPONSE_FIELDS.reduce((result, fieldName) => {
    result[fieldName] = String(merged[fieldName] || "").trim();
    return result;
  }, {});
}

function isPublicCompanyUrl(value) {
  let url;

  try {
    url = new URL(value);
  } catch {
    return false;
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") return false;

  const hostname = url.hostname.toLowerCase();
  const blockedHosts = ["localhost", "0.0.0.0", "127.0.0.1", "::1"];

  return !blockedHosts.includes(hostname) && !hostname.endsWith(".localhost");
}

async function callDeepSeek(env, prompt) {
  const apiKey = env.DEEPSEEK_API_KEY || env.deepseek;

  if (!apiKey) {
    const error = new Error("DeepSeek is not configured.");
    error.code = "MISSING_DEEPSEEK_CONFIGURATION";
    throw error;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "authorization": "Bearer " + apiKey,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: "Return valid JSON only. Do not include markdown or extra commentary." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0,
        stream: false
      })
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error?.message || "DeepSeek request failed.");
    }

    return parseDeepSeekJson(payload.choices?.[0]?.message?.content || "{}");
  } finally {
    clearTimeout(timeoutId);
  }
}

async function handleEnrichment(request, env) {
  if (isRateLimited(request)) {
    return json({ error: "Too many enrichment requests. Please try again shortly." }, 429);
  }

  const contentLength = Number(request.headers.get("content-length") || 0);

  if (contentLength > MAX_BODY_BYTES) {
    return json({ error: "Request body is too large." }, 413);
  }

  const rawBody = await request.text();

  if (rawBody.length > MAX_BODY_BYTES) {
    return json({ error: "Request body is too large." }, 413);
  }

  let body;

  try {
    body = JSON.parse(rawBody || "{}");
  } catch {
    return json({ error: "Request body must be valid JSON." }, 400);
  }

  const companyUrl = String(body.companyUrl || "").trim();
  const message = String(body.message || "").trim();

  if (!companyUrl) return json({ error: "companyUrl is required." }, 400);
  if (!isPublicCompanyUrl(companyUrl)) return json({ error: "companyUrl must be a public HTTP(S) URL." }, 400);

  try {
    const companyResult = await callDeepSeek(env, getCompanyPrompt(companyUrl));
    let messageResult = { urgency: "", sentiment: "", query: "" };

    if (message) {
      try {
        messageResult = await callDeepSeek(env, getMessageAnalysisPrompt(message));
      } catch {
        // Company enrichment remains useful if message classification is unavailable.
      }
    }

    return json(createEnrichmentResponse(companyResult, messageResult));
  } catch (error) {
    console.error("DeepSeek enrichment failed:", error?.message || "unknown error");
    const status = error?.code === "MISSING_DEEPSEEK_CONFIGURATION" ? 503 : 502;
    const message = error?.code === "MISSING_DEEPSEEK_CONFIGURATION"
      ? "Company enrichment is not configured yet."
      : error?.name === "AbortError"
      ? "DeepSeek request timed out. Please try again."
      : "Company enrichment failed. Please try again.";

    return json({ error: message }, status);
  }
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;

    if (path === "/enrich-company") {
      if (request.method !== "POST") return json({ error: "Not found." }, 404);
      return handleEnrichment(request, env);
    }

    const asset = assets[path];

    if (!asset) {
      return new Response("Not found", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
    }

    return new Response(decode(asset), {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "x-content-type-options": "nosniff",
        "referrer-policy": "strict-origin-when-cross-origin",
        "x-frame-options": "DENY"
      }
    });
  }
};
`;

const outputDir = path.join(projectDir, "dist", "server");
await mkdir(outputDir, { recursive: true });
await writeFile(path.join(outputDir, "index.js"), worker);
