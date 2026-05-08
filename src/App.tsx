/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "./data/store";
import RootLayout from "./components/layout";

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

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootLayout />}>
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
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
