import 'dart:async';
import 'dart:convert';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_reactive_ble/flutter_reactive_ble.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// One position report from a LoRa tracker, as decoded by the finder.
class FinderFix {
  final String id; // PML-XXXXXXXX
  final double? lat;
  final double? lng;
  final int altM;
  final int speedKmh;
  final double? hdop;
  final int sats;
  final int battery;
  final int flags;
  final int fixAgeS;
  final int rssi;
  final double snr;
  final DateTime receivedAt;

  const FinderFix({
    required this.id,
    this.lat,
    this.lng,
    this.altM = 0,
    this.speedKmh = 0,
    this.hdop,
    this.sats = 0,
    this.battery = 0,
    this.flags = 0,
    this.fixAgeS = 0,
    this.rssi = 0,
    this.snr = 0,
    required this.receivedAt,
  });

  // Uplink flags (firmware/shared/lib/pmlora/pmlora.h)
  bool get hasFix => flags & 0x01 != 0;
  bool get insideZone => flags & 0x02 != 0;
  bool get lostMode => flags & 0x04 != 0;
  bool get lowBattery => flags & 0x10 != 0;
  bool get ringing => flags & 0x40 != 0;
  bool get searchMode => flags & 0x80 != 0;
  bool get hasPosition => lat != null && lng != null;

  /// When the GPS position itself was taken.
  DateTime get fixTakenAt => receivedAt.subtract(Duration(seconds: fixAgeS));

  factory FinderFix.fromJson(Map<String, dynamic> j) {
    double? d(dynamic v) => v is num ? v.toDouble() : double.tryParse('$v');
    int i(dynamic v) => v is num ? v.toInt() : int.tryParse('$v') ?? 0;
    return FinderFix(
      id: '${j['id']}',
      lat: d(j['lat']),
      lng: d(j['lng']),
      altM: i(j['alt']),
      speedKmh: i(j['spd']),
      hdop: d(j['hd']),
      sats: i(j['sat']),
      battery: i(j['bat']),
      flags: i(j['f']),
      fixAgeS: i(j['age']),
      rssi: i(j['rssi']),
      snr: d(j['snr']) ?? 0,
      receivedAt: DateTime.now().subtract(Duration(seconds: i(j['ago']))),
    );
  }
}

class FinderTracker {
  final String id;
  final String name;
  const FinderTracker(this.id, this.name);
}

enum FinderLinkState { idle, scanning, connecting, connected, error }

/// Talks to a Pet Maya LoRa Finder (firmware/lora-finder) over Bluetooth LE.
/// Works with no internet: the finder hears the trackers directly over LoRa and
/// decrypts them with keys paired once (that one step needs internet).
class LoraFinderService extends ChangeNotifier {
  static final LoraFinderService _instance = LoraFinderService._();
  factory LoraFinderService() => _instance;
  LoraFinderService._();

  static final Uuid serviceUuid = Uuid.parse('7b1e0001-5a3c-4c8e-9f2d-504d4c4f5241');
  static final Uuid _fixesUuid = Uuid.parse('7b1e0002-5a3c-4c8e-9f2d-504d4c4f5241');
  static final Uuid _controlUuid = Uuid.parse('7b1e0003-5a3c-4c8e-9f2d-504d4c4f5241');
  static final Uuid _statusUuid = Uuid.parse('7b1e0004-5a3c-4c8e-9f2d-504d4c4f5241');
  static const _prefLastFinder = 'lora_finder_last_id';

  final FlutterReactiveBle _ble = FlutterReactiveBle();

  FinderLinkState state = FinderLinkState.idle;
  String? error;
  final Map<String, DiscoveredDevice> discovered = {};
  String? connectedId;
  String? connectedName;
  final Map<String, FinderFix> fixes = {};
  final List<FinderTracker> paired = [];
  final Map<String, String> commandStatus = {}; // tracker id → queued/sent/delivered/failed
  Map<String, dynamic>? info;
  bool pairing = false;

  StreamSubscription<DiscoveredDevice>? _scanSub;
  StreamSubscription<ConnectionStateUpdate>? _connSub;
  StreamSubscription<List<int>>? _fixSub;
  StreamSubscription<List<int>>? _statusSub;
  final List<FinderTracker> _listBuffer = [];
  final StreamController<String> _messages = StreamController.broadcast();

  /// Human-readable events (delivered, failed, errors) for snackbars.
  Stream<String> get messages => _messages.stream;
  bool get isConnected => state == FinderLinkState.connected;

