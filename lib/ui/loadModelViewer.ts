const MODEL_VIEWER_TAG = "model-viewer";
const MODEL_VIEWER_SCRIPT_ID = "google-model-viewer-script";
const MODEL_VIEWER_SCRIPT_SRC =
  "https://cdn.jsdelivr.net/npm/@google/model-viewer@4.3.1/dist/model-viewer.min.js";

let modelViewerLoadPromise: Promise<void> | null = null;

export function loadModelViewer(): Promise<void> {
  if (typeof window === "undefined" || typeof document === "undefined" || typeof customElements === "undefined") {
    return Promise.resolve();
  }

  if (customElements.get(MODEL_VIEWER_TAG)) {
    return Promise.resolve();
  }

  if (modelViewerLoadPromise) {
    return modelViewerLoadPromise;
  }

  modelViewerLoadPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(MODEL_VIEWER_SCRIPT_ID) as HTMLScriptElement | null;

    const finish = () => {
      void customElements.whenDefined(MODEL_VIEWER_TAG).then(() => resolve(), reject);
    };

    if (existingScript) {
      if (customElements.get(MODEL_VIEWER_TAG)) {
        resolve();
        return;
      }
      existingScript.addEventListener("load", finish, { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Failed to load model-viewer script.")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.id = MODEL_VIEWER_SCRIPT_ID;
    script.type = "module";
    script.src = MODEL_VIEWER_SCRIPT_SRC;
    script.onload = finish;
    script.onerror = () => reject(new Error("Failed to load model-viewer script."));
    document.head.appendChild(script);
  }).catch((error) => {
    modelViewerLoadPromise = null;
    throw error;
  });

  return modelViewerLoadPromise;
}
