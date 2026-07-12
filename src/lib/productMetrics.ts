type ProductMetricsInput = {
  accounts: { id: string }[];
  members: { id: string; status: string; authUserId?: string }[];
  pendingAccountRequests: { id: string }[];
};

export function getProductMetrics({
  accounts,
  members,
  pendingAccountRequests,
}: ProductMetricsInput) {
  return {
    approvedAccountCount: accounts.length,
    activeRosterCount: members.filter((member) => member.status === "Active").length,
    archivedRosterCount: members.filter((member) => member.status === "Archived").length,
    pendingAccountCount: pendingAccountRequests.length,
  };
}
