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

type NavigationItemDefinition = Readonly<{
  name: string;
  path: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}>;

function defineNavigationItem<const Item extends NavigationItemDefinition>(item: Item): Readonly<Item> {
  return Object.freeze(item);
}

const navigationRegistry = Object.freeze({
  home: defineNavigationItem({ name: "Home", path: "/", icon: Home }),
  profile: defineNavigationItem({ name: "Profile", path: "/profile", icon: UserCircle }),
  teams: defineNavigationItem({ name: "Teams", path: "/teams", icon: Shield }),
  leaderboard: defineNavigationItem({ name: "Leaderboard", path: "/leaderboard", icon: Trophy }),
  strategy: defineNavigationItem({ name: "Strategy", path: "/strategy", icon: MapPinned }),
  decrees: defineNavigationItem({ name: "Decrees", path: "/announcements", icon: ScrollText }),
  notifications: defineNavigationItem({ name: "Notifications", path: "/notifications", icon: Bell }),
  admin: defineNavigationItem({
    name: "Admin Portal",
    path: "/admin",
    icon: FileEdit,
    adminOnly: true,
  }),
});

type NavigationKey = keyof typeof navigationRegistry;

export type AppPath = (typeof navigationRegistry)[NavigationKey]["path"];

export interface NavigationItem {
  readonly name: string;
  readonly path: AppPath;
  readonly icon: LucideIcon;
  readonly adminOnly?: boolean;
}

const canonicalNavigationRegistry: Readonly<Record<NavigationKey, NavigationItem>> =
  navigationRegistry;

const mobilePrimaryKeys = Object.freeze([
  "home",
  "teams",
  "strategy",
  "decrees",
  "profile",
] as const satisfies readonly NavigationKey[]);

const moreKeys = Object.freeze([
  "leaderboard",
  "notifications",
  "admin",
] as const satisfies readonly NavigationKey[]);

const desktopKeys = Object.freeze([
  "home",
  "profile",
  "teams",
  "leaderboard",
  "strategy",
  "decrees",
  "admin",
] as const satisfies readonly NavigationKey[]);

function selectNavigation(
  keys: readonly NavigationKey[],
  isAdmin: boolean,
): readonly NavigationItem[] {
  // adminOnly controls presentation only; routes and data need their own authorization checks.
  const selection = keys
    .map((key) => canonicalNavigationRegistry[key])
    .filter((item) => !item.adminOnly || isAdmin);

  return Object.freeze(selection);
}

export function getMobilePrimaryNavigation(isAdmin: boolean): readonly NavigationItem[] {
  return selectNavigation(mobilePrimaryKeys, isAdmin);
}

export function getMoreNavigation(isAdmin: boolean): readonly NavigationItem[] {
  return selectNavigation(moreKeys, isAdmin);
}

export function getDesktopNavigation(isAdmin: boolean): readonly NavigationItem[] {
  return selectNavigation(desktopKeys, isAdmin);
}
