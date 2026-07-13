# Royal Supremacy Android Live Wrapper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce and deliver an installable Android APK that securely loads the latest Royal Supremacy Codex Sites deployment.

**Architecture:** Add a focused native Android WebView project under `android-wrapper/`. The Android shell owns secure navigation, device-local browser state, file uploads, back navigation, loading feedback, and an offline retry surface; the Codex Sites deployment remains the application UI and data client.

**Tech Stack:** Java 17, Android Gradle Plugin 8.8.2, Gradle 8.10.2, Android SDK 35, Android WebView, JUnit 4.

---

## File Map

- `android-wrapper/settings.gradle`: plugin and repository configuration.
- `android-wrapper/build.gradle`: Android application plugin version.
- `android-wrapper/gradle.properties`: deterministic Gradle defaults.
- `android-wrapper/app/build.gradle`: Android package, SDK, Java, and test settings.
- `android-wrapper/app/src/main/AndroidManifest.xml`: secure network and app metadata.
- `android-wrapper/app/src/main/java/com/royalsupremacy/app/AppUrlPolicy.java`: pure-Java trusted-origin policy.
- `android-wrapper/app/src/main/java/com/royalsupremacy/app/MainActivity.java`: WebView lifecycle and user interaction shell.
- `android-wrapper/app/src/main/res/layout/activity_main.xml`: WebView, loading indicator, and offline state.
- `android-wrapper/app/src/main/res/drawable/offline_panel.xml`: native offline-state panel.
- `android-wrapper/app/src/main/res/drawable/royal_mark.xml`: existing Royal Supremacy crown mark adapted from the repository favicon.
- `android-wrapper/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml`: adaptive app icon.
- `android-wrapper/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml`: round adaptive app icon.
- `android-wrapper/app/src/main/res/values/colors.xml`: black, navy, blue, and gold native colors.
- `android-wrapper/app/src/main/res/values/strings.xml`: app and offline-state copy.
- `android-wrapper/app/src/main/res/values/themes.xml`: edge-to-edge dark Android theme.
- `android-wrapper/app/src/test/java/com/royalsupremacy/app/AppUrlPolicyTest.java`: trusted-origin unit tests.
- `android-wrapper/README.md`: reproducible build and installation instructions.

### Task 1: Install The Local Android Build Toolchain

**Files:**
- Create: `%LOCALAPPDATA%/Android/Sdk/**` (tool-managed)
- Create: `%USERPROFILE%/.royal-supremacy-tools/gradle-8.10.2/**` (tool-managed)

- [ ] **Step 1: Install a supported JDK**

Run:

```powershell
winget install --id EclipseAdoptium.Temurin.17.JDK --exact --silent --accept-package-agreements --accept-source-agreements
```

Expected: Temurin JDK 17 is installed without replacing repository files.

- [ ] **Step 2: Download the official Android command-line tools**

Run:

```powershell
$sdkRoot = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
$download = Join-Path $env:TEMP 'commandlinetools-win-14742923_latest.zip'
$extract = Join-Path $env:TEMP 'royal-supremacy-android-tools'
Invoke-WebRequest 'https://dl.google.com/android/repository/commandlinetools-win-14742923_latest.zip' -OutFile $download
New-Item -ItemType Directory -Force -Path $extract | Out-Null
Expand-Archive -LiteralPath $download -DestinationPath $extract -Force
New-Item -ItemType Directory -Force -Path (Join-Path $sdkRoot 'cmdline-tools\latest') | Out-Null
Copy-Item -Path (Join-Path $extract 'cmdline-tools\*') -Destination (Join-Path $sdkRoot 'cmdline-tools\latest') -Recurse -Force
```

Expected: `sdkmanager.bat` exists under `%LOCALAPPDATA%\Android\Sdk\cmdline-tools\latest\bin`.

- [ ] **Step 3: Install the build SDK packages and accept licenses**

Run:

```powershell
$sdkRoot = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
$sdkManager = Join-Path $sdkRoot 'cmdline-tools\latest\bin\sdkmanager.bat'
$env:JAVA_HOME = (Get-ChildItem 'C:\Program Files\Eclipse Adoptium' -Directory | Sort-Object Name -Descending | Select-Object -First 1).FullName
1..20 | ForEach-Object { 'y' } | & $sdkManager --sdk_root=$sdkRoot --licenses
& $sdkManager --sdk_root=$sdkRoot 'platform-tools' 'platforms;android-35' 'build-tools;35.0.1'
```

Expected: all requested packages install and `adb.exe` plus `aapt2.exe` are present.

- [ ] **Step 4: Download Gradle 8.10.2**

