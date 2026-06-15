// ============================================================================
// Planner Document Model
// ============================================================================

export {
  plannerDocumentSchema,
  validatePlannerDocument,
  validatePlannerDocumentSafe,
  validateSceneEnvelope,
  createEmptyPlannerDocument,
  migrateDocument,
  createPlannerDocument,
  normalizePlannerDocument,
  parsePlannerDocumentImport,
  validatePlannerDocumentImport,
  type PlannerDocument,
  type PlannerSceneEnvelope,
  type PlannerJsonValue,
  type PlannerUnitSystem,
  type PlannerDocumentImportResult,
  type PlannerImportValidationResult,
  PLANNER_DOCUMENT_SCHEMA_VERSION,
} from "./plannerDocument";


// ============================================================================
// Planner Identity Model
// ============================================================================

export {
  PLANNER_IDENTITY_CONFIGS,
  getPlannerIdentityConfig,
  getPlannerWorkflowStages,
  listPlannerIdentityConfigs,
  type PlannerIdentityId,
  type PlannerIdentityConfig,
  type PlannerWorkflowStage,
  type PlannerWorkflowEngine,
  type PlannerRouteContract,
  type PlannerRouteStatus,
} from "./plannerIdentity";

// ============================================================================
// Planner Transfer Envelope
// ============================================================================

export {
  plannerTransferEnvelopeSchema,
  validatePlannerTransferEnvelope,
  createPlannerTransferEnvelope,
  buildPlannerEnvelopeMetadata,
  normalizePlannerTransferSource,
  isPlannerTransferSource,
  type PlannerTransferEnvelope,
  type PlannerTransferEnvelopeMetadata,
  type PlannerTransferSource,
} from "./plannerEnvelope";

// ============================================================================
// Planner Placement Model
// ============================================================================

export {
  plannerPlacementEnvelopeSchema,
  validatePlannerPlacementEnvelope,
  buildPlannerPlacementMetadata,
  createPlannerPlacementEnvelope,
  type PlannerPlacementEnvelope,
  type PlannerPlacementMetadata,
  type PlannerPlacementPosition,
  type PlannerPlacementDimensions,
} from "./plannerPlacement";

// ============================================================================
// Planner 3D Scene Model
// ============================================================================

export {
  planner3dSceneDocumentSchema,
  validatePlanner3DSceneDocument,
  collectPlanner3DSceneWarnings,
  type Planner3DSceneDocument,
  type Planner3DSceneRoom,
  type Planner3DScenePosition,
  type Planner3DSceneSize,
  type Planner3DSceneItem,
  type Planner3DSceneWarning,
  type Planner3DSceneWarningsResult,
  type Planner3DSceneWarningSeverity,
} from "./planner3dScene";

// ============================================================================
// Planner Permission Model
// ============================================================================

export {
  PLANNER_ACTION_PERMISSION_MATRIX,
  PLANNER_GUEST_BLOCKED_ACTIONS,
  getPlannerActionPermissions,
  plannerActionIsBlocked,
  type PlannerAccessContext,
  type PlannerActionKey,
  type PlannerActionPermissionMatrix,
  type PlannerActionPermissionSet,
} from "./plannerPermissions";

// ============================================================================
// Planner Managed Product Model
// ============================================================================

export {
  PlannerManagedProductSchema,
  productToCatalogItem,
  catalogItemToProduct,
  canPlaceProduct,
  getProductAreaMm,
  getProductAreaSqM,
  filterProductsByCategory,
  filterVisibleProducts,
  sortProductsByName,
  getProductCategories,
  plannerManagedProductRowSchema,
  plannerManagedProductWriteSchema,
  type PlannerManagedProduct,
  type ProductCategory,
  type ProductMeshType,
  type CatalogItemWrite,
  type CatalogItemRead,
  type PlannerManagedProductRow,
  type PlannerManagedProductWrite,
} from "./plannerManagedProduct";
