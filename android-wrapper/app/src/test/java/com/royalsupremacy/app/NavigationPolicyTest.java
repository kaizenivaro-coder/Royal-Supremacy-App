package com.royalsupremacy.app;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public class NavigationPolicyTest {
    @Test
    public void keepsTrustedSiteNavigationInTheWebView() {
        assertEquals(NavigationPolicy.Destination.WEB_VIEW, NavigationPolicy.destinationFor(
                "https://royal-supremacy-app.kaizenivaro.chatgpt.site/profile", true));
    }

    @Test
    public void opensOnlyValidExternalHttpsTopLevelNavigations() {
        assertEquals(NavigationPolicy.Destination.EXTERNAL, NavigationPolicy.destinationFor(
                "https://support.example/help", true));
        assertEquals(NavigationPolicy.Destination.BLOCKED, NavigationPolicy.destinationFor(
                "https://support.example/asset.js", false));
        assertEquals(NavigationPolicy.Destination.BLOCKED, NavigationPolicy.destinationFor(
                "http://support.example", true));
        assertEquals(NavigationPolicy.Destination.BLOCKED, NavigationPolicy.destinationFor(
                "https:///missing-host", true));
    }

    @Test
    public void onlyShowsOfflineStateForTheCurrentTrustedPageSslFailure() {
        String activePage = "https://royal-supremacy-app.kaizenivaro.chatgpt.site/profile";

        assertTrue(NavigationPolicy.isActiveTopLevelSslFailure(activePage, activePage));
        assertFalse(NavigationPolicy.isActiveTopLevelSslFailure(
                "https://cdn.example/script.js", activePage));
        assertFalse(NavigationPolicy.isActiveTopLevelSslFailure(
                "https://royal-supremacy-app.kaizenivaro.chatgpt.site/other", activePage));
    }
}
