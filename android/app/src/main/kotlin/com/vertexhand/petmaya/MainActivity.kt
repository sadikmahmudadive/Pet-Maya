package com.vertexhand.petmaya
 
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import com.vertexhand.petmaya.AlarmHelper

class MainActivity: FlutterActivity() {
    private val CHANNEL = "com.masa.petmaya/native_bridge"

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL).setMethodCallHandler { call, result ->
            when (call.method) {
                "openLocationPicker" -> result.success("789 Health St, Care Valley")
                "calculateDistance" -> result.success(1200.0)
                "scheduleAlarm" -> {
                    val id = call.argument<String>("id")
                    val title = call.argument<String>("title")
                    val body = call.argument<String>("body") ?: ""
                    val category = call.argument<String>("category") ?: (if (call.argument<Boolean>("isFeeding") == true) "feeding" else "event")
                    val timestamp = call.argument<Long>("timestamp")
                    
                    if (id != null && title != null && timestamp != null) {
                        AlarmHelper.scheduleNotificationAlarm(this, id, title, body, category, timestamp)
                        result.success(null)
                    } else {
                        result.error("INVALID_ARGS", "Missing alarm parameters", null)
                    }
                }
                "cancelAlarm" -> {
                    val id = call.argument<String>("id")
                    if (id != null) {
                        AlarmHelper.cancelAlarm(this, id)
                        result.success(null)
                    } else {
                        result.error("INVALID_ARGS", "Missing event ID", null)
                    }
                }
                else -> result.notImplemented()
            }
        }
    }
}
