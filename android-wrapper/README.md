# Royal Supremacy Android Wrapper

This native Java Android shell loads the current Royal Supremacy live site at
`https://royal-supremacy-app.kaizenivaro.chatgpt.site`. It is a sideloadable
debug build, not a Play Store release, and requires an internet connection.

## Prerequisites

- JDK 17
- Android SDK Platform 35 and Build-Tools 35.0.1
- Gradle 8.10.2, available on `PATH` only for the one-time wrapper generation
- `ANDROID_HOME` set to the Android SDK directory

## Generate The Gradle Wrapper

The Gradle wrapper is intentionally not committed yet: no local Gradle 8.10.2
installation was available when this project was created. From this directory,
once Gradle 8.10.2 is available, generate it with:

```powershell
gradle wrapper --gradle-version 8.10.2
```

Commit the generated `gradlew`, `gradlew.bat`, and `gradle/wrapper/*` files so
future builds do not require a system Gradle installation.

## Build And Install

After generating the wrapper, run:

```powershell
.\gradlew.bat clean testDebugUnitTest lintDebug assembleDebug
adb install -r app\build\outputs\apk\debug\app-debug.apk
```

To launch it from a connected device after installation:

```powershell
adb shell am start -n com.royalsupremacy.app/.MainActivity
```

The resulting APK is `app/build/outputs/apk/debug/app-debug.apk`.