Run:

```powershell
$toolRoot = Join-Path $env:USERPROFILE '.royal-supremacy-tools'
$gradleZip = Join-Path $env:TEMP 'gradle-8.10.2-bin.zip'
New-Item -ItemType Directory -Force -Path $toolRoot | Out-Null
Invoke-WebRequest 'https://services.gradle.org/distributions/gradle-8.10.2-bin.zip' -OutFile $gradleZip
Expand-Archive -LiteralPath $gradleZip -DestinationPath $toolRoot -Force
```

Expected: `%USERPROFILE%\.royal-supremacy-tools\gradle-8.10.2\bin\gradle.bat` exists.

### Task 2: Scaffold The Android Application And Test The URL Policy

**Files:**
- Create: `android-wrapper/settings.gradle`
- Create: `android-wrapper/build.gradle`
- Create: `android-wrapper/gradle.properties`
- Create: `android-wrapper/app/build.gradle`
- Create: `android-wrapper/app/src/test/java/com/royalsupremacy/app/AppUrlPolicyTest.java`
- Create: `android-wrapper/app/src/main/java/com/royalsupremacy/app/AppUrlPolicy.java`

- [ ] **Step 1: Create the Gradle project files**

Create `settings.gradle`:

```groovy
pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = 'RoyalSupremacyAndroid'
include ':app'
```

Create the root `build.gradle`:

```groovy
plugins {
    id 'com.android.application' version '8.8.2' apply false
}
```

Create `gradle.properties`:

```properties
org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.nonTransitiveRClass=true
```

Create `app/build.gradle`:

```groovy
plugins {
    id 'com.android.application'
}

android {
    namespace 'com.royalsupremacy.app'
    compileSdk 35

    defaultConfig {
        applicationId 'com.royalsupremacy.app'
        minSdk 26
        targetSdk 35
        versionCode 1
        versionName '0.1.0'
        testInstrumentationRunner 'android.test.InstrumentationTestRunner'
    }

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
}

dependencies {
    testImplementation 'junit:junit:4.13.2'
}
```

- [ ] **Step 2: Write the failing trusted-origin test**

Create `AppUrlPolicyTest.java`:

```java
package com.royalsupremacy.app;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public class AppUrlPolicyTest {
    @Test
    public void acceptsOnlyHttpsPagesOnTheRoyalSupremacySite() {
        assertTrue(AppUrlPolicy.isTrusted("https://royal-supremacy-app.kaizenivaro.chatgpt.site"));
        assertTrue(AppUrlPolicy.isTrusted("https://royal-supremacy-app.kaizenivaro.chatgpt.site/profile?tab=rank#history"));
        assertFalse(AppUrlPolicy.isTrusted("http://royal-supremacy-app.kaizenivaro.chatgpt.site"));
        assertFalse(AppUrlPolicy.isTrusted("https://evil.example"));
        assertFalse(AppUrlPolicy.isTrusted("https://royal-supremacy-app.kaizenivaro.chatgpt.site.evil.example"));
        assertFalse(AppUrlPolicy.isTrusted("not a url"));
    }
}
```

- [ ] **Step 3: Run the test to verify it fails**

Run:

```powershell
& "$env:USERPROFILE\.royal-supremacy-tools\gradle-8.10.2\bin\gradle.bat" -p android-wrapper testDebugUnitTest
```

Expected: FAIL because `AppUrlPolicy` does not exist.

- [ ] **Step 4: Implement the minimal URL policy**

Create `AppUrlPolicy.java`:

```java
package com.royalsupremacy.app;

import java.net.URI;
import java.net.URISyntaxException;

public final class AppUrlPolicy {
    public static final String HOME_URL = "https://royal-supremacy-app.kaizenivaro.chatgpt.site";
    private static final String TRUSTED_HOST = "royal-supremacy-app.kaizenivaro.chatgpt.site";

    private AppUrlPolicy() {}

    public static boolean isTrusted(String rawUrl) {
        try {
            URI uri = new URI(rawUrl);
            return "https".equalsIgnoreCase(uri.getScheme())
                && TRUSTED_HOST.equalsIgnoreCase(uri.getHost());
        } catch (URISyntaxException | NullPointerException error) {
            return false;
        }
    }
}
```

- [ ] **Step 5: Run the unit test**

Run the Task 2 Step 3 command again.

Expected: `BUILD SUCCESSFUL` and one passing test.

- [ ] **Step 6: Commit the scaffold and policy**

```powershell
git add android-wrapper
git commit -m "feat: scaffold Android live wrapper"
```

### Task 3: Build The Secure WebView Shell

