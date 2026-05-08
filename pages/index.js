(() => {
  const yearNodes = document.querySelectorAll("[data-current-year]");
  const year = String(new Date().getFullYear());
  for (const node of yearNodes) node.textContent = year;

  const installAction = document.querySelector("[data-install-action]");
  const installStatus = document.querySelector("[data-install-status]");
  let installPrompt = null;

  function setInstallStatus(copy) {
    if (installStatus) installStatus.textContent = copy;
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event;
    setInstallStatus("Ready to install. Use the Install SayIt button and the saved icon will open the app.");
  });

  if (installAction) {
    installAction.addEventListener("click", () => {
      if (!installPrompt) {
        setInstallStatus("Use the browser install control. Safari uses Share or Add to Dock; Chrome and Edge may show Install app in the address bar or menu.");
        return;
      }

      installPrompt.prompt();
      installPrompt.userChoice.finally(() => {
        installPrompt = null;
      });
    });
  }

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
})();
