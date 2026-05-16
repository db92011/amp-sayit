import test from "node:test";
import assert from "node:assert/strict";

import { createSpeechController } from "../pages/src/speech.js";

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

test("speech controller uses browser speech recognition when available", async () => {
  const originalWindow = globalThis.window;
  let recognition;

  globalThis.window = {
    SpeechRecognition: class MockSpeechRecognition {
      constructor() {
        recognition = this;
        this.continuous = false;
        this.interimResults = false;
        this.lang = "";
      }

      start() {
        this.onstart();
        this.onresult({
          results: [
            [
              {
                transcript: "browser transcript"
              }
            ]
          ]
        });
      }

      stop() {
        this.onend();
      }
    }
  };

  try {
    const statusNode = { textContent: "" };
    const startButton = { disabled: false };
    const stopButton = { disabled: false };
    const textarea = { value: "" };

    const controller = createSpeechController({
      textarea,
      statusNode,
      startButton,
      stopButton,
      onTranscript() {}
    });

    assert.ok(controller);

    await controller.start();

    assert.equal(textarea.value, "browser transcript");
    assert.equal(startButton.disabled, true);
    assert.equal(stopButton.disabled, false);
    assert.equal(recognition.continuous, true);
    assert.equal(recognition.interimResults, true);
    assert.equal(recognition.lang, "en-US");

    await controller.stop();

    assert.equal(startButton.disabled, false);
    assert.equal(stopButton.disabled, true);
  } finally {
    globalThis.window = originalWindow;
  }
});