**Files:**
- Create: `android-wrapper/app/src/main/AndroidManifest.xml`
- Create: `android-wrapper/app/src/main/java/com/royalsupremacy/app/MainActivity.java`
- Create: `android-wrapper/app/src/main/res/layout/activity_main.xml`
- Create: `android-wrapper/app/src/main/res/values/strings.xml`

- [ ] **Step 1: Add the secure Android manifest**

Create `AndroidManifest.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET" />

    <application
        android:allowBackup="false"
        android:hardwareAccelerated="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.RoyalSupremacy"
        android:usesCleartextTraffic="false">
        <activity
            android:name=".MainActivity"
            android:configChanges="keyboardHidden|orientation|screenSize"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

- [ ] **Step 2: Add the WebView/offline layout**

Create `activity_main.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<FrameLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="@color/royal_black">

    <WebView
        android:id="@+id/web_view"
        android:layout_width="match_parent"
        android:layout_height="match_parent" />

    <ProgressBar
        android:id="@+id/loading_indicator"
        android:layout_width="48dp"
        android:layout_height="48dp"
        android:layout_gravity="center"
        android:indeterminateTint="@color/royal_gold" />

    <LinearLayout
        android:id="@+id/offline_state"
        android:layout_width="320dp"
        android:layout_height="wrap_content"
        android:layout_gravity="center"
        android:background="@drawable/offline_panel"
        android:gravity="center"
        android:orientation="vertical"
        android:padding="28dp"
        android:visibility="gone">

        <ImageView
            android:layout_width="72dp"
            android:layout_height="72dp"
            android:contentDescription="@string/app_name"
            android:src="@drawable/royal_mark" />

        <TextView
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_marginTop="20dp"
            android:text="@string/offline_title"
            android:textColor="@color/royal_gold"
            android:textSize="22sp"
            android:textStyle="bold" />

        <TextView
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:layout_marginTop="10dp"
            android:gravity="center"
            android:lineSpacingExtra="3dp"
            android:text="@string/offline_message"
            android:textColor="@color/royal_text"
            android:textSize="15sp" />

        <Button
            android:id="@+id/retry_button"
            android:layout_width="match_parent"
            android:layout_height="52dp"
            android:layout_marginTop="22dp"
            android:backgroundTint="@color/royal_gold"
            android:text="@string/retry"
            android:textColor="@color/royal_black"
            android:textStyle="bold" />
    </LinearLayout>
</FrameLayout>
```

Create `strings.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">Royal Supremacy</string>
    <string name="offline_title">Command Link Offline</string>
    <string name="offline_message">Royal Supremacy could not reach the squad server. Check your connection and try again.</string>
    <string name="retry">Retry</string>
</resources>
```

- [ ] **Step 3: Implement `MainActivity`**

Create `MainActivity.java`:

```java
package com.royalsupremacy.app;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Bitmap;
import android.net.Uri;
import android.net.http.SslError;
import android.os.Bundle;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.SslErrorHandler;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.ProgressBar;
import android.widget.Toast;

public class MainActivity extends Activity {
    private static final int FILE_CHOOSER_REQUEST = 9001;

