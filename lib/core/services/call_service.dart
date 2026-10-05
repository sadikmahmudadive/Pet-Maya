import 'dart:async';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_callkit_incoming/entities/entities.dart';
import 'package:flutter_callkit_incoming/flutter_callkit_incoming.dart';

import '../../data/models/call_model.dart';

/// Owns everything about *incoming* tele-vet calls: the native ringing UI
/// (CallKit on iOS, full-screen heads-up on Android), Accept/Decline handling,
/// and a foreground Firestore listener so calls ring even when the push is late.
class CallService {
  static final CallService _instance = CallService._internal();
  factory CallService() => _instance;
  CallService._internal();

  static const int _ringMs = 60000;

  /// Set by the app shell: pushes the in-call screen for an accepted call.
  void Function(CallModel call)? openIncomingScreen;

  String? _uid;
  String? activeCallId; // call currently on screen (either direction)
  StreamSubscription<QuerySnapshot<Map<String, dynamic>>>? _incomingSub;
  StreamSubscription<CallEvent?>? _eventSub;
  final Set<String> _shown = {};

  // ─── Lifecycle ─────────────────────────────────────────────────────────────
  void start(String uid) {
    if (_uid == uid) return;
    stop();
    _uid = uid;

    _eventSub = FlutterCallkitIncoming.onEvent.listen(_onCallkitEvent);

    _incomingSub = FirebaseFirestore.instance
        .collection('calls')
        .where('calleeId', isEqualTo: uid)
        .where('status', isEqualTo: 'ringing')
        .snapshots()
        .listen((snap) {
      for (final change in snap.docChanges) {
        final data = change.doc.data();
        if (data == null) continue;
        final call = CallModel.fromMap(change.doc.id, data);
        if (change.type == DocumentChangeType.removed) {
          hideIncoming(call.id);
        } else if (change.type == DocumentChangeType.added && _isFresh(call)) {
          showIncoming(
            callId: call.id,
            callerName: call.callerName,
            callerId: call.callerId,
            petName: call.petName,
            appointmentId: call.appointmentId,
            photo: call.callerPhoto,
          );
        }
      }
    }, onError: (e) => debugPrint('[CallService] incoming listener error: $e'));

    _resumeAcceptedFromColdStart();
  }

  Future<void> stop() async {
    await _incomingSub?.cancel();
    await _eventSub?.cancel();
    _incomingSub = null;
    _eventSub = null;
    _uid = null;
    activeCallId = null;
    _shown.clear();
    try {
      await FlutterCallkitIncoming.endAllCalls();
    } catch (_) {}
  }

  bool _isFresh(CallModel c) =>
      c.createdAtMs == 0 || DateTime.now().millisecondsSinceEpoch - c.createdAtMs < _ringMs;

  // ─── Native incoming-call UI ───────────────────────────────────────────────
  /// Safe to call from the FCM background isolate.
  static Future<void> showIncoming({
    required String callId,
    required String callerName,
    required String callerId,
    String petName = '',
    String? appointmentId,
    String? photo,
  }) async {
    final self = CallService();
    if (!self._shown.add(callId)) return; // already ringing
    if (self.activeCallId != null) return; // server marks the call busy

    // Don't ring for calls that were already cancelled/answered by the time
    // a delayed push arrived.
    try {
      final snap = await FirebaseFirestore.instance.collection('calls').doc(callId).get();
      final status = snap.data()?['status'];
      if (status != null && status != 'ringing') return;
    } catch (_) {}

    final params = CallKitParams(
      id: callId,
      nameCaller: callerName,
      appName: 'Pet Maya',
      avatar: (photo != null && photo.startsWith('http')) ? photo : null,
      handle: petName.isEmpty ? 'Video consultation' : 'Video consultation • $petName',
      type: 1, // video
      duration: _ringMs,
      missedCallNotification: const NotificationParams(
        showNotification: false, // the backend leaves an in-app + push "missed call"
      ),
      extra: {'callerId': callerId, 'petName': petName, 'appointmentId': appointmentId ?? ''},
      android: const AndroidParams(
        isCustomNotification: true,
        isShowLogo: false,
        ringtonePath: 'system_ringtone_default',
        backgroundColor: '#0F172A',
        actionColor: '#22C55E',
        textColor: '#ffffff',
        incomingCallNotificationChannelName: 'Incoming video calls',
        missedCallNotificationChannelName: 'Missed calls',
        isShowFullLockedScreen: true,
        textAccept: 'Answer',
        textDecline: 'Decline',
      ),
      ios: const IOSParams(
        iconName: 'CallKitLogo',
        handleType: 'generic',
        supportsVideo: true,
        maximumCallGroups: 1,
        maximumCallsPerCallGroup: 1,
      ),
    );
    await FlutterCallkitIncoming.showCallkitIncoming(params);
  }

