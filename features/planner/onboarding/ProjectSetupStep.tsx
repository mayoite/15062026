"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, Building2, MapPin, Ruler, Users } from "lucide-react";

import {
  PLANNER_INDIAN_CITIES,
  PLANNER_PRIMARY_PURPOSE_OPTIONS,
  applyProjectSetup,
  createDefaultProjectSetupDraft,
  markProjectSetupCompleteInStorage,
  type PlannerProjectMetadata,
  type PlannerProjectSetupDraft,
  type PlannerPrimaryPurpose,
} from "./projectSetup";



type ProjectSetupStepProps = {
  guestMode?: boolean;
  planId?: string;
  onComplete: (metadata: PlannerProjectMetadata) => void;
};

export function ProjectSetupStep({ guestMode = false, planId, onComplete }: ProjectSetupStepProps) {
  const [draft, setDraft] = useState<PlannerProjectSetupDraft>(() =>
    createDefaultProjectSetupDraft({ guestMode }),
  );
  const [error, setError] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const hydrationTimer = window.setTimeout(() => {
      setIsHydrated(true);
    }, 0);

    return () => window.clearTimeout(hydrationTimer);
  }, []);

  const updateDraft = <K extends keyof PlannerProjectSetupDraft>(key: K, value: PlannerProjectSetupDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setError(null);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isHydrated) {
      return;
    }

    const projectName = draft.projectName.trim();
    if (!projectName) {
      setError("Add a project name so you can find this layout later.");
      return;
    }

    if (projectName.length > 255) {
      setError("Project name must be 255 characters or fewer.");
      return;
    }

    if (!Number.isFinite(draft.floorAreaSqFt) || draft.floorAreaSqFt < 100) {
      setError("Enter a floor area of at least 100 sq ft.");
      return;
    }

    if (!Number.isFinite(draft.seatTarget) || draft.seatTarget < 1) {
      setError("Enter how many people you need to seat.");
      return;
    }

    const metadata: PlannerProjectMetadata = {
      ...draft,
      projectName,
      floorAreaSqFt: Math.round(draft.floorAreaSqFt),
      seatTarget: Math.round(draft.seatTarget),
      completedAt: new Date().toISOString(),
    };

    try {
      applyProjectSetup(metadata);
      markProjectSetupCompleteInStorage(guestMode, planId);
    } catch (storageErr) {
      const message =
        storageErr instanceof DOMException && storageErr.name === "QuotaExceededError"
          ? "Your browser storage is full. Clear some space and try again."
          : "Unable to save setup. Please try again.";
      setError(message);
      return;
    }

    onComplete(metadata);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[color:var(--surface-inverse)]/88 p-4 backdrop-blur-sm">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[var(--radius-xl)] border border-[color:var(--border-soft)] bg-[color:var(--surface-panel-strong)] shadow-[var(--shadow-soft)] lg:grid-cols-[1fr_1.05fr]">
        <aside className="flex flex-col justify-between gap-8 border-b border-[color:var(--border-soft)] bg-[color:var(--surface-accent-wash)] p-8 lg:border-b-0 lg:border-r">
          <div>
            <p className="typ-eyebrow text-[color:var(--color-bronze-500)]">Project setup</p>
            <h1 className="typ-h2 mt-3 text-[color:var(--text-strong)]">
              Set up your space in <span className="text-accent-italic">30 seconds</span>
            </h1>
            <p className="page-copy-sm mt-4 max-w-md text-[color:var(--text-muted)]">
              Tell us about your office once. We will size the grid, filter the furniture catalog, and
              save these details with your layout.
            </p>
          </div>

          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <span className="scheme-accent-wash flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[color:var(--color-primary)]">
                <Building2 className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="typ-label text-[color:var(--text-strong)]">Built for Indian offices</p>
                <p className="typ-caption-lg text-[color:var(--text-muted)]">
                  TVS, Titan, government departments — start with real cities and seat counts.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="scheme-accent-wash flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[color:var(--color-primary)]">
                <Ruler className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="typ-label text-[color:var(--text-strong)]">True-to-scale grid</p>
                <p className="typ-caption-lg text-[color:var(--text-muted)]">
                  Large floors use 1 m grid units; smaller spaces use 0.5 m for precision.
                </p>
              </div>
            </li>
          </ul>
        </aside>

        <form
          className="flex flex-col gap-5 p-8"
          onSubmit={handleSubmit}
          aria-label="Project setup"
          aria-busy={!isHydrated}
        >
          <div className="pwx-field">
            <label className="pwx-field-label" htmlFor="project-setup-name">
              Project name
            </label>
            <input
              id="project-setup-name"
              className="pwx-field-input"
              placeholder="TVS Bihar Office — 2nd Floor"
              value={draft.projectName}
              onChange={(event) => updateDraft("projectName", event.target.value)}
              autoComplete="organization"
              autoFocus
              maxLength={255}
              aria-describedby={error ? "project-setup-error" : undefined}
            />
          </div>

          <div className="pwx-field">
            <label className="pwx-field-label" htmlFor="project-setup-city">
              City
            </label>
            <div className="relative">
              <MapPin
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--text-muted)]"
                aria-hidden="true"
              />
              <select
                id="project-setup-city"
                className="pwx-field-input pl-9"
                value={draft.city}
                onChange={(event) => updateDraft("city", event.target.value)}
              >
                {PLANNER_INDIAN_CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pwx-field">
            <label className="pwx-field-label" htmlFor="project-setup-area">
              Floor area (sq ft)
            </label>
            <input
              id="project-setup-area"
              className="pwx-field-input"
              type="number"
              min={100}
              step={50}
              value={draft.floorAreaSqFt}
              onChange={(event) => updateDraft("floorAreaSqFt", Number(event.target.value))}
            />
            <p className="typ-caption-lg mt-1 text-[color:var(--text-muted)]">
              Not sure? Use 1000 sq ft for 50 seats
            </p>
          </div>

          <fieldset className="pwx-field">
            <legend id="project-setup-purpose-label" className="pwx-field-label mb-2">Primary purpose</legend>
            <div
              className="grid gap-2 sm:grid-cols-2"
              role="radiogroup"
              aria-labelledby="project-setup-purpose-label"
            >
              {PLANNER_PRIMARY_PURPOSE_OPTIONS.map((option) => {
                const selected = draft.primaryPurpose === option.value;
                return (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer flex-col rounded-[var(--radius-lg)] border px-3 py-3 transition-colors ${
                      selected
                        ? "border-[color:color-mix(in_srgb,var(--color-primary)_45%,var(--border-soft))] bg-[color:var(--surface-accent-wash)]"
                        : "border-[color:var(--border-soft)] bg-[color:var(--surface-panel)]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="project-setup-purpose"
                      className="sr-only"
                      checked={selected}
                      onChange={() => updateDraft("primaryPurpose", option.value as PlannerPrimaryPurpose)}
                    />
                    <span className="typ-label text-[color:var(--text-strong)]">{option.label}</span>
                    <span className="typ-caption-lg mt-0.5 text-[color:var(--text-muted)]">
                      {option.description}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="pwx-field">
            <label className="pwx-field-label" htmlFor="project-setup-seats">
              Target seat count
            </label>
            <div className="relative">
              <Users
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--text-muted)]"
                aria-hidden="true"
              />
              <input
                id="project-setup-seats"
                className="pwx-field-input pl-9"
                type="number"
                min={1}
                step={1}
                value={draft.seatTarget}
                onChange={(event) => updateDraft("seatTarget", Number(event.target.value))}
              />
            </div>
          </div>

          {error ? (
            <p
              id="project-setup-error"
              className="typ-caption-lg text-[color:var(--color-danger,#dc2626)]"
              role="alert"
              aria-live="assertive"
            >
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            className="btn-primary typ-cta mt-auto inline-flex items-center justify-center gap-2 px-6 py-3"
            disabled={!isHydrated}
          >
            {isHydrated ? "Start placing furniture" : "Preparing workspace..."}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </form>
      </div>
    </div>
  );
}
