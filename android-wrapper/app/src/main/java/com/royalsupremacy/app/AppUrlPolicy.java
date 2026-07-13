package com.royalsupremacy.app;

import java.net.URI;
import java.net.URISyntaxException;

public final class AppUrlPolicy {
    public static final String HOME_URL = "https://royal-supremacy-app.kaizenivaro.chatgpt.site";
    private static final String TRUSTED_HOST = "royal-supremacy-app.kaizenivaro.chatgpt.site";

    private AppUrlPolicy() {
    }

    public static boolean isTrusted(String rawUrl) {
        if (rawUrl == null) {
            return false;
        }

        try {
            URI uri = new URI(rawUrl);
            int port = uri.getPort();
            return "https".equalsIgnoreCase(uri.getScheme())
                    && TRUSTED_HOST.equalsIgnoreCase(uri.getHost())
                    && uri.getUserInfo() == null
                    && (port == -1 || port == 443);
        } catch (URISyntaxException error) {
            return false;
        }
    }
}
