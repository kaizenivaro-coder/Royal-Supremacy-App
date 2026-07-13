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
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(false);
        settings.setSupportZoom(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);

        CookieManager cookies = CookieManager.getInstance();
        cookies.setAcceptCookie(true);
        cookies.setAcceptThirdPartyCookies(webView, true);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri target = request.getUrl();
                if (AppUrlPolicy.isTrusted(target.toString())) {
                    return false;
                }
                if (request.isForMainFrame() && "https".equalsIgnoreCase(target.getScheme())) {
                    openExternal(target);
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
                    FileChooserParams params) {
                if (filePathCallback != null) {
                    filePathCallback.onReceiveValue(null);
                }
                filePathCallback = callback;

                Intent picker = new Intent(Intent.ACTION_GET_CONTENT);
                picker.addCategory(Intent.CATEGORY_OPENABLE);
                picker.setType("*/*");
                picker.putExtra(
                        Intent.EXTRA_ALLOW_MULTIPLE,
                        params.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE);

                try {
                    startActivityForResult(Intent.createChooser(picker, getString(R.string.choose_file)),
                            FILE_CHOOSER_REQUEST);
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

        filePathCallback.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(resultCode, data));
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
        if (filePathCallback != null) {
            filePathCallback.onReceiveValue(null);
            filePathCallback = null;
        }
        if (isFinishing()) {
            webView.destroy();
        }
        super.onDestroy();
    }
}
