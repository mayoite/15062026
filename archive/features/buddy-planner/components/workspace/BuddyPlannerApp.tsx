"use client";

import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";

import { BuddyPlannerPage } from "../../ui/BuddyPlannerPage";

function DemoPlannerRedirect() {
  return <Navigate to="/t/demo/o/demo/map" replace />;
}

function EditorRoute() {
  return <BuddyPlannerPage guestMode={true} />;
}

function TenantPlannerRedirect() {
  const { teamSlug, officeSlug } = useParams<{
    teamSlug: string;
    officeSlug: string;
  }>();

  if (!teamSlug || !officeSlug) {
    return <DemoPlannerRedirect />;
  }

  return <Navigate to={`/t/${teamSlug}/o/${officeSlug}/map`} replace />;
}

/** First slice: the planner editor (map) view. */
export function BuddyPlannerApp() {
  return (
    <BrowserRouter basename="/buddy-planner">
      <Routes>
        <Route path="/t/:teamSlug/o/:officeSlug/map" element={<BuddyPlannerPage />} />
        <Route path="/editor" element={<EditorRoute />} />
        <Route path="/t/:teamSlug/o/:officeSlug" element={<TenantPlannerRedirect />} />
        <Route path="/t/:teamSlug/o/:officeSlug/*" element={<TenantPlannerRedirect />} />
        <Route path="/" element={<DemoPlannerRedirect />} />
        <Route path="*" element={<DemoPlannerRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}

export default BuddyPlannerApp;
