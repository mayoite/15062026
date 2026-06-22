"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Archive,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { usePlannerCatalogStore } from "@/features/planner/catalog/catalogStore";
import {
  AdminCheckbox,
  AdminField,
  AdminFieldGroup,
  AdminNumberInput,
  AdminSelect,
  AdminTextarea,
  AdminTextInput,
} from "./AdminFormFields";
import {
  createAdminCatalogItem,
  deleteAdminCatalogItem,
  fetchAdminCatalog,
  patchAdminCatalogItem,
  type AdminCatalogType,
  type ConfiguratorCatalogItem,
  type StandardCatalogItem,
} from "./adminCatalogClient";

const MESH_TYPES = ["box", "cylinder", "sphere", "custom", "glb", "gltf"] as const;

const STANDARD_CATEGORIES = [
  "workstation",
  "table",
  "storage",
  "seating",
  "partition",
  "misc",
] as const;

const CONFIGURATOR_CATEGORIES = [
  "desks",
  "seating",
  "storage",
  "tables",
  "meeting",
  "accessories",
] as const;

type CatalogListProps = {
  title: string;
  description: string;
  catalogType: AdminCatalogType;
};

type EditorMode = "create" | "edit" | null;

type StandardDraft = {
  id?: string;
  name: string;
  category: string;
  subcategory: string;
  description: string;
  width_mm: string;
  depth_mm: string;
  height_mm: string;
  price: string;
  mesh_type: string;
  image_url: string;
  visible: boolean;
};

type ConfiguratorDraft = {
  id?: string;
  slug: string;
  name: string;
  category: string;
  family: string;
  brand_name: string;
  sizing_type: "parametric" | "discrete" | "fixed";
  description: string;
  materials: string;
  thumbnail_url: string;
  model_3d_url: string;
  active: boolean;
  workstationJson: string;
  sizeOptionsJson: string;
  defaultFootprintJson: string;
  derivedRulesJson: string;
};

function emptyStandardDraft(): StandardDraft {
  return {
    name: "",
    category: "workstation",
    subcategory: "",
    description: "",
    width_mm: "1200",
    depth_mm: "600",
    height_mm: "750",
    price: "",
    mesh_type: "box",
    image_url: "",
    visible: true,
  };
}

function standardFromItem(item: StandardCatalogItem): StandardDraft {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    subcategory: item.subcategory ?? "",
    description: item.description ?? "",
    width_mm: String(item.width_mm ?? ""),
    depth_mm: String(item.depth_mm ?? ""),
    height_mm: String(item.height_mm ?? ""),
    price: item.price != null ? String(item.price) : "",
    mesh_type: item.mesh_type ?? "box",
    image_url: item.image_url ?? "",
    visible: item.visible !== false && item.active !== false,
  };
}

function emptyConfiguratorDraft(): ConfiguratorDraft {
  return {
    slug: "",
    name: "",
    category: "desks",
    family: "",
    brand_name: "",
    sizing_type: "fixed",
    description: "",
    materials: "",
    thumbnail_url: "",
    model_3d_url: "",
    active: true,
    workstationJson: JSON.stringify(
      {
        shape: "straight",
        system: "leg",
        wireManagement: [],
        sharing: "non-sharing",
        seaterOptions: [1, 2, 4],
        lengthOptions: [1200, 1500],
        depthOptions: [600, 750],
        heightMm: 750,
      },
      null,
      2,
    ),
    sizeOptionsJson: JSON.stringify(
      [{ sku: "SKU-1200", label: "1200mm", dim: { L: 1200, D: 600, H: 750 } }],
      null,
      2,
    ),
    defaultFootprintJson: JSON.stringify({ L: 1200, D: 600, H: 750 }, null, 2),
    derivedRulesJson: "",
  };
}

function configuratorFromItem(item: ConfiguratorCatalogItem): ConfiguratorDraft {
  return {
    id: item.id,
    slug: item.slug,
    name: item.name,
    category: item.category,
    family: item.family ?? "",
    brand_name: item.brand_name ?? "",
    sizing_type: item.sizing_type,
    description: item.description ?? "",
    materials: (item.materials ?? []).join(", "),
    thumbnail_url: item.thumbnail_url ?? "",
    model_3d_url: item.model_3d_url ?? "",
    active: item.active !== false,
    workstationJson: item.workstation
      ? JSON.stringify(item.workstation, null, 2)
      : emptyConfiguratorDraft().workstationJson,
    sizeOptionsJson: item.size_options
      ? JSON.stringify(item.size_options, null, 2)
      : emptyConfiguratorDraft().sizeOptionsJson,
    defaultFootprintJson: item.default_footprint
      ? JSON.stringify(item.default_footprint, null, 2)
      : emptyConfiguratorDraft().defaultFootprintJson,
    derivedRulesJson: item.derived_rules
      ? JSON.stringify(item.derived_rules, null, 2)
      : "",
  };
}

