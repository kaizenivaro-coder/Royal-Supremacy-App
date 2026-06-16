import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  MainHeroPickerDialog,
  ProfileIdentityDialog,
  ProfileLeaderboardStats,
  ProfileMainHeroesCard,
  ProfilePictureLightbox,
  filterMainHeroOptions,
} from "./Profile.tsx";
import { mockMembers } from "../data/mock.ts";

test("profile picture viewer exposes edit upload without legacy upload button copy", () => {
  const html = renderToStaticMarkup(
    React.createElement(ProfilePictureLightbox, {
      isOpen: true,
      imageSrc: "data:image/png;base64,abc",
      playerName: "King Choou",
      username: "kingchoou",
      imageError: "",
      onClose: () => undefined,
      onUpload: () => undefined,
    }),
  );

  assert.match(html, /Profile picture/);
  assert.match(html, /Edit profile picture/);
  assert.match(html, /type="file"/);
  assert.match(html, /accept="image\/png,image\/jpeg,image\/webp,image\/gif"/);
  assert.doesNotMatch(html, /Upload Profile Picture/i);
});

test("main hero picker renders searchable checklist with save action", () => {
  const html = renderToStaticMarkup(
    React.createElement(MainHeroPickerDialog, {
      isOpen: true,
      selectedHeroes: ["Chou"],
      onClose: () => undefined,
      onSave: () => undefined,
    }),
  );

  assert.match(html, /Main Heroes/);
  assert.match(html, /Search heroes/);
  assert.match(html, /Chou/);
  assert.match(html, /role="checkbox"/);
  assert.match(html, /aria-checked="true"/);
  assert.match(html, /Save Main Heroes/);
  assert.doesNotMatch(html, /Signature Heroes/i);
});

test("main hero picker avoids hidden native checkboxes that scroll the modal card", () => {
  const html = renderToStaticMarkup(
    React.createElement(MainHeroPickerDialog, {
      isOpen: true,
      selectedHeroes: ["Chou"],
      onClose: () => undefined,
      onSave: () => undefined,
    }),
  );

  assert.doesNotMatch(html, /type="checkbox"/);
  assert.doesNotMatch(html, /class="sr-only"/);
});

test("identity dialog uses a shorter title and contains profile fields", () => {
  const html = renderToStaticMarkup(
    React.createElement(ProfileIdentityDialog, {
      isOpen: true,
      formData: mockMembers[0],
      authUsername: "kingchoou",
      accountEmail: "",
      newPassword: "",
      accountError: "",
      showSuccess: false,
      isSaving: false,
      onClose: () => undefined,
      onSubmit: () => undefined,
      onInputChange: () => undefined,
      onAccountEmailChange: () => undefined,
      onNewPasswordChange: () => undefined,
    }),
  );

  assert.match(html, /Identity/);
  assert.match(html, /Operator Handle/);
  assert.match(html, /Current Rank/);
  assert.match(html, /Save Profile/);
  assert.doesNotMatch(html, /Choose Main Heroes/);
  assert.doesNotMatch(html, /Main Heroes/);
  assert.doesNotMatch(html, /Identity Configuration/);
});

test("main heroes card is separate from identity and opens the picker", () => {
  const html = renderToStaticMarkup(
    React.createElement(ProfileMainHeroesCard, {
      heroes: ["Chou", "Gatotkaca", "Yu Zhong"],
      onOpen: () => undefined,
    }),
  );

  assert.match(html, /Heroes/);
  assert.match(html, /Main Heroes/);
  assert.match(html, /3 selected/);
  assert.match(html, /Choose Main Heroes/);
  assert.match(html, /Chou/);
  assert.match(html, /Gatotkaca/);
  assert.match(html, /Yu Zhong/);
});

test("profile leaderboard stats show RP, Mythic position, and star chart", () => {
  const html = renderToStaticMarkup(
    React.createElement(ProfileLeaderboardStats, {
      currentRp: 388,
      rpRank: 6,
      mythicStars: 57,
      mythicRankPosition: 6,
      history: [
        { recordedAt: "2026-05-26T00:00:00.000Z", stars: 49 },
        { recordedAt: "2026-05-27T00:00:00.000Z", stars: 54 },
        { recordedAt: "2026-05-28T00:00:00.000Z", stars: 57 },
      ],
      historyRangeDays: 7,
      onHistoryRangeChange: () => undefined,
      seasons: [{ id: "mlbb_season_40", name: "MLBB Season 40" }],
      selectedSeasonId: "mlbb_season_40",
      onSelectedSeasonChange: () => undefined,
    }),
  );

  assert.match(html, /Current RP/);
  assert.match(html, /RP Rank/);
  assert.match(html, /Current Mythic Stars/);
  assert.match(html, /Mythic Rank Position/);
  assert.match(html, /Mythic Star History/);
  assert.match(html, /7D/);
  assert.match(html, /14D/);
  assert.match(html, /30D/);
  assert.match(html, /60D/);
  assert.match(html, /90D/);
  assert.match(html, /MLBB Season 40/);
  assert.match(html, /<svg/);
});

test("profile leaderboard stats shows an empty state when selected range has no records", () => {
  const html = renderToStaticMarkup(
    React.createElement(ProfileLeaderboardStats, {
      currentRp: 0,
      rpRank: null,
      mythicStars: 0,
      mythicRankPosition: null,
      history: [],
      historyRangeDays: 7,
      onHistoryRangeChange: () => undefined,
      seasons: [{ id: "mlbb_season_40", name: "MLBB Season 40" }],
      selectedSeasonId: "mlbb_season_40",
      onSelectedSeasonChange: () => undefined,
    }),
  );

  assert.match(html, /No rank records for this range/);
  assert.doesNotMatch(html, /<svg/);
});

test("filterMainHeroOptions matches hero names without requiring exact casing", () => {
  assert.deepEqual(
    filterMainHeroOptions("yu zhong").map((hero) => hero.name),
    ["Yu Zhong"],
  );
  assert.deepEqual(
    filterMainHeroOptions("x borg").map((hero) => hero.assetName),
    ["x_borg"],
  );
});
