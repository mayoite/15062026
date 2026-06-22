"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useMemo, useState } from "react";
import {
  BadgeCheck,
  Cloud,
  CopyPlus,
  Download,
  FolderOpen,
  Import,
  Loader2,
  Pencil,
  Save,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";

import type { PlannerManagedProductRow, PlannerManagedProductWrite } from "../model";

export interface PlannerSavedEntry {
  id: string;
  name: string;
  source: "cloud" | "local";
  isActive?: boolean;
  accessMode?: "owner" | "admin";
  ownerUserId?: string;
  ownerLabel?: string;
  canDelete?: boolean;
  canRename?: boolean;
  updatedAtLabel?: string;
  itemCount?: number;
  detail?: string;
  subtitle?: string;
  statusLabel?: string;
}

interface PlannerSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planName: string;
  onPlanNameChange: (value: string) => void;
  plans: PlannerSavedEntry[];
  isAuthenticated: boolean;
  isBusy?: boolean;
  statusMessage?: string | null;
  errorMessage?: string | null;
  canOpen3d?: boolean;
  isAdmin?: boolean;
  adminPlans?: PlannerSavedEntry[];
  managedProducts?: PlannerManagedProductRow[];
  onSaveCloud: () => void;
  onSaveDraft: () => void;
  onSaveAsNewSession?: () => void;
  onLoadPlan: (plan: PlannerSavedEntry) => void;
  onDeletePlan?: (plan: PlannerSavedEntry) => void;
  onRenamePlan?: (plan: PlannerSavedEntry, nextName: string) => void;
  onImport: () => void;
  onExportJson?: () => void;
  onOpen3d?: () => void;
  onUpsertManagedProduct?: (product: PlannerManagedProductWrite) => void | Promise<void>;
  onDeleteManagedProduct?: (id: string) => void | Promise<void>;
  onDismissError?: () => void;
  isOnline?: boolean;
}

type ManagedProductDraft = {
  id?: string;
  name: string;
  slug: string;
  plannerSourceSlug: string;
  category: string;
  series: string;
  dimensions: string;
  price: string;
  flagshipImage: string;
  description: string;
  active: boolean;
};

function emptyDraft(): ManagedProductDraft {
  return {
    name: "",
    slug: "",
    plannerSourceSlug: "",
    category: "",
    series: "",
    dimensions: "",
    price: "0",
    flagshipImage: "",
    description: "",
    active: true,
  };
}

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function draftFromProduct(product: PlannerManagedProductRow): ManagedProductDraft {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    plannerSourceSlug: product.planner_source_slug,
    category: product.category_name || product.category,
    series: product.series_name,
    dimensions: typeof product.specs.dimensions === "string" ? product.specs.dimensions : "",
    price: String(product.price ?? 0),
    flagshipImage: product.flagship_image,
    description: product.description,
    active: product.active,
  };
}

function rowToWrite(product: PlannerManagedProductRow, active = product.active): PlannerManagedProductWrite {
  return {
    id: product.id,
    legacy_product_id: product.legacy_product_id,
    slug: product.slug,
    planner_source_slug: product.planner_source_slug,
    name: product.name,
    description: product.description,
    category: product.category,
    category_id: product.category_id,
    category_name: product.category_name,
    series_id: product.series_id,
    series_name: product.series_name,
    price: product.price,
    flagship_image: product.flagship_image,
    images: product.images,
    specs: product.specs,
    metadata: product.metadata,
    active,
    created_by: product.created_by,
  };
}

function draftToWrite(draft: ManagedProductDraft): PlannerManagedProductWrite {
  const categoryName = draft.category.trim() || "Planner Managed";
  const seriesName = draft.series.trim() || categoryName;
  const slug = draft.slug.trim() || slugify(draft.name);
  const sourceSlug = draft.plannerSourceSlug.trim() || slug;
  const image = draft.flagshipImage.trim();
  return {
    id: draft.id,
    legacy_product_id: null,
    slug,
    planner_source_slug: sourceSlug,
    name: draft.name.trim(),
    description: draft.description.trim(),
    category: categoryName,
    category_id: slugify(categoryName) || "planner-managed",
    category_name: categoryName,
    series_id: slugify(seriesName) || "planner-series",
    series_name: seriesName,
    price: Math.max(0, Number.parseInt(draft.price.trim() || "0", 10) || 0),
    flagship_image: image,
    images: image ? [image] : [],
    specs: draft.dimensions.trim() ? { dimensions: draft.dimensions.trim() } : {},
    metadata: { source: "planner-admin-browser", browserWorkflow: true },
    active: draft.active,
    created_by: null,
  };
}

