import 'dart:async';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';

import '../models/call_model.dart';

enum CallPhase { preparing, ringing, connecting, connected, reconnecting, ended }

/// One WebRTC tele-vet call (either side). Signaling goes through Firestore
/// `calls/{id}` (offer/answer/status) and its candidate sub-collections.
class CallSession extends ChangeNotifier {
  CallSession._({required this.callId, required this.isCaller, required this.myUid});

  static const Duration ringTimeout = Duration(seconds: 60);
  static const Duration reconnectGrace = Duration(seconds: 20);

  final String callId;
  final bool isCaller;
  final String myUid;

  final FirebaseFirestore _db = FirebaseFirestore.instance;
  DocumentReference<Map<String, dynamic>> get _doc => _db.collection('calls').doc(callId);
  String get _myCandidates => isCaller ? 'callerCandidates' : 'calleeCandidates';
  String get _theirCandidates => isCaller ? 'calleeCandidates' : 'callerCandidates';

  final RTCVideoRenderer localRenderer = RTCVideoRenderer();
  final RTCVideoRenderer remoteRenderer = RTCVideoRenderer();

  RTCPeerConnection? _pc;
  MediaStream? _localStream;
  StreamSubscription<DocumentSnapshot<Map<String, dynamic>>>? _callSub;
  StreamSubscription<QuerySnapshot<Map<String, dynamic>>>? _candSub;
  Timer? _ringTimer;
  Timer? _reconnectTimer;

  final List<Map<String, dynamic>> _pendingLocalCandidates = [];
  final List<RTCIceCandidate> _pendingRemoteCandidates = [];
  bool _callDocExists = false;
  bool _remoteDescriptionSet = false;
  bool _disposed = false;
  bool _closing = false;

  CallPhase phase = CallPhase.preparing;
  CallModel? call;
  String? endReason;
  String? error;
  bool isMuted = false;
  bool isVideoOff = false;
  bool isFrontCamera = true;
  bool speakerOn = true;
  bool hasRemoteVideo = false;
  DateTime? connectedAt;

  /// ICE servers (STUN + short-lived TURN credentials) from the backend.
  static Future<List<Map<String, dynamic>>> fetchIceServers() async {
    try {
      final res = await FirebaseFunctions.instance.httpsCallable('get_ice_servers').call();
      final list = (res.data['iceServers'] as List).map((e) => Map<String, dynamic>.from(e as Map)).toList();
      if (list.isNotEmpty) return list;
    } catch (e) {
      debugPrint('[CallSession] get_ice_servers failed, falling back to STUN: $e');
    }
    return [
      {
        'urls': ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'],
      },
    ];
  }

  // ─── Outgoing ──────────────────────────────────────────────────────────────
  static Future<CallSession> startOutgoing({
    required String myUid,
    required String myName,
    String? myPhoto,
    required String calleeId,
    required String calleeName,
    required String petId,
    required String petName,
    String? appointmentId,
  }) async {
    final ref = FirebaseFirestore.instance.collection('calls').doc();
    final s = CallSession._(callId: ref.id, isCaller: true, myUid: myUid);
    try {
      await s._prepareMedia();
      await s._createPeer(await fetchIceServers());

      final offer = await s._pc!.createOffer({'offerToReceiveAudio': 1, 'offerToReceiveVideo': 1});
      await s._pc!.setLocalDescription(offer);

      final nowMs = DateTime.now().millisecondsSinceEpoch;
      await ref.set({
        'callerId': myUid,
        'calleeId': calleeId,
        'callerName': myName,
        'calleeName': calleeName,
        'callerPhoto': ?((myPhoto != null && myPhoto.startsWith('http')) ? myPhoto : null),
        'petId': petId,
        'petName': petName,
        'appointmentId': appointmentId ?? '',
        'status': 'ringing',
        'video': true,
        'participants': [myUid, calleeId],
        'createdAt': FieldValue.serverTimestamp(),
        'createdAtMs': nowMs,
        'offer': {'type': offer.type, 'sdp': offer.sdp},
      });
      s._callDocExists = true;
      await s._flushLocalCandidates();

      s._setPhase(CallPhase.ringing);
      s._listenToCall();
      s._listenToCandidates();
      s._ringTimer = Timer(ringTimeout, () => s._markUnansweredAndEnd());
    } catch (e) {
      s._fail(e);
    }
    return s;
  }

