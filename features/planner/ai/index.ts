export { AIAssistDrawer, type AIAssistDrawerProps } from "./AIAssistDrawer";
export { AiAdvisorChatPane, type AiAdvisorChatPaneProps } from "./AiAdvisorChatPane";
export { AiAdvisorChat, AiAdvisorTrigger } from "./AiAdvisorChat";
export { LayoutPreviewSvg } from "./LayoutPreviewSvg";
export {
  AI_ADVISOR_PLANNER_ID,
  CATALOG_TIER_LABELS,
  buildAdvisorChatWelcome,
  buildChatSuggestionChips,
  resolveSpaceSuggestDefaults,
} from "./aiAdvisorConfig";

export { suggestLayout, suggestLayoutGridPack, type SuggestLayoutResult } from "./spaceSuggest";
export { matchCatalogForPlacement, matchCatalogForPlacements, inferCatalogPriceTier } from "./catalogMatch";
export { extractCanvasPlacements } from "./extractCanvasPlacements";
export { applySuggestedLayout, buildShapesFromSuggestedLayout } from "./applySuggestedLayout";
export {
  CHAT_ADVISOR_SYSTEM_PROMPT,
  SPACE_SUGGEST_SYSTEM_PROMPT,
  buildSpaceSuggestUserPrompt,
} from "./prompts";

export type {
  SuggestedLayoutJson,
  SuggestedLayoutWall,
  SuggestedLayoutFurniture,
  SuggestedLayoutZone,
  SpaceSuggestInput,
  CatalogPriceTier,
  CanvasFurnitureKind,
  CanvasPlacementSummary,
  CatalogSkuMatch,
  CatalogMatchResult,
} from "./types";

export {
  classifyAIResponse,
  isStaleResponse,
  validateLayoutSchema,
  type AIStatusState,
  type AIProviderStatus,
  type AIProviderClassification,
} from "./aiStatus";