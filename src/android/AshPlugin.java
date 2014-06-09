package pl.ug.ash;

//import org.apache.cordova.CallbackContext;
//import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CordovaWebView;
//import org.apache.cordova.CordovaInterface;
import org.apache.cordova.IceCreamCordovaWebViewClient;
import org.json.JSONArray;
import org.json.JSONException;

import java.lang.Class;
import java.lang.IllegalAccessException;
import java.lang.reflect.Field;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;

import android.content.Context;
import android.content.pm.ActivityInfo;
import android.util.Log;
import android.net.ConnectivityManager;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.apache.cordova.api.Plugin;
import org.apache.cordova.api.PluginResult;

public class AshPlugin extends Plugin {

  public static final String ACTION_ORIENTATION_HORIZONTAL = "orientationHorizontal";
  public static final String ACTION_ORIENTATION_VERTICAL = "orientationVertical";
  public static final String ACTION_NETWORK_OFF = "networkOff";
  public static final String ACTION_NETWORK_ON = "networkOn";
  public static final String ACTION_NETWORK_SLOW = "networkSlow";
  public static final String PRESS_BACK = "pressBack";
  
//  @Override
//  public boolean execute(String action, JSONArray args, final CallbackContext callbackContext) throws JSONException {
  @Override
  public PluginResult execute(String action, JSONArray args, String callbackId) {
  
    if (ACTION_ORIENTATION_HORIZONTAL.equals(action)) {
      try {
        Log.d("HelloPlugin", "Changing orientation to horizontal");
        changeOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE);
        
//        callbackContext.success("");
//        return true;
        return new PluginResult(PluginResult.Status.OK, ""); 
      }
      catch (Exception ex) {
        Log.d("AshPlugin error:", ex.toString());
//        callbackContext.error(ex.toString());
        return new PluginResult(PluginResult.Status.ERROR, ex.toString());
      }  
    }
    if (ACTION_ORIENTATION_VERTICAL.equals(action)) {
      try {
        Log.d("HelloPlugin", "Changing orientation to vertical");
        changeOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
        
//        callbackContext.success("");
//        return true;
        return new PluginResult(PluginResult.Status.OK, ""); 
      }
      catch (Exception ex) {
        Log.d("AshPlugin error:", ex.toString());
//        callbackContext.error(ex.toString());
        return new PluginResult(PluginResult.Status.ERROR, ex.toString());
      }  
    }
    if (ACTION_NETWORK_OFF.equals(action)) {
      try {
        Log.d("HelloPlugin", "Blocking access to network");
        
        return turnNetworkOff();
//        return true;
      }
      catch (Exception ex) {
        Log.d("AshPlugin error:", ex.toString());
//        callbackContext.error(ex.toString());
        return new PluginResult(PluginResult.Status.ERROR, ex.toString());
      }  
    }
//    if (ACTION_NETWORK_ON.equals(action)) {
//      try {
//        Log.d("HelloPlugin", "Enabling network");
//          
//        return setNetworkConnectivity(true/*, callbackContext*/);
////        return true;
//      }
//      catch (Exception ex) {
//        Log.d("AshPlugin error:", ex.toString());
////        callbackContext.error(ex.toString());
//        return new PluginResult(PluginResult.Status.ERROR, ex.toString());
//      }  
//    }
//    if (ACTION_NETWORK_SLOW.equals(action)) {
//      try {
//        Log.d("HelloPlugin", "Slowing down network access");
//          
//        return slowNetworkDown(callbackContext);
////        return true;
//      }
//      catch (Exception ex) {
//        Log.d("AshPlugin error:", ex.toString());
////        callbackContext.error(ex.toString());
//        return new PluginResult(PluginResult.Status.ERROR, ex.toString());
//      }  
//    }
//    if (PRESS_BACK.equals(action)) {
//      try {
//        Log.d("HelloPlugin", "Pressing back");
//        
//        cordova.getActivity().runOnUiThread(new Runnable() {
//            public void run() {
//                Log.d("HelloPlugin", "Now we are really going to press the button");
//                boolean wentBack = webView.backHistory();
//                Log.d("HelloPlugin", "Did we go back with history? " + wentBack); 
//                if(wentBack){
//                  callbackContext.success(); // Thread-safe.
//                }else{
//                  callbackContext.error("Already at top of history stack");
//                }
//            }
//        });
//          
//        return true;
//      }
//      catch (Exception ex) {
//        Log.d("AshPlugin error:", ex.toString());
//        callbackContext.error(ex.toString());
//      }  
//    	return new PluginResult(PluginResult.Status.ERROR, "Cordova 2.1.0 won't support runOnUIThread");
//    }

    Log.d("AshPlugin error: No action " + action, "");
    //callbackContext.error("Error");
//    return false;
    return new PluginResult(PluginResult.Status.ERROR, "No action " + action);
  }

  private void changeOrientation(int orientation) {
    this.cordova.getActivity().setRequestedOrientation(orientation);
  }
    
//  private void setNetworkConnectivity(boolean turnOn/*, final CallbackContext callbackContext*/) {
//    Log.d("HelloPlugin", "Changing network access to " + turnOn);
//    if(turnOn){
//      turnNetworkOn(callbackContext);
//    }else{
//      turnNetworkOff(callbackContext);
//    }
//  }
    
  private PluginResult turnNetworkOff() {
    final CordovaWebView cordovaWebView = this.webView;
          
    //working on UI thread ...
//    cordova.getActivity().runOnUiThread(new Runnable() {
//      public void run() {
        // set the alternative web view client, that does nothing ...
        cordovaWebView.setWebViewClient(new WebViewClient() {
          @Override
          public void onLoadResource(WebView view, String url) {
            System.out.println("CUSTOM - load aborted");
            view.stopLoading();
          }
        });
        // trigger the event ...
        //cordovaWebView.setNetworkAvailable(false);
        // and call the test
//        callbackContext.success(""); // Thread-safe.
//      }
//    });
        return new PluginResult(PluginResult.Status.OK, ""); 
  }
//    
//  private void turnNetworkOn(final CallbackContext callbackContext) {
//    final CordovaWebView cordovaWebView = this.webView;
//    final CordovaInterface cordovaInterface = this.cordova; 
//          
//    //working on UI thread ...
//    cordova.getActivity().runOnUiThread(new Runnable() {
//      public void run() {
//        // set the alternative web view client
//        cordovaWebView.setWebViewClient(new IceCreamCordovaWebViewClient(cordovaInterface ,cordovaWebView));
//        // trigger the event ...
//        //cordovaWebView.setNetworkAvailable(true);
//        // and call the test
//        callbackContext.success(""); // Thread-safe.
//      }
//    });
//  }
//    
//  private void slowNetworkDown(final CallbackContext callbackContext) {
//    final CordovaWebView cordovaWebView = this.webView;
//          
//    //working on UI thread ...
//    cordova.getActivity().runOnUiThread(new Runnable() {
//      public void run() {
//        // set the alternative web view client
//        cordovaWebView.setWebViewClient(new WebViewClient() {
//          @Override
//          public void onLoadResource(WebView view, String url) {
//            //TODO: slowdown can be passed as a param
//            int slowdownSeconds = 1;
//            System.out.println("Web View waiting for " + slowdownSeconds);
//            try{
//              Thread.sleep(slowdownSeconds * 1000);
//            }catch(InterruptedException e){}
//            System.out.println("Web View ending wait. Delegating call");
//          }
//        });
//        // trigger the event ...
//        //cordovaWebView.setNetworkAvailable(true);
//        // and call the test
//        callbackContext.success(""); // Thread-safe.
//      }
//    });
//  }
  
}
