package com.taskflow.app;

import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

@CapacitorPlugin(name = "AppUpdate")
public class AppUpdatePlugin extends Plugin {

    @PluginMethod()
    public void getVersionInfo(PluginCall call) {
        try {
            PackageInfo pInfo = getContext().getPackageManager()
                    .getPackageInfo(getContext().getPackageName(), 0);

            JSObject ret = new JSObject();
            ret.put("versionName", pInfo.versionName);

            long versionCode;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                versionCode = pInfo.getLongVersionCode();
            } else {
                versionCode = pInfo.versionCode;
            }
            ret.put("versionCode", versionCode);

            call.resolve(ret);
        } catch (PackageManager.NameNotFoundException e) {
            call.reject("Unable to get version info", e);
        }
    }

    @PluginMethod()
    public void downloadAndInstall(PluginCall call) {
        String url = call.getString("url");
        if (url == null || url.isEmpty()) {
            call.reject("URL is required");
            return;
        }

        new Thread(() -> {
            HttpURLConnection connection = null;
            InputStream input = null;
            FileOutputStream output = null;
            try {
                File updatesDir = new File(getContext().getExternalCacheDir(), "updates");
                if (!updatesDir.exists()) {
                    updatesDir.mkdirs();
                }
                File apkFile = new File(updatesDir, "app-release.apk");
                if (apkFile.exists()) {
                    apkFile.delete();
                }

                URL downloadUrl = new URL(url);
                connection = (HttpURLConnection) downloadUrl.openConnection();
                connection.setConnectTimeout(15000);
                connection.setReadTimeout(30000);
                connection.connect();

                int responseCode = connection.getResponseCode();
                if (responseCode != HttpURLConnection.HTTP_OK) {
                    call.reject("Server returned HTTP " + responseCode);
                    return;
                }

                int fileLength = connection.getContentLength();
                input = connection.getInputStream();
                output = new FileOutputStream(apkFile);

                byte[] buffer = new byte[8192];
                long totalBytesRead = 0;
                int bytesRead;
                int lastReportedProgress = -1;

                while ((bytesRead = input.read(buffer)) != -1) {
                    totalBytesRead += bytesRead;
                    output.write(buffer, 0, bytesRead);

                    if (fileLength > 0) {
                        int progress = (int) (totalBytesRead * 100 / fileLength);
                        // Emit progress every 5%
                        if (progress / 5 > lastReportedProgress / 5) {
                            lastReportedProgress = progress;
                            JSObject progressData = new JSObject();
                            progressData.put("progress", progress);
                            notifyListeners("downloadProgress", progressData);
                        }
                    }
                }

                output.flush();
                output.close();
                output = null;

                // Install APK via FileProvider
                Uri apkUri = FileProvider.getUriForFile(
                        getContext(),
                        getContext().getPackageName() + ".fileprovider",
                        apkFile
                );

                Intent installIntent = new Intent(Intent.ACTION_VIEW);
                installIntent.setDataAndType(apkUri, "application/vnd.android.package-archive");
                installIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                installIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                getContext().startActivity(installIntent);

                call.resolve();

            } catch (Exception e) {
                call.reject("Download failed: " + e.getMessage(), e);
            } finally {
                try {
                    if (output != null) output.close();
                    if (input != null) input.close();
                } catch (Exception ignored) {}
                if (connection != null) connection.disconnect();
            }
        }).start();
    }
}
