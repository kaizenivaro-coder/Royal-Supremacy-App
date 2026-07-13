# Live Routing and APK Delivery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every Royal Supremacy screen reload safely from the public site and distribute the signed Android APK through a stable public download.

**Architecture:** Move React Router state into the URL fragment so the network always requests the deployable root document. Canonicalize any legacy direct-path URL before Android renderer recovery. Keep the existing Sites project, Android security policy, package identity, signing key, and live-data WebView architecture.

**Tech Stack:** React 19, React Router 7, TypeScript, Node test runner, Vite, Java 17, Android Gradle Plugin, Codex Sites, GitHub Releases

---

## File Structure

- Create `src/lib/appRouting.ts`: construct safe hash-route reload URLs without coupling UI components to URL syntax.
- Create `src/lib/appRouting.test.ts`: cover root-host and GitHub Pages hash URLs.
- Modify `src/App.tsx`: use `HashRouter` for all client screens.
- Modify `src/pages/Auth.tsx`: use the shared hash-route helper for the local account reset reload.
- Modify `android-wrapper/app/src/main/java/com/royalsupremacy/app/AppUrlPolicy.java`: canonicalize trusted legacy paths to root hash routes.
- Modify `android-wrapper/app/src/main/java/com/royalsupremacy/app/RendererRecoveryPolicy.java`: reload only canonical app URLs.
- Modify Android policy tests: prove trusted routes are preserved or converted and untrusted URLs fall back home.

### Task 1: Hash-safe web routing

**Files:**
- Create: `src/lib/appRouting.test.ts`
- Create: `src/lib/appRouting.ts`
- Modify: `src/App.tsx`
- Modify: `src/pages/Auth.tsx`

- [ ] **Step 1: Write the failing route helper tests**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { createHashRouteHref } from "./appRouting.ts";

test("creates an auth route without requesting a server-side auth path", () => {
  assert.equal(
    createHashRouteHref(
      { origin: "https://royal-supremacy-app.kaizenivaro.chatgpt.site", pathname: "/" },
      "/auth",
    ),
    "https://royal-supremacy-app.kaizenivaro.chatgpt.site/#/auth",
  );
});

