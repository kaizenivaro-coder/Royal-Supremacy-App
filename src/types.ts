export interface Member {
  id: string;
  username: string;
  authUserId?: string;
  playerName: string;
  normalizedName?: string;
  mlbbId: string;
  serverId: string;
  mainRole: string;
  secondaryRole: string;
  mainHeroes: string[];
  currentRank: string;
  highestRank: string;
  team: string;
  status: string; // Active, Inactive, Trial, Suspended, Left
  lifecycleStatus?: "Active" | "Archived";
  archivedAt?: string;
  archivedReason?: string;
  bannerId: string;
  profileImageSrc?: string;
  joinedAt?: string;
  notes?: string;
}

export interface Team {
  id: string;
  name: string;
  createdAt: string;
  isDefault?: boolean;
  archivedAt?: string;
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
  imageSrc?: string;
  imageName?: string;
  likedBy?: string[];
  savedBy?: string[];
  comments?: AnnouncementComment[];
  deletedAt?: string;
  deletedBy?: string;
}

export interface AnnouncementComment {
  id: string;
  author: string;
  message: string;
  createdAt: string;
  editedAt?: string;
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

export type RankStatus =
  | "Unranked"
  | "Grandmaster"
  | "Epic"
  | "Legend"
  | "Mythic"
  | "Mythical Honor"
  | "Mythical Glory"
  | "Mythical Immortal"
  | "Mythic Placement";

export type RpSourceType =
  | "Royal FunFest"
  | "Customs"
  | "Supreme Titles"
  | "Active Points"
  | "Mythic Stars"
  | "Manual Adjustments"
  | "Starting Average for new members";

export interface Season {
  id: string;
  name: string;
  mlbbSeasonNumber: number;
  startDate: string;
  endDate?: string;
  isActive: boolean;
}

export interface RpTransaction {
  id: string;
  seasonId: string;
  memberId: string;
  sourceType: RpSourceType;
  amount: number;
  description: string;
  occurredAt: string;
  createdAt: string;
}

export interface RankHistory {
  id: string;
  seasonId: string;
  memberId: string;
  rankStatus: RankStatus;
  stars: number;
  recordedAt: string;
  createdAt: string;
}

export interface StrategyPlacement {
  id: string;
  heroId: string;
  heroName: string;
  xPercent: number;
  yPercent: number;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}