function parseJsonField(raw: string, fieldName: string): unknown {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    throw new Error(`Invalid JSON in ${fieldName}`);
  }
}

function standardDraftToPayload(draft: StandardDraft): Record<string, unknown> {
  const width = Number(draft.width_mm);
  const depth = Number(draft.depth_mm);
  const height = Number(draft.height_mm);
  if (!draft.name.trim()) throw new Error("Name is required");
  if (!width || !depth || !height) throw new Error("Width, depth, and height must be positive numbers");

  return {
    ...(draft.id ? { id: draft.id } : {}),
    name: draft.name.trim(),
    category: draft.category.trim(),
    subcategory: draft.subcategory.trim() || undefined,
    description: draft.description.trim() || undefined,
    width_mm: width,
    depth_mm: depth,
    height_mm: height,
    price: draft.price.trim() ? Number(draft.price) : undefined,
    mesh_type: draft.mesh_type || "box",
    image_url: draft.image_url.trim() || undefined,
    visible: draft.visible,
  };
}

function configuratorDraftToPayload(draft: ConfiguratorDraft): Record<string, unknown> {
  if (!draft.name.trim()) throw new Error("Name is required");
  if (!draft.category.trim()) throw new Error("Category is required");

  const payload: Record<string, unknown> = {
    name: draft.name.trim(),
    category: draft.category.trim(),
    slug: draft.slug.trim() || undefined,
    family: draft.family.trim() || undefined,
    brand_name: draft.brand_name.trim() || undefined,
    sizing_type: draft.sizing_type,
    description: draft.description.trim() || undefined,
    materials: draft.materials
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean),
    thumbnail_url: draft.thumbnail_url.trim() || undefined,
    model_3d_url: draft.model_3d_url.trim() || undefined,
    active: draft.active,
  };

  if (draft.sizing_type === "parametric") {
    payload.workstation = parseJsonField(draft.workstationJson, "workstation");
  } else if (draft.sizing_type === "discrete") {
    payload.size_options = parseJsonField(draft.sizeOptionsJson, "size_options");
  } else {
    payload.default_footprint = parseJsonField(draft.defaultFootprintJson, "default_footprint");
  }

  const derived = draft.derivedRulesJson.trim();
  if (derived) {
    payload.derived_rules = parseJsonField(draft.derivedRulesJson, "derived_rules");
  }

  return payload;
}

