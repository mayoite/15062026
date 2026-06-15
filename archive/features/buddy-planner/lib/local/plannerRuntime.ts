// @ts-nocheck
import { useElementsStore } from '../../stores/elementsStore'
import { useProjectStore } from '../../stores/projectStore'
import { useCanvasStore } from '../../stores/canvasStore'
import type { PlannerDocument } from '../../../oando-planner/model/plannerDocument'

export const CURRENT_LOCAL_PROJECT_ID_STORAGE_KEY = 'buddycraft_current_project_id'

export interface PlannerRecentProjectSummary {
  id: string
  name: string
  updatedAt: string
}

export function toPlannerRecentProjectSummary(doc: PlannerDocument): PlannerRecentProjectSummary {
  return {
    id: doc.projectName || 'untitled',
    name: doc.title,
    updatedAt: doc.updatedAt || new Date().toISOString(),
  }
}

export function sortPlannerProjectsByRecent(a: PlannerRecentProjectSummary, b: PlannerRecentProjectSummary) {
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
}

export function createBlankPlannerDocument(): PlannerDocument {
  return {
    schemaVersion: 1,
    title: 'Untitled Plan',
    projectName: 'untitled-' + Date.now(),
    roomWidthMm: 6000,
    roomDepthMm: 8000,
    seatTarget: 10,
    unitSystem: 'metric',
    sceneJson: { elements: {} } as Record<string, unknown>,
    itemCount: 0,
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as unknown as PlannerDocument
}

export function buildPlannerDocumentFromStores(): PlannerDocument {
  const elements = useElementsStore.getState().elements
  const project = useProjectStore.getState().currentProject
  const canvasSettings = useCanvasStore.getState().settings

  return {
    schemaVersion: 1,
    title: project?.name || 'Untitled Plan',
    projectName: project?.id,
    roomWidthMm: 6000,
    roomDepthMm: 8000,
    seatTarget: 10,
    unitSystem: 'metric',
    sceneJson: { elements, settings: canvasSettings } as Record<string, unknown>,
    itemCount: Object.keys(elements).length,
    status: 'draft',
    updatedAt: new Date().toISOString(),
  } as unknown as PlannerDocument
}

export function hydratePlannerDocument(doc: PlannerDocument) {
  const scene = (doc.sceneJson || {}) as { elements?: unknown }
  
  if (scene.elements) {
    useElementsStore.getState().setElements(scene.elements)
  }
  if (doc.title) {
     
    useProjectStore.getState().setCurrentProject({ id: doc.projectName || 'untitled', name: doc.title, slug: 'untitled' } as unknown)
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function hydrateStoresFromState(state: { elements?: unknown }, source: 'local' | 'remote') {
  if (state.elements) {
    useElementsStore.getState().setElements(state.elements)
  }
}

export function extractStateFromStores(): Record<string, unknown> {
  return {
    version: 1,
    elements: useElementsStore.getState().elements,
    settings: useCanvasStore.getState().settings,
  }
}
