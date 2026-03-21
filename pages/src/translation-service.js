import { buildTranslation } from "./rewrite-engine.js";

const API_ENDPOINT = "/api/translate";
const API_TIMEOUT_MS = 18000;
const MAX_RETRIES = 1;

function buildFallback(payload, reason) {
  return {
    translation: buildTranslation(payload),
    meta: {
      source: "local",
      label: "Local engine fallback",
      reason: reason || "Fallback triggered.",
      mode: "rule-based",
      usedFallback: true
    }
  };
}

function normalizePayload(payload) {
  return {
    recipient: String(payload?.recipient || "").trim(),
    relationship: String(payload?.relationship || "").trim(),
    intent: String(payload?.intent || "auto").trim() || "auto",
    afterState: String(payload?.afterState || payload?.["after-state"] || "").trim(),
    situation: String(payload?.situation || "").trim(),
    message: String(payload?.message || "").trim()
  };
}

function validatePayload(payload) {
  if (!payload.message) {
    throw new Error("Message is required.");
  }

  if (payload.message.length < 2) {
    throw new Error("Message is too short.");
  }

  return payload;
}

async function parseJsonSafely(response) {
  if (typeof response?.text !== "function" && typeof response?.json === "function") {
    return response.json();
  }

  const text = await response.text();

  if (!text) {
    throw new Error("Translation response was empty.");
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Translation response was not valid JSON.");
  }
}

function normalizeTranslationShape(rawTranslation) {
  if (typeof rawTranslation === "string") {
    const primary = rawTranslation.trim();
    if (!primary) {
      throw new Error("Translation response was missing usable text.");
    }

    return {
      primary,
      teleprompterLines: primary
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean)
    };
  }

  if (rawTranslation && typeof rawTranslation === "object") {
    const primary = String(rawTranslation.primary || rawTranslation.text || "").trim();

    if (!primary) {
      throw new Error("Translation response was missing usable text.");
    }

    const teleprompterLines = Array.isArray(rawTranslation.teleprompterLines)
      ? rawTranslation.teleprompterLines
          .map((line) => String(line || "").trim())
          .filter(Boolean)
      : primary
          .split(/\n+/)
          .map((line) => line.trim())
          .filter(Boolean);

    return {
      ...rawTranslation,
      primary,
      teleprompterLines
    };
  }

  throw new Error("Translation response was missing usable text.");
}

function normalizeApiResult(body) {
  const translation = normalizeTranslationShape(body?.translation);

  return {
    translation,
    meta: {
      source: "api",
      label: "Pages Function API",
      runtime: body?.meta?.runtime || "unknown",
      mode: body?.meta?.mode || "unknown",
      provider: body?.meta?.provider || "unknown",
      providerConfigured: body?.meta?.providerConfigured === true,
      behaviorConfigured: body?.meta?.behaviorConfigured === true,
      usedFallback: body?.meta?.usedFallback === true,
      fallbackReason: body?.meta?.fallbackReason || "",
      model: body?.meta?.model || "",
      toneProfile: body?.meta?.toneProfile || "",
      intentDetected: body?.meta?.intentDetected || ""
    }
  };
}

function isRetryableError(error) {
  const message = String(error?.message || "").toLowerCase();

  return (
    message.includes("timeout") ||
    message.includes("network") ||
    message.includes("failed to fetch") ||
    message.includes("abort") ||
    message.includes("503") ||
    message.includes("502") ||
    message.includes("504")
  );
}

async function fetchTranslation(payload, attempt = 0) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => {
    controller.abort();
  }, API_TIMEOUT_MS);

  try {
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "accept": "application/json"
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Translation request failed with status ${response.status}.`);
    }

    const body = await parseJsonSafely(response);
    return normalizeApiResult(body);
  } catch (error) {
    if (attempt < MAX_RETRIES && isRetryableError(error)) {
      return fetchTranslation(payload, attempt + 1);
    }

    if (error?.name === "AbortError") {
      throw new Error("Translation request timed out.");
    }

    throw error instanceof Error ? error : new Error("Request failed.");
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function requestTranslation(rawPayload) {
  const payload = normalizePayload(rawPayload);

  try {
    validatePayload(payload);
    return await fetchTranslation(payload);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Request failed.";
    return buildFallback(payload, reason);
  }
}
