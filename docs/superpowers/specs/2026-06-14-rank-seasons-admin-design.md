# Royal Supremacy Rank, Seasons, Members, and Teams Design

Date: 2026-06-14

## Goal

Extend the current local-first Royal Supremacy MVP with better rank history, season reset behavior, admin rank management, safer member registration, archived member handling, and editable teams. The work must preserve the existing black/navy/gold MLBB-inspired UI and remain easy to migrate to Supabase later.

## Confirmed Decisions

- Use a local-first implementation now.
- Season reset closes the current season and creates a new active season.
- Season 40 data must remain stored and viewable later by each member and by admins.
- Kicking a member archives them instead of hard-deleting them, so their historical season data remains viewable.
- Rank Command should be separate from RP Command.
- Admin should be able to save the correct ranks for the squad once per day.

## Data Model

### Season

Extend `Season` with:

- `mlbbSeasonNumber: number`
- `startDate: string`
- `endDate?: string`
- `isActive: boolean`

The current active season should represent Mobile Legends Season 40. A reset will mark Season 40 inactive, set its `endDate`, and create Season 41 as active.

### Member

Extend `Member` with:

- `lifecycleStatus: "Active" | "Archived"`
- `archivedAt?: string`
- `archivedReason?: string`

Archived members stay in local storage and remain available in historical admin/member views. They are excluded from active team assignment, normal active leaderboards, and routine admin rank updates unless an admin explicitly opens archived history.

### Team

Introduce a new editable `Team` type:

- `id: string`
- `name: string`
- `createdAt: string`
- `isDefault?: boolean`
- `archivedAt?: string`

Default teams:

- Royal Supremacy Team A
- Royal Supremacy Team B
- Royal Valor Team A
- Royal Valor Team B
- Unassigned

Deleting a team should archive the team record and move active members from that team to `Unassigned`. `Unassigned` cannot be deleted.

### RankHistory

Keep the existing season-scoped `RankHistory` structure. Rank saves append new records rather than replacing older records. The profile chart and historical views filter by `seasonId`.

### RpTransaction

Keep the existing season-scoped RP transaction model. Season reset must not delete old RP transactions.

## Admin Portal Design

### Navigation

Split the current `RP Command` area into:

- `RP Command`: RP gain/loss transactions and RP source summaries.
- `Rank Command`: rank updates, rank history count, season reset, and current active season controls.

This avoids mixing two different admin jobs.

### Rank Command

Rank Command contains:

- Active season summary, for example `MLBB Season 40`.
- Button: `Update Squad Ranks`.
- Button: `Reset Season`.
- Recent rank update summary.

`Update Squad Ranks` opens the existing focused modal card style:

- Blurred dark backdrop.
- Smooth ease-in/ease-out animation.
- Top-left back arrow.
- Scroll-locked background.
- Mobile-friendly height.

The modal lists every active member. Each row includes:

- Player name and username.
- Rank dropdown with accepted rank values.
- Stars input only when the chosen rank is Mythic or above.
- Non-star ranks save 0 stars.

Saving appends one `RankHistory` record per active member for the active season. It also updates each active member's visible `currentRank`. Mythic star RP transaction deltas can continue using the current existing logic.

### Season Reset

Season reset is an admin-only action with a confirmation step. It should say clearly that old season data will be preserved.

Reset behavior:

- Close the active season by setting `isActive: false` and `endDate`.
- Create the next MLBB season as active.
- Reset every active member's `currentRank` to `Epic`.
- Set active members' current-season stars to 0 by creating initial rank records in the new season.
- Do not delete old rank history.
- Do not delete old RP transactions.
- Do not delete archived members.

The app should later allow users/admins to select older seasons in history views.

## Profile Chart Design

The `Mythic Star History` card should become more useful without becoming crowded.

Controls:

- Segmented range selector: `7D`, `14D`, `30D`, `60D`, `90D`
- Season selector when past seasons exist.

Chart behavior:

