"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface PlannerErrorBoundaryProps {
  children: ReactNode;
  label?: string;
}

interface PlannerErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary that wraps the planner workspace and 3D viewer.
 * Prevents a canvas/WebGL crash from taking down the entire app.
 */
export class PlannerErrorBoundary extends Component<
  PlannerErrorBoundaryProps,
  PlannerErrorBoundaryState
> {
  constructor(props: PlannerErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): PlannerErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[planner-error-boundary]", this.props.label ?? "planner", error, info);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="surface-inverse flex h-full min-h-[320px] items-center justify-center px-6">
        <div className="planner-viewer-surface max-w-md rounded-[1.35rem] border border-warning px-5 py-4 text-center">
          <div className="typ-caption font-semibold uppercase tracking-[0.16em] text-warning">
            {this.props.label ?? "Planner"} unavailable
          </div>
          <div className="mt-2 typ-caption-lg text-body">
            Something went wrong rendering this surface. Your plan data is safe.
            Try again to reload the view.
          </div>
          {this.state.error?.message ? (
            <div className="mt-2 typ-caption text-muted">
              {this.state.error.message}
            </div>
          ) : null}
          <button
            type="button"
            onClick={this.handleReset}
            className="btn-primary mt-4 px-4 py-2 text-sm"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }
}
