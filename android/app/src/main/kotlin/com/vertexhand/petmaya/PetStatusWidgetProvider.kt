package com.vertexhand.petmaya

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.widget.RemoteViews

class PetStatusWidgetProvider : AppWidgetProvider() {

    companion object {
        const val LAUNCH_ACTION = "es.antonborri.home_widget.action.LAUNCH"

        fun createLaunchPendingIntent(context: Context, uriString: String, requestCode: Int): PendingIntent {
            val intent = Intent(context, MainActivity::class.java).apply {
                action = LAUNCH_ACTION
                data = Uri.parse(uriString)
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            var flags = PendingIntent.FLAG_UPDATE_CURRENT
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags = flags or PendingIntent.FLAG_IMMUTABLE
            }
            return PendingIntent.getActivity(context, requestCode, intent, flags)
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        if (intent.action == AppWidgetManager.ACTION_APPWIDGET_UPDATE) {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val thisWidget = ComponentName(context, PetStatusWidgetProvider::class.java)
            val allWidgetIds = intent.getIntArrayExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS)
                ?: appWidgetManager.getAppWidgetIds(thisWidget)
            if (allWidgetIds.isNotEmpty()) {
                onUpdate(context, appWidgetManager, allWidgetIds)
            }
        }
    }

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        val hwPrefs = context.getSharedPreferences("HomeWidgetPreferences", Context.MODE_PRIVATE)
        val flutterPrefs = context.getSharedPreferences("FlutterSharedPreferences", Context.MODE_PRIVATE)

        appWidgetIds.forEach { widgetId ->
            val views = RemoteViews(context.packageName, R.layout.pet_status_widget).apply {
                val petName = hwPrefs.getString("widget_pet_name", null)
                    ?: flutterPrefs.getString("flutter.widget_pet_name", null)
                    ?: "Max (Golden Retriever)"
                val battery = hwPrefs.getString("widget_battery", null)
                    ?: flutterPrefs.getString("flutter.widget_battery", null)
                    ?: "🔋 88%"
                val safeZone = hwPrefs.getString("widget_safezone_status", null)
                    ?: flutterPrefs.getString("flutter.widget_safezone_status", null)
                    ?: "🟢 Inside Safe Zone (Home Radar)"
                val activity = hwPrefs.getString("widget_activity_score", null)
                    ?: flutterPrefs.getString("flutter.widget_activity_score", null)
                    ?: "⚡ Activity: 94/100"

                setTextViewText(R.id.widget_pet_name, petName)
                setTextViewText(R.id.widget_battery, battery)
                setTextViewText(R.id.widget_safezone_status, safeZone)
                setTextViewText(R.id.widget_activity_score, activity)

                // PendingIntent for Radar click
                setOnClickPendingIntent(
                    R.id.btn_open_radar,
                    createLaunchPendingIntent(context, "petmaya://radar", 101)
                )

                // PendingIntent for AI Triage click
                setOnClickPendingIntent(
                    R.id.btn_open_ai,
                    createLaunchPendingIntent(context, "petmaya://ai_scan", 102)
                )

                // Root click to open app
                setOnClickPendingIntent(
                    R.id.widget_root,
                    createLaunchPendingIntent(context, "petmaya://home", 100)
                )
            }

            appWidgetManager.updateAppWidget(widgetId, views)
        }
    }
}