  Future<bool> _ensurePermissions() async {
    final statuses = await [
      Permission.bluetoothScan,
      Permission.bluetoothConnect,
      Permission.locationWhenInUse,
    ].request();
    final denied = statuses.entries.where((e) => e.value.isPermanentlyDenied || e.value.isDenied).toList();
    // On iOS / older Android some of these don't exist and report "denied"; BLE status is checked below.
    if (denied.any((e) => e.key == Permission.locationWhenInUse)) {
      _fail('Location permission is needed to scan for the finder and show distance.');
      return false;
    }
    return true;
  }

  Future<void> startScan() async {
    if (!await _ensurePermissions()) return;
    if (_ble.status == BleStatus.poweredOff) {
      _fail('Turn on Bluetooth to connect to the finder.');
      return;
    }
    await _scanSub?.cancel();
    discovered.clear();
    error = null;
    state = FinderLinkState.scanning;
    notifyListeners();

    final last = (await SharedPreferences.getInstance()).getString(_prefLastFinder);
    _scanSub = _ble.scanForDevices(withServices: [serviceUuid], scanMode: ScanMode.lowLatency).listen((d) {
      discovered[d.id] = d;
      notifyListeners();
      if (d.id == last && state == FinderLinkState.scanning) connect(d); // reconnect to the usual finder
    }, onError: (e) => _fail('Scan failed: $e'));

    // Don't scan forever (battery).
    Future.delayed(const Duration(seconds: 20), () {
      if (state == FinderLinkState.scanning) stopScan();
    });
  }

  Future<void> stopScan() async {
    await _scanSub?.cancel();
    _scanSub = null;
    if (state == FinderLinkState.scanning) state = FinderLinkState.idle;
    notifyListeners();
  }

  Future<void> connect(DiscoveredDevice d) async {
    await _scanSub?.cancel();
    _scanSub = null;
    await _connSub?.cancel();
    state = FinderLinkState.connecting;
    connectedName = d.name.isEmpty ? 'Pet Maya Finder' : d.name;
    error = null;
    notifyListeners();

    _connSub = _ble.connectToDevice(id: d.id, connectionTimeout: const Duration(seconds: 15)).listen((u) async {
      if (u.connectionState == DeviceConnectionState.connected) {
        connectedId = d.id;
        try {
          await _ble.requestMtu(deviceId: d.id, mtu: 247);
        } catch (_) {} // iOS negotiates by itself
        await _subscribe(d.id);
        state = FinderLinkState.connected;
        (await SharedPreferences.getInstance()).setString(_prefLastFinder, d.id);
        notifyListeners();
        await refresh();
      } else if (u.connectionState == DeviceConnectionState.disconnected) {
        _onDisconnected(u.failure?.message);
      }
    }, onError: (e) => _onDisconnected('$e'));
  }

  Future<void> _subscribe(String deviceId) async {
    QualifiedCharacteristic chr(Uuid id) =>
        QualifiedCharacteristic(serviceId: serviceUuid, characteristicId: id, deviceId: deviceId);
    // First access to an encrypted characteristic triggers OS pairing (6-digit passkey on the finder).
    _statusSub = _ble.subscribeToCharacteristic(chr(_statusUuid)).listen(_onStatus, onError: (e) {
      _messages.add('Pairing with the finder failed. Check the 6-digit passkey and try again.');
    });
    _fixSub = _ble.subscribeToCharacteristic(chr(_fixesUuid)).listen(_onFix);
  }

  void _onDisconnected(String? reason) {
    _fixSub?.cancel();
    _statusSub?.cancel();
    final wasConnected = state == FinderLinkState.connected;
    connectedId = null;
    state = FinderLinkState.idle;
    if (wasConnected) _messages.add('Finder disconnected${reason == null || reason.isEmpty ? '' : ': $reason'}');
    notifyListeners();
  }

  Future<void> disconnect() async {
    await _connSub?.cancel();
    _connSub = null;
    _onDisconnected(null);
  }

  void _onFix(List<int> data) {
    try {
      final j = jsonDecode(utf8.decode(data)) as Map<String, dynamic>;
      if (j['t'] != 'fix') return;
      final f = FinderFix.fromJson(j);
      fixes[f.id] = f;
      notifyListeners();
    } catch (e) {
      debugPrint('[Finder] bad fix: $e');
    }
  }

