"use client";

import type { ErrorInfo, ReactNode } from "react";
import React, { Component } from "react";
import { trackEvent } from "../lib/amplitude";
import { PLANNER_BRAND } from "../theme/brandTokens";

/**
 * Error types for categorizing errors
 */
type ErrorCategory = "localStorage" | "generic";

/**
 * Props for the ErrorBoundary component
 */
interface ErrorBoundaryProps {
  /** Child components to wrap */
  children: ReactNode;
  /** Optional key to reset the error boundary (e.g., route path) */
  resetKey?: string;
  /** Optional fallback component to render on error */
  fallback?: ReactNode;
}

/**
 * State for the ErrorBoundary component
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorCategory: ErrorCategory;
}

/**
 * Sanitizes an error message for analytics tracking.
 * - Truncates to 500 characters
 * - Strips potential PII (emails, IPs, names)
 */
function sanitizeErrorMessage(message: string): string {
  if (!message) return "Unknown error";

  let sanitized = message;

  // Strip email addresses
  sanitized = sanitized.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[EMAIL]");

  // Strip IP addresses (IPv4)
  sanitized = sanitized.replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, "[IP]");

  // Strip potential file paths with usernames
  sanitized = sanitized.replace(/\/Users\/[^/\s]+/g, "/Users/[USER]");
  sanitized = sanitized.replace(/C:\\Users\\[^\\]+/gi, "C:\\Users\\[USER]");

  // Truncate to 500 characters
  if (sanitized.length > 500) {
    sanitized = sanitized.substring(0, 497) + "...";
  }

  return sanitized;
}

/**
 * Determines if an error is related to localStorage parsing issues
 */
function isLocalStorageError(error: Error): boolean {
  const message = error.message?.toLowerCase() || "";
  const name = error.name?.toLowerCase() || "";

  // Check for JSON parsing errors
  if (name === "syntaxerror" && message.includes("json")) {
    return true;
  }

  // Check for localStorage-related errors
  if (
    message.includes("localstorage") ||
    message.includes("local storage") ||
    message.includes("quota") ||
    message.includes("storage")
  ) {
    return true;
  }

  // Check for common localStorage parsing patterns
  if (
    message.includes("unexpected token") ||
    message.includes("unexpected end of json") ||
    message.includes("json.parse")
  ) {
    return true;
  }

  return false;
}

/**
 * Clears planner-related localStorage entries
 */
function clearPlannerLocalStorage(): void {
  if (typeof window === "undefined") return;

  const keysToRemove: string[] = [];

  // Find all planner-related keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("planner")) {
      keysToRemove.push(key);
    }
  }

  // Remove the keys
  keysToRemove.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore removal errors
    }
  });
}

/**
 * Route-level ErrorBoundary component for catching and displaying errors.
 *
 * Features:
 * - Catches render errors in child components
 * - Displays user-friendly error messages
 * - Provides recovery options based on error type
 * - Logs errors to analytics
 * - Resets on route changes (via resetKey prop)
 *
 * @example
 * ```tsx
 * <ErrorBoundary resetKey={pathname}>
 *   <DashboardContent />
 * </ErrorBoundary>
 * ```
 *
 * **Validates: Requirements 17.1, 17.2, 17.3, 17.4, 17.5, 17.6**
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorCategory: "generic",
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorCategory: ErrorCategory = isLocalStorageError(error) ? "localStorage" : "generic";

    return {
      hasError: true,
      error,
      errorCategory,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log to console for debugging
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    // Track error in analytics with sanitized message
    const sanitizedMessage = sanitizeErrorMessage(error.message);
    const route = typeof window !== "undefined" ? window.location.pathname : "unknown";

    trackEvent("render_error", {
      route: route.substring(0, 256), // Limit route length
      errorName: error.name || "Error",
      errorMessage: sanitizedMessage,
      errorCategory: this.state.errorCategory,
      componentStack: sanitizeErrorMessage(errorInfo.componentStack || "").substring(0, 256),
    });
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    // Reset error state when resetKey changes (e.g., route navigation)
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.resetErrorState();
    }
  }

  resetErrorState = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorCategory: "generic",
    });
  };

  handleClearLocalStorage = (): void => {
    clearPlannerLocalStorage();
    // Reload the page after clearing
    window.location.reload();
  };

  handleReload = (): void => {
    window.location.reload();
  };

  handleTryAgain = (): void => {
    this.resetErrorState();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Render the appropriate recovery panel based on error category
      return (
        <div
          role="alert"
          aria-live="assertive"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "400px",
            padding: "2rem",
            backgroundColor: PLANNER_BRAND.color.lightSurface,
            borderRadius: "var(--radius-lg, 8px)",
            margin: "2rem",
            textAlign: "center",
          }}
        >
          {this.state.errorCategory === "localStorage" ? (
            <LocalStorageErrorPanel
              onClearData={this.handleClearLocalStorage}
              onTryAgain={this.handleTryAgain}
            />
          ) : (
            <GenericErrorPanel
              onReload={this.handleReload}
              onTryAgain={this.handleTryAgain}
            />
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Recovery panel for localStorage-related errors
 */