function StandardCatalogForm({
  draft,
  onChange,
  readOnly,
}: {
  draft: StandardDraft;
  onChange: (next: StandardDraft) => void;
  readOnly?: boolean;
}) {
  const set = <K extends keyof StandardDraft>(key: K, value: StandardDraft[K]) =>
    onChange({ ...draft, [key]: value });

  return (
    <div className="space-y-4">
      <AdminFieldGroup title="Identity">
        <AdminField label="Name *">
          <AdminTextInput
            value={draft.name}
            disabled={readOnly}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Linear workstation 4-seat"
          />
        </AdminField>
        <div className="grid gap-3 sm:grid-cols-2">
          <AdminField label="Category *">
            <AdminSelect
              value={draft.category}
              disabled={readOnly}
              onChange={(e) => set("category", e.target.value)}
            >
              {STANDARD_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </AdminSelect>
          </AdminField>
          <AdminField label="Subcategory / shape">
            <AdminTextInput
              value={draft.subcategory}
              disabled={readOnly}
              onChange={(e) => set("subcategory", e.target.value)}
              placeholder="straight-bench"
            />
          </AdminField>
        </div>
        <AdminField label="Description">
          <AdminTextarea
            value={draft.description}
            disabled={readOnly}
            onChange={(e) => set("description", e.target.value)}
            rows={3}
            className="font-sans text-sm"
          />
        </AdminField>
      </AdminFieldGroup>

      <AdminFieldGroup title="Footprint (mm)">
        <div className="grid gap-3 sm:grid-cols-3">
          <AdminField label="Width *">
            <AdminNumberInput
              value={draft.width_mm}
              disabled={readOnly}
              min={1}
              onChange={(e) => set("width_mm", e.target.value)}
            />
          </AdminField>
          <AdminField label="Depth *">
            <AdminNumberInput
              value={draft.depth_mm}
              disabled={readOnly}
              min={1}
              onChange={(e) => set("depth_mm", e.target.value)}
            />
          </AdminField>
          <AdminField label="Height *">
            <AdminNumberInput
              value={draft.height_mm}
              disabled={readOnly}
              min={1}
              onChange={(e) => set("height_mm", e.target.value)}
            />
          </AdminField>
        </div>
      </AdminFieldGroup>

      <AdminFieldGroup title="Commerce & render">
        <div className="grid gap-3 sm:grid-cols-2">
          <AdminField label="Price (INR)">
            <AdminNumberInput
              value={draft.price}
              disabled={readOnly}
              min={0}
              onChange={(e) => set("price", e.target.value)}
            />
          </AdminField>
          <AdminField label="Mesh type">
            <AdminSelect
              value={draft.mesh_type}
              disabled={readOnly}
              onChange={(e) => set("mesh_type", e.target.value)}
            >
              {MESH_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </AdminSelect>
          </AdminField>
        </div>
        <AdminField label="Image URL">
          <AdminTextInput
            value={draft.image_url}
            disabled={readOnly}
            onChange={(e) => set("image_url", e.target.value)}
            placeholder="https://…"
          />
        </AdminField>
        <AdminCheckbox
          label="Visible in planner catalog"
          checked={draft.visible}
          disabled={readOnly}
          onChange={(visible) => set("visible", visible)}
        />
      </AdminFieldGroup>
    </div>
  );
}

function ConfiguratorCatalogForm({
  draft,
  onChange,
  readOnly,
}: {
  draft: ConfiguratorDraft;
  onChange: (next: ConfiguratorDraft) => void;
  readOnly?: boolean;
}) {
  const set = <K extends keyof ConfiguratorDraft>(key: K, value: ConfiguratorDraft[K]) =>
    onChange({ ...draft, [key]: value });

  return (
    <div className="space-y-4">
      <AdminFieldGroup title="Identity">
        <AdminField label="Name *">
          <AdminTextInput
            value={draft.name}
            disabled={readOnly}
            onChange={(e) => set("name", e.target.value)}
          />
        </AdminField>
        <div className="grid gap-3 sm:grid-cols-2">
          <AdminField label="Slug" hint="Auto-generated from name if empty">
            <AdminTextInput
              value={draft.slug}
              disabled={readOnly}
              onChange={(e) => set("slug", e.target.value)}
            />
          </AdminField>
          <AdminField label="Category *">
            <AdminSelect
              value={draft.category}
              disabled={readOnly}
              onChange={(e) => set("category", e.target.value)}
            >
              {CONFIGURATOR_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </AdminSelect>
          </AdminField>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <AdminField label="Family">
            <AdminTextInput
              value={draft.family}
              disabled={readOnly}
              onChange={(e) => set("family", e.target.value)}
            />
          </AdminField>
          <AdminField label="Brand name">
            <AdminTextInput
              value={draft.brand_name}
              disabled={readOnly}
              onChange={(e) => set("brand_name", e.target.value)}
            />
          </AdminField>
        </div>
        <AdminField label="Description">
          <AdminTextarea
            value={draft.description}
            disabled={readOnly}
            onChange={(e) => set("description", e.target.value)}
            rows={3}
            className="font-sans text-sm"
          />
        </AdminField>
      </AdminFieldGroup>

      <AdminFieldGroup title="Sizing model">
        <AdminField label="Sizing type *">
          <AdminSelect
            value={draft.sizing_type}
            disabled={readOnly}
            onChange={(e) =>
              set("sizing_type", e.target.value as ConfiguratorDraft["sizing_type"])
            }
          >
            <option value="parametric">parametric (workstation spec)</option>
            <option value="discrete">discrete (size options list)</option>
            <option value="fixed">fixed (single footprint)</option>
          </AdminSelect>
        </AdminField>

        {draft.sizing_type === "parametric" ? (
          <AdminField label="Workstation JSON *" hint="shape, system, seaterOptions, lengthOptions, depthOptions">
            <AdminTextarea
              value={draft.workstationJson}
              disabled={readOnly}
              onChange={(e) => set("workstationJson", e.target.value)}
              rows={14}
            />
          </AdminField>
        ) : null}

        {draft.sizing_type === "discrete" ? (
          <AdminField label="Size options JSON *" hint='[{ "sku", "label", "dim": { "L", "D", "H?" } }]'>
            <AdminTextarea
              value={draft.sizeOptionsJson}
              disabled={readOnly}
              onChange={(e) => set("sizeOptionsJson", e.target.value)}
              rows={12}
            />
          </AdminField>
        ) : null}

        {draft.sizing_type === "fixed" ? (
          <AdminField label="Default footprint JSON *" hint='{ "L", "D", "H?" } in millimetres'>
            <AdminTextarea
              value={draft.defaultFootprintJson}
              disabled={readOnly}
              onChange={(e) => set("defaultFootprintJson", e.target.value)}
              rows={6}
            />
          </AdminField>
        ) : null}

        <AdminField label="Derived rules JSON (optional)" hint="Screen/modesty offsets">
          <AdminTextarea
            value={draft.derivedRulesJson}
            disabled={readOnly}
            onChange={(e) => set("derivedRulesJson", e.target.value)}
            rows={5}
          />
        </AdminField>
      </AdminFieldGroup>

      <AdminFieldGroup title="Assets">
        <AdminField label="Materials" hint="Comma-separated">
          <AdminTextInput
            value={draft.materials}
            disabled={readOnly}
            onChange={(e) => set("materials", e.target.value)}
          />
        </AdminField>
        <AdminField label="Thumbnail URL">
          <AdminTextInput
            value={draft.thumbnail_url}
            disabled={readOnly}
            onChange={(e) => set("thumbnail_url", e.target.value)}
          />
        </AdminField>
        <AdminField label="3D model URL">
          <AdminTextInput
            value={draft.model_3d_url}
            disabled={readOnly}
            onChange={(e) => set("model_3d_url", e.target.value)}
          />
        </AdminField>
        <AdminCheckbox
          label="Active in configurator"
          checked={draft.active}
          disabled={readOnly}
          onChange={(active) => set("active", active)}
        />
      </AdminFieldGroup>
    </div>
  );
}

export function AdminCatalogManager({ title, description, catalogType }: CatalogListProps) {
  const isStandard = catalogType === "standard";
  const [items, setItems] = useState<Array<StandardCatalogItem | ConfiguratorCatalogItem>>([]);
  const [total, setTotal] = useState(0);
  const [source, setSource] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [visibleFilter, setVisibleFilter] = useState<"" | "true" | "false">("");
  const [page, setPage] = useState(1);
  const [editorMode, setEditorMode] = useState<EditorMode>(null);
  const [standardDraft, setStandardDraft] = useState<StandardDraft>(emptyStandardDraft);
  const [configuratorDraft, setConfiguratorDraft] = useState<ConfiguratorDraft>(emptyConfiguratorDraft);
  const [saving, setSaving] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const readOnly = isStandard && source === "local-catalog";

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query: Record<string, string | number | undefined> = {
        page,
        limit: 50,
      };
      if (isStandard) {
        if (search.trim()) query.search = search.trim();
        if (categoryFilter) query.category = categoryFilter;
        if (visibleFilter) query.visible = visibleFilter;
      }
      const payload = await fetchAdminCatalog(catalogType, query);
      const rows = (payload.items ?? payload.catalog_items ?? []) as Array<
        StandardCatalogItem | ConfiguratorCatalogItem
      >;
      setItems(rows);
      setTotal(payload.pagination?.total ?? payload.total ?? rows.length);
      setSource(payload.source ?? null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load catalog");
    } finally {
      setLoading(false);
    }
  }, [catalogType, categoryFilter, isStandard, page, search, visibleFilter]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      if (item.category) set.add(item.category);
    }
    return [...set].sort();
  }, [items]);

  const filteredConfiguratorItems = useMemo(() => {
    if (isStandard) return items;
    let rows = items;
    if (categoryFilter) rows = rows.filter((item) => item.category === categoryFilter);
    if (visibleFilter === "true") rows = rows.filter((item) => item.active !== false);
    if (visibleFilter === "false") rows = rows.filter((item) => item.active === false);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter((item) =>
        [item.name, item.category, "slug" in item ? item.slug : ""]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(q)),
      );
    }
    return rows;
  }, [categoryFilter, isStandard, items, search, visibleFilter]);

  const displayItems = isStandard ? items : filteredConfiguratorItems;

  const openCreate = () => {
    if (readOnly) return;
    setEditorMode("create");
    setStandardDraft(emptyStandardDraft());
    setConfiguratorDraft(emptyConfiguratorDraft());
    setError(null);
  };

  const openEdit = (item: StandardCatalogItem | ConfiguratorCatalogItem) => {
    setEditorMode("edit");
    if (isStandard) {
      setStandardDraft(standardFromItem(item as StandardCatalogItem));
    } else {
      setConfiguratorDraft(configuratorFromItem(item as ConfiguratorCatalogItem));
    }
    setError(null);
  };

  const closeEditor = () => {
    setEditorMode(null);
    setSaving(false);
  };

  const handleSave = async () => {
    if (readOnly) return;
    setSaving(true);
    setError(null);
    try {
      const payload = isStandard
        ? standardDraftToPayload(standardDraft)
        : configuratorDraftToPayload(configuratorDraft);

      if (editorMode === "create") {
        await createAdminCatalogItem(catalogType, payload);
      } else {
        const id = isStandard ? standardDraft.id : configuratorDraft.id;
        if (!id) throw new Error("Missing item id");
        await patchAdminCatalogItem(catalogType, id, payload);
      }
      closeEditor();
      await loadItems();
      void usePlannerCatalogStore.getState().hydrateCatalog();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save item");
      setSaving(false);
    }
  };

  const handleToggleVisible = async (item: StandardCatalogItem | ConfiguratorCatalogItem) => {
    if (readOnly || !item.id) return;
    setPendingId(item.id);
    setError(null);
    try {
      const nextVisible = isStandard
        ? (item as StandardCatalogItem).visible === false
        : (item as ConfiguratorCatalogItem).active === false;
      await patchAdminCatalogItem(
        catalogType,
        item.id,
        isStandard ? { visible: nextVisible } : { active: nextVisible },
      );
      await loadItems();
      void usePlannerCatalogStore.getState().hydrateCatalog();
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "Failed to update visibility");
    } finally {
      setPendingId(null);
    }
  };

  const handleDelete = async (item: StandardCatalogItem | ConfiguratorCatalogItem) => {
    if (readOnly || !item.id) return;
    const label = item.name;
    if (!window.confirm(`Delete "${label}"? This cannot be undone for standard catalog items.`)) return;
    setPendingId(item.id);
    setError(null);
    try {
      await deleteAdminCatalogItem(catalogType, item.id);
      if (editorMode === "edit") closeEditor();
      await loadItems();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete item");
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <div>
          <p className="admin-page__eyebrow">Catalog admin</p>
          <h1 className="admin-page__title">{title}</h1>
          <p className="admin-page__copy">{description}</p>
          {source ? (
            <p className="admin-page__meta">
              Data source: <code>{source}</code>
              {readOnly ? " — read-only until Supabase `planner_managed_products` is configured" : null}
            </p>
          ) : null}
        </div>
        <div className="admin-page__actions">
          <button
            type="button"
            className="btn-outline inline-flex items-center gap-2 px-3 py-2 text-sm"
            onClick={() => void loadItems()}
            disabled={loading}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Refresh
          </button>
          <button
            type="button"
            className="btn-primary inline-flex items-center gap-2 px-3 py-2 text-sm"
            onClick={openCreate}
            disabled={readOnly}
          >
            <Plus size={14} />
            Add item
          </button>
        </div>
      </header>

      {readOnly ? (
        <div className="admin-alert admin-alert--warn" role="status">
          Showing bundled local catalog fallback. Connect Supabase service role and migrate{" "}
          <code>planner_managed_products</code> to create and edit items from this panel.
        </div>
      ) : null}

      {error ? (
        <div className="admin-alert admin-alert--error" role="alert">
          {error}
        </div>
      ) : null}

      <div className="admin-toolbar">
        <AdminField label="Search" className="admin-field--search">
          <div className="relative min-w-[200px]">
            <Search size={14} className="admin-field__search-icon" />
            <AdminTextInput
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="admin-field__input--search"
              placeholder="Name, category…"
            />
          </div>
        </AdminField>
        <AdminField label="Category">
          <AdminSelect
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="min-w-[140px]"
          >
            <option value="">All</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </AdminSelect>
        </AdminField>
        <AdminField label="Status">
          <AdminSelect
            value={visibleFilter}
            onChange={(e) => {
              setVisibleFilter(e.target.value as "" | "true" | "false");
              setPage(1);
            }}
            className="min-w-[120px]"
          >
            <option value="">All</option>
            <option value="true">Active</option>
            <option value="false">Hidden</option>
          </AdminSelect>
        </AdminField>
      </div>

      {loading && items.length === 0 ? (
        <div className="flex items-center gap-2 text-sm text-muted">
          <Loader2 size={16} className="animate-spin" />
          Loading catalog…
        </div>
      ) : displayItems.length === 0 ? (
        <div className="admin-empty">No items match filters.</div>
      ) : (
        <div className="admin-panel">
          <div className="admin-panel__header">
            {isStandard ? total : displayItems.length} items
            {isStandard && total > 50 ? ` — page ${page}` : null}
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Size / type</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayItems.map((item) => {
                  const id = item.id ?? ("slug" in item ? item.slug : item.name);
                  const busy = pendingId === item.id;
                  const isActive = isStandard
                    ? (item as StandardCatalogItem).visible !== false
                    : (item as ConfiguratorCatalogItem).active !== false;
                  return (
                    <tr key={String(id)}>
                      <td>
                        <p className="admin-table__primary">{item.name}</p>
                        {"slug" in item && item.slug ? (
                          <p className="admin-table__secondary">{item.slug}</p>
                        ) : null}
                      </td>
                      <td className="text-muted">
                        {item.category}
                        {"subcategory" in item && item.subcategory ? ` · ${item.subcategory}` : null}
                        {"family" in item && item.family ? ` · ${item.family}` : null}
                      </td>
                      <td className="text-muted">
                        {isStandard ? (
                          <>
                            {(item as StandardCatalogItem).width_mm ?? "—"} ×{" "}
                            {(item as StandardCatalogItem).depth_mm ?? "—"} ×{" "}
                            {(item as StandardCatalogItem).height_mm ?? "—"} mm
                          </>
                        ) : (
                          (item as ConfiguratorCatalogItem).sizing_type
                        )}
                      </td>
                      <td>
                        <span className={`admin-badge ${isActive ? "admin-badge--active" : "admin-badge--hidden"}`}>
                          {isActive ? "Active" : "Hidden"}
                        </span>
                      </td>
                      <td>
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            className="admin-icon-btn"
                            title="Edit"
                            onClick={() => openEdit(item)}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            className="admin-icon-btn"
                            title={isActive ? "Hide" : "Show"}
                            disabled={readOnly || busy || !item.id}
                            onClick={() => void handleToggleVisible(item)}
                          >
                            {busy ? <Loader2 size={14} className="animate-spin" /> : <Archive size={14} />}
                          </button>
                          <button
                            type="button"
                            className="admin-icon-btn admin-icon-btn--danger"
                            title="Delete"
                            disabled={readOnly || busy || !item.id}
                            onClick={() => void handleDelete(item)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {isStandard && total > 50 ? (
            <div className="flex items-center justify-between border-t border-soft px-4 py-3 text-sm">
              <button
                type="button"
                className="btn-outline px-3 py-1"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span className="text-muted">
                Page {page} of {Math.ceil(total / 50)}
              </span>
              <button
                type="button"
                className="btn-outline px-3 py-1"
                disabled={page >= Math.ceil(total / 50)}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          ) : null}
        </div>
      )}

      {editorMode ? (
        <div className="admin-drawer-backdrop" role="presentation">
          <div
            className="admin-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={editorMode === "create" ? "Create catalog item" : "Edit catalog item"}
          >
            <header className="admin-drawer__header">
              <h2 className="admin-drawer__title">
                {editorMode === "create" ? "New catalog item" : "Edit catalog item"}
              </h2>
              <button type="button" className="admin-icon-btn" onClick={closeEditor} aria-label="Close">
                <X size={16} />
              </button>
            </header>
            <div className="admin-drawer__body">
              {isStandard ? (
                <StandardCatalogForm
                  draft={standardDraft}
                  onChange={setStandardDraft}
                  readOnly={readOnly}
                />
              ) : (
                <ConfiguratorCatalogForm
                  draft={configuratorDraft}
                  onChange={setConfiguratorDraft}
                  readOnly={readOnly}
                />
              )}
            </div>
            <footer className="admin-drawer__footer">
              <button type="button" className="btn-outline px-4 py-2 text-sm" onClick={closeEditor}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm"
                disabled={readOnly || saving}
                onClick={() => void handleSave()}
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {editorMode === "create" ? "Create" : "Save changes"}
              </button>
            </footer>
          </div>
        </div>
      ) : null}
    </div>
  );
}
