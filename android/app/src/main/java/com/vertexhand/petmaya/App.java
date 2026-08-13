package com.vertexhand.petmaya;

import android.app.Application;
import android.util.Log;
import com.google.firebase.database.FirebaseDatabase;

public class App extends Application {
    private static final String TAG = "PetMayaApp";

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "Application started. Initializing Offline-First architecture.");

        // Requirement 1: Enable Disk Persistence & High-Speed Cache
        // This caches all RTDB data for offline access.
        try {
            FirebaseDatabase.getInstance().setPersistenceEnabled(true);
            // Increase cache size to 100MB for faster large-dataset retrieval
            FirebaseDatabase.getInstance().setPersistenceCacheSizeBytes(100 * 1024 * 1024);
            Log.d(TAG, "Firebase persistence enabled with 100MB cache.");
        } catch (Exception e) {
            Log.e(TAG, "Failed to enable Firebase persistence: " + e.getMessage());
        }
    }
}
