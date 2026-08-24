package com.vertexhand.petmaya;

import android.util.Log;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

/**
 * Custom FirebaseMessagingService.
 * Notification display is handled on the Flutter side via the background handler 
 * to ensure UI consistency and premium styling.
 */
public class MyFirebaseMessagingService extends FirebaseMessagingService {
    private static final String TAG = "MyFirebaseMsgService";

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        // We log the message for debugging, but we do NOT call showNotification here.
        // The Flutter firebase_messaging plugin will trigger the background handler 
        // defined in Dart, which will show the styled local notification.
        Log.d(TAG, "FCM message received. Handling via Flutter background listener.");
    }

    @Override
    public void onNewToken(String token) {
        Log.d(TAG, "Refreshed token: " + token);
    }
}
