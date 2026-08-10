package com.vertexhand.petmaya;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import android.util.Log;

public class EventAlarmReceiver extends BroadcastReceiver {
    private static final String CHANNEL_ID = "high_importance_channel";

    @Override
    public void onReceive(Context context, Intent intent) {
        String eventId = intent.getStringExtra("eventId");
        String title = intent.getStringExtra("title");
        boolean isFeeding = intent.getBooleanExtra("isFeeding", false);

        Log.d("EventAlarmReceiver", "Alarm received for: " + title);

        NotificationManager notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);

        // Ensure channel exists
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Critical Pet Care Alerts",
                    NotificationManager.IMPORTANCE_HIGH
            );
            notificationManager.createNotificationChannel(channel);
        }

        // Actions: Mark Done / Dismiss
        Intent doneIntent = new Intent(context, ActionReceiver.class);
        doneIntent.setAction("ACTION_DONE");
        doneIntent.putExtra("eventId", eventId);
        PendingIntent donePendingIntent = PendingIntent.getBroadcast(context, eventId.hashCode() + 1, doneIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm) // Should be replaced with pet icon
                .setContentTitle(isFeeding ? "Prep Meal for your Pet!" : "Pet Care Reminder")
                .setContentText(title)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true)
                .addAction(android.R.drawable.checkbox_on_background, "Mark Done", donePendingIntent);

        notificationManager.notify(eventId.hashCode(), builder.build());
    }
}
