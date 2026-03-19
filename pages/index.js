(() => {
  const yearNodes = document.querySelectorAll("[data-current-year]");
  const year = String(new Date().getFullYear());
  for (const node of yearNodes) node.textContent = year;

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
