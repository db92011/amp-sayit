function createBrowserSpeechController({ textarea, statusNode, startButton, stopButton, onTranscript, Recognition }) {
  const recognition = new Recognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-US";

  let baseValue = "";
  let listening = false;

  const syncButtons = () => {
    startButton.disabled = listening;
    if (stopButton) {
      stopButton.disabled = !listening;
    }
  };

  recognition.onstart = () => {
    listening = true;
    baseValue = textarea.value.trim();
    statusNode.textContent = "Listening now. Say it naturally.";
    syncButtons();
  };

  recognition.onend = () => {
    listening = false;
    statusNode.textContent = "Your draft is here. Adjust anything you want, then hit Refine Draft.";
    syncButtons();
  };

  recognition.onerror = (event) => {
    listening = false;
    statusNode.textContent = `I hit a voice capture snag: ${event.error}.`;
    syncButtons();
  };

  recognition.onresult = (event) => {
    const transcript = Array.from(event.results)
      .map((result) => result[0]?.transcript || "")
      .join(" ")
      .trim();

    const nextValue = [baseValue, transcript].filter(Boolean).join(baseValue ? " " : "");
    textarea.value = nextValue;
    if (typeof onTranscript === "function") {
      onTranscript(nextValue);
    }
  };

  syncButtons();

  return {
    async start() {
      recognition.start();
    },
    async stop() {
      recognition.stop();
    },
    isListening() {
      return listening;
    }
  };
}

export function createSpeechController({ textarea, statusNode, startButton, stopButton, onTranscript }) {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (Recognition) {
    return createBrowserSpeechController({
      textarea,
      statusNode,
      startButton,
      stopButton,
      onTranscript,
      Recognition
    });
  }

  statusNode.textContent = "Voice capture is not supported on this device yet.";
  startButton.disabled = true;
  if (stopButton) {
    stopButton.disabled = true;
  }
  return null;
}
