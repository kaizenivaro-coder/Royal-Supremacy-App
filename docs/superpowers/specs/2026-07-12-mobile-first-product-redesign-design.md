# Royal Supremacy Mobile-First Product Redesign

Date: 2026-07-12
Status: Approved design direction

## Objective

Transform the existing Royal Supremacy MVP into a coherent, premium, mobile-first MLBB squad companion. The app must feel trustworthy, fast, intentional, and suitable for everyday squad use on a phone while retaining an efficient desktop workspace for administrators.

This is a redesign of the existing product, not a replacement. Working domain systems and assets remain in place unless they conflict with the requirements below.

## Product Principles

1. Mobile member experience comes first. Desktop is the secondary surface and is optimized particularly for administration.
2. Data shown to users must be truthful. Registered accounts, roster members, active members, archived members, and pending applicants are distinct concepts.
3. Every screen must prioritize the user's immediate task. Decorative treatment supports hierarchy instead of competing with it.
4. Black, navy, gold, and restrained electric blue remain the Royal Supremacy visual language. Gold is reserved for priority actions, selected states, and elite emphasis.
5. Motion communicates state changes. It must remain smooth, short, interruptible, and compatible with reduced-motion preferences.
6. Touch targets, typography, contrast, focus states, and semantic controls must meet modern accessibility expectations.
7. The app remains local-first in this redesign, but domain logic stays separated from storage so Supabase can replace persistence without rewriting screens.

## User Model And Data Truth

The application will distinguish these records:

- Account: credentials and access approval. KingChoou is currently the only approved account and is the owner administrator.
- Roster member: an MLBB squad member who can exist before receiving an account.
- Active member: a roster member currently participating in the squad.
- Archived member: a former member retained for historical rank, RP, season, and announcement records.
- Pending account request: an unapproved signup that cannot enter the protected app.

Dashboard account metrics must count approved accounts. Squad metrics must count active roster members and be labelled explicitly. No screen may present seeded roster records as registered users.

Tryouts are retired. Their route becomes a neutral paused/removed destination for old links during migration, but Tryouts state, visible copy, mock content, controls, and active navigation are removed from the current product.

## Information Architecture

### Mobile

The persistent bottom navigation contains:

- Home
- Teams
- Strategy
- Decrees
- Profile

Leaderboard, notifications, admin access, settings, and sign out live in a More sheet opened from the top app bar or profile. Strategy may temporarily hide the standard shell when entering its immersive map workspace, but it always exposes a clear exit control.

Admin Portal is visible only to the owner/admin account. Ordinary members never see disabled or inaccessible admin navigation.

### Desktop

Desktop retains a fixed collapsible sidebar with readable icon labels. Member routes follow the same order as mobile. Admin Portal uses a dense workspace layout with a local secondary navigation instead of horizontally overflowing tabs.

## Shared Mobile Shell

The shell provides:

- Compact top app bar with squad logo, contextual page title, notification access, and More.
- Safe-area-aware bottom navigation with stable dimensions and labels.
- Consistent content gutters and maximum widths.
- Route transitions using a restrained fade and short vertical movement.
- Reusable page header, section header, empty state, feedback banner, loading skeleton, error state, modal, bottom sheet, confirmation dialog, and toast.
- Scroll restoration per route and body scroll locking for modal/sheet states.

Mobile drawers are reserved for secondary detail, not primary navigation. Desktop dialogs may be centered; mobile editing flows prefer bottom sheets or full-height focused panels depending on content length.

## Visual System

- Background: near-black with subtle navy depth, never a flat field of identical cards.
- Surfaces: two navy elevation levels with restrained borders.
- Gold: primary action, selected state, rank-one emphasis, and important status only.
- Electric blue: informational highlight, focus ring, live/presence state, and motion path accents.
- Typography: display serif for major section identity; clear sans serif for UI, body text, numbers, and controls.
- Cards: maximum 8px radius unless a circular control is expected. Avoid decorative cut corners except on a small number of primary gold command buttons.
- Effects: controlled glow, image overlays, and short transitions. No permanent animation that distracts from reading or strategy work.

Small uppercase labels must remain readable on phones. Important values cannot be truncated when a wrapping or stacked arrangement can preserve them.

## Screen Designs

### Authentication

Keep the full-bleed Royal Supremacy artwork and translucent access panel. Optimize the form for mobile keyboard use and password managers without pre-populating shared credentials. Include clear pending-review, rejected, wrong-password, offline, and unavailable-storage states. Passwords are never displayed after signup; the confirmation reminds users of their username and asks them to store their password securely.

### Home

Replace the MVP hero block with a compact personalized command view:

- Greeting and current squad status.
- Current rank, Mythic stars, RP, and team assignment in one scan-friendly band.
- Primary actions: notify squad, read latest decree, open strategy.
- Latest decree preview.
- Recent squad activity and notifications.

Home must not duplicate Profile. It summarizes current state and directs action.

### Profile

Use one cohesive identity surface with a large darkened banner, profile image, handle, team, rank, and status. Below it, show compact performance history and editable sections.

- Profile picture opens full-screen and exposes upload through an edit icon.
- Identity editing becomes a mobile-focused sheet with grouped Account, MLBB, Roles, and Ranks sections.
- Main Heroes remains a separate searchable selector.
- Mythic history shows useful axis labels, recorded dates, tooltips, range filters, season selector, and a purposeful empty state.
- Never leave a large empty desktop column beside small cards.

### Teams

Replace five simultaneous tall columns with team summaries and progressive disclosure.

- Mobile: stacked team cards with member count, role coverage, and expandable roster.
- Desktop: responsive two- or three-column grid of compact team panels.
- Unassigned appears first for admins and last for members unless it contains the current user.
- Member rows include profile image, name, role, rank, and status without truncating the name.
- Member details open in the shared focused sheet/dialog.

