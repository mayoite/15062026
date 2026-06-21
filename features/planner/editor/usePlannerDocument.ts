import { useCallback, useMemo, useRef } from "react";
import { buildPlannerDocumentFromEditor } from "../../document/plannerDocumentBridge";
import { sanitizePlannerPlanName } from "../../lib/sessionState";

export function usePlannerDocument({
  planId,
  planName,
  fabricSerializedDraft,
}: {
  planId?: string;
  planName: string;
  fabricSerializedDraft: string | null;
}) {
  const activeDocumentIdRef = useRef<string | null>(planId ?? null);
  const planNameRef = useRef<string>("Workspace Plan");

  activeDocumentIdRef.current = planId ?? null;
  planNameRef.current = planName;

  const buildCurrentPlannerDocument = useCallback(() => {
    return buildPlannerDocumentFromEditor(null, {
      id: activeDocumentIdRef.current ?? undefined,
      title: sanitizePlannerPlanName(planNameRef.current),
    });
  }, []);

  const currentPlannerDocument = useMemo(() => {
    void fabricSerializedDraft;
    void planName;
    return buildCurrentPlannerDocument();
  }, [buildCurrentPlannerDocument, fabricSerializedDraft, planName]);

  return {
    buildCurrentPlannerDocument,
    currentPlannerDocument,
    activeDocumentIdRef,
  };
}
