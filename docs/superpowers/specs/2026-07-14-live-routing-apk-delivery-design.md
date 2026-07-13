# Royal Supremacy Live Routing and APK Delivery Repair

## Problem

The deployed Codex Site serves the application shell at `/`, but direct requests to client routes such as `/auth` return HTTP 404. The Android wrapper initially loads `/`, then React routes to `/auth`; after Android restores the WebView state or the page reloads, it may request `/auth` directly and fail before React starts.

Gmail and ChatGPT attachment handling also reject or fail to preview APK files, so email attachment delivery is not a reliable installation path.

## Selected Design

Use hash-based client routing. The server will always receive `/`, while the active screen is represented after the URL fragment, such as `/#/auth` or `/#/profile`. Internal navigation remains controlled by React Router, and the existing Vite base path continues to control static assets for Codex Sites and GitHub Pages.

Keep the Android wrapper's trusted home URL at the live site root. Restored URLs containing a hash remain root requests at the network layer, preventing deep-route 404 failures without weakening the wrapper's navigation restrictions.

Publish the signed APK as a versioned GitHub Release asset in the existing public Royal Supremacy repository. This provides a stable HTTPS download link, version history, and integrity metadata without relying on Gmail attachments or Google Play.

## Code Changes

- Replace `BrowserRouter` with `HashRouter` and remove the path basename that does not apply to fragment routes.
- Replace direct browser navigation to `/auth` with hash-safe routing behavior.
- Add routing-policy tests that verify all app screens resolve through the root document URL.
- Preserve the current Android URL allowlist, SSL handling, file chooser protections, package ID, signing identity, and official Royal Supremacy launcher icon.
- Increment the Android patch version only if the routing repair requires a new APK build.

## Validation

- Run the focused routing tests and Android unit tests.
- Run the complete web test, type-check, and production build.
- Verify the live root and `/#/auth` return the application successfully from a clean, unauthenticated request.
- Verify login navigation, refresh, and Android WebView state restoration no longer request `/auth` from the server.
- Inspect the signed APK metadata and checksum before publishing it.
- Download the GitHub Release asset through its public link and confirm its checksum matches the locally verified APK.

## Deployment

Deploy the validated web build to the existing public Codex Sites project. Then publish the signed APK to the existing GitHub repository as a release asset and provide the direct release download page to the user.

## Out of Scope

This repair does not redesign the application, change Royal Supremacy data, modify account credentials, or publish to Google Play.