    private WebView webView;
    private ProgressBar loadingIndicator;
    private View offlineState;
    private ValueCallback<Uri[]> filePathCallback;
    private boolean mainFrameFailed;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.web_view);
        loadingIndicator = findViewById(R.id.loading_indicator);
        offlineState = findViewById(R.id.offline_state);
        Button retryButton = findViewById(R.id.retry_button);

        configureWebView();
        retryButton.setOnClickListener(view -> loadHome());

        if (savedInstanceState == null || webView.restoreState(savedInstanceState) == null) {
            loadHome();
        }
    }

    private void configureWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(false);
        settings.setSupportZoom(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setMediaPlaybackRequiresUserGesture(false);

        CookieManager cookies = CookieManager.getInstance();
        cookies.setAcceptCookie(true);
        cookies.setAcceptThirdPartyCookies(webView, true);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String target = request.getUrl().toString();
                if (AppUrlPolicy.isTrusted(target)) {
                    return false;
                }
                if ("https".equalsIgnoreCase(request.getUrl().getScheme())) {
                    openExternal(request.getUrl());
                }
                return true;
            }

            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                mainFrameFailed = false;
                loadingIndicator.setVisibility(View.VISIBLE);
                offlineState.setVisibility(View.GONE);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                loadingIndicator.setVisibility(View.GONE);
                if (!mainFrameFailed) {
                    offlineState.setVisibility(View.GONE);
                }
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) {
                    showOffline();
                }
            }

            @Override
            public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
                handler.cancel();
                showOffline();
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(
                WebView view,
                ValueCallback<Uri[]> callback,
                FileChooserParams params
            ) {
                if (filePathCallback != null) {
                    filePathCallback.onReceiveValue(null);
                }
                filePathCallback = callback;

                try {
                    startActivityForResult(params.createIntent(), FILE_CHOOSER_REQUEST);
                    return true;
                } catch (ActivityNotFoundException error) {
                    filePathCallback.onReceiveValue(null);
                    filePathCallback = null;
                    Toast.makeText(MainActivity.this, "No file picker is available.", Toast.LENGTH_SHORT).show();
                    return false;
                }
            }
        });
    }

    private void loadHome() {
        mainFrameFailed = false;
        offlineState.setVisibility(View.GONE);
        loadingIndicator.setVisibility(View.VISIBLE);
        webView.loadUrl(AppUrlPolicy.HOME_URL);
    }

    private void showOffline() {
        mainFrameFailed = true;
        loadingIndicator.setVisibility(View.GONE);
        offlineState.setVisibility(View.VISIBLE);
    }

    private void openExternal(Uri uri) {
        Intent intent = new Intent(Intent.ACTION_VIEW, uri);
        if (intent.resolveActivity(getPackageManager()) != null) {
            startActivity(intent);
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != FILE_CHOOSER_REQUEST || filePathCallback == null) {
            return;
        }
        Uri[] result = WebChromeClient.FileChooserParams.parseResult(resultCode, data);
        filePathCallback.onReceiveValue(result);
        filePathCallback = null;
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        webView.saveState(outState);
        super.onSaveInstanceState(outState);
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        if (isFinishing()) {
            webView.destroy();
        }
        super.onDestroy();
    }
}
```

- [ ] **Step 4: Run unit tests and Android lint**

Run:

```powershell
& "$env:USERPROFILE\.royal-supremacy-tools\gradle-8.10.2\bin\gradle.bat" -p android-wrapper testDebugUnitTest lintDebug
```

Expected: tests pass and lint reports no fatal errors.

- [ ] **Step 5: Commit the WebView shell**

```powershell
git add android-wrapper/app/src
git commit -m "feat: add secure Royal Supremacy WebView shell"
```

### Task 4: Add Native Branding And Reproducible Build Instructions

**Files:**
- Create: `android-wrapper/app/src/main/res/drawable/royal_mark.xml`
- Create: `android-wrapper/app/src/main/res/drawable/ic_launcher_background.xml`
- Create: `android-wrapper/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml`
- Create: `android-wrapper/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml`
- Create: `android-wrapper/app/src/main/res/values/colors.xml`
- Create: `android-wrapper/app/src/main/res/values/themes.xml`
- Create: `android-wrapper/README.md`

- [ ] **Step 1: Adapt the existing repository mark**

Create `royal_mark.xml`, preserving the paths and colors from `public/favicon.svg`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="64dp"
    android:height="64dp"
    android:viewportWidth="64"
    android:viewportHeight="64">
    <path android:fillColor="#030712" android:pathData="M0,0h64v64h-64z" />
    <path android:fillColor="#F2C453" android:pathData="M12,45h40l-4,-24l-10,9l-6,-14l-6,14l-10,-9z" />
    <path
        android:fillColor="@android:color/transparent"
        android:pathData="M17,48h30"
        android:strokeColor="#6DBFFF"
        android:strokeLineCap="round"
        android:strokeWidth="4" />
</vector>
```

Create `offline_panel.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
    <solid android:color="@color/royal_navy" />
    <stroke android:width="1dp" android:color="@color/royal_blue" />
    <corners android:radius="8dp" />
</shape>
```

- [ ] **Step 2: Configure the dark launch theme and adaptive icons**

Create `colors.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="royal_black">#030712</color>
    <color name="royal_navy">#07172A</color>
    <color name="royal_blue">#173A64</color>
    <color name="royal_gold">#F2C453</color>
    <color name="royal_text">#D7E3F4</color>
</resources>
```

Create `themes.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="Theme.RoyalSupremacy" parent="android:style/Theme.Material.NoActionBar">
        <item name="android:fontFamily">sans</item>
        <item name="android:windowBackground">@color/royal_black</item>
        <item name="android:colorAccent">@color/royal_gold</item>
        <item name="android:statusBarColor">@color/royal_black</item>
        <item name="android:navigationBarColor">@color/royal_black</item>
        <item name="android:windowLightStatusBar">false</item>
        <item name="android:windowLightNavigationBar">false</item>
    </style>
</resources>
```

Create `ic_launcher_background.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
    <solid android:color="@color/royal_black" />
</shape>
```

