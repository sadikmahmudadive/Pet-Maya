package com.vertexhand.petmaya;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

public class AlarmHelper {
    private static final String TAG = "AlarmHelper";

    public static void scheduleEventAlarm(Context context, String eventId, String title, long timestamp, boolean isFeeding) {
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        
        Intent intent = new Intent(context, EventAlarmReceiver.class);
        intent.putExtra("eventId", eventId);
        intent.putExtra("title", title);
        intent.putExtra("isFeeding", isFeeding);

        // Requirement: Smart Feeding Alarms fire 10 minutes earlier for prep time
        long scheduleTime = timestamp;
        if (isFeeding) {
            scheduleTime = timestamp - (10 * 60 * 1000); // 10 minutes early
            Log.d(TAG, "Feeding alarm adjusted for 10m prep time: " + title);
        }

        PendingIntent pendingIntent = PendingIntent.getBroadcast(
                context, 
                eventId.hashCode(), 
                intent, 
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            // Ensure delivery during Doze mode
            alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, scheduleTime, pendingIntent);
        } else {
            alarmManager.setExact(AlarmManager.RTC_WAKEUP, scheduleTime, pendingIntent);
        }
        
        Log.d(TAG, "Alarm scheduled for event: " + title + " at " + scheduleTime);
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
