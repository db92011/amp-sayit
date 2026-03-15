import test from "node:test";
import assert from "node:assert/strict";

import { createSpeechController } from "../site/src/speech.js";

test("speech controller disables controls when recognition is unavailable", () => {
  const originalWindow = globalThis.window;

  globalThis.window = {};

  try {
    const statusNode = { textContent: "" };
    const startButton = { disabled: false };
    const stopButton = { disabled: false };

    const controller = createSpeechController({
      textarea: { value: "" },
      statusNode,
      startButton,
      stopButton,
      onTranscript() {},
    });

    assert.equal(controller, null);
    assert.equal(startButton.disabled, true);
    assert.equal(stopButton.disabled, true);
    assert.match(statusNode.textContent, /not supported/i);
  } finally {
    globalThis.window = originalWindow;
  }
});