  static Future<void> hideIncoming(String callId) async {
    // Answered on this device: leave the native call session alone.
    if (CallService().activeCallId == callId) return;
    CallService()._shown.remove(callId);
    try {
      await FlutterCallkitIncoming.endCall(callId);
    } catch (e) {
      debugPrint('[CallService] hideIncoming: $e');
    }
  }

  // ─── Callkit events ────────────────────────────────────────────────────────
  Future<void> _onCallkitEvent(CallEvent? event) async {
    if (event == null) return;
    if (event is CallEventActionCallAccept) {
      await _openIncoming(event.callKitParams.id);
    } else if (event is CallEventActionCallDecline) {
      await declineCall(event.callKitParams.id);
    }
  }

  /// Decline without opening the app (also used from the background isolate).
  static Future<void> declineCall(String callId) async {
    CallService()._shown.remove(callId);
    try {
      final ref = FirebaseFirestore.instance.collection('calls').doc(callId);
      await FirebaseFirestore.instance.runTransaction((tx) async {
        final snap = await tx.get(ref);
        if (snap.data()?['status'] != 'ringing') return;
        tx.update(ref, {
          'status': 'declined',
          'endedAt': DateTime.now().millisecondsSinceEpoch,
          'endedBy': FirebaseAuth.instance.currentUser?.uid,
          'endReason': 'declined',
        });
      });
    } catch (e) {
      debugPrint('[CallService] decline failed: $e');
    }
  }

  Future<void> _openIncoming(String callId) async {
    // Cold start: wait (up to ~12s) for auth + navigator before routing.
    for (var i = 0; i < 40; i++) {
      if (FirebaseAuth.instance.currentUser != null && openIncomingScreen != null) break;
      await Future<void>.delayed(const Duration(milliseconds: 300));
    }
    final open = openIncomingScreen;
    if (open == null) return;
    try {
      final snap = await FirebaseFirestore.instance.collection('calls').doc(callId).get();
      if (!snap.exists) return;
      open(CallModel.fromMap(callId, snap.data()!));
    } catch (e) {
      debugPrint('[CallService] could not open call $callId: $e');
    }
  }

  /// App was launched by tapping Answer on a native call UI.
  Future<void> _resumeAcceptedFromColdStart() async {
    try {
      final calls = await FlutterCallkitIncoming.activeCalls();
      for (final c in calls) {
        if (c.isAccepted && activeCallId != c.id) {
          await _openIncoming(c.id);
          break;
        }
      }
    } catch (_) {}
  }

  /// Called by the in-call screen so the native UI knows the call is live/over.
  Future<void> markConnected(String callId) async {
    try {
      await FlutterCallkitIncoming.setCallConnected(callId);
    } catch (_) {}
  }

  Future<void> markEnded(String callId) async {
    if (activeCallId == callId) activeCallId = null;
    _shown.remove(callId);
    try {
      await FlutterCallkitIncoming.endCall(callId);
    } catch (_) {}
  }
}