- Default range is last 7 days.
- Chart reads only records for the selected season.
- It renders as many data points as exist within the selected range.
- If there is only one point, show one highlighted point plus a flat guide line.
- If there are no points, show a polished empty state: `No rank records for this range`.

The chart remains a real UI component, not a generated image.

## Register Member Design

The current register form has risky free-text fields. Replace them with controlled inputs:

- Current Rank: dropdown using accepted rank values.
- Highest Rank: dropdown using accepted rank values.
- Main Heroes: use the same focused hero picker card pattern from Profile.

The register form stores selected heroes as an array, not comma-separated text.

For a new member:

- Create member profile.
- Assign selected team from editable team list.
- Create an initial active-season rank history record using the selected current rank and star count.
- If the member is Mythic or above, allow starting stars.
- If the member is below Mythic, stars are 0.

## Member Archive and Kick Design

Add an admin action: `Archive Member` or `Kick Member`.

Behavior:

- Set `lifecycleStatus` to `Archived`.
- Set `status` to `Left` or `Archived`.
- Store `archivedAt` and optional reason.
- Move the member out of active team assignment.
- Preserve rank history and RP transactions.
- Hide archived members from active leaderboards by default.
- Add an admin filter to view archived members.

This is safer than deleting because old season charts and standings stay correct.

## Editable Teams Design

Add team management to Admin Portal under `Members & Teams`.

Features:

- Create team by name.
- Archive/delete team.
- Default `Unassigned` team is protected.
- If a team is archived, active members in that team move to `Unassigned`.
- Team assignment dropdowns read from the editable team list.

For Supabase later, this maps cleanly to a `teams` table.

## Data Flow

Profile:

- Reads active member.
- Reads selected season.
- Filters `rankHistory` by `memberId`, `seasonId`, and selected time range.
- Builds chart points from filtered data.

Admin Rank Command:

- Reads active members.
- Reads latest rank by active season.
- Saves rank updates through store action.
- Store appends `RankHistory`.
- Store updates member `currentRank`.
- Store optionally appends Mythic Stars RP transaction delta.

Season Reset:

- Store closes active season.
- Store creates new active season.
- Store appends Epic rank records for active members in new season.
- Profile and leaderboard automatically read the new active season.

Teams:

- Store owns editable team list.
- Admin modifies teams through store actions.
- Member team assignment reads editable teams.

## Error Handling

- Rank Command rejects save when user is not admin.
- Season reset rejects when user is not admin.
- Team delete rejects protected `Unassigned`.
- Team create rejects empty or duplicate names.
- Archive member rejects missing member id.
- Register member rejects duplicate username.
- Hero picker can save an empty list, but selected heroes must always be stored as an array.
- Rank stars are clamped to whole numbers greater than or equal to 0.

## Testing Plan

Unit tests:

- Chart range filtering returns only selected season and selected date range.
- Season reset closes old season, creates next season, and resets active ranks to Epic.
- Season reset preserves old rank history and RP transactions.
- Archived members are excluded from active leaderboards by default.
- Archived member data remains available for historical lookups.
- Rank Command appends rank history records.
- Register Member uses rank dropdown values and selected hero array.
- Editable team create/delete logic works.
- Deleting a team moves members to Unassigned.
- Protected Unassigned team cannot be deleted.

App checks:

- `npm test`
- `npm run lint`
- `npm run build`

Browser QA:

- Profile chart range selector on desktop and mobile.
- Admin Rank Command modal.
- Admin season reset confirmation.
- Register Member hero picker.
- Editable teams create/delete.
- Archive member flow.

## Out of Scope

- Supabase table creation.
- Production authentication enforcement.
- Push notifications.
- Exporting historical reports.
- AI-generated charts or images.

## Implementation Order

1. Add data types and store actions.
2. Add chart filtering and profile UI controls.
3. Add Rank Command admin tab.
4. Add season reset flow.
5. Improve Register Member inputs and hero picker.
6. Add archived member flow.
7. Add editable team management.
8. Add tests and browser QA.
