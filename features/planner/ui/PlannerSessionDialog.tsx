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

import { cn } from "@/lib/utils";

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

type SessionButtonTone = "primary" | "secondary" | "accent";
type SessionIconButtonTone = "surface" | "surface-strong" | "danger" | "error";
type SessionFieldTone = "rename" | "panel" | "compact";
type ManagedProductFieldKey = keyof Omit<ManagedProductDraft, "id" | "active">;

const MANAGED_PRODUCT_FIELDS: ReadonlyArray<readonly [ManagedProductFieldKey, string]> = [
  ["name", "Name"],
  ["slug", "Slug"],
  ["plannerSourceSlug", "Source slug"],
  ["category", "Category"],
  ["series", "Series"],
  ["price", "Price"],
  ["dimensions", "Dimensions"],
  ["flagshipImage", "Image URL"],
] as const;

const SESSION_SECTION_TITLE_CLASS = "pwx-session-section-title";
const SESSION_SECTION_NOTE_CLASS = "pwx-session-section-note";
const SESSION_COPY_CLASS = "pwx-session-copy";
const SESSION_COPY_SUBTLE_CLASS = "pwx-session-copy-subtle";
const SESSION_PLAN_TITLE_CLASS = "pwx-session-plan-title";
const SESSION_CARD_TITLE_CLASS = "pwx-session-card-title";
const SESSION_CARD_META_CLASS = "pwx-session-card-meta";
const SESSION_CARD_DETAIL_CLASS = "pwx-session-card-detail";
const SESSION_FIELD_LABEL_CLASS = "pwx-session-field-label";
const SESSION_MESSAGE_COPY_CLASS = "pwx-session-message-copy";
const SESSION_MESSAGE_LABEL_CLASS = "pwx-session-message-label";
const SESSION_EMPTY_STATE_CLASS = "pwx-session-empty-state";
const SESSION_ICON_CLASS = "h-4 w-4";
const SESSION_TINY_ICON_CLASS = "h-3 w-3";
const SESSION_STATUS_DOT_CLASS = "h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse";

function sessionButtonClass(tone: SessionButtonTone, compact = false) {
  return cn("pwx-session-btn", `pwx-session-btn--${tone}`, compact && "pwx-session-btn--compact");
}

function sessionIconButtonClass(tone: SessionIconButtonTone) {
  return cn("pwx-session-icon-btn", `pwx-session-icon-btn--${tone}`);
}

