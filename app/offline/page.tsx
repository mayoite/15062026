import type { Metadata } from "next";
import ReloadButton from "./ReloadButton";

export const metadata: Metadata = {
  title: "Offline — Oando Platform",
  description: "You are offline. Cached content is available.",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <div className="site-error">
      <div className="site-error__panel">
        <h1 className="site-error__title">You are offline</h1>
        <p className="site-error__copy">
          We cannot reach the network right now. Any cached pages you have
          visited will still be available. Please reconnect to continue.
        </p>
        <ReloadButton />
      </div>
    </div>
  );
}
