# Royal Supremacy Android Wrapper

This native Java Android shell loads the current Royal Supremacy live site at
`https://royal-supremacy-app.kaizenivaro.chatgpt.site`. It is a sideloadable
debug build, not a Play Store release, and requires an internet connection.

## Prerequisites

- JDK 17
- Android SDK Platform 35 and Build-Tools 35.0.1
- `ANDROID_SDK_ROOT` set to the Android SDK directory

## Build And Install

The committed Gradle wrapper pins builds to Gradle 8.10.2. From this directory,
run:

```powershell
.\gradlew.bat clean testDebugUnitTest lintDebug assembleDebug
adb install -r app\build\outputs\apk\debug\app-debug.apk
```

To launch it from a connected device after installation:

```powershell
adb shell am start -n com.royalsupremacy.app/.MainActivity
```

The resulting APK is `app/build/outputs/apk/debug/app-debug.apk`.
