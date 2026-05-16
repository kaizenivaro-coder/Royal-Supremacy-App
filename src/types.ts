export interface Member {
  id: string;
  username: string;
  authUserId?: string;
  playerName: string;
  mlbbId: string;
  serverId: string;
  mainRole: string;
  secondaryRole: string;
  mainHeroes: string[];
  currentRank: string;
  highestRank: string;
  team: string;
  status: string; // Active, Inactive, Trial, Suspended, Left
  bannerId: string;
  profileImageSrc?: string;
}

export interface Notification {
  id: string;
  type: string;
  message: string;
  createdAt: string;
  actorUsername: string;
  read?: boolean;
}

export interface ProfileBanner {
  id: string;
  name: string;
  src: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  priority: string; // Normal, Important, Urgent
  postedBy: string;
  date: string;
}

export interface Tryout {
  id: string;
  playerName: string;
  mlbbId: string;
  serverId: string;
  currentRank: string;
  highestRank: string;
  mainRole: string;
  secondaryRole: string;
  mainHeroes: string[];
  country: string;
  availability: string;
  whatsapp: string;
  reason: string; // Why they want to join
  status: string; // Pending, Accepted, Rejected, Trial, Needs Test Match
}
