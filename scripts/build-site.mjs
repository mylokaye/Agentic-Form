import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Build infrastructure — Package the static form and TypeSafe route for the Sites worker.
const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = await readFile(path.join(projectDir, "index.html"), "utf8");
const encodedHtml = Buffer.from(html, "utf8").toString("base64");
const icon = await readFile(path.join(projectDir, "assets", "agentic-form-icon.png"));
const encodedIcon = icon.toString("base64");
const worker = `// Build infrastructure — Static assets embedded by scripts/build-site.mjs.
const assets = {"/":"${encodedHtml}","/index.html":"${encodedHtml}","/assets/agentic-form-icon.png":"${encodedIcon}"};
const inquiryTypes = {
  new_business: "New Business",
  service: "Service",
  parts: "Parts",
  other: "Other"
};

// Build infrastructure — Decode embedded static assets without changing their bytes.
function decode(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

// F15 — Classify only the inquiry text; the TypeSafe key stays in the worker environment.
async function classifyInquiry(request, apiKey) {
  if (request.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed." }, { allow: "POST" });
  }

  const requestUrl = new URL(request.url);
  if (request.headers.get("origin") !== requestUrl.origin) {
    return jsonResponse(403, { error: "Request origin is not allowed." });
  }
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return jsonResponse(415, { error: "Content-Type must be application/json." });
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > 10000) {
    return jsonResponse(413, { error: "Inquiry is too long." });
  }

  let body;
  try {
    const rawBody = await request.text();
    if (rawBody.length > 10000) return jsonResponse(413, { error: "Inquiry is too long." });
    body = JSON.parse(rawBody);
  } catch {
    return jsonResponse(400, { error: "Request must be valid JSON." });
  }

  const inquiry = typeof body?.inquiry === "string" ? body.inquiry.trim() : "";
  if (!inquiry) return jsonResponse(400, { error: "Inquiry text is required." });
  if (inquiry.length > 8000) return jsonResponse(413, { error: "Inquiry is too long." });
  if (typeof apiKey !== "string" || !apiKey.trim()) return jsonResponse(503, { error: "Classification is unavailable." });
  const authorizationKey = apiKey.trim().split("").filter((character) => {
    const code = character.charCodeAt(0);
    return code >= 33 && code <= 126;
  }).join("");
  if (!authorizationKey) return jsonResponse(503, { error: "Classification is unavailable." });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch("https://api.typesafe.ai/v1/systemone", {
      method: "POST",
      signal: controller.signal,
      headers: {
        authorization: "Bearer " + authorizationKey,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        state: { inquiry: inquiry },
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

    if (!response.ok) {
      console.error("[F15] TypeSafe returned HTTP " + response.status + ".");
      return jsonResponse(502, { error: "Classification is unavailable." });
    }

    const result = await response.json();
    const choice = result?.answers?.inquiry_type?.choice;
    if (typeof choice !== "string" || !Object.hasOwn(inquiryTypes, choice)) {
      console.error("[F15] TypeSafe response did not contain an allowlisted Choice.");
      return jsonResponse(502, { error: "Classification response was invalid." });
    }

    return jsonResponse(200, { inquiryType: inquiryTypes[choice] });
  } catch (error) {
    const code = error?.cause?.code;
    const detail = [error?.message, code, error?.cause?.message].filter(Boolean).join(" | ").slice(0, 240);
    console.error("[F15] TypeSafe request failed (" + (error?.name || "Error") + "): " + detail);
    return jsonResponse(502, { error: "Classification is unavailable." });
  } finally {
    clearTimeout(timeoutId);
  }
}

function jsonResponse(status, payload, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      ...extraHeaders
    }
  });
}

// Hosted worker entrypoint — Serve the form or classify an inquiry through TypeSafe.
export default {
  async fetch(request, env = {}) {
    const path = new URL(request.url).pathname;

    if (path === "/api/classify-inquiry") {
      return classifyInquiry(request, env.TYPESAFE_API_KEY);
    }

    const asset = assets[path];

    if (!asset) {
      return new Response("Not found", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
    }

    return new Response(decode(asset), {
      headers: {
        "content-type": path === "/assets/agentic-form-icon.png" ? "image/png" : "text/html; charset=utf-8",
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
