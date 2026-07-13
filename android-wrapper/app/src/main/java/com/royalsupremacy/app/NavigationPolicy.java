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

    public static boolean isActiveTopLevelSslFailure(String sslErrorUrl, String activeUrl) {
        return sslErrorUrl != null
                && sslErrorUrl.equals(activeUrl)
                && AppUrlPolicy.isTrusted(activeUrl);
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
