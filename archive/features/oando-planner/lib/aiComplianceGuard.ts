/**
 * AI & Compliance Feature Guard - Gates AI/compliance behavior behind flags with graceful failure
 * Ensures AI and compliance features only run when enabled and handle API/quota errors gracefully
 */

import React from "react";
import { isFeatureEnabled, type FeatureFlagName } from "./featureFlags";

// Feature flag keys (mapped to existing feature flags)
export const AI_FEATURE_FLAGS = {
  AI_SUGGESTIONS: "aiAdvisor" as FeatureFlagName,
  AI_AUTOFURNISH: "aiFurnish" as FeatureFlagName,
  AI_OPTIMIZATION: "aiAdvisor" as FeatureFlagName,
  COMPLIANCE_CHECKING: "complianceChecks" as FeatureFlagName,
  COMPLIANCE_OVERLAYS: "complianceChecks" as FeatureFlagName,
  COMPLIANCE_AUTO_FIX: "complianceChecks" as FeatureFlagName,
} as const;

// Error types
export class AIFeatureError extends Error {
  constructor(
    message: string,
    public code: "FEATURE_DISABLED" | "API_ERROR" | "QUOTA_EXCEEDED" | "TIMEOUT" | "UNKNOWN",
    public originalError?: unknown
  ) {
    super(message);
    this.name = "AIFeatureError";
  }
}

/**
 * Feature guard result
 */
export interface FeatureGuardResult<T> {
  enabled: boolean;
  data?: T;
  error?: AIFeatureError;
  fallback?: T;
}

/**
 * AI Feature Guard - Wraps AI features with feature flag checks and error handling
 */
export class AIFeatureGuard {
  /**
   * Check if AI feature is enabled
   */
  isFeatureEnabled(featureKey: FeatureFlagName): boolean {
    try {
      return isFeatureEnabled(featureKey);
    } catch (error) {
      console.error(`Error checking feature flag ${featureKey}:`, error);
      return false; // Fail safely - disable feature if flag check fails
    }
  }

  /**
   * Execute AI feature with flag check and error handling
   */
  async executeWithGuard<T>(
    featureKey: FeatureFlagName,
    aiFunction: () => Promise<T>,
    fallback?: T
  ): Promise<FeatureGuardResult<T>> {
    // Check if feature is enabled
    if (!this.isFeatureEnabled(featureKey)) {
      return {
        enabled: false,
        error: new AIFeatureError(
          `Feature ${featureKey} is disabled`,
          "FEATURE_DISABLED"
        ),
        fallback,
      };
    }

    try {
      // Execute AI function with timeout
      const result = await this.withTimeout(aiFunction(), 30000); // 30 second timeout
      return {
        enabled: true,
        data: result,
      };
    } catch (error) {
      const aiError = this.handleError(error, featureKey);
      return {
        enabled: true,
        error: aiError,
        fallback,
      };
    }
  }

  /**
   * Execute synchronous AI feature with flag check
   */
  executeWithGuardSync<T>(
    featureKey: FeatureFlagName,
    syncFunction: () => T,
    fallback?: T
  ): FeatureGuardResult<T> {
    // Check if feature is enabled
    if (!this.isFeatureEnabled(featureKey)) {
      return {
        enabled: false,
        error: new AIFeatureError(
          `Feature ${featureKey} is disabled`,
          "FEATURE_DISABLED"
        ),
        fallback,
      };
    }

    try {
      const result = syncFunction();
      return {
        enabled: true,
        data: result,
      };
    } catch (error) {
      const aiError = this.handleError(error, featureKey);
      return {
        enabled: true,
        error: aiError,
        fallback,
      };
    }
  }

  /**
   * Handle API errors gracefully
   */
  private handleError(error: unknown, featureKey: string): AIFeatureError {
    if (error instanceof AIFeatureError) {
      return error;
    }

    if (error instanceof Error) {
      // Check for specific error types
      if (error.message.includes("429") || error.message.includes("quota")) {
        return new AIFeatureError(
          `API quota exceeded for ${featureKey}`,
          "QUOTA_EXCEEDED",
          error
        );
      }

      if (error.message.includes("timeout") || error.message.includes("ETIMEDOUT")) {
        return new AIFeatureError(
          `Request timeout for ${featureKey}`,
          "TIMEOUT",
          error
        );
      }

      if (error.message.includes("401") || error.message.includes("403")) {
        return new AIFeatureError(
          `API authentication failed for ${featureKey}`,
          "API_ERROR",
          error
        );
      }

      return new AIFeatureError(
        `API error for ${featureKey}: ${error.message}`,
        "API_ERROR",
        error
      );
    }

    return new AIFeatureError(
      `Unknown error for ${featureKey}`,
      "UNKNOWN",
      error
    );
  }

