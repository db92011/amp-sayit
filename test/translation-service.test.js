import test from "node:test";
import assert from "node:assert/strict";

import { requestTranslation } from "../pages/src/translation-service.js";

const samplePayload = {
  recipient: "My manager",
  relationship: "Boss or supervisor",
  situation: "Feedback got tense in a meeting.",
  message: "I want to reset this calmly and be clear about what happened.",
  intent: "auto",
  outcome: "Be understood clearly",
  barrier: "Power dynamic",
  beforeState: "Too emotional",
  afterState: "Clear",
  proof: "",
  tones: ["calm", "clear"],
};

test("requestTranslation returns API payload when the endpoint succeeds", async () => {
  const originalWindow = globalThis.window;
  const originalFetch = globalThis.fetch;

  globalThis.window = {
    setTimeout,
    clearTimeout,
  };

  globalThis.fetch = async (url, init) => {
    assert.equal(url, "/api/translate");
    assert.equal(init.method, "POST");
    assert.match(String(init.body), /reset this calmly/i);

    return {
      ok: true,
      async json() {
        return {
          translation: {
            primary: "I want to reset this calmly.",
            concise: "Let's reset calmly.",
          },
          meta: {
            runtime: "cloudflare-pages-function",
            mode: "rule-based",
          },
        };
      },
    };
  };

  try {
    const result = await requestTranslation(samplePayload);
    assert.equal(result.meta.source, "api");
    assert.equal(result.meta.label, "Pages Function API");
    assert.equal(result.translation.primary, "I want to reset this calmly.");
  } finally {
    globalThis.window = originalWindow;
    globalThis.fetch = originalFetch;
  }
});

test("requestTranslation falls back locally when the API fails", async () => {
  const originalWindow = globalThis.window;
  const originalFetch = globalThis.fetch;

  globalThis.window = {
    setTimeout,
    clearTimeout,
  };

  globalThis.fetch = async () => {
    throw new Error("network offline");
  };

  try {
    const result = await requestTranslation(samplePayload);
    assert.equal(result.meta.source, "local");
    assert.equal(result.meta.label, "Local engine fallback");
    assert.match(result.meta.reason, /network offline/i);
    assert.match(result.translation.primary, /I want|Let me|I hear/i);
  } finally {
    globalThis.window = originalWindow;
    globalThis.fetch = originalFetch;
  }
});
