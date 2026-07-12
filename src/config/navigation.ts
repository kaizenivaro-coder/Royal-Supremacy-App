import type { LucideIcon } from "lucide-react";
import {
  Bell,
  FileEdit,
  Home,
  MapPinned,
  ScrollText,
  Shield,
  Trophy,
  UserCircle,
} from "lucide-react";

export interface NavigationItem {
  name: string;
  path: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

const mobilePrimaryNavigation: NavigationItem[] = [
  { name: "Home", path: "/", icon: Home },
  { name: "Teams", path: "/teams", icon: Shield },
  { name: "Strategy", path: "/strategy", icon: MapPinned },
  { name: "Decrees", path: "/announcements", icon: ScrollText },
  { name: "Profile", path: "/profile", icon: UserCircle },
];

const moreNavigation: NavigationItem[] = [
  { name: "Leaderboard", path: "/leaderboard", icon: Trophy },
  { name: "Notifications", path: "/notifications", icon: Bell },
  { name: "Admin Portal", path: "/admin", icon: FileEdit, adminOnly: true },
];

const desktopNavigation: NavigationItem[] = [
  { name: "Home", path: "/", icon: Home },
  { name: "Profile", path: "/profile", icon: UserCircle },
  { name: "Teams", path: "/teams", icon: Shield },
  { name: "Leaderboard", path: "/leaderboard", icon: Trophy },
  { name: "Strategy", path: "/strategy", icon: MapPinned },
  { name: "Decrees", path: "/announcements", icon: ScrollText },
  { name: "Admin Portal", path: "/admin", icon: FileEdit, adminOnly: true },
];

function filterNavigation(items: NavigationItem[], isAdmin: boolean): NavigationItem[] {
  return items.filter((item) => !item.adminOnly || isAdmin);
}

export function getMobilePrimaryNavigation(isAdmin: boolean): NavigationItem[] {
  return filterNavigation(mobilePrimaryNavigation, isAdmin);
}

export function getMoreNavigation(isAdmin: boolean): NavigationItem[] {
  return filterNavigation(moreNavigation, isAdmin);
}

export function getDesktopNavigation(isAdmin: boolean): NavigationItem[] {
  return filterNavigation(desktopNavigation, isAdmin);
}
