package com.vertexhand.petmaya;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

public class AlarmHelper {
    private static final String TAG = "AlarmHelper";

    public static void scheduleNotificationAlarm(Context context, String id, String title, String body, String category, long timestamp) {
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        
        Intent intent = new Intent(context, EventAlarmReceiver.class);
        intent.putExtra("id", id);
        intent.putExtra("eventId", id);
        intent.putExtra("title", title);
        intent.putExtra("body", body);
        intent.putExtra("category", category);

        boolean isFeeding = "feeding".equalsIgnoreCase(category);
        intent.putExtra("isFeeding", isFeeding);

        long scheduleTime = timestamp;
        if (isFeeding) {
            // Give 5 minutes prep window for feeding alarms
            scheduleTime = Math.max(System.currentTimeMillis() + 1000, timestamp - (5 * 60 * 1000));
            Log.d(TAG, "Feeding alarm adjusted for prep time: " + title);
        }

        PendingIntent pendingIntent = PendingIntent.getBroadcast(
                context, 
                id.hashCode(), 
                intent, 
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, scheduleTime, pendingIntent);
        } else {
            alarmManager.setExact(AlarmManager.RTC_WAKEUP, scheduleTime, pendingIntent);
        }
        
        Log.d(TAG, "Notification alarm scheduled for category [" + category + "]: " + title + " at " + scheduleTime);
    }

    public static void scheduleEventAlarm(Context context, String eventId, String title, long timestamp, boolean isFeeding) {
        String category = isFeeding ? "feeding" : "event";
        scheduleNotificationAlarm(context, eventId, title, "", category, timestamp);
    }

    public static void cancelAlarm(Context context, String eventId) {
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        Intent intent = new Intent(context, EventAlarmReceiver.class);
        PendingIntent pendingIntent = PendingIntent.getBroadcast(
                context, 
                eventId.hashCode(), 
                intent, 
                PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE
        );
        if (pendingIntent != null) {
            alarmManager.cancel(pendingIntent);
            Log.d(TAG, "Alarm cancelled for: " + eventId);
        }
    }
}
