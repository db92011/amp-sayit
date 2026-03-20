import { buildTranslation } from "./rewrite-engine.js";

const API_ENDPOINT = "/api/translate";
const API_TIMEOUT_MS = 18000;
const MAX_RETRIES = 1;

function buildFallback(payload, reason) {
  return {
    translation: buildTranslation(payload),
    meta: {
      source: "local",
      label: "Local rewrite mode",
      reason: reason || "Fallback triggered.",
      mode: "rule-based"
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

function normalizeApiResult(body) {
  const translation =
    typeof body?.translation === "string"
      ? body.translation.trim()
      : "";

  if (!translation) {
    throw new Error("Translation response was missing usable text.");
  }

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
  try {
    const payload = validatePayload(normalizePayload(rawPayload));
    return await fetchTranslation(payload);
  } catch (error) {
    const payload = normalizePayload(rawPayload);
    const reason = error instanceof Error ? error.message : "Request failed.";
    return buildFallback(payload, reason);
  }
}
