"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[site-error-boundary]", error);
  }, [error]);

  return (
    <div className="site-error">
      <div className="site-error__panel">
        <h1 className="site-error__title">Something went wrong</h1>
        <p className="site-error__copy">
          We encountered an unexpected error. Please try again or contact
          support if the issue persists.
        </p>
        <button type="button" onClick={reset} className="btn-primary">
          Try again
        </button>
      </div>
    </div>
  );
}
