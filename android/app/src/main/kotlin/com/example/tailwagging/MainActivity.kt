package com.example.tailwagging

import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity: FlutterActivity() {
    private val CHANNEL = "com.masa.petmaya/native_bridge"

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL).setMethodCallHandler { call, result ->
            if (call.method == "openLocationPicker") {
                result.success("789 Health St, Care Valley")
            } else if (call.method == "calculateDistance") {
                result.success(1200.0)
            } else {
                result.notImplemented()
            }
        }
    }
}
