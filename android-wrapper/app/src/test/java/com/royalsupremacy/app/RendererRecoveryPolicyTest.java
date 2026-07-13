package com.royalsupremacy.app;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

public class RendererRecoveryPolicyTest {
    @Test
    public void showsRecoveryStateWhenTheRendererCrashed() {
        assertEquals(RendererRecoveryPolicy.Action.SHOW_RECOVERY,
                RendererRecoveryPolicy.actionFor(true, false));
    }

    @Test
    public void reloadsOnlyTheFirstNonCrashRendererReclamation() {
        assertEquals(RendererRecoveryPolicy.Action.RELOAD,
                RendererRecoveryPolicy.actionFor(false, false));
        assertEquals(RendererRecoveryPolicy.Action.SHOW_RECOVERY,
                RendererRecoveryPolicy.actionFor(false, true));
    }

    @Test
    public void reloadsTheLastTrustedPageOrHome() {
        String trustedPage = "https://royal-supremacy-app.kaizenivaro.chatgpt.site/strategy";

        assertEquals(AppUrlPolicy.HOME_URL + "/#/strategy",
                RendererRecoveryPolicy.reloadUrl(trustedPage));
        assertEquals(AppUrlPolicy.HOME_URL, RendererRecoveryPolicy.reloadUrl("https://evil.example"));
    }
}
