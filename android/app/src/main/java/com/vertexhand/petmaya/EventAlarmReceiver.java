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
    private static final String CHANNEL_HEALTH = "health_alerts_channel";
    private static final String CHANNEL_FEEDING = "feeding_schedule_channel";
    private static final String CHANNEL_GENERAL = "high_importance_channel";

    @Override
    public void onReceive(Context context, Intent intent) {
        String eventId = intent.getStringExtra("eventId");
        if (eventId == null) eventId = intent.getStringExtra("id");
        if (eventId == null) eventId = "alert_" + System.currentTimeMillis();

        String title = intent.getStringExtra("title");
        if (title == null || title.isEmpty()) title = "Pet Care Alert";

        String body = intent.getStringExtra("body");
        String category = intent.getStringExtra("category");
        if (category == null) {
            boolean isFeeding = intent.getBooleanExtra("isFeeding", false);
            category = isFeeding ? "feeding" : "event";
        }

        Log.d("EventAlarmReceiver", "Alarm triggered for category [" + category + "]: " + title);

        NotificationManager notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);

        String targetChannelId = CHANNEL_GENERAL;
        String defaultTitle = "Pet Care Reminder 📅";
        String actionTitle = "Mark Done";

        if ("health".equalsIgnoreCase(category) || "medication".equalsIgnoreCase(category) || "vaccination".equalsIgnoreCase(category)) {
            targetChannelId = CHANNEL_HEALTH;
            defaultTitle = "Pet Health Alert 🩺";
            actionTitle = "Mark Administered";
        } else if ("feeding".equalsIgnoreCase(category) || "food".equalsIgnoreCase(category) || "diet".equalsIgnoreCase(category)) {
            targetChannelId = CHANNEL_FEEDING;
            defaultTitle = "Meal Time for your Pet! 🍲";
            actionTitle = "Mark Fed";
        }

        // Register Channels if Android 8.0+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel healthChannel = new NotificationChannel(
                    CHANNEL_HEALTH,
                    "Pet Health & Medical Alerts",
                    NotificationManager.IMPORTANCE_HIGH
            );
            healthChannel.setDescription("Urgent reminders for medications, vaccinations, and health checkups.");
            healthChannel.enableVibration(true);
            notificationManager.createNotificationChannel(healthChannel);

            NotificationChannel feedingChannel = new NotificationChannel(
                    CHANNEL_FEEDING,
                    "Feeding & Nutrition Schedule",
                    NotificationManager.IMPORTANCE_HIGH
            );
            feedingChannel.setDescription("Daily meal times, water refills, and dietary reminders.");
            feedingChannel.enableVibration(true);
            notificationManager.createNotificationChannel(feedingChannel);

            NotificationChannel generalChannel = new NotificationChannel(
                    CHANNEL_GENERAL,
                    "Critical Pet Care & Events",
                    NotificationManager.IMPORTANCE_HIGH
            );
            generalChannel.setDescription("General pet appointments and calendar reminders.");
            generalChannel.enableVibration(true);
            notificationManager.createNotificationChannel(generalChannel);
        }

        // Action: Mark Done / Acknowledge
        Intent doneIntent = new Intent(context, ActionReceiver.class);
        doneIntent.setAction("ACTION_DONE");
        doneIntent.putExtra("eventId", eventId);
        PendingIntent donePendingIntent = PendingIntent.getBroadcast(
                context, 
                eventId.hashCode() + 1, 
                doneIntent, 
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        // Open App on tap
        Intent openAppIntent = new Intent(context, MainActivity.class);
        openAppIntent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        openAppIntent.putExtra("notification_category", category);
        openAppIntent.putExtra("notification_id", eventId);
        PendingIntent contentPendingIntent = PendingIntent.getActivity(
                context,
                eventId.hashCode(),
                openAppIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        String displayContent = (body != null && !body.isEmpty()) ? body : title;
        String displayTitle = (body != null && !body.isEmpty()) ? title : defaultTitle;

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, targetChannelId)
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentTitle(displayTitle)
                .setContentText(displayContent)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(displayContent))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true)
                .setContentIntent(contentPendingIntent)
                .addAction(android.R.drawable.checkbox_on_background, actionTitle, donePendingIntent);

        notificationManager.notify(eventId.hashCode(), builder.build());
    }
}
