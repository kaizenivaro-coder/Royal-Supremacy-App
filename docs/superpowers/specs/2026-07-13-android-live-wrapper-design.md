# Royal Supremacy Android Live Wrapper Design

## Objective

Package Royal Supremacy as an installable Android APK that always loads the
latest deployment from Codex Sites:

`https://royal-supremacy-app.kaizenivaro.chatgpt.site`

The website remains the product source of truth. Publishing a new version to
the same Codex Sites address updates what Android users see without rebuilding
the APK.

## Architecture

- Create a small native Android WebView shell inside this repository.
- Use application ID `com.royalsupremacy.app` and display name
  `Royal Supremacy`.
- Permit navigation only to the Royal Supremacy Codex Sites origin. Open other
  HTTPS links in the device browser.
- Require HTTPS and disable cleartext network traffic.
- Enable JavaScript, DOM storage, cookies, and file selection so the existing
  authentication, profile uploads, Supabase access, and strategy tools work.
- Keep browser storage inside the Android app sandbox. Login data is therefore
  device-specific and is not bundled into the APK.
- Use Android system back navigation for website history before closing the
  app.
- Allow device rotation so the strategy room can be used in landscape while
  the rest of the responsive site remains comfortable in portrait.

## Loading And Failure States

- Show the existing Royal Supremacy branding while the first page loads.
- Display a local offline screen when the Codex Sites deployment cannot be
  reached, with a single Retry action.
- Preserve the current web page across ordinary Android lifecycle changes when
  possible.
- Never fall back to an unrelated URL or an insecure connection.

## Distribution

- Produce an installable debug APK for direct sideload testing.
- This first APK is not a Play Store release. A future store release will need
  a durable release signing key, store listing assets, privacy disclosures, and
  Play Console review.
- Email the APK to `kaizenivaro@gmail.com`. If Gmail rejects the attachment due
  to size or executable-file rules, upload the APK to a shareable delivery
  location and email the download link instead.

## Verification

- Build the current web project and run its existing tests, lint, and build
  checks before creating the Android package.
- Build the Android APK with a modern JDK and Android SDK.
- Inspect the APK metadata for the correct package ID, label, permissions, and
  target URL.
- Install and launch it on an emulator or connected Android device when one is
  available. Otherwise, verify the APK with Android build tools and clearly
  report that physical-device launch testing remains outstanding.
- Confirm login fields start empty on a fresh app install and that the remote
  site loads from the Codex Sites origin.

## Scope Boundaries

- No live website deployment is included in this packaging task.
- No Supabase schema changes are required.
- No native push notifications, camera integration, or Play Store submission
  are included in this first APK.
