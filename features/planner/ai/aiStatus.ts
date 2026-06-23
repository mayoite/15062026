export type AIStatusState =
  | "idle"
  | "requesting"
  | "live_success"
  | "degraded_fallback"
  | "request_aborted"
  | "invalid_response"
  | "hard_failure";

export type AIProviderStatus = {
  state: AIStatusState;
  errorCode?: string;
  errorMessage?: string;
  usedFallback: boolean;
  abortedReason?: string;
  requestTimestamp: number;
};

export type AIProviderClassification =
  | { kind: "live_success"; provider: string; timestamp: number }
  | { kind: "degraded_fallback"; provider: string; reason: string; timestamp: number }
  | { kind: "request_aborted"; reason: string; timestamp: number }
  | { kind: "invalid_response"; error: string; timestamp: number }
  | { kind: "hard_failure"; error: string; timestamp: number };

export function classifyAIResponse(
  success: boolean,
  usedFallback: boolean,
  error: unknown,
  provider?: string,
): AIProviderClassification {
  const timestamp = Date.now();

  if (error instanceof DOMException && error.name === "AbortError") {
    return {
      kind: "request_aborted",
      reason: error.message || "Request cancelled",
      timestamp,
    };
  }

  if (success && !usedFallback) {
    return {
      kind: "live_success",
      provider: provider || "unknown",
      timestamp,
    };
  }

  if (success && usedFallback) {
    if (error instanceof Error && /schema validation|invalid response|failed schema validation/i.test(error.message)) {
      return {
        kind: "invalid_response",
        error: error.message,
        timestamp,
      };
    }
    return {
      kind: "degraded_fallback",
      provider: provider || "unknown",
      reason: "Provider unavailable, using fallback",
      timestamp,
    };
  }

  if (error instanceof Error) {
    return {
      kind: "hard_failure",
      error: error.message,
      timestamp,
    };
  }

  return {
    kind: "hard_failure",
    error: "Unknown error",
    timestamp,
  };
}

export function isStaleResponse(
  responseTimestamp: number,
  userActionTimestamp: number,
): boolean {
  return responseTimestamp < userActionTimestamp;
}

export function validateLayoutSchema(data: unknown): data is Record<string, unknown> {
  if (!data || typeof data !== "object" || Array.isArray(data)) return false;

  const obj = data as Record<string, unknown>;
  if (obj.version !== 1) return false;
  if (!Array.isArray(obj.furniture)) return false;
  if (!obj.room || typeof obj.room !== "object") return false;

  const room = obj.room as Record<string, unknown>;
  if (typeof room.label !== "string") return false;
  if (typeof room.widthMm !== "number" || typeof room.depthMm !== "number") return false;

  return true;
}
