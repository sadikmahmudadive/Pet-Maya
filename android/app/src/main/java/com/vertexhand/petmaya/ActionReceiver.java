package com.vertexhand.petmaya;

import android.app.NotificationManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

public class ActionReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        String eventId = intent.getStringExtra("eventId");

        if ("ACTION_DONE".equals(action)) {
            Log.d("ActionReceiver", "Event marked as DONE: " + eventId);
            
            // In a real app, you would send a background update to Firebase here.
            // For now, we dismiss the notification.
            NotificationManager notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            notificationManager.cancel(eventId.hashCode());
        }
    }
}