  /**
   * Add timeout to promise
   */
  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Request timeout after ${timeoutMs}ms`)), timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  /**
   * Get user-friendly error message
   */
  getErrorMessage(error: AIFeatureError): string {
    switch (error.code) {
      case "FEATURE_DISABLED":
        return "This feature is currently disabled. Please contact your administrator.";
      case "QUOTA_EXCEEDED":
        return "AI service quota exceeded. Please try again later.";
      case "TIMEOUT":
        return "Request timed out. Please try again.";
      case "API_ERROR":
        return "AI service is currently unavailable. Please try again later.";
      default:
        return "An unexpected error occurred. Please try again.";
    }
  }

  /**
   * Check if error is retryable
   */
  isRetryableError(error: AIFeatureError): boolean {
    return error.code === "API_ERROR" || error.code === "TIMEOUT" || error.code === "QUOTA_EXCEEDED";
  }

  /**
   * Get suggested action for error
   */
  getSuggestedAction(error: AIFeatureError): string {
    switch (error.code) {
      case "FEATURE_DISABLED":
        return "Enable this feature in the admin dashboard or contact support.";
      case "QUOTA_EXCEEDED":
        return "Wait a few minutes before trying again or upgrade your plan.";
      case "TIMEOUT":
        return "Check your internet connection and try again.";
      case "API_ERROR":
        return "Check your internet connection or contact support if the issue persists.";
      default:
        return "Try again or contact support if the issue persists.";
    }
  }
}

// Singleton instance
const aiFeatureGuard = new AIFeatureGuard();

/**
 * Convenience functions for common AI features
 */

export async function withAIGuard<T>(
  featureKey: FeatureFlagName,
  aiFunction: () => Promise<T>,
  fallback?: T
): Promise<FeatureGuardResult<T>> {
  return aiFeatureGuard.executeWithGuard(featureKey, aiFunction, fallback);
}

export function withAIGuardSync<T>(
  featureKey: FeatureFlagName,
  syncFunction: () => T,
  fallback?: T
): FeatureGuardResult<T> {
  return aiFeatureGuard.executeWithGuardSync(featureKey, syncFunction, fallback);
}

export function isAIFeatureEnabled(featureKey: FeatureFlagName): boolean {
  return aiFeatureGuard.isFeatureEnabled(featureKey);
}

export function getAIErrorMessage(error: AIFeatureError): string {
  return aiFeatureGuard.getErrorMessage(error);
}

export function isRetryableAIError(error: AIFeatureError): boolean {
  return aiFeatureGuard.isRetryableError(error);
}

export function getAISuggestedAction(error: AIFeatureError): string {
  return aiFeatureGuard.getSuggestedAction(error);
}

/**
 * React hook for AI feature guard
 */
export function useAIFeatureGuard() {
  const [isChecking, setIsChecking] = React.useState(false);
  const [lastError, setLastError] = React.useState<AIFeatureError | null>(null);

  const executeWithGuard = React.useCallback(async <T>(
    featureKey: FeatureFlagName,
    aiFunction: () => Promise<T>,
    fallback?: T
  ): Promise<FeatureGuardResult<T>> => {
    setIsChecking(true);
    setLastError(null);

    try {
      const result = await aiFeatureGuard.executeWithGuard(featureKey, aiFunction, fallback);
      
      if (result.error) {
        setLastError(result.error);
      }
      
      return result;
    } finally {
      setIsChecking(false);
    }
  }, []);

  const executeWithGuardSync = React.useCallback(<T>(
    featureKey: FeatureFlagName,
    syncFunction: () => T,
    fallback?: T
  ): FeatureGuardResult<T> => {
    setLastError(null);
    
    const result = aiFeatureGuard.executeWithGuardSync(featureKey, syncFunction, fallback);
    
    if (result.error) {
      setLastError(result.error);
    }
    
    return result;
  }, []);

  const isFeatureEnabled = React.useCallback((featureKey: FeatureFlagName): boolean => {
    return aiFeatureGuard.isFeatureEnabled(featureKey);
  }, []);

  const getErrorMessage = React.useCallback((error: AIFeatureError): string => {
    return aiFeatureGuard.getErrorMessage(error);
  }, []);

  const clearError = React.useCallback(() => {
    setLastError(null);
  }, []);

  return {
    isChecking,
    lastError,
    executeWithGuard,
    executeWithGuardSync,
    isFeatureEnabled,
    getErrorMessage,
    clearError,
  };
}

export default aiFeatureGuard;