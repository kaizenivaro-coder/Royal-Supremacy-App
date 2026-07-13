package com.royalsupremacy.app;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.net.Uri;
import android.net.http.SslError;
import android.os.Build;
import android.os.Bundle;
import android.os.Process;
import android.view.View;
import android.view.WindowInsets;
import android.webkit.CookieManager;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.SslErrorHandler;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;

public class MainActivity extends Activity {
    private static final int FILE_CHOOSER_REQUEST = 9001;

    private FrameLayout rootView;
    private WebView webView;
    private ProgressBar loadingIndicator;
    private View offlineState;
    private TextView offlineMessage;
    private ValueCallback<Uri[]> filePathCallback;
    private boolean mainFrameFailed;
    private String trackedTopLevelUrl = AppUrlPolicy.HOME_URL;
    private boolean rendererRecoveryReloadAttempted;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        rootView = findViewById(R.id.root_view);
        webView = findViewById(R.id.web_view);
        loadingIndicator = findViewById(R.id.loading_indicator);
        offlineState = findViewById(R.id.offline_state);
        offlineMessage = findViewById(R.id.offline_message);
        Button retryButton = findViewById(R.id.retry_button);

        configureEdgeToEdge();
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
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(false);
        settings.setSupportZoom(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setAllowFileAccess(false);

        CookieManager cookies = CookieManager.getInstance();
        cookies.setAcceptCookie(true);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri target = request.getUrl();
                NavigationPolicy.Destination destination = NavigationPolicy.destinationFor(
                        target.toString(), request.isForMainFrame());
                if (destination == NavigationPolicy.Destination.WEB_VIEW) {
                    return false;
                }
                if (destination == NavigationPolicy.Destination.EXTERNAL) {
                    openExternal(target);
                }
                return true;
            }

            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                if (AppUrlPolicy.isTrusted(url)) {
                    trackedTopLevelUrl = url;
                }
                mainFrameFailed = false;
                loadingIndicator.setVisibility(View.VISIBLE);
                offlineState.setVisibility(View.GONE);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                loadingIndicator.setVisibility(View.GONE);
                if (!mainFrameFailed) {
                    rendererRecoveryReloadAttempted = false;
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
                if (NavigationPolicy.isTrackedTopLevelSslFailure(error.getUrl(), trackedTopLevelUrl)) {
                    showOffline();
                }
            }

            @Override
            public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
                recreateWebView(view, detail.didCrash());
                return true;
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(
                    WebView view,
                    ValueCallback<Uri[]> callback,
                    FileChooserParams params) {
                if (filePathCallback != null) {
                    filePathCallback.onReceiveValue(null);
                }
                filePathCallback = callback;

                if (params.isCaptureEnabled()) {
                    Toast.makeText(MainActivity.this, R.string.capture_unavailable, Toast.LENGTH_LONG).show();
                }
                Intent picker = params.createIntent();
                picker.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

                try {
                    startActivityForResult(picker, FILE_CHOOSER_REQUEST);
                    return true;
                } catch (ActivityNotFoundException error) {
                    filePathCallback.onReceiveValue(null);
                    filePathCallback = null;
                    Toast.makeText(MainActivity.this, R.string.file_picker_unavailable, Toast.LENGTH_SHORT).show();
                    return false;
                }
            }
        });
    }

    private void loadHome() {
        rendererRecoveryReloadAttempted = false;
        loadUrl(AppUrlPolicy.HOME_URL);
    }

    private void loadUrl(String url) {
        mainFrameFailed = false;
        offlineState.setVisibility(View.GONE);
        loadingIndicator.setVisibility(View.VISIBLE);
        webView.loadUrl(url);
    }

    private void showOffline() {
        showOffline(R.string.offline_message);
    }

    private void showRendererRecovery() {
        showOffline(R.string.renderer_recovery_message);
    }

    private void showOffline(int messageResId) {
        mainFrameFailed = true;
        loadingIndicator.setVisibility(View.GONE);
        offlineMessage.setText(messageResId);
        offlineState.setVisibility(View.VISIBLE);
    }

    private void openExternal(Uri uri) {
        Intent intent = new Intent(Intent.ACTION_VIEW, uri);
        try {
            startActivity(intent);
        } catch (ActivityNotFoundException error) {
            Toast.makeText(this, R.string.browser_unavailable, Toast.LENGTH_SHORT).show();
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != FILE_CHOOSER_REQUEST || filePathCallback == null) {
            return;
        }

        Uri[] selectedUris = WebChromeClient.FileChooserParams.parseResult(resultCode, data);
        filePathCallback.onReceiveValue(sanitizeFileSelection(selectedUris));
        filePathCallback = null;
    }

    private Uri[] sanitizeFileSelection(Uri[] candidates) {
        if (candidates == null || candidates.length == 0) {
            return null;
        }

        for (Uri uri : candidates) {
            if (uri == null || !FileSelectionPolicy.isAcceptable(uri.toString(), hasReadAccess(uri))) {
                return null;
            }
        }
        return candidates;
    }

    private boolean hasReadAccess(Uri uri) {
        if (checkUriPermission(
                uri,
                Process.myPid(),
                Process.myUid(),
                Intent.FLAG_GRANT_READ_URI_PERMISSION) != PackageManager.PERMISSION_GRANTED) {
            return false;
        }

        try (InputStream inputStream = getContentResolver().openInputStream(uri)) {
            return inputStream != null;
        } catch (FileNotFoundException | SecurityException error) {
            return false;
        } catch (IOException error) {
            return false;
        }
    }

    @SuppressWarnings("deprecation")
    private void configureEdgeToEdge() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            getWindow().setDecorFitsSystemWindows(false);
        }
        rootView.setOnApplyWindowInsetsListener((view, insets) -> {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                android.graphics.Insets bars = insets.getInsets(
                        WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
                view.setPadding(bars.left, bars.top, bars.right, bars.bottom);
            } else {
                view.setPadding(
                        insets.getSystemWindowInsetLeft(),
                        insets.getSystemWindowInsetTop(),
                        insets.getSystemWindowInsetRight(),
                        insets.getSystemWindowInsetBottom());
            }
            return insets;
        });
        rootView.requestApplyInsets();
    }

    private void recreateWebView(WebView deadWebView, boolean didCrash) {
        if (deadWebView != webView) {
            return;
        }

        clearFilePathCallback();
        FrameLayout.LayoutParams layoutParams = (FrameLayout.LayoutParams) webView.getLayoutParams();
        rootView.removeView(webView);
        webView.destroy();

        webView = new WebView(this);
        webView.setId(R.id.web_view);
        rootView.addView(webView, 0, layoutParams);
        configureWebView();

        RendererRecoveryPolicy.Action action = RendererRecoveryPolicy.actionFor(
                didCrash, rendererRecoveryReloadAttempted);
        if (action == RendererRecoveryPolicy.Action.RELOAD) {
            rendererRecoveryReloadAttempted = true;
            loadUrl(RendererRecoveryPolicy.reloadUrl(trackedTopLevelUrl));
        } else {
            showRendererRecovery();
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        webView.saveState(outState);
        super.onSaveInstanceState(outState);
    }

    @Override
    protected void onPause() {
        webView.onPause();
        webView.pauseTimers();
        super.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        webView.onResume();
        webView.resumeTimers();
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        clearFilePathCallback();
        if (isFinishing()) {
            webView.destroy();
        }
        super.onDestroy();
    }

    private void clearFilePathCallback() {
        if (filePathCallback != null) {
            filePathCallback.onReceiveValue(null);
            filePathCallback = null;
        }
    }
}
