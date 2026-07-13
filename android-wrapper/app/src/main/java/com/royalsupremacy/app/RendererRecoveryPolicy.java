package com.royalsupremacy.app;

public final class RendererRecoveryPolicy {
    public enum Action {
        RELOAD,
        SHOW_RECOVERY
    }

    private RendererRecoveryPolicy() {
    }

    public static Action actionFor(boolean didCrash, boolean recoveryReloadAlreadyAttempted) {
        return didCrash || recoveryReloadAlreadyAttempted
                ? Action.SHOW_RECOVERY
                : Action.RELOAD;
    }

    public static String reloadUrl(String lastTrustedUrl) {
        return AppUrlPolicy.canonicalize(lastTrustedUrl);
    }
}
