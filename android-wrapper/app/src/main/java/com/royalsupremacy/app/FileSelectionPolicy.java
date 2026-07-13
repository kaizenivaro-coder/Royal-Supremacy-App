package com.royalsupremacy.app;

import java.net.URI;
import java.net.URISyntaxException;

public final class FileSelectionPolicy {
    private static final String APP_AUTHORITY_PREFIX = "com.royalsupremacy.app";

    private FileSelectionPolicy() {
    }

    public static boolean isAcceptable(String rawUri, boolean readAccessGranted) {
        if (rawUri == null || !readAccessGranted) {
            return false;
        }

        try {
            URI uri = new URI(rawUri);
            String authority = uri.getAuthority();
            return "content".equalsIgnoreCase(uri.getScheme())
                    && authority != null
                    && !authority.isEmpty()
                    && uri.getUserInfo() == null
                    && !isAppPrivateAuthority(authority);
        } catch (URISyntaxException error) {
            return false;
        }
    }

    private static boolean isAppPrivateAuthority(String authority) {
        return authority.equalsIgnoreCase(APP_AUTHORITY_PREFIX)
                || authority.regionMatches(
                true,
                0,
                APP_AUTHORITY_PREFIX + ".",
                0,
                APP_AUTHORITY_PREFIX.length() + 1);
    }
}