function sessionFieldClass(tone: SessionFieldTone, extra?: string) {
  return cn("pwx-session-field", `pwx-session-field--${tone}`, extra);
}

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
  const primary = sessionButtonClass("primary");
  const secondary = sessionButtonClass("secondary");
  const accent = sessionButtonClass("accent");

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
        <Dialog.Overlay className="pwx-session-overlay pwx-session-backdrop" />
        <Dialog.Content className="pwx-session-dialog">
          <div className="pwx-session-header">
            <div className="pwx-session-header__content">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="pwx-session-chip" data-tone="session">Session Hub</span>
                    <span className="pwx-session-chip" data-tone={isOnline ? "online" : "offline"}>
                      {!isOnline ? (
                        <>
                        <span className={SESSION_STATUS_DOT_CLASS} />
                        Offline Draft
                      </>
                    ) : (
                      <>
                        {isAuthenticated ? <Cloud className={SESSION_TINY_ICON_CLASS} /> : <ShieldCheck className={SESSION_TINY_ICON_CLASS} />}
                        {isAuthenticated ? "Cloud Ready" : "Draft Mode"}
                      </>
                    )}
                  </span>
                  {isAdmin ? (
                    <span className="pwx-session-chip" data-tone="admin">
                      <ShieldCheck className={SESSION_TINY_ICON_CLASS} /> Admin Browser RLS
                    </span>
                  ) : null}
                </div>
                <Dialog.Title className="mt-3 typ-h3 text-[color:var(--planner-text-strong)]">{t("title")}</Dialog.Title>
                <Dialog.Description className="mt-2 max-w-3xl typ-caption-lg leading-6 text-muted">
                  {t("description")}
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <button type="button" className="pwx-session-close" aria-label="Close session dialog">
                  <X className={SESSION_ICON_CLASS} />
                </button>
              </Dialog.Close>
            </div>
          </div>

          <div className="pwx-session-body">
            <div className="pwx-session-layout">
              <section className="pwx-session-section">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className={SESSION_SECTION_TITLE_CLASS}>{t("savedPlans")}</h2>
                    <p className={SESSION_SECTION_NOTE_CLASS}>{plans.length === 0 ? t("noPlans") : `${plans.length} session${plans.length === 1 ? "" : "s"} available.`}</p>
                  </div>
                  {isBusy ? <Loader2 className={cn(SESSION_ICON_CLASS, "animate-spin text-[color:var(--planner-primary)]")} /> : null}
                </div>
                <div className="pwx-session-list mt-4">
                  {plans.length === 0 ? <div className={SESSION_EMPTY_STATE_CLASS}>Save the current planner to create your first session.</div> : null}
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
                              className={sessionFieldClass("rename", "min-w-0 flex-1")}
                              aria-label={`Rename ${plan.name}`}
                              autoFocus
                              onFocus={(event) => event.currentTarget.select()}
                            />
                            <button
                              type="button"
                              onClick={() => submitRename(plan)}
                              disabled={!renameValue.trim() || isBusy}
                              className={sessionButtonClass("primary", true)}
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={cancelRename}
                              className={sessionButtonClass("secondary", true)}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button type="button" onClick={() => onLoadPlan(plan)} className={cn("mt-2 block w-full truncate text-left", SESSION_PLAN_TITLE_CLASS)}>
                            {plan.name}
                          </button>
                        )}
                        {plan.subtitle ? <p className={cn("mt-1", SESSION_COPY_CLASS)}>{plan.subtitle}</p> : null}
                        <p className={cn("mt-2", SESSION_COPY_SUBTLE_CLASS)}>{plan.updatedAtLabel ?? "No timestamp"}{typeof plan.itemCount === "number" ? ` | ${plan.itemCount} item${plan.itemCount === 1 ? "" : "s"}` : ""}</p>
                        {plan.ownerLabel ? <p className={cn("mt-1", SESSION_COPY_CLASS)}>Owner {plan.ownerLabel}</p> : null}
                        {plan.detail ? <p className={cn("mt-1", SESSION_CARD_DETAIL_CLASS)}>{plan.detail}</p> : null}
                        {plan.statusLabel ? <p className="mt-1 typ-caption uppercase tracking-[0.1em] text-[color:var(--planner-primary)]">{plan.statusLabel}</p> : null}
                      </div>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => onLoadPlan(plan)} disabled={isBusy || editingPlanId === plan.id} className={sessionIconButtonClass("surface")} aria-label={`Load ${plan.name}`}>
                          <FolderOpen className={SESSION_ICON_CLASS} />
                        </button>
                        {onRenamePlan && plan.canRename ? (
                          <button type="button" onClick={() => { setEditingPlanId(plan.id); setRenameValue(plan.name); }} disabled={isBusy || editingPlanId === plan.id} className={sessionIconButtonClass("surface")} aria-label={`Rename ${plan.name}`}>
                            <Pencil className={SESSION_ICON_CLASS} />
                          </button>
                        ) : null}
                        {onDeletePlan && plan.canDelete ? (
                          <button type="button" onClick={() => onDeletePlan(plan)} disabled={isBusy || editingPlanId === plan.id} className={sessionIconButtonClass("danger")} aria-label={`Delete ${plan.name}`}>
                            <Trash2 className={SESSION_ICON_CLASS} />
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="pwx-session-section pwx-session-section--strong pwx-session-section--stack">
                <div className="pwx-session-section pwx-session-section--panel">
                  <h2 className={SESSION_SECTION_TITLE_CLASS}>Current Plan</h2>
                  <label className={SESSION_FIELD_LABEL_CLASS} htmlFor="planner-plan-name">Plan name</label>
                  <input id="planner-plan-name" value={planName} onChange={(event) => onPlanNameChange(event.target.value)} placeholder="Untitled plan" className={sessionFieldClass("panel", "mt-2 w-full")} />
                </div>
                <div className="pwx-session-actions">
                  <button type="button" onClick={onSaveCloud} disabled={!isAuthenticated || isBusy || !isOnline} className={primary}><Save className={SESSION_ICON_CLASS} /> {t("saveCloud")}{!isOnline && " (Offline)"}</button>
                  <button type="button" onClick={onSaveDraft} disabled={isBusy} className={accent}><Download className={SESSION_ICON_CLASS} /> {t("saveDraft")}</button>
                  {onSaveAsNewSession ? <button type="button" onClick={onSaveAsNewSession} disabled={isBusy} className={secondary}><CopyPlus className={SESSION_ICON_CLASS} /> {t("saveAsNew")}</button> : null}
                  <button type="button" onClick={onImport} disabled={isBusy} className={secondary}><Import className={SESSION_ICON_CLASS} /> {t("importJson")}</button>
                  {onExportJson ? <button type="button" onClick={onExportJson} disabled={isBusy} className={secondary}><Upload className={SESSION_ICON_CLASS} /> {t("exportJson")}</button> : null}
                  {onOpen3d ? <button type="button" onClick={onOpen3d} disabled={!canOpen3d || isBusy} className={secondary}><FolderOpen className={SESSION_ICON_CLASS} /> {t("open3d")}</button> : null}
                </div>
                <div className={SESSION_MESSAGE_COPY_CLASS}>
                  {!isOnline ? (
                    <span className="pwx-session-message-emphasis">You are offline. Cloud operations are temporarily disabled, but local autosave and drafts are safe and fully operational.</span>
                  ) : isAuthenticated ? (
                    isAdmin ? "Authenticated admin session detected. Admin oversight uses the shared browser Supabase client plus RLS." : "Authenticated session detected. Cloud save/load follow the shared Supabase identity model."
                  ) : (
                    "No authenticated session detected. Cloud save is disabled, but local draft and import still work."
                  )}
                </div>
                {errorMessage ? <div className="pwx-session-message" data-tone="error"><div className="pwx-session-message-row pwx-session-message-row--between"><div><p className={SESSION_MESSAGE_LABEL_CLASS}>Planner error</p><p className={cn("mt-1", SESSION_MESSAGE_COPY_CLASS)}>{errorMessage}</p></div>{onDismissError ? <button type="button" onClick={onDismissError} className={sessionIconButtonClass("error")} aria-label="Dismiss planner error"><X className={SESSION_ICON_CLASS} /></button> : null}</div></div> : null}
                {statusMessage ? <div className="pwx-session-message" data-tone="success"><div className="pwx-session-message-row"><BadgeCheck className={cn("mt-0.5", SESSION_ICON_CLASS, "text-[color:var(--planner-primary)]")} /><p className={SESSION_MESSAGE_COPY_CLASS}>{statusMessage}</p></div></div> : null}
              </section>
            </div>

            {isAdmin ? (
              <section className="pwx-session-section pwx-session-section--offset">
                <h2 className={SESSION_SECTION_TITLE_CLASS}>Admin Oversight</h2>
                <p className={cn("mt-1 max-w-3xl", SESSION_SECTION_NOTE_CLASS)}>These browser surfaces run through the normal authenticated Supabase client. No planner admin action here requires a browser-exposed service-role key.</p>
                <div className="pwx-session-admin-grid">
                  <section className="pwx-session-section pwx-session-section--panel">
                    <p className={SESSION_SECTION_TITLE_CLASS}>Admin Cloud Saves</p>
                    <div className="pwx-session-list mt-3">
                      {adminCloudPlans.length === 0 ? <div className={SESSION_EMPTY_STATE_CLASS}>No admin-visible cloud plans found.</div> : null}
                      {adminCloudPlans.map((plan) => (
                        <button key={`admin:${plan.id}`} type="button" onClick={() => onLoadPlan(plan)} className="pwx-session-item pwx-session-item--compact w-full text-left" data-active={false}>
                          <div className={SESSION_CARD_TITLE_CLASS}>{plan.name}</div>
                          <div className={cn("mt-1", SESSION_CARD_META_CLASS)}>{plan.ownerLabel ?? "Unknown owner"} | {plan.updatedAtLabel ?? "No timestamp"}</div>
                          {plan.detail ? <div className={cn("mt-1", SESSION_CARD_DETAIL_CLASS)}>{plan.detail}</div> : null}
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="pwx-session-section pwx-session-section--panel">
                    <p className={SESSION_SECTION_TITLE_CLASS}>Planner-Managed Products</p>
                    <div className="pwx-session-fields-grid">
                      {MANAGED_PRODUCT_FIELDS.map(([field, placeholder]) => (
                        <input
                          key={field}
                          value={draft[field]}
                          onChange={(event) => setDraft((current) => ({ ...current, [field]: event.target.value }))}
                          className={sessionFieldClass("compact")}
                          placeholder={placeholder}
                        />
                      ))}
                    </div>
                    <textarea value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} className={cn(sessionFieldClass("compact"), "pwx-session-textarea--compact mt-3 w-full")} placeholder="Description" />
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <label className="pwx-session-checkbox-label"><input type="checkbox" checked={draft.active} onChange={(event) => setDraft((current) => ({ ...current, active: event.target.checked }))} /> Active in planner catalog</label>
                      <div className="flex flex-wrap items-center gap-2">
                        {draft.id ? <button type="button" onClick={() => setDraft(emptyDraft())} className={secondary}>Reset</button> : null}
                        <button type="button" onClick={() => void (async () => { if (!onUpsertManagedProduct) return; await onUpsertManagedProduct(draftToWrite(draft)); setDraft(emptyDraft()); })()} disabled={isBusy || !draft.name.trim()} className={primary}><Save className={SESSION_ICON_CLASS} /> {draft.id ? "Update Product" : "Create Product"}</button>
                      </div>
                    </div>
                    <div className="mt-4 space-y-3">
                      {managedProducts.length === 0 ? <div className={SESSION_EMPTY_STATE_CLASS}>No planner-managed products found yet.</div> : null}
                      {managedProducts.map((product) => (
                        <div key={product.id} className="pwx-session-item pwx-session-item--compact">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className={SESSION_CARD_TITLE_CLASS}>{product.name}</div>
                              <div className={cn("mt-1", SESSION_CARD_META_CLASS)}>{product.slug} | {product.active ? "Active" : "Archived"}</div>
                              <div className={cn("mt-1", SESSION_CARD_DETAIL_CLASS)}>{product.category_name} | {product.series_name} | INR {product.price.toLocaleString("en-IN")}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button type="button" onClick={() => setDraft(draftFromProduct(product))} disabled={isBusy} className={sessionIconButtonClass("surface-strong")} aria-label={`Edit ${product.name}`}><Pencil className={SESSION_ICON_CLASS} /></button>
                              <button type="button" onClick={() => void onUpsertManagedProduct?.(rowToWrite(product, !product.active))} disabled={isBusy} className={sessionIconButtonClass("surface-strong")} aria-label={product.active ? `Archive ${product.name}` : `Activate ${product.name}`}><ShieldCheck className={SESSION_ICON_CLASS} /></button>
                              {onDeleteManagedProduct ? <button type="button" onClick={() => void onDeleteManagedProduct(product.id)} disabled={isBusy} className={sessionIconButtonClass("danger")} aria-label={`Delete ${product.name}`}><Trash2 className={SESSION_ICON_CLASS} /></button> : null}
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