export function PlannerSessionDialog({
  open,
  onOpenChange,
  planName,
  onPlanNameChange,
  plans,
  isAuthenticated,
  isBusy = false,
  statusMessage,
  errorMessage,
  canOpen3d = false,
  isAdmin = false,
  adminPlans = [],
  managedProducts = [],
  onSaveCloud,
  onSaveDraft,
  onSaveAsNewSession,
  onLoadPlan,
  onDeletePlan,
  onRenamePlan,
  onImport,
  onExportJson,
  onOpen3d,
  onUpsertManagedProduct,
  onDeleteManagedProduct,
  onDismissError,
  isOnline = true,
}: PlannerSessionDialogProps) {
  const [draft, setDraft] = useState<ManagedProductDraft>(() => emptyDraft());
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const adminCloudPlans = useMemo(() => adminPlans.filter((plan) => plan.source === "cloud"), [adminPlans]);
  const t = useTranslations("planner.session");
  const primary = "pwx-session-btn pwx-session-btn--primary";
  const secondary = "pwx-session-btn pwx-session-btn--secondary";
  const accent = "pwx-session-btn pwx-session-btn--accent";

  function submitRename(plan: PlannerSavedEntry) {
    if (!renameValue.trim()) return;
    onRenamePlan?.(plan, renameValue);
    setEditingPlanId(null);
    setRenameValue("");
  }

  function cancelRename() {
    setEditingPlanId(null);
    setRenameValue("");
  }

  const [previousOpen, setPreviousOpen] = useState(open);
  if (previousOpen !== open) {
    setPreviousOpen(open);
    if (!open) {
      cancelRename();
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[180] pwx-session-backdrop" />
        <Dialog.Content className="pwx-session-dialog">
          <div className="pwx-session-header px-5 py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="pwx-session-chip" data-tone="session">Session Hub</span>
                  <span className="pwx-session-chip" data-tone={isOnline ? "online" : "offline"}>
                    {!isOnline ? (
                      <>
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Offline Draft
                      </>
                    ) : (
                      <>
                        {isAuthenticated ? <Cloud className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
                        {isAuthenticated ? "Cloud Ready" : "Draft Mode"}
                      </>
                    )}
                  </span>
                  {isAdmin ? (
                    <span className="pwx-session-chip" data-tone="admin">
                      <ShieldCheck className="h-3 w-3" /> Admin Browser RLS
                    </span>
                  ) : null}
                </div>
                <Dialog.Title className="mt-3 typ-h3 text-[color:var(--planner-text-strong)]">{t("title")}</Dialog.Title>
                <Dialog.Description className="mt-2 max-w-3xl typ-caption-lg leading-6 text-muted">
                  {t("description")}
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <button type="button" className="pwx-session-close p-2 text-subtle hover:bg-[color:var(--planner-primary-soft)] hover:text-[color:var(--planner-primary)]" aria-label="Close session dialog">
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>
          </div>

          <div className="overflow-y-auto px-5 py-5">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
              <section className="pwx-session-section p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="typ-caption-lg font-semibold uppercase tracking-[0.14em] text-muted">{t("savedPlans")}</h2>
                    <p className="mt-1 typ-caption-lg text-subtle">{plans.length === 0 ? t("noPlans") : `${plans.length} session${plans.length === 1 ? "" : "s"} available.`}</p>
                  </div>
                  {isBusy ? <Loader2 className="h-4 w-4 animate-spin text-[color:var(--planner-primary)]" /> : null}
                </div>
                <div className="pwx-session-list mt-4">
                  {plans.length === 0 ? <div className="rounded-[1.2rem] border border-dashed border-theme-soft px-4 py-5 text-center typ-caption-lg text-subtle">Save the current planner to create your first session.</div> : null}
                  {plans.map((plan) => (
                    <div key={`${plan.accessMode ?? "owner"}:${plan.source}:${plan.id}`} className="pwx-session-item group" data-active={plan.isActive}>
                      <div className="min-w-0 flex-1 text-left">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="pwx-session-item-meta" data-tone={plan.source === "cloud" ? "cloud" : "draft"}>
                            {plan.source === "cloud" ? plan.accessMode === "admin" ? "Admin Cloud Save" : "Cloud Save" : "Local Draft"}
                          </span>
                          {plan.isActive ? (
                            <span className="pwx-session-item-meta" data-tone="active">
                              Open Now
                            </span>
                          ) : null}
                        </div>
                        {editingPlanId === plan.id ? (
                          <div className="mt-2 flex items-center gap-2">
                            <input
                              value={renameValue}
                              onChange={(event) => setRenameValue(event.target.value)}
                              onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                  event.preventDefault();
                                  submitRename(plan);
                              }
                              if (event.key === "Escape") {
                                event.preventDefault();
                                cancelRename();
                              }
                            }}
                              className="pwx-session-field min-w-0 flex-1 rounded-[0.8rem] px-3 py-2 text-[0.95rem] font-semibold tracking-[-0.02em] text-strong"
                              aria-label={`Rename ${plan.name}`}
                              autoFocus
                              onFocus={(event) => event.currentTarget.select()}
                            />
                            <button
                              type="button"
                              onClick={() => submitRename(plan)}
                              disabled={!renameValue.trim() || isBusy}
                              className="pwx-session-btn pwx-session-btn--primary rounded-[0.8rem] px-3 py-2 typ-caption"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={cancelRename}
                              className="pwx-session-btn pwx-session-btn--secondary rounded-[0.8rem] px-3 py-2 typ-caption"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button type="button" onClick={() => onLoadPlan(plan)} className="mt-2 block w-full truncate text-left text-[0.98rem] font-semibold tracking-[-0.02em] text-strong">
                            {plan.name}
                          </button>
                        )}
                        {plan.subtitle ? <p className="mt-1 typ-caption text-body">{plan.subtitle}</p> : null}
                        <p className="mt-2 typ-caption-lg text-subtle">{plan.updatedAtLabel ?? "No timestamp"}{typeof plan.itemCount === "number" ? ` | ${plan.itemCount} item${plan.itemCount === 1 ? "" : "s"}` : ""}</p>
                        {plan.ownerLabel ? <p className="mt-1 typ-caption text-body">Owner {plan.ownerLabel}</p> : null}
                        {plan.detail ? <p className="mt-1 typ-caption-lg text-body">{plan.detail}</p> : null}
                        {plan.statusLabel ? <p className="mt-1 typ-caption uppercase tracking-[0.1em] text-[color:var(--planner-primary)]">{plan.statusLabel}</p> : null}
                      </div>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => onLoadPlan(plan)} disabled={isBusy || editingPlanId === plan.id} className="pwx-session-icon-btn rounded-full bg-[color:var(--planner-panel)] p-2 text-subtle disabled:cursor-not-allowed disabled:opacity-60" aria-label={`Load ${plan.name}`}>
                          <FolderOpen className="h-4 w-4" />
                        </button>
                        {onRenamePlan && plan.canRename ? (
                          <button type="button" onClick={() => { setEditingPlanId(plan.id); setRenameValue(plan.name); }} disabled={isBusy || editingPlanId === plan.id} className="pwx-session-icon-btn rounded-full bg-[color:var(--planner-panel)] p-2 text-subtle disabled:cursor-not-allowed disabled:opacity-60" aria-label={`Rename ${plan.name}`}>
                            <Pencil className="h-4 w-4" />
                          </button>
                        ) : null}
                        {onDeletePlan && plan.canDelete ? (
                          <button type="button" onClick={() => onDeletePlan(plan)} disabled={isBusy || editingPlanId === plan.id} className="pwx-session-icon-btn rounded-full bg-[color:var(--planner-panel)] p-2 text-[color:var(--planner-accent-strong)] disabled:cursor-not-allowed disabled:opacity-60" aria-label={`Delete ${plan.name}`}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="pwx-session-section pwx-session-section--strong space-y-4 p-4">
                <div className="rounded-[1.2rem] border border-theme-soft bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(245,247,250,0.96)_100%)] p-4">
                  <h2 className="typ-caption-lg font-semibold uppercase tracking-[0.14em] text-muted">Current Plan</h2>
                  <label className="mt-3 block typ-caption text-subtle" htmlFor="planner-plan-name">Plan name</label>
                  <input id="planner-plan-name" value={planName} onChange={(event) => onPlanNameChange(event.target.value)} placeholder="Untitled plan" className="pwx-session-field mt-2 w-full rounded-[1rem] px-4 py-3 typ-caption-lg text-body" />
                </div>
                <div className="grid gap-3">
                  <button type="button" onClick={onSaveCloud} disabled={!isAuthenticated || isBusy || !isOnline} className={`${primary} bg-[color:var(--planner-primary)] text-white hover:bg-[color:var(--planner-primary-hover)] disabled:bg-[color:var(--planner-surface-muted)] disabled:text-[color:var(--planner-text-subtle)]`}><Save className="h-4 w-4" /> {t("saveCloud")}{!isOnline && " (Offline)"}</button>
                  <button type="button" onClick={onSaveDraft} disabled={isBusy} className={accent}><Download className="h-4 w-4" /> {t("saveDraft")}</button>
                  {onSaveAsNewSession ? <button type="button" onClick={onSaveAsNewSession} disabled={isBusy} className={secondary}><CopyPlus className="h-4 w-4" /> {t("saveAsNew")}</button> : null}
                  <button type="button" onClick={onImport} disabled={isBusy} className={secondary}><Import className="h-4 w-4" /> {t("importJson")}</button>
                  {onExportJson ? <button type="button" onClick={onExportJson} disabled={isBusy} className={secondary}><Upload className="h-4 w-4" /> {t("exportJson")}</button> : null}
                  {onOpen3d ? <button type="button" onClick={onOpen3d} disabled={!canOpen3d || isBusy} className={secondary}><FolderOpen className="h-4 w-4" /> {t("open3d")}</button> : null}
                </div>
                <div className="pwx-session-message typ-caption-lg text-body">
                  {!isOnline ? (
                    <span className="text-amber-600 dark:text-amber-400 font-semibold">You are offline. Cloud operations are temporarily disabled, but local autosave and drafts are safe and fully operational.</span>
                  ) : isAuthenticated ? (
                    isAdmin ? "Authenticated admin session detected. Admin oversight uses the shared browser Supabase client plus RLS." : "Authenticated session detected. Cloud save/load follow the shared Supabase identity model."
                  ) : (
                    "No authenticated session detected. Cloud save is disabled, but local draft and import still work."
                  )}
                </div>
                {errorMessage ? <div className="pwx-session-message" data-tone="error"><div className="flex items-start justify-between gap-3"><div><p className="typ-caption font-semibold uppercase tracking-[0.12em] text-[color:var(--planner-accent-strong)]">Planner error</p><p className="mt-1 typ-caption-lg text-body">{errorMessage}</p></div>{onDismissError ? <button type="button" onClick={onDismissError} className="pwx-session-icon-btn rounded-full border border-[color:rgba(151,43,26,0.18)] bg-white/70 p-1.5 text-[color:var(--planner-accent-strong)] transition hover:bg-white" aria-label="Dismiss planner error"><X className="h-4 w-4" /></button> : null}</div></div> : null}
                {statusMessage ? <div className="pwx-session-message" data-tone="success"><div className="flex items-start gap-2"><BadgeCheck className="mt-0.5 h-4 w-4 text-[color:var(--planner-primary)]" /><p className="typ-caption-lg text-body">{statusMessage}</p></div></div> : null}
              </section>
            </div>

            {isAdmin ? (
              <section className="pwx-session-section mt-5 p-4">
                <h2 className="typ-caption-lg font-semibold uppercase tracking-[0.14em] text-muted">Admin Oversight</h2>
                <p className="mt-1 max-w-3xl typ-caption-lg text-subtle">These browser surfaces run through the normal authenticated Supabase client. No planner admin action here requires a browser-exposed service-role key.</p>
                <div className="mt-4 grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                  <section className="pwx-session-section pwx-session-section--strong rounded-[1.2rem] p-4">
                    <p className="typ-caption font-semibold uppercase tracking-[0.14em] text-muted">Admin Cloud Saves</p>
                    <div className="pwx-session-list mt-3">
                      {adminCloudPlans.length === 0 ? <div className="rounded-[1rem] border border-dashed border-theme-soft px-4 py-5 text-center typ-caption-lg text-subtle">No admin-visible cloud plans found.</div> : null}
                      {adminCloudPlans.map((plan) => (
                        <button key={`admin:${plan.id}`} type="button" onClick={() => onLoadPlan(plan)} className="pwx-session-item w-full rounded-[1rem] px-4 py-3 text-left" data-active={false}>
                          <div className="text-[0.94rem] font-semibold text-strong">{plan.name}</div>
                          <div className="mt-1 typ-caption text-subtle">{plan.ownerLabel ?? "Unknown owner"} | {plan.updatedAtLabel ?? "No timestamp"}</div>
                          {plan.detail ? <div className="mt-1 typ-caption-lg text-body">{plan.detail}</div> : null}
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="pwx-session-section pwx-session-section--strong rounded-[1.2rem] p-4">
                    <p className="typ-caption font-semibold uppercase tracking-[0.14em] text-muted">Planner-Managed Products</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} className="pwx-session-field rounded-[0.9rem] px-3 py-2 typ-caption-lg text-body" placeholder="Name" />
                      <input value={draft.slug} onChange={(event) => setDraft((current) => ({ ...current, slug: event.target.value }))} className="pwx-session-field rounded-[0.9rem] px-3 py-2 typ-caption-lg text-body" placeholder="Slug" />
                      <input value={draft.plannerSourceSlug} onChange={(event) => setDraft((current) => ({ ...current, plannerSourceSlug: event.target.value }))} className="pwx-session-field rounded-[0.9rem] px-3 py-2 typ-caption-lg text-body" placeholder="Source slug" />
                      <input value={draft.category} onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))} className="pwx-session-field rounded-[0.9rem] px-3 py-2 typ-caption-lg text-body" placeholder="Category" />
                      <input value={draft.series} onChange={(event) => setDraft((current) => ({ ...current, series: event.target.value }))} className="pwx-session-field rounded-[0.9rem] px-3 py-2 typ-caption-lg text-body" placeholder="Series" />
                      <input value={draft.price} onChange={(event) => setDraft((current) => ({ ...current, price: event.target.value }))} className="pwx-session-field rounded-[0.9rem] px-3 py-2 typ-caption-lg text-body" placeholder="Price" />
                      <input value={draft.dimensions} onChange={(event) => setDraft((current) => ({ ...current, dimensions: event.target.value }))} className="pwx-session-field rounded-[0.9rem] px-3 py-2 typ-caption-lg text-body" placeholder="Dimensions" />
                      <input value={draft.flagshipImage} onChange={(event) => setDraft((current) => ({ ...current, flagshipImage: event.target.value }))} className="pwx-session-field rounded-[0.9rem] px-3 py-2 typ-caption-lg text-body" placeholder="Image URL" />
                    </div>
                    <textarea value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} className="pwx-session-textarea mt-3 min-h-24 w-full rounded-[0.9rem] px-3 py-2 typ-caption-lg text-body" placeholder="Description" />
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <label className="inline-flex items-center gap-2 typ-caption-lg text-body"><input type="checkbox" checked={draft.active} onChange={(event) => setDraft((current) => ({ ...current, active: event.target.checked }))} /> Active in planner catalog</label>
                      <div className="flex flex-wrap items-center gap-2">
                        {draft.id ? <button type="button" onClick={() => setDraft(emptyDraft())} className={secondary}>Reset</button> : null}
                        <button type="button" onClick={() => void (async () => { if (!onUpsertManagedProduct) return; await onUpsertManagedProduct(draftToWrite(draft)); setDraft(emptyDraft()); })()} disabled={isBusy || !draft.name.trim()} className={`${primary} bg-[color:var(--planner-primary)] text-white hover:bg-[color:var(--planner-primary-hover)] disabled:bg-[color:var(--planner-surface-muted)] disabled:text-[color:var(--planner-text-subtle)]`}><Save className="h-4 w-4" /> {draft.id ? "Update Product" : "Create Product"}</button>
                      </div>
                    </div>
                    <div className="mt-4 space-y-3">
                      {managedProducts.length === 0 ? <div className="rounded-[1rem] border border-dashed border-theme-soft px-4 py-5 text-center typ-caption-lg text-subtle">No planner-managed products found yet.</div> : null}
                      {managedProducts.map((product) => (
                        <div key={product.id} className="pwx-session-item rounded-[1rem] px-4 py-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-[0.94rem] font-semibold text-strong">{product.name}</div>
                              <div className="mt-1 typ-caption text-subtle">{product.slug} | {product.active ? "Active" : "Archived"}</div>
                              <div className="mt-1 typ-caption-lg text-body">{product.category_name} | {product.series_name} | INR {product.price.toLocaleString("en-IN")}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button type="button" onClick={() => setDraft(draftFromProduct(product))} disabled={isBusy} className="pwx-session-icon-btn rounded-full bg-[color:var(--planner-panel-strong)] p-2 text-subtle" aria-label={`Edit ${product.name}`}><Pencil className="h-4 w-4" /></button>
                              <button type="button" onClick={() => void onUpsertManagedProduct?.(rowToWrite(product, !product.active))} disabled={isBusy} className="pwx-session-icon-btn rounded-full bg-[color:var(--planner-panel-strong)] p-2 text-subtle" aria-label={product.active ? `Archive ${product.name}` : `Activate ${product.name}`}><ShieldCheck className="h-4 w-4" /></button>
                              {onDeleteManagedProduct ? <button type="button" onClick={() => void onDeleteManagedProduct(product.id)} disabled={isBusy} className="pwx-session-icon-btn rounded-full bg-[color:var(--planner-panel-strong)] p-2 text-[color:var(--planner-accent-strong)]" aria-label={`Delete ${product.name}`}><Trash2 className="h-4 w-4" /></button> : null}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </section>
            ) : null}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
