package com.royalsupremacy.app;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public class FileSelectionPolicyTest {
    @Test
    public void acceptsReadableGrantedContentUrisFromOtherAuthorities() {
        assertTrue(FileSelectionPolicy.isAcceptable(
                "content://com.android.providers.media.documents/document/image%3A42", true));
    }

    @Test
    public void rejectsUnsafeOrInaccessibleUris() {
        assertFalse(FileSelectionPolicy.isAcceptable("file:///sdcard/Pictures/avatar.png", true));
        assertFalse(FileSelectionPolicy.isAcceptable("https://example.com/avatar.png", true));
        assertFalse(FileSelectionPolicy.isAcceptable("content:///missing-authority", true));
        assertFalse(FileSelectionPolicy.isAcceptable("content://attacker@media/documents/42", true));
        assertFalse(FileSelectionPolicy.isAcceptable(
                "content://com.royalsupremacy.app.files/private/avatar.png", true));
        assertFalse(FileSelectionPolicy.isAcceptable(
                "content://com.android.providers.media.documents/document/image%3A42", false));
        assertFalse(FileSelectionPolicy.isAcceptable("not a uri", true));
        assertFalse(FileSelectionPolicy.isAcceptable(null, true));
    }
}
