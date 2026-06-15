"use client";

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { BuddyPlannerPage } from "../../ui/BuddyPlannerPage";


/**
 * Client-side router host for the active configurator runtime.
 *
 * Migrated to generic PlannerDocument format (Phase 07).
 */
export function WorkspacePlannerApp() {
  return (
    <BrowserRouter basename="/buddy-planner">
      <Routes>
        <Route path="/p/:projectId/map" element={<BuddyPlannerPage />} />
        <Route path="/editor" element={<Navigate to="/p/demo/map" replace />} />
        <Route path="/p/:projectId" element={<Navigate to="/p/demo/map" replace />} />
        <Route path="/p/:projectId/*" element={<Navigate to="/p/demo/map" replace />} />
        <Route path="/" element={<Navigate to="/p/demo/map" replace />} />
        <Route path="*" element={<Navigate to="/p/demo/map" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default WorkspacePlannerApp;
