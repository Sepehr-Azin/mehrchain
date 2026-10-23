package com.mehrchain.app;

import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.os.Build;
import androidx.core.content.pm.PackageInfoCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.security.MessageDigest;

/** Read the installed binary identity, never a web-supplied signing claim. */
@CapacitorPlugin(name = "AppRelease")
public class AppReleasePlugin extends Plugin {
    @PluginMethod
    @SuppressWarnings("deprecation")
    public void getInfo(PluginCall call) {
        try {
            PackageManager manager = getContext().getPackageManager();
            String appId = getContext().getPackageName();
            PackageInfo info = manager.getPackageInfo(appId,
                Build.VERSION.SDK_INT >= 28 ? PackageManager.GET_SIGNING_CERTIFICATES : PackageManager.GET_SIGNATURES);
            Signature[] signatures = Build.VERSION.SDK_INT >= 28
                ? info.signingInfo.getApkContentsSigners() : info.signatures;
            if (signatures == null || signatures.length != 1) {
                call.reject("A single installed signing identity is required");
                return;
            }
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(signatures[0].toByteArray());
            StringBuilder fingerprint = new StringBuilder();
            for (byte value : digest) fingerprint.append(String.format("%02x", value & 0xff));
            JSObject result = new JSObject();
            result.put("version", info.versionName);
            result.put("versionCode", PackageInfoCompat.getLongVersionCode(info));
            result.put("applicationId", appId);
            result.put("certificateSha256", fingerprint.toString());
            result.put("debug", (info.applicationInfo.flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0);
            call.resolve(result);
        } catch (Exception error) {
            call.reject("Could not read the installed release identity", error);
        }
    }
}