Only Admin Portal supports assignment changes.

### Leaderboard

Build a live competition view rather than a poster inside a page.

- Sticky segmented switch for RP and Mythic Stars.
- Compact season and last-updated context.
- Top three use distinctive podium treatment without oversized empty framing.
- Remaining entries use dense, readable rows with position change, member avatar, rank, score, and current-user highlight.
- Mobile keeps the current user visible through a pinned personal-rank summary.
- Placement and non-star ranks are separate compact groups.
- Dates derive from the latest relevant transaction/history record rather than a fixed seed date.

### Decrees

Keep the image-led social feed while refining information density:

- Clear Royal Supremacy publisher identity and live squad logo.
- Responsive image aspect ratios without awkward crops.
- Like, comment, and personal save states with optimistic feedback.
- Comments open in a focused sheet on mobile.
- Saved deleted announcements remain personal archive records until unsaved.
- Empty, loading, failed-image, and deleted-content states are explicit.

### Admin Portal

Desktop becomes the primary admin workspace; mobile remains complete but uses sheets and stacked forms.

- Left secondary navigation: Overview, Accounts, Roster, Teams, Ranks, RP, Decrees, Seasons, System.
- Overview reports approved accounts separately from active roster members.
- Replace browser confirmation prompts with branded confirmation dialogs that explain consequences.
- Long member/rank lists gain search, role/team/status filters, sticky save bars, dirty-state feedback, and unsaved-change protection.
- Batch rank updates support quick keyboard movement on desktop.
- Destructive actions require confirmation and preserve history when appropriate.
- Reset actions state exactly which data will be changed and which will be retained.

### Strategy Room

Preserve the immersive map as the primary canvas.

- Phone entry defaults to the immersive map and strongly supports landscape.
- Exit, private/public control, hero drawer, keyframes, playback, speed, and autosave status remain reachable without covering key map areas.
- Long-press and context-menu actions receive discoverable alternatives through a selected-hero action sheet.
- Add undo/redo history for placement, deletion, routes, team color, rename, duplication, and keyframe edits.
- Motion paths and direct movement routes remain distinct and visually labelled.
- Show a short first-use gesture coach that can be dismissed permanently.
- Public-room editing state clearly shows viewer/editor/admin permissions.

## Feature Recommendations

Included in the redesign where they support existing workflows:

- Notification inbox with unread state.
- Player availability/presence with explicit expiry.
- Saved strategy boards with names and updated timestamps.
- Search and filtering across roster, ranks, RP, and hero selection.
- Personal leaderboard position and movement.
- Autosave state and undo history in Strategy Room.
- First-use onboarding for navigation, Profile setup, and Strategy gestures.

Deferred until shared backend support is reliable:

- Push notifications.
- Real-time multi-user strategy editing.
- Chat/direct messages.
- Automated MLBB stat imports.
- Complex achievements or currency systems.

## Error Handling And Resilience

- Every persistence action returns success or actionable failure feedback.
- Optimistic updates roll back when persistence fails.
- Uploaded images validate type, size, and decode success before replacement.
- Missing hero/rank/squad assets show intentional fallbacks.
- Corrupt local state migrates or resets only the affected domain.
- Offline state never silently discards changes.
- Route-level error boundaries keep the navigation shell available.

## Accessibility And Interaction Standards

- Minimum touch target: 44 by 44 CSS pixels.
- Keyboard focus is visible and follows visual reading order.
- Dialogs trap focus, close through an explicit control, support Escape on desktop, restore focus, and lock background scrolling.
- Icon-only controls have accessible names and tooltips where meaning is unfamiliar.
- Text and controls meet WCAG AA contrast targets.
- Reduced-motion preference disables decorative and large spatial transitions.
- Drag-and-drop has click/tap alternatives.
- Status is never communicated only by color.

## Engineering Boundaries

- Separate account, roster, leaderboard, announcements, teams, and strategy domain logic from React views.
- Break oversized Admin, Profile, Strategy, and store modules into focused units while preserving behavior.
- Introduce no new global state library unless existing React context becomes a demonstrated blocker.
- Keep local persistence adapters behind interfaces compatible with a later Supabase implementation.
- Avoid large unrelated refactors outside the redesigned flows.

## Verification

Automated checks:

- Domain tests for account/roster truth, migrations, season calculations, permissions, archived records, optimistic rollback, and strategy history.
- Component tests for mobile navigation, dialogs, sheets, forms, empty/error states, and leaderboard freshness.
- Existing test, TypeScript, and production build checks remain mandatory.

Browser checks:

- Phone portrait: auth, Home, Profile, Teams, Leaderboard, Decrees, and mobile admin forms.
- Phone landscape: Strategy Room placement, dragging, context actions, paths, keyframes, playback, drawer, and exit.
- Desktop: all routes, admin workflows, collapsed/expanded sidebar, keyboard use, and long-list behavior.
- Verify no horizontal overflow, text clipping, inaccessible controls, background scroll behind overlays, stale counts, or misleading labels.

Real-device checks remain required for mobile keyboard behavior, orientation, touch dragging, long-press timing, safe areas, and fullscreen support.

## Delivery Sequence

1. Data truth, migrations, retired Tryouts cleanup, and shared feedback primitives.
2. Mobile/desktop application shell and navigation.
3. Home and Profile.
4. Teams and Leaderboard.
5. Decrees.
6. Admin Portal.
7. Strategy Room interaction and resilience pass.
8. Accessibility, responsive, performance, and cross-flow QA.

The live deployment remains untouched during this program. Work is performed and verified locally until the user explicitly approves a future release.