test("preserves the GitHub Pages document base", () => {
  assert.equal(
    createHashRouteHref(
      { origin: "https://kaizenivaro-coder.github.io", pathname: "/Royal-Supremacy-App/" },
      "/profile?tab=rank",
    ),
    "https://kaizenivaro-coder.github.io/Royal-Supremacy-App/#/profile?tab=rank",
  );
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --import tsx --test src/lib/appRouting.test.ts`

Expected: FAIL because `src/lib/appRouting.ts` does not exist.

- [ ] **Step 3: Implement the hash route helper**

```ts
interface DocumentLocation {
  origin: string;
  pathname: string;
}

export function createHashRouteHref(location: DocumentLocation, route: string) {
  const documentPath = location.pathname.endsWith("/")
    ? location.pathname
    : `${location.pathname}/`;
  const normalizedRoute = route.startsWith("/") ? route : `/${route}`;
  return `${location.origin}${documentPath}#${normalizedRoute}`;
}
```

- [ ] **Step 4: Adopt `HashRouter` and the helper**

In `src/App.tsx`, replace the router import and wrapper:

```tsx
import { HashRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";

// ...

<HashRouter>
  <Routes>{/* existing routes remain unchanged */}</Routes>
</HashRouter>
```

Remove `routerBasename`. In `src/pages/Auth.tsx`, import `createHashRouteHref` and replace the local reset reload with:

```ts
window.location.replace(createHashRouteHref(window.location, "/auth"));
```

- [ ] **Step 5: Run the focused and complete web tests**

Run: `node --import tsx --test src/lib/appRouting.test.ts`

Expected: PASS.

Run: `npm test`

Expected: all tests PASS.

- [ ] **Step 6: Commit the web repair**

```bash
git add src/App.tsx src/pages/Auth.tsx src/lib/appRouting.ts src/lib/appRouting.test.ts
git commit -m "fix: make app routes reload safely"
```

### Task 2: Canonical Android recovery URLs

**Files:**
- Modify: `android-wrapper/app/src/test/java/com/royalsupremacy/app/AppUrlPolicyTest.java`
- Modify: `android-wrapper/app/src/test/java/com/royalsupremacy/app/RendererRecoveryPolicyTest.java`
- Modify: `android-wrapper/app/src/main/java/com/royalsupremacy/app/AppUrlPolicy.java`
- Modify: `android-wrapper/app/src/main/java/com/royalsupremacy/app/RendererRecoveryPolicy.java`

- [ ] **Step 1: Write failing canonicalization tests**

Add assertions that direct legacy paths become hash routes, existing hash routes stay unchanged, and untrusted URLs become the home URL:

```java
@Test
public void canonicalizesLegacyPathsWithoutChangingHashRoutes() {
    assertEquals(
            "https://royal-supremacy-app.kaizenivaro.chatgpt.site/#/profile?tab=rank#history",
            AppUrlPolicy.canonicalize(
                    "https://royal-supremacy-app.kaizenivaro.chatgpt.site/profile?tab=rank#history"));
    assertEquals(
            "https://royal-supremacy-app.kaizenivaro.chatgpt.site/#/auth",
            AppUrlPolicy.canonicalize(
                    "https://royal-supremacy-app.kaizenivaro.chatgpt.site/#/auth"));
    assertEquals(AppUrlPolicy.HOME_URL, AppUrlPolicy.canonicalize("https://evil.example/auth"));
}
```

Update `RendererRecoveryPolicyTest` so a legacy `/strategy` URL is expected to reload as `/#/strategy`.

- [ ] **Step 2: Run Android unit tests and verify RED**

Run from `android-wrapper`: `gradlew.bat test`

Expected: FAIL because `AppUrlPolicy.canonicalize` does not exist and renderer recovery returns the legacy path.

- [ ] **Step 3: Implement trusted URL canonicalization**

Add `AppUrlPolicy.canonicalize(String rawUrl)` using `URI`: reject untrusted input to `HOME_URL`; preserve root URLs whose fragment already starts with `/`; otherwise combine the direct path, query, and fragment behind `HOME_URL + "/#"`.

Update renderer recovery:

```java
public static String reloadUrl(String lastTrustedUrl) {
    return AppUrlPolicy.canonicalize(lastTrustedUrl);
}
```

- [ ] **Step 4: Run Android unit tests**

Run from `android-wrapper`: `gradlew.bat test`

Expected: all tests PASS.

- [ ] **Step 5: Commit Android recovery protection**

```bash
git add android-wrapper/app/src/main/java/com/royalsupremacy/app/AppUrlPolicy.java android-wrapper/app/src/main/java/com/royalsupremacy/app/RendererRecoveryPolicy.java android-wrapper/app/src/test/java/com/royalsupremacy/app/AppUrlPolicyTest.java android-wrapper/app/src/test/java/com/royalsupremacy/app/RendererRecoveryPolicyTest.java
git commit -m "fix: recover android sessions through app root"
```

### Task 3: Validate and deploy the live site

**Files:**
- Generated: `dist/**`

- [ ] **Step 1: Run full web validation**

Run: `npm test`

Run: `npm run lint`

Run: `npm run build`

Expected: every command exits 0 and `dist/server/index.js` plus `dist/client/index.html` exist.

- [ ] **Step 2: Commit the exact validated source if generated source changes exist**

Run: `git status --short`

Expected: clean working tree because `dist` is ignored; commit only tracked source changes if any remain.

- [ ] **Step 3: Publish to the existing Sites project**

Use `.openai/hosting.json` project `appgprj_6a519c7fd17c8191810138b579a59962`, push the exact commit to its Sites source repository, package the validated build with the Sites helper, save one version, deploy it publicly, and poll until the deployment reports `succeeded`.

- [ ] **Step 4: Verify public routing**

Request these URLs without browser credentials:

```text
https://royal-supremacy-app.kaizenivaro.chatgpt.site/
https://royal-supremacy-app.kaizenivaro.chatgpt.site/#/auth
```

Expected: both return HTTP 200 and the Royal Supremacy application shell. The hash URL's network pathname is `/`.

### Task 4: Publish and verify the signed APK download

**Files:**
- Existing artifact: `output/android/Royal-Supremacy-release.apk`

- [ ] **Step 1: Verify the release artifact**

Run the Android SDK `apksigner verify --verbose --print-certs output/android/Royal-Supremacy-release.apk`.

Expected: v1, v2, and v3 signature verification succeeds for package `com.royalsupremacy.app`.

Run: `Get-FileHash output/android/Royal-Supremacy-release.apk -Algorithm SHA256`

Record the exact checksum for the release notes.

- [ ] **Step 2: Confirm GitHub authentication and release availability**

Run: `gh auth status`

Run: `gh release view v0.1.1 --repo kaizenivaro-coder/Royal-Supremacy-App`

Expected: GitHub authentication succeeds. If `v0.1.1` does not exist, continue to creation; if it exists, upload only when the existing asset is absent or has a different checksum.

- [ ] **Step 3: Publish the APK as a release asset**

Create or update release `v0.1.1` with title `Royal Supremacy Android v0.1.1`, installation notes, package ID, minimum Android version, and SHA-256. Upload the APK under the stable filename `Royal-Supremacy-v0.1.1.apk`.

- [ ] **Step 4: Verify the public download**

Download the published asset to a temporary file, calculate SHA-256, and compare it with the local verified artifact.

Expected: checksums match exactly and the release page is publicly accessible.

- [ ] **Step 5: Final status check**

Run: `git status --short`

Expected: clean working tree. Report the live site URL, GitHub Release URL, Android version, and verified checksum.
