package com.royalsupremacy.app;

import java.net.URI;
import java.net.URISyntaxException;

public final class NavigationPolicy {
    public enum Destination {
        WEB_VIEW,
        EXTERNAL,
        BLOCKED
    }

    private NavigationPolicy() {
    }

    public static Destination destinationFor(String rawUrl, boolean isMainFrame) {
        if (AppUrlPolicy.isTrusted(rawUrl)) {
            return Destination.WEB_VIEW;
        }
        return isMainFrame && isValidHttpsUrl(rawUrl)
                ? Destination.EXTERNAL
                : Destination.BLOCKED;
    }

    public static boolean isTrackedTopLevelSslFailure(String sslErrorUrl, String trackedTopLevelUrl) {
        return sslErrorUrl != null
                && sslErrorUrl.equals(trackedTopLevelUrl)
                && AppUrlPolicy.isTrusted(trackedTopLevelUrl);
    }

    public static boolean shouldBlockMainFrameRequest(
            String rawUrl,
            boolean isMainFrame,
            String requestMethod) {
        // Origin admission is deliberately independent of GET, POST, or any other method.
        return isMainFrame && !AppUrlPolicy.isTrusted(rawUrl);
    }

    public static boolean shouldRejectTopLevelPageStart(String rawUrl) {
        return !AppUrlPolicy.isTrusted(rawUrl);
    }

    private static boolean isValidHttpsUrl(String rawUrl) {
        if (rawUrl == null) {
            return false;
        }

        try {
            URI uri = new URI(rawUrl);
            return "https".equalsIgnoreCase(uri.getScheme())
                    && uri.getHost() != null
                    && uri.getUserInfo() == null;
        } catch (URISyntaxException error) {
            return false;
        }
    }
}
