package com.vertexhand.petmaya;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;
import androidx.core.app.NotificationCompat;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import java.util.Map;

public class MyFirebaseMessagingService extends FirebaseMessagingService {
    private static final String TAG = "MyFirebaseMsgService";
    private static final String CHANNEL_HEALTH = "health_alerts_channel";
    private static final String CHANNEL_FEEDING = "feeding_schedule_channel";
    private static final String CHANNEL_GENERAL = "push_notifications";

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        Log.d(TAG, "Push message received from: " + remoteMessage.getFrom());

        String title = "Pet Maya Alert";
        String body = "";
        String category = "general";

        Map<String, String> data = remoteMessage.getData();
        if (data != null && !data.isEmpty()) {
            Log.d(TAG, "Data payload: " + data);
            if (data.containsKey("title")) title = data.get("title");
            if (data.containsKey("message")) body = data.get("message");
            if (data.containsKey("body")) body = data.get("body");
            if (data.containsKey("category")) category = data.get("category");
            if (data.containsKey("type")) category = data.get("type");
        }

        if (remoteMessage.getNotification() != null) {
            if (remoteMessage.getNotification().getTitle() != null) {
                title = remoteMessage.getNotification().getTitle();
            }
            if (remoteMessage.getNotification().getBody() != null) {
                body = remoteMessage.getNotification().getBody();
            }
        }

        showNotification(title, body, category);
    }

    private void showNotification(String title, String body, String category) {
        NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);

        String channelId = CHANNEL_GENERAL;
        if ("health".equalsIgnoreCase(category) || "medication".equalsIgnoreCase(category) || "vaccine".equalsIgnoreCase(category)) {
            channelId = CHANNEL_HEALTH;
        } else if ("feeding".equalsIgnoreCase(category) || "food".equalsIgnoreCase(category) || "diet".equalsIgnoreCase(category)) {
            channelId = CHANNEL_FEEDING;
        }

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
                    "Pet Maya Push Alerts",
                    NotificationManager.IMPORTANCE_HIGH
            );
            generalChannel.setDescription("App updates and system broadcasts");
            generalChannel.enableVibration(true);
            notificationManager.createNotificationChannel(generalChannel);
        }

        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        intent.putExtra("notification_category", category);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this, 
                (int) System.currentTimeMillis(), 
                intent, 
                PendingIntent.FLAG_ONE_SHOT | PendingIntent.FLAG_IMMUTABLE
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, channelId)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                .setAutoCancel(true)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setVibrate(new long[]{0, 250, 250, 250})
                .setContentIntent(pendingIntent);

        notificationManager.notify((int) System.currentTimeMillis(), builder.build());
    }

    @Override
    public void onNewToken(String token) {
        Log.d(TAG, "Refreshed token: " + token);
    }
}