Create identical `ic_launcher.xml` and `ic_launcher_round.xml` adaptive icon files:

```xml
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background" />
    <foreground android:drawable="@drawable/royal_mark" />
</adaptive-icon>
```

- [ ] **Step 3: Document build and install commands**

Document the required JDK/SDK variables and these commands:

```powershell
./gradlew.bat testDebugUnitTest lintDebug assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

State clearly that the APK loads Codex Sites, requires internet, and is a sideload test build rather than a Play Store release.

- [ ] **Step 4: Generate and commit the Gradle wrapper**

Run:

```powershell
& "$env:USERPROFILE\.royal-supremacy-tools\gradle-8.10.2\bin\gradle.bat" -p android-wrapper wrapper --gradle-version 8.10.2
git add android-wrapper
git commit -m "build: make Android wrapper reproducible"
```

### Task 5: Build And Inspect The APK

**Files:**
- Produce: `android-wrapper/app/build/outputs/apk/debug/app-debug.apk`
- Create: `output/android/Royal-Supremacy-debug.apk`

- [ ] **Step 1: Verify the web project remains healthy**

Run from the mobile worktree root:

```powershell
npm test
npm run lint
npm run build
```

Expected: all tests pass, TypeScript emits no errors, and the Vite/Sites build completes.

- [ ] **Step 2: Build the APK from a clean Android project state**

Run:

```powershell
./android-wrapper/gradlew.bat -p android-wrapper clean testDebugUnitTest lintDebug assembleDebug
```

Expected: `BUILD SUCCESSFUL` and `app-debug.apk` exists.

- [ ] **Step 3: Inspect package metadata**

Run:

```powershell
$aapt = Join-Path $env:LOCALAPPDATA 'Android\Sdk\build-tools\35.0.1\aapt.exe'
& $aapt dump badging android-wrapper\app\build\outputs\apk\debug\app-debug.apk
```

Expected output contains package `com.royalsupremacy.app`, label `Royal Supremacy`, launch activity `com.royalsupremacy.app.MainActivity`, and target SDK 35.

- [ ] **Step 4: Copy and checksum the delivery artifact**

Run:

```powershell
New-Item -ItemType Directory -Force output\android | Out-Null
Copy-Item android-wrapper\app\build\outputs\apk\debug\app-debug.apk output\android\Royal-Supremacy-debug.apk -Force
Get-FileHash output\android\Royal-Supremacy-debug.apk -Algorithm SHA256
```

Expected: the delivery APK and its SHA-256 digest are available.

- [ ] **Step 5: Install on a connected device when available**

Run `adb devices`. If an authorized device is listed, run:

```powershell
adb install -r output\android\Royal-Supremacy-debug.apk
adb shell am start -n com.royalsupremacy.app/.MainActivity
```

Verify the Codex Sites login opens, fresh fields are empty, Back follows site history, file upload launches the picker, rotation works, and unavailable networking shows Retry. If no device is connected, record physical-device launch testing as outstanding without claiming it passed.

### Task 6: Deliver The APK By Email

**Files:**
- Read: `output/android/Royal-Supremacy-debug.apk`

- [ ] **Step 1: Attempt direct Gmail delivery only if APK attachments are accepted**

Prepare an email to `kaizenivaro@gmail.com` with subject `Royal Supremacy Android APK` and a short body containing the build type, install note, Codex Sites behavior, and SHA-256 digest.

- [ ] **Step 2: Use a download link when direct APK attachment is blocked**

If Gmail or the connected Gmail tool rejects executable attachments or exceeds its attachment limit, upload `Royal-Supremacy-debug.apk` to the user's connected Google Drive, grant link access appropriate for the user, and email that download link instead. Do not rename or disguise the executable to bypass provider rules.

- [ ] **Step 3: Verify delivery**

Confirm the Gmail operation returns a sent-message ID or verify the message appears in Sent Mail. Report whether the email contains the APK directly or a Drive download link.

### Task 7: Final Repository Verification

**Files:**
- Verify: all files changed by Tasks 1-6

- [ ] **Step 1: Run all final checks**

Run:

```powershell
npm test
npm run lint
npm run build
./android-wrapper/gradlew.bat -p android-wrapper clean testDebugUnitTest lintDebug assembleDebug
git diff --check
git status --short
```

Expected: all commands succeed and only intentional delivery artifacts remain untracked or ignored.

- [ ] **Step 2: Commit final corrections**

If verification required source corrections, commit only those corrections:

```powershell
git add android-wrapper .gitignore
git commit -m "fix: finalize Android delivery build"
```
