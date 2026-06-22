import { useCallback, useMemo } from "react";
import { buildPlannerDocumentFromEditor } from "@/features/planner/document/plannerDocumentBridge";
import { sanitizePlannerPlanName } from "@/features/planner/lib/sessionState";

export function usePlannerDocument({
  planId,
  planName,
  fabricSerializedDraft,
}: {
  planId?: string;
  planName: string;
  fabricSerializedDraft: string | null;
}) {
  const buildCurrentPlannerDocument = useCallback(() => {
    return buildPlannerDocumentFromEditor(null, {
      id: planId,
      title: sanitizePlannerPlanName(planName),
    });
  }, [planId, planName]);

  const currentPlannerDocument = useMemo(() => {
    void fabricSerializedDraft;
    return buildCurrentPlannerDocument();
  }, [buildCurrentPlannerDocument, fabricSerializedDraft]);

  return {
    buildCurrentPlannerDocument,
    currentPlannerDocument,
  };
}
