package com.royalsupremacy.app;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public class AppUrlPolicyTest {
    @Test
    public void canonicalizesRootToHome() {
        assertEquals(AppUrlPolicy.HOME_URL,
                AppUrlPolicy.canonicalize(AppUrlPolicy.HOME_URL));
        assertEquals(AppUrlPolicy.HOME_URL,
                AppUrlPolicy.canonicalize(AppUrlPolicy.HOME_URL + "/"));
    }

    @Test
    public void preservesExistingHashRoutes() {
        String authRoute = AppUrlPolicy.HOME_URL + "/#/auth";

        assertEquals(authRoute, AppUrlPolicy.canonicalize(authRoute));
    }

    @Test
    public void movesTrustedLegacyPathsBehindTheRootHash() {
        assertEquals(
                AppUrlPolicy.HOME_URL + "/#/profile?tab=rank#history",
                AppUrlPolicy.canonicalize(
                        AppUrlPolicy.HOME_URL + "/profile?tab=rank#history"));
    }

    @Test
    public void canonicalizesUntrustedNullOrMalformedAddressesToHome() {
        assertEquals(AppUrlPolicy.HOME_URL,
                AppUrlPolicy.canonicalize("https://evil.example/profile"));
        assertEquals(AppUrlPolicy.HOME_URL,
                AppUrlPolicy.canonicalize(
                        "https://attacker@royal-supremacy-app.kaizenivaro.chatgpt.site/profile"));
        assertEquals(AppUrlPolicy.HOME_URL,
                AppUrlPolicy.canonicalize(
                        "https://royal-supremacy-app.kaizenivaro.chatgpt.site:444/profile"));
        assertEquals(AppUrlPolicy.HOME_URL, AppUrlPolicy.canonicalize("not a url"));
        assertEquals(AppUrlPolicy.HOME_URL, AppUrlPolicy.canonicalize(null));
    }

    @Test
    public void acceptsTrustedHttpsRoutesQueriesAndFragments() {
        assertTrue(AppUrlPolicy.isTrusted(
                "https://royal-supremacy-app.kaizenivaro.chatgpt.site"));
        assertTrue(AppUrlPolicy.isTrusted(
                "https://royal-supremacy-app.kaizenivaro.chatgpt.site/profile?tab=rank#history"));
        assertTrue(AppUrlPolicy.isTrusted(
                "https://ROYAL-SUPREMACY-APP.KAIZENIVARO.CHATGPT.SITE:443/strategy"));
    }

    @Test
    public void rejectsUntrustedOrMalformedAddresses() {
        assertFalse(AppUrlPolicy.isTrusted(
                "http://royal-supremacy-app.kaizenivaro.chatgpt.site"));
        assertFalse(AppUrlPolicy.isTrusted("https://evil.example"));
        assertFalse(AppUrlPolicy.isTrusted(
                "https://royal-supremacy-app.kaizenivaro.chatgpt.site.evil.example"));
        assertFalse(AppUrlPolicy.isTrusted(
                "https://attacker@royal-supremacy-app.kaizenivaro.chatgpt.site"));
        assertFalse(AppUrlPolicy.isTrusted(
                "https://royal-supremacy-app.kaizenivaro.chatgpt.site:444"));
        assertFalse(AppUrlPolicy.isTrusted("not a url"));
        assertFalse(AppUrlPolicy.isTrusted(null));
    }
}
