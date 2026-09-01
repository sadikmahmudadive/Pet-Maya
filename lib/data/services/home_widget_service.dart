import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:home_widget/home_widget.dart';

class HomeWidgetService {
  static const String _groupId = 'group.com.vertexhand.petmaya';
  static StreamSubscription<Uri?>? _widgetClickSubscription;

  /// Initialize HomeWidget and register click handlers
  static Future<void> init({void Function(Uri uri)? onDeepLink}) async {
    try {
      await HomeWidget.setAppGroupId(_groupId);

      // Check if launched from a widget click
      final initialUri = await HomeWidget.initiallyLaunchedFromHomeWidget();
      if (initialUri != null && onDeepLink != null) {
        debugPrint('[HomeWidget] Launched from initial widget click: $initialUri');
        onDeepLink(initialUri);
      }

      // Listen for runtime widget clicks
      _widgetClickSubscription?.cancel();
      _widgetClickSubscription = HomeWidget.widgetClicked.listen((uri) {
        if (uri != null && onDeepLink != null) {
          debugPrint('[HomeWidget] Received runtime widget click: $uri');
          onDeepLink(uri);
        }
      });

      debugPrint('[HomeWidget] Service initialized successfully');
    } catch (e) {
      debugPrint('[HomeWidget] Init error: $e');
    }
  }

  /// Update Pet Status & Radar Widget
  static Future<void> updatePetStatusWidget({
    String petName = 'Max (Golden Retriever)',
    String battery = '🔋 88%',
    String safeZoneStatus = '🟢 Inside Safe Zone',
    String activityScore = '⚡ Activity: 94/100',
  }) async {
    try {
      await HomeWidget.saveWidgetData<String>('widget_pet_name', petName);
      await HomeWidget.saveWidgetData<String>('widget_battery', battery);
      await HomeWidget.saveWidgetData<String>('widget_safezone_status', safeZoneStatus);
      await HomeWidget.saveWidgetData<String>('widget_activity_score', activityScore);

      await HomeWidget.updateWidget(
        name: 'PetStatusWidgetProvider',
        androidName: 'PetStatusWidgetProvider',
        qualifiedAndroidName: 'com.vertexhand.petmaya.PetStatusWidgetProvider',
      );
      debugPrint('[HomeWidget] PetStatusWidget updated');
    } catch (e) {
      debugPrint('[HomeWidget] updatePetStatusWidget error: $e');
    }
  }

  /// Update Care & Vaccine Reminder Widget
  static Future<void> updateCareReminderWidget({
    String title = 'Rabies Annual Booster',
    String petInfo = 'Patient: Max • Greenwood Clinic',
    String due = '⏳ Due in 4 days',
  }) async {
    try {
      await HomeWidget.saveWidgetData<String>('widget_care_title', title);
      await HomeWidget.saveWidgetData<String>('widget_care_pet', petInfo);
      await HomeWidget.saveWidgetData<String>('widget_care_due', due);

      await HomeWidget.updateWidget(
        name: 'CareReminderWidgetProvider',
        androidName: 'CareReminderWidgetProvider',
        qualifiedAndroidName: 'com.vertexhand.petmaya.CareReminderWidgetProvider',
      );
      debugPrint('[HomeWidget] CareReminderWidget updated');
    } catch (e) {
      debugPrint('[HomeWidget] updateCareReminderWidget error: $e');
    }
  }

  /// Update Quick Actions Widget
  static Future<void> updateQuickActionsWidget() async {
    try {
      await HomeWidget.updateWidget(
        name: 'QuickActionsWidgetProvider',
        androidName: 'QuickActionsWidgetProvider',
        qualifiedAndroidName: 'com.vertexhand.petmaya.QuickActionsWidgetProvider',
      );
      debugPrint('[HomeWidget] QuickActionsWidget updated');
    } catch (e) {
      debugPrint('[HomeWidget] updateQuickActionsWidget error: $e');
    }
  }

  /// Sync all widgets simultaneously with current app state
  static Future<void> syncAllWidgets({
    String? petName,
    String? petBreed,
    String? battery,
    bool isInsideSafeZone = true,
    int activityScore = 94,
    String? nextCareTitle,
    String? nextCareDue,
  }) async {
    final displayName = (petName != null && petBreed != null)
        ? '$petName ($petBreed)'
        : (petName ?? 'Max (Golden Retriever)');

    final safeZoneText = isInsideSafeZone
        ? '🟢 Inside Safe Zone (Home Radar)'
        : '🚨 Safe Zone Breach Alert!';

    await updatePetStatusWidget(
      petName: displayName,
      battery: battery ?? '🔋 88%',
      safeZoneStatus: safeZoneText,
      activityScore: '⚡ Activity: $activityScore/100',
    );

    final resolvedPetName = petName ?? 'Max';
    await updateCareReminderWidget(
      title: nextCareTitle ?? 'Rabies Annual Booster',
      petInfo: 'Patient: $resolvedPetName • Greenwood Clinic',
      due: nextCareDue ?? '⏳ Scheduled on time',
    );

    await updateQuickActionsWidget();
  }

  static void dispose() {
    _widgetClickSubscription?.cancel();
  }
}