  void _onStatus(List<int> data) {
    Map<String, dynamic> j;
    try {
      j = jsonDecode(utf8.decode(data)) as Map<String, dynamic>;
    } catch (_) {
      return;
    }
    final id = j['id']?.toString();
    switch (j['t']) {
      case 'tracker':
        _listBuffer.add(FinderTracker('${j['id']}', '${j['name'] ?? ''}'));
        break;
      case 'listEnd':
        paired
          ..clear()
          ..addAll(_listBuffer);
        _listBuffer.clear();
        break;
      case 'info':
        info = j;
        break;
      case 'queued':
      case 'sent':
        if (id != null) commandStatus[id] = '${j['t']}';
        break;
      case 'delivered':
        if (id != null) commandStatus[id] = 'delivered';
        _messages.add('${_nameOf(id)}: ${j['cmd']} delivered ✓');
        break;
      case 'failed':
        if (id != null) commandStatus[id] = 'failed';
        _messages.add('${_nameOf(id)}: ${j['cmd']} not acknowledged — out of range?');
        break;
      case 'ack':
        if (j['ok'] != true) _messages.add('Finder: ${j['op']} failed (${j['err'] ?? 'error'})');
        break;
    }
    notifyListeners();
  }

  String _nameOf(String? id) {
    final t = paired.where((p) => p.id == id).firstOrNull;
    return (t?.name.isNotEmpty ?? false) ? t!.name : (id ?? 'Tracker');
  }

  String displayName(String id) => _nameOf(id);

  Future<void> _send(Map<String, dynamic> msg) async {
    final id = connectedId;
    if (id == null) throw StateError('Finder not connected');
    await _ble.writeCharacteristicWithResponse(
      QualifiedCharacteristic(serviceId: serviceUuid, characteristicId: _controlUuid, deviceId: id),
      value: utf8.encode(jsonEncode(msg)),
    );
  }

  Future<void> refresh() async {
    try {
      await _send({'op': 'info'});
      await _send({'op': 'list'});
      await _send({'op': 'dump'});
    } catch (e) {
      debugPrint('[Finder] refresh: $e');
    }
  }

  /// Rings the tracker's buzzer on its next report (it only listens right after transmitting).
  Future<void> ring(String trackerId) => _command({'op': 'ring', 'id': trackerId});

  /// Asks the tracker to report as fast as allowed for [minutes] (0 = stop).
  Future<void> search(String trackerId, {int minutes = 30}) =>
      _command({'op': 'search', 'id': trackerId, 'min': minutes});

  Future<void> _command(Map<String, dynamic> msg) async {
    try {
      await _send(msg);
      commandStatus[msg['id'] as String] = 'queued';
      notifyListeners();
    } catch (e) {
      _messages.add('Could not reach the finder: $e');
    }
  }

  /// One-time (needs internet): give the finder the keys of every LoRa tracker this
  /// user owns. Keys come from the get_tracker_key Cloud Function (owner-only).
  Future<int> pairMyTrackers(String uid) async {
    pairing = true;
    notifyListeners();
    var added = 0;
    try {
      final snap = await FirebaseFirestore.instance.collection('devices').where('ownerId', isEqualTo: uid).get();
      final lora = snap.docs.where((d) => d.id.startsWith('PML-')).toList();
      if (lora.isEmpty) {
        _messages.add('No LoRa trackers linked to your account yet.');
        return 0;
      }
      final fn = FirebaseFunctions.instance.httpsCallable('get_tracker_key');
      for (final d in lora) {
        final res = await fn.call({'deviceId': d.id});
        final key = (res.data as Map)['key'] as String;
        final name = (d.data()['petName'] ?? d.data()['name'] ?? '').toString();
        await _send({'op': 'add', 'id': d.id, 'key': key, 'name': name.length > 23 ? name.substring(0, 23) : name});
        added++;
      }
      await _send({'op': 'list'});
      _messages.add('Paired $added tracker${added == 1 ? '' : 's'} with the finder — works offline from now on.');
    } on FirebaseFunctionsException catch (e) {
      _messages.add('Pairing needs internet once: ${e.message ?? e.code}');
    } catch (e) {
      _messages.add('Pairing failed: $e');
    } finally {
      pairing = false;
      notifyListeners();
    }
    return added;
  }

  Future<void> removeTracker(String trackerId) async {
    await _send({'op': 'remove', 'id': trackerId});
    fixes.remove(trackerId);
    await _send({'op': 'list'});
  }

  void _fail(String msg) {
    error = msg;
    state = FinderLinkState.error;
    _messages.add(msg);
    notifyListeners();
  }
}