  // ─── Incoming (user already tapped Accept) ─────────────────────────────────
  static Future<CallSession> answerIncoming({required String callId, required String myUid}) async {
    final s = CallSession._(callId: callId, isCaller: false, myUid: myUid);
    try {
      final snap = await s._doc.get();
      final data = snap.data();
      if (data == null) throw StateError('This call no longer exists.');
      s.call = CallModel.fromMap(callId, data);
      if (s.call!.calleeId != myUid) throw StateError('This call is not for you.');
      if (s.call!.status != 'ringing') {
        s.endReason = s.call!.status == 'cancelled' || s.call!.status == 'missed'
            ? 'The caller hung up before you answered.'
            : 'This call has already ended.';
        s._setPhase(CallPhase.ended);
        return s;
      }
      final offer = s.call!.offer;
      if (offer == null) throw StateError('Call offer missing.');

      await s._prepareMedia();
      await s._createPeer(await fetchIceServers());
      await s._pc!.setRemoteDescription(RTCSessionDescription(offer['sdp'], offer['type']));
      s._remoteDescriptionSet = true;

      final answer = await s._pc!.createAnswer();
      await s._pc!.setLocalDescription(answer);
      s._callDocExists = true;

      // Fails (permission-denied) if the caller cancelled in the meantime.
      await s._doc.update({
        'status': 'accepted',
        'answeredAt': DateTime.now().millisecondsSinceEpoch,
        'answer': {'type': answer.type, 'sdp': answer.sdp},
      });
      await s._flushLocalCandidates();

      s._setPhase(CallPhase.connecting);
      s._listenToCall();
      s._listenToCandidates();
    } catch (e) {
      s._fail(e);
    }
    return s;
  }

  // ─── Media / peer connection ───────────────────────────────────────────────
  Future<void> _prepareMedia() async {
    await localRenderer.initialize();
    await remoteRenderer.initialize();
    _localStream = await navigator.mediaDevices.getUserMedia({
      'audio': {'echoCancellation': true, 'noiseSuppression': true, 'autoGainControl': true},
      'video': {
        'facingMode': 'user',
        'width': {'ideal': 960},
        'height': {'ideal': 540},
        'frameRate': {'ideal': 24, 'max': 30},
      },
    });
    localRenderer.srcObject = _localStream;
    await Helper.setSpeakerphoneOn(true);
  }

  Future<void> _createPeer(List<Map<String, dynamic>> iceServers) async {
    final pc = await createPeerConnection({
      'iceServers': iceServers,
      'sdpSemantics': 'unified-plan',
      'bundlePolicy': 'max-bundle',
    });
    _pc = pc;

    for (final track in _localStream!.getTracks()) {
      await pc.addTrack(track, _localStream!);
    }

    pc.onIceCandidate = (RTCIceCandidate c) {
      if (c.candidate == null) return;
      final map = {'candidate': c.candidate, 'sdpMid': c.sdpMid, 'sdpMLineIndex': c.sdpMLineIndex};
      if (_callDocExists) {
        _doc.collection(_myCandidates).add(map).then(
              (_) {},
              onError: (e) => debugPrint('[CallSession] candidate write failed: $e'),
            );
      } else {
        _pendingLocalCandidates.add(map);
      }
    };

    pc.onTrack = (RTCTrackEvent e) {
      if (e.streams.isNotEmpty) {
        remoteRenderer.srcObject = e.streams.first;
        hasRemoteVideo = e.track.kind == 'video' || hasRemoteVideo;
        notifyListeners();
      }
    };

    pc.onIceConnectionState = (RTCIceConnectionState state) {
      if (_disposed || phase == CallPhase.ended) return;
      switch (state) {
        case RTCIceConnectionState.RTCIceConnectionStateConnected:
        case RTCIceConnectionState.RTCIceConnectionStateCompleted:
          _reconnectTimer?.cancel();
          connectedAt ??= DateTime.now();
          _setPhase(CallPhase.connected);
          break;
        case RTCIceConnectionState.RTCIceConnectionStateDisconnected:
          if (phase == CallPhase.connected) {
            _setPhase(CallPhase.reconnecting);
            _reconnectTimer?.cancel();
            _reconnectTimer = Timer(reconnectGrace, () => hangUp(reason: 'connection_lost'));
          }
          break;
        case RTCIceConnectionState.RTCIceConnectionStateFailed:
          hangUp(reason: 'connection_failed');
          break;
        default:
          break;
      }
    };
  }

