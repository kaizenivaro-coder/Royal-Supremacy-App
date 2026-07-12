/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppProvider, useAppStore } from "./data/store";
import RootLayout from "./components/layout";

import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Teams from "./pages/Teams";
import Announcements from "./pages/Announcements";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import MobilePreview from "./pages/MobilePreview";
import PausedFeature from "./pages/PausedFeature";
import Leaderboard from "./pages/Leaderboard";
import StrategyRoom from "./pages/StrategyRoom";

const routerBasename =
  import.meta.env.BASE_URL === "/"
    ? undefined
    : import.meta.env.BASE_URL.replace(/\/$/, "");

function RequireAuth() {
  const { authUser } = useAppStore();
  const location = useLocation();

  if (!authUser) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  return <RootLayout />;
}

function AuthRoute() {
  const { authUser } = useAppStore();

  if (authUser) {
    return <Navigate to="/" replace />;
  }

  return <Auth />;
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter basename={routerBasename}>
        <Routes>
          <Route path="/auth" element={<AuthRoute />} />
          <Route path="/mobile-preview" element={<MobilePreview />} />
          <Route path="/" element={<RequireAuth />}>
            <Route index element={<Dashboard />} />
            <Route path="members" element={<Navigate to="/teams" replace />} />
            <Route path="teams" element={<Teams />} />
            <Route path="schedule" element={<PausedFeature featureName="Schedule" />} />
            <Route path="matches" element={<PausedFeature featureName="Matches" />} />
            <Route path="points" element={<PausedFeature featureName="Paused MVP Section" />} />
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="notifications" element={<PausedFeature featureName="Notifications" />} />
            <Route path="strategy" element={<StrategyRoom />} />
            <Route path="announcements" element={<Announcements />} />
            <Route path="tryouts" element={<PausedFeature featureName="This section has been retired" />} />
            <Route path="admin" element={<Admin />} />
            <Route path="profile" element={<Profile />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
