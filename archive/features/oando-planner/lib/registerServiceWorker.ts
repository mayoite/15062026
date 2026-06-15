export function registerPlannerServiceWorker(): void {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  const doRegister = () => {
    navigator.serviceWorker
      .register("/planner-sw.js", { scope: "/editor" })
      .catch(() => {});
  };

  if (document.readyState === "complete") {
    doRegister();
  } else {
    window.addEventListener("load", doRegister);
  }
}
