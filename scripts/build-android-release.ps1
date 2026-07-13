param(
    [string]$CredentialPath = "$env:USERPROFILE\.royal-supremacy-signing\upload-credential.xml",
    [string]$KeystorePath = "$env:USERPROFILE\.royal-supremacy-signing\royal-supremacy-upload.jks"
)

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$androidRoot = Join-Path $projectRoot 'android-wrapper'
$outputRoot = Join-Path $projectRoot 'output\android'
$javaHome = Join-Path $env:USERPROFILE '.royal-supremacy-tools\jdk17\jdk-17.0.19+10'
$gradle = Join-Path $env:USERPROFILE '.royal-supremacy-tools\gradle-8.10.2\bin\gradle.bat'
$androidSdk = Join-Path $env:LOCALAPPDATA 'Android\Sdk'

if (!(Test-Path -LiteralPath $CredentialPath)) {
    throw "Signing credential not found: $CredentialPath"
}

if (!(Test-Path -LiteralPath $KeystorePath)) {
    throw "Signing keystore not found: $KeystorePath"
}

if (!(Test-Path -LiteralPath $gradle)) {
    throw "Gradle was not found: $gradle"
}

if (!(Test-Path -LiteralPath $androidSdk)) {
    throw "Android SDK was not found: $androidSdk"
}

$credential = Import-Clixml -LiteralPath $CredentialPath
$password = $credential.GetNetworkCredential().Password

$env:JAVA_HOME = $javaHome
$env:ANDROID_HOME = $androidSdk
$env:ANDROID_SDK_ROOT = $androidSdk
$env:PATH = "$javaHome\bin;$env:PATH"
$env:_JAVA_OPTIONS = '-Djavax.net.ssl.trustStoreType=Windows-ROOT'
$env:RS_ANDROID_KEYSTORE = $KeystorePath
$env:RS_ANDROID_STORE_PASSWORD = $password
$env:RS_ANDROID_KEY_ALIAS = $credential.UserName
$env:RS_ANDROID_KEY_PASSWORD = $password

Push-Location $androidRoot
try {
    & $gradle --no-daemon clean test lintRelease assembleRelease
    if ($LASTEXITCODE -ne 0) {
        throw "Android release build failed with exit code $LASTEXITCODE"
    }
} finally {
    Pop-Location
}

$sourceApk = Join-Path $androidRoot 'app\build\outputs\apk\release\app-release.apk'
$targetApk = Join-Path $outputRoot 'Royal-Supremacy-release.apk'

New-Item -ItemType Directory -Force -Path $outputRoot | Out-Null
Copy-Item -LiteralPath $sourceApk -Destination $targetApk -Force

$artifact = Get-Item -LiteralPath $targetApk
$hash = Get-FileHash -LiteralPath $targetApk -Algorithm SHA256

[pscustomobject]@{
    Apk = $artifact.FullName
    Bytes = $artifact.Length
    SHA256 = $hash.Hash
}