interface LocalStorageErrorPanelProps {
  onClearData: () => void;
  onTryAgain: () => void;
}

function LocalStorageErrorPanel({ onClearData, onTryAgain }: LocalStorageErrorPanelProps) {
  return (
    <>
      <ErrorIcon />
      <h2
        style={{
          color: PLANNER_BRAND.color.primary,
          fontSize: "1.5rem",
          fontWeight: 600,
          marginTop: "1.5rem",
          marginBottom: "0.75rem",
        }}
      >
        Local Data Issue
      </h2>
      <p
        style={{
          color: "var(--text-body)",
          fontSize: "1rem",
          maxWidth: "400px",
          marginBottom: "1.5rem",
          lineHeight: 1.5,
        }}
      >
        We encountered a problem with your saved project data. This can happen if the data became
        corrupted. You can try again or clear the local data to start fresh.
      </p>
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
        <button
          onClick={onTryAgain}
          style={{
            padding: "0.75rem 1.5rem",
            fontSize: "1rem",
            fontWeight: 500,
            color: PLANNER_BRAND.color.primary,
            backgroundColor: "transparent",
            border: `2px solid ${PLANNER_BRAND.color.primary}`,
            borderRadius: "var(--radius-lg, 8px)",
            cursor: "pointer",
            transition: "background-color 0.2s, color 0.2s",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = PLANNER_BRAND.color.primary;
            e.currentTarget.style.color = "var(--text-inverse, var(--surface-panel))";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = PLANNER_BRAND.color.primary;
          }}
          aria-label="Try again without clearing data"
        >
          Try again
        </button>
        <button
          onClick={onClearData}
          style={{
            padding: "0.75rem 1.5rem",
            fontSize: "1rem",
            fontWeight: 500,
            color: "var(--text-inverse, var(--surface-panel))",
            backgroundColor: PLANNER_BRAND.color.primary,
            border: "none",
            borderRadius: "var(--radius-lg, 8px)",
            cursor: "pointer",
            transition: "background-color 0.2s",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = PLANNER_BRAND.color.primaryHover;
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = PLANNER_BRAND.color.primary;
          }}
          aria-label="Clear local project data and reload"
        >
          Clear local project data
        </button>
      </div>
    </>
  );
}

/**
 * Recovery panel for generic errors
 */
interface GenericErrorPanelProps {
  onReload: () => void;
  onTryAgain: () => void;
}

function GenericErrorPanel({ onReload, onTryAgain }: GenericErrorPanelProps) {
  return (
    <>
      <ErrorIcon />
      <h2
        style={{
          color: PLANNER_BRAND.color.primary,
          fontSize: "1.5rem",
          fontWeight: 600,
          marginTop: "1.5rem",
          marginBottom: "0.75rem",
        }}
      >
        Something went wrong
      </h2>
      <p
        style={{
          color: "var(--text-body)",
          fontSize: "1rem",
          maxWidth: "400px",
          marginBottom: "1.5rem",
          lineHeight: 1.5,
        }}
      >
        We encountered an unexpected error. Please try again or reload the page. If the problem
        persists, please contact support.
      </p>
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
        <button
          onClick={onTryAgain}
          style={{
            padding: "0.75rem 1.5rem",
            fontSize: "1rem",
            fontWeight: 500,
            color: PLANNER_BRAND.color.primary,
            backgroundColor: "transparent",
            border: `2px solid ${PLANNER_BRAND.color.primary}`,
            borderRadius: "var(--radius-lg, 8px)",
            cursor: "pointer",
            transition: "background-color 0.2s, color 0.2s",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = PLANNER_BRAND.color.primary;
            e.currentTarget.style.color = "var(--text-inverse, var(--surface-panel))";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = PLANNER_BRAND.color.primary;
          }}
          aria-label="Try again"
        >
          Try again
        </button>
        <button
          onClick={onReload}
          style={{
            padding: "0.75rem 1.5rem",
            fontSize: "1rem",
            fontWeight: 500,
            color: "var(--text-inverse, var(--surface-panel))",
            backgroundColor: PLANNER_BRAND.color.primary,
            border: "none",
            borderRadius: "var(--radius-lg, 8px)",
            cursor: "pointer",
            transition: "background-color 0.2s",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = PLANNER_BRAND.color.primaryHover;
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = PLANNER_BRAND.color.primary;
          }}
          aria-label="Reload the page"
        >
          Reload
        </button>
      </div>
    </>
  );
}

/**
 * Error icon component using brand colors
 */
function ErrorIcon() {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle
        cx="32"
        cy="32"
        r="28"
        stroke={PLANNER_BRAND.color.warning}
        strokeWidth="4"
        fill="none"
      />
      <path
        d="M32 18V36"
        stroke={PLANNER_BRAND.color.warning}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="32" cy="44" r="3" fill={PLANNER_BRAND.color.warning} />
    </svg>
  );
}

export default ErrorBoundary;
