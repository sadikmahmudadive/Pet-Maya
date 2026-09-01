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

class QuickActionsWidgetProvider : AppWidgetProvider() {

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
            val thisWidget = ComponentName(context, QuickActionsWidgetProvider::class.java)
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
        appWidgetIds.forEach { widgetId ->
            val views = RemoteViews(context.packageName, R.layout.quick_actions_widget).apply {
                setOnClickPendingIntent(
                    R.id.btn_quick_scan,
                    createLaunchPendingIntent(context, "petmaya://ai_scan", 301)
                )

                setOnClickPendingIntent(
                    R.id.btn_quick_radar,
                    createLaunchPendingIntent(context, "petmaya://radar", 302)
                )

                setOnClickPendingIntent(
                    R.id.btn_quick_sos,
                    createLaunchPendingIntent(context, "petmaya://sos", 303)
                )

                setOnClickPendingIntent(
                    R.id.btn_quick_passport,
                    createLaunchPendingIntent(context, "petmaya://passport", 304)
                )
            }

            appWidgetManager.updateAppWidget(widgetId, views)
        }
    }
}