  Future<void> _flushLocalCandidates() async {
    if (_pendingLocalCandidates.isEmpty) return;
    final batch = _db.batch();
    for (final c in _pendingLocalCandidates) {
      batch.set(_doc.collection(_myCandidates).doc(), c);
    }
    _pendingLocalCandidates.clear();
    await batch.commit();
  }

  // ─── Signaling listeners ───────────────────────────────────────────────────
  void _listenToCall() {
    _callSub = _doc.snapshots().listen((snap) async {
      final data = snap.data();
      if (data == null || _disposed) return;
      final model = CallModel.fromMap(callId, data);
      call = model;

      if (isCaller && model.answer != null && !_remoteDescriptionSet && model.status == 'accepted') {
        _ringTimer?.cancel();
        _remoteDescriptionSet = true;
        try {
          await _pc?.setRemoteDescription(RTCSessionDescription(model.answer!['sdp'], model.answer!['type']));
          await _drainRemoteCandidates();
          _setPhase(CallPhase.connecting);
        } catch (e) {
          _fail(e);
        }
      }

      if (model.isTerminal && phase != CallPhase.ended) {
        endReason = _describeEnd(model);
        await _teardown();
        _setPhase(CallPhase.ended);
      }
    }, onError: (e) => debugPrint('[CallSession] call listener error: $e'));
  }

  void _listenToCandidates() {
    _candSub = _doc.collection(_theirCandidates).snapshots().listen((snap) async {
      for (final change in snap.docChanges) {
        if (change.type != DocumentChangeType.added) continue;
        final d = change.doc.data();
        if (d == null) continue;
        final cand = RTCIceCandidate(d['candidate'], d['sdpMid'], (d['sdpMLineIndex'] as num?)?.toInt());
        if (_remoteDescriptionSet) {
          try {
            await _pc?.addCandidate(cand);
          } catch (e) {
            debugPrint('[CallSession] addCandidate failed: $e');
          }
        } else {
          _pendingRemoteCandidates.add(cand);
        }
      }
    }, onError: (e) => debugPrint('[CallSession] candidate listener error: $e'));
  }

  Future<void> _drainRemoteCandidates() async {
    for (final c in List<RTCIceCandidate>.from(_pendingRemoteCandidates)) {
      try {
        await _pc?.addCandidate(c);
      } catch (_) {}
    }
    _pendingRemoteCandidates.clear();
  }

  String _describeEnd(CallModel m) {
    switch (m.status) {
      case 'declined':
        return isCaller ? 'The vet is unavailable right now and declined the call.' : 'Call declined.';
      case 'busy':
        return 'The other party is on another call. Please try again shortly.';
      case 'missed':
        return isCaller ? 'No answer. Please try again or book an appointment.' : 'Call missed.';
      case 'cancelled':
        return 'The caller hung up.';
      default:
        return m.endReason == 'connection_lost' || m.endReason == 'connection_failed'
            ? 'The connection was lost.'
            : 'Call ended.';
    }
  }

  // ─── Controls ──────────────────────────────────────────────────────────────
  void toggleMute() {
    isMuted = !isMuted;
    for (final t in _localStream?.getAudioTracks() ?? <MediaStreamTrack>[]) {
      t.enabled = !isMuted;
    }
    notifyListeners();
  }

