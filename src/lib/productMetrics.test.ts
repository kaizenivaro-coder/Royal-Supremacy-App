import assert from "node:assert/strict";
import test from "node:test";
import { getProductMetrics } from "./productMetrics.ts";

test("counts approved accounts and active or archived roster members separately", () => {
  const metrics = getProductMetrics({
    accounts: [{ id: "auth_kingchoou" }],
    members: [
      { id: "king", status: "Active", authUserId: "auth_kingchoou" },
      { id: "void", status: "Active" },
      { id: "trial", status: "Trial", lifecycleStatus: "Active" },
      { id: "former", status: "Left", lifecycleStatus: "Archived" },
    ],
    pendingAccountRequests: [{ id: "request_1" }],
  });

  assert.deepEqual(metrics, {
    approvedAccountCount: 1,
    activeRosterCount: 3,
    archivedRosterCount: 1,
    pendingAccountCount: 1,
  });
});
