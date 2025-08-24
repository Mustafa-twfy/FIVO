package com.twfy.simsim;

import android.app.Application;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactNativeHost;
import com.facebook.soloader.SoLoader;
import java.util.List;
import java.util.Arrays;

public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost =
      new DefaultReactNativeHost(this) {
        @Override
        public boolean getUseDeveloperSupport() {
          return false; // تعطيل وضع المطور للإنتاج
        }

        @Override
        protected List<ReactPackage> getPackages() {
          // إرجاع قائمة فارغة - سيتم التعامل مع الحزم تلقائياً
          return Arrays.asList();
        }

        @Override
        protected String getJSMainModuleName() {
          return "index";
        }

        @Override
        protected boolean isNewArchEnabled() {
          return false; // تعطيل الهندسة المعمارية الجديدة
        }

        @Override
        protected Boolean isHermesEnabled() {
          return true; // تفعيل Hermes
        }
      };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    SoLoader.init(this, /* native exopackage */ false);
    if (mReactNativeHost.isNewArchEnabled()) {
      DefaultNewArchitectureEntryPoint.load();
    }
  }
}
