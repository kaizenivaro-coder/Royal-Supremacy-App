package com.royalsupremacy.app;

import java.net.URI;
import java.net.URISyntaxException;

public final class AppUrlPolicy {
    public static final String HOME_URL = "https://royal-supremacy-app.kaizenivaro.chatgpt.site";
    private static final String TRUSTED_HOST = "royal-supremacy-app.kaizenivaro.chatgpt.site";

    private AppUrlPolicy() {
    }

    public static String canonicalize(String rawUrl) {
        if (!isTrusted(rawUrl)) {
            return HOME_URL;
        }

        try {
            URI uri = new URI(rawUrl);
            String path = uri.getRawPath();
            String query = uri.getRawQuery();
            String fragment = uri.getRawFragment();
            boolean isRoot = path == null || path.isEmpty() || "/".equals(path);

            if (isRoot && query == null) {
                return fragment == null ? HOME_URL : HOME_URL + "/#" + fragment;
            }

            StringBuilder canonicalUrl = new StringBuilder(HOME_URL)
                    .append("/#")
                    .append(isRoot ? "/" : path);
            if (query != null) {
                canonicalUrl.append('?').append(query);
            }
            if (fragment != null) {
                canonicalUrl.append('#').append(fragment);
            }
            return canonicalUrl.toString();
        } catch (URISyntaxException error) {
            return HOME_URL;
        }
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
