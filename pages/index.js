(() => {
  const yearNodes = document.querySelectorAll("[data-current-year]");
  const year = String(new Date().getFullYear());
  for (const node of yearNodes) node.textContent = year;

  const params = new URLSearchParams(window.location.search);
  const shouldOpenInstallGuide =
    params.get("source") === "circle" || params.get("install") === "1";
  const installAction = document.querySelector("[data-install-action]");
  const installStatus = document.querySelector("[data-install-status]");
  const installSheet = document.querySelector("#installSheet");
  const closeInstallSheet = document.querySelector("#closeInstallSheet");
  const installSheetEyebrow = document.querySelector("#installSheetEyebrow");
  const installSheetTitle = document.querySelector("#installSheetTitle");
  const installStepOne = document.querySelector("#installStepOne");
  const installStepTwo = document.querySelector("#installStepTwo");
  const installStepThree = document.querySelector("#installStepThree");
  const ua = window.navigator.userAgent || "";
  const platform = window.navigator.platform || "";
  const vendor = window.navigator.vendor || "";
  const isAppleTouchDevice =
    /iphone|ipad|ipod/i.test(ua) ||
    /iphone|ipad|ipod/i.test(platform) ||
    (platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
  const isIOS = isAppleTouchDevice;
  const isSafari =
    /Apple/i.test(vendor) &&
    /safari/i.test(ua) &&
    !/crios|fxios|edgios|opios|mercury/i.test(ua);
  const isDesktopSafari = isSafari && !isIOS;
  const isAndroid = /android/i.test(ua);
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true ||
    document.referrer.startsWith("android-app://");
  let installPrompt = null;

  function setInstallStatus(copy) {
    if (installStatus) installStatus.textContent = copy;
  }

  function setInstallGuide(kind) {
    if (kind === "mac") {
      installSheetEyebrow.textContent = "Mac install";
      installSheetTitle.textContent = "Add SayIt! to the Dock";
      installStepOne.textContent = "Open this installer page in Safari on your Mac.";
      installStepTwo.textContent = "Use File > Add to Dock from the Safari menu bar.";
      installStepThree.textContent = "Click Add. Then launch SayIt! from the Dock or Applications.";
      return;
    }

    if (kind === "android") {
      installSheetEyebrow.textContent = "Android install";
      installSheetTitle.textContent = "Install SayIt!";
      installStepOne.textContent = "Tap the browser menu or the install prompt when it appears.";
      installStepTwo.textContent = "Choose Install app or Add to Home screen.";
      installStepThree.textContent = "Tap Install. Then launch SayIt! from the new app icon.";
      return;
    }

    if (kind === "desktop") {
      installSheetEyebrow.textContent = "Desktop install";
      installSheetTitle.textContent = "Install SayIt!";
      installStepOne.textContent = "Use the install icon in the address bar, or open the browser app menu.";
      installStepTwo.textContent = "Choose Install SayIt, Install this site as an app, or Add to Dock.";
      installStepThree.textContent = "Open SayIt! from the new app icon. It will launch the app shell.";
      return;
    }

    installSheetEyebrow.textContent = "iPhone install";
    installSheetTitle.textContent = "Add SayIt! to Home Screen";
    installStepOne.textContent = "Open this installer page in Safari.";
    installStepTwo.textContent = "Tap Share, then choose Add to Home Screen.";
    installStepThree.textContent = "Tap Add. Then launch SayIt! from the new Home Screen icon.";
  }

  function showDeviceGuide() {
    if (!installSheet?.showModal || isStandalone) return;

    if (isIOS) {
      setInstallGuide("iphone");
    } else if (isDesktopSafari) {
      setInstallGuide("mac");
    } else if (isAndroid) {
      setInstallGuide("android");
    } else {
      setInstallGuide("desktop");
    }

    installSheet.showModal();
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event;
    setInstallStatus("Ready to install. Use the Install SayIt button and the saved icon will open the app.");
  });

  if (installAction) {
    installAction.addEventListener("click", async () => {
      if (isStandalone) {
        window.location.href = "/app.html?source=pwa";
        return;
      }

      if (!installPrompt) {
        setInstallStatus("Use the browser install control. Safari uses Share or Add to Dock; Chrome and Edge may show Install app in the address bar or menu.");
        showDeviceGuide();
        return;
      }

      installPrompt.prompt();
      await installPrompt.userChoice;
      installPrompt = null;
      setInstallStatus("Install requested. Open SayIt! from the new app icon when it appears.");
    });
  }

  closeInstallSheet?.addEventListener("click", () => {
    installSheet?.close();
  });

  installSheet?.addEventListener("click", (event) => {
    if (event.target === installSheet) {
      installSheet.close();
    }
  });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data?.type !== "SAYIT_SW_ACTIVATED") {
        return;
      }

      if (document.visibilityState === "visible") {
        window.location.reload();
      }
    });
  }

  if (shouldOpenInstallGuide) {
    window.setTimeout(showDeviceGuide, 250);
  }
})();
