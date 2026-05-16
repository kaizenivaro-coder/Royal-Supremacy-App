/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppProvider, useAppStore } from "./data/store";
import RootLayout from "./components/layout";

import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Members from "./pages/Members";
import Teams from "./pages/Teams";
import Schedule from "./pages/Schedule";
import Matches from "./pages/Matches";
import Points from "./pages/Points";
import Leaderboard from "./pages/Leaderboard";
import Announcements from "./pages/Announcements";
import Tryouts from "./pages/Tryouts";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import MobilePreview from "./pages/MobilePreview";

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
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthRoute />} />
          <Route path="/mobile-preview" element={<MobilePreview />} />
          <Route path="/" element={<RequireAuth />}>
            <Route index element={<Dashboard />} />
            <Route path="members" element={<Members />} />
            <Route path="teams" element={<Teams />} />
            <Route path="schedule" element={<Schedule />} />
            <Route path="matches" element={<Matches />} />
            <Route path="points" element={<Points />} />
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="announcements" element={<Announcements />} />
            <Route path="tryouts" element={<Tryouts />} />
            <Route path="admin" element={<Admin />} />
            <Route path="profile" element={<Profile />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
