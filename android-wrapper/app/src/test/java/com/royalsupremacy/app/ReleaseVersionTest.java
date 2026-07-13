package com.royalsupremacy.app;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

public class ReleaseVersionTest {
    @Test
    public void releaseVersionCodeMatchesV012() {
        assertEquals(3, BuildConfig.VERSION_CODE);
    }

    @Test
    public void releaseVersionNameMatchesV012() {
        assertEquals("0.1.2", BuildConfig.VERSION_NAME);
    }
}
