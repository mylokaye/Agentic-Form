import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const PORT = 8787;
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";
const MODEL = "deepseek-v4-flash";
const ENV_FILES = [".env.local", ".env"];
const ALLOWED_ORIGINS = new Set([
  "http://127.0.0.1:8000",
  "http://localhost:8000"
]);
const DEFAULT_SYSTEM_PROMPT = "Return valid JSON only. Do not include markdown or extra commentary.";
const DEEPSEEK_REQUEST_TIMEOUT_MS = 8000;
const ENRICHMENT_RESPONSE_FIELDS = [
  "industry",
  "about",
  "urgency",
  "sentiment",
  "query"
];

function loadLocalEnv() {
  ENV_FILES.forEach((fileName) => {
    const filePath = path.join(process.cwd(), fileName);

    if (!fs.existsSync(filePath)) {
      return;
    }

    const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);

    lines.forEach((line) => {
      const trimmedLine = line.trim();

      if (!trimmedLine || trimmedLine.startsWith("#")) {
        return;
      }

      const separatorIndex = trimmedLine.indexOf("=");

      if (separatorIndex === -1) {
        return;
      }

      const key = trimmedLine.slice(0, separatorIndex).trim();
      const value = trimmedLine.slice(separatorIndex + 1).trim();

      if (!key || process.env[key]) {
        return;
      }

      process.env[key] = value.replace(/^["']|["']$/g, "");
    });
  });
}

loadLocalEnv();

function sendJson(request, response, statusCode, payload) {
  const origin = request.headers.origin;
  const headers = {
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };

  if (ALLOWED_ORIGINS.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers.Vary = "Origin";
  }

  response.writeHead(statusCode, headers);
  response.end(JSON.stringify(payload));
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;

      if (body.length > 10000) {
        reject(new Error("Request body is too large."));
        request.destroy();
      }
    });

    request.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch {
        reject(new Error("Request body must be valid JSON."));
      }
    });

    request.on("error", reject);
  });
}

function getCompanyPrompt(companyUrl) {
  return `Visit ${companyUrl}, return a JSON result with two fields:
- "industry": the company's industry in one or two broad words (e.g. "Manufacturing", "Financial Services")
- "about": a short 1-2 sentence description of what the company does`;
}

function getMessageAnalysisPrompt(message) {
  return `Analyse this customer message and classify it into exactly these three fields:
- "urgency": one of "Low", "Medium", or "High"
- "sentiment": one of "Annoyed", "Content", or "Happy"
- "query": one of "General", "Complaint", "New Business", or "Parts & Service"

Message:
${message}`;
}

function parseDeepSeekJson(content) {
  const trimmedContent = content.trim();
  const jsonMatch = trimmedContent.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : trimmedContent);

  return {
    industry: String(parsed.industry || "").trim(),
    about: String(parsed.about || "").trim(),
    urgency: String(parsed.urgency || "").trim(),
    sentiment: String(parsed.sentiment || "").trim(),
    query: String(parsed.query || "").trim()
  };
}

function createEnrichmentResponse(companyResult, messageResult) {
  const result = {
    ...companyResult,
    ...messageResult
  };

  return ENRICHMENT_RESPONSE_FIELDS.reduce((response, fieldName) => {
    response[fieldName] = String(result[fieldName] || "").trim();
    return response;
  }, {});
}

function getPublicErrorMessage(error) {
  if (error?.name === "AbortError") {
    return "DeepSeek request timed out. Please try again.";
  }

  if (error?.message === "fetch failed") {
    return "DeepSeek request could not be reached. Check your network, VPN, firewall, or certificate settings.";
  }

  return error?.message || "Company enrichment failed.";
}

async function callDeepSeek({
  prompt,
  systemPrompt = DEFAULT_SYSTEM_PROMPT
}) {
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    throw new Error("Missing DEEPSEEK_API_KEY environment variable.");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    DEEPSEEK_REQUEST_TIMEOUT_MS
  );

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: {
          type: "json_object"
        },
        temperature: 0,
        stream: false
      })
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error?.message || "DeepSeek request failed.");
    }

    const rawContent = payload.choices?.[0]?.message?.content || "{}";
    return parseDeepSeekJson(rawContent);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function enrichCompany(companyUrl) {
  return callDeepSeek({
    prompt: getCompanyPrompt(companyUrl)
  });
}

async function analyzeMessage(message) {
  if (!message) {
    return {
      urgency: "",
      sentiment: "",
      query: ""
    };
  }

  try {
    const result = await callDeepSeek({
      prompt: getMessageAnalysisPrompt(message)
    });

    return {
      urgency: result.urgency || "",
      sentiment: result.sentiment || "",
      query: result.query || ""
    };
  } catch (error) {
    return {
      urgency: "",
      sentiment: "",
      query: ""
    };
  }
}

async function handleEnrichmentRequest(request, response) {
  const body = await readJsonBody(request);
  const companyUrl = String(body.companyUrl || "").trim();
  const message = String(body.message || "").trim();

  if (!companyUrl) {
    sendJson(request, response, 400, {
      error: "companyUrl is required."
    });
    return;
  }

  const companyResult = await enrichCompany(companyUrl);
  const messageResult = await analyzeMessage(message);
  sendJson(request, response, 200, createEnrichmentResponse(companyResult, messageResult));
}

const server = http.createServer(async (request, response) => {
  if (request.method === "OPTIONS") {
    sendJson(request, response, 204, {});
    return;
  }

  if (request.method !== "POST" || request.url !== "/enrich-company") {
    sendJson(request, response, 404, {
      error: "Not found."
    });
    return;
  }

  try {
    await handleEnrichmentRequest(request, response);
  } catch (error) {
    sendJson(request, response, 500, {
      error: getPublicErrorMessage(error)
    });
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`DeepSeek dev proxy running at http://127.0.0.1:${PORT}`);
});