  void toggleVideo() {
    isVideoOff = !isVideoOff;
    for (final t in _localStream?.getVideoTracks() ?? <MediaStreamTrack>[]) {
      t.enabled = !isVideoOff;
    }
    notifyListeners();
  }

  Future<void> switchCamera() async {
    final tracks = _localStream?.getVideoTracks() ?? [];
    if (tracks.isEmpty) return;
    await Helper.switchCamera(tracks.first);
    isFrontCamera = !isFrontCamera;
    notifyListeners();
  }

  Future<void> toggleSpeaker() async {
    speakerOn = !speakerOn;
    await Helper.setSpeakerphoneOn(speakerOn);
    notifyListeners();
  }

  /// Seconds since the media connection was established.
  int get elapsedSeconds => connectedAt == null ? 0 : DateTime.now().difference(connectedAt!).inSeconds;

  // ─── Ending ────────────────────────────────────────────────────────────────
  Future<void> _markUnansweredAndEnd() async {
    if (phase != CallPhase.ringing) return;
    await _setStatus(const {'ringing'}, 'missed', reason: 'timeout');
  }

  /// Ends/cancels/declines according to the current lifecycle state.
  Future<void> hangUp({String? reason}) async {
    if (_closing || phase == CallPhase.ended) return;
    _closing = true;
    final status = call?.status ?? (isCaller ? 'ringing' : 'accepted');
    try {
      if (status == 'ringing') {
        await _setStatus(const {'ringing'}, isCaller ? 'cancelled' : 'declined', reason: reason ?? 'user');
      } else if (status == 'accepted') {
        await _setStatus(const {'accepted'}, 'ended', reason: reason ?? 'user');
      }
    } catch (e) {
      debugPrint('[CallSession] hangUp status write failed: $e');
    }
    endReason ??= 'Call ended.';
    await _teardown();
    _setPhase(CallPhase.ended);
  }

  Future<void> _setStatus(Set<String> from, String to, {String? reason}) async {
    try {
      await _db.runTransaction((tx) async {
        final snap = await tx.get(_doc);
        if (!snap.exists || !from.contains(snap.data()?['status'])) return;
        tx.update(_doc, {
          'status': to,
          'endedAt': DateTime.now().millisecondsSinceEpoch,
          'endedBy': myUid,
          'endReason': ?reason,
        });
      });
    } catch (e) {
      debugPrint('[CallSession] status->$to failed: $e');
    }
  }

  Future<void> _teardown() async {
    _ringTimer?.cancel();
    _reconnectTimer?.cancel();
    await _candSub?.cancel();
    _candSub = null;
    for (final t in _localStream?.getTracks() ?? <MediaStreamTrack>[]) {
      await t.stop();
    }
    await _localStream?.dispose();
    _localStream = null;
    await _pc?.close();
    _pc = null;
  }

  void _fail(Object e) {
    debugPrint('[CallSession] error: $e');
    error = e is StateError ? e.message : _friendly(e);
    endReason = error;
    _teardown().then((_) {
      if (isCaller && _callDocExists) _setStatus(const {'ringing', 'accepted'}, 'ended', reason: 'error');
      _setPhase(CallPhase.ended);
    });
  }

  String _friendly(Object e) {
    final s = e.toString();
    if (s.contains('NotAllowed') || s.contains('Permission')) {
      return 'Camera and microphone access is needed for video calls. Enable it in Settings.';
    }
    if (s.contains('permission-denied')) {
      return 'The call is no longer available.';
    }
    return 'Could not set up the call. Check your connection and try again.';
  }

  void _setPhase(CallPhase p) {
    if (_disposed || phase == p) return;
    phase = p;
    notifyListeners();
  }

  @override
  void dispose() {
    if (_disposed) return;
    _disposed = true;
    _callSub?.cancel();
    _teardown();
    localRenderer.srcObject = null;
    remoteRenderer.srcObject = null;
    localRenderer.dispose();
    remoteRenderer.dispose();
    super.dispose();
  }
}
