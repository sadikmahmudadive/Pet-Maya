import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:provider/provider.dart';

import '../../../core/services/lora_finder_service.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/repositories/app_state_repository.dart';
import '../../common_widgets/glass_scaffold.dart';

/// Offline pet finding: a Pet Maya LoRa Finder hears the collar directly and
/// streams it to this screen over Bluetooth. No gateway, SIM or internet needed
/// (map tiles need internet or a cached area; distance + direction never do).
class LoraFinderScreen extends StatefulWidget {
  const LoraFinderScreen({super.key});

  @override
  State<LoraFinderScreen> createState() => _LoraFinderScreenState();
}

class _LoraFinderScreenState extends State<LoraFinderScreen> {
  final finder = LoraFinderService();
  StreamSubscription<String>? _msgSub;
  StreamSubscription<Position>? _posSub;
  Position? _me;
  GoogleMapController? _map;
  Timer? _ticker;
  bool _followedFirstFix = false;

  @override
  void initState() {
    super.initState();
    finder.addListener(_onFinder);
    _msgSub = finder.messages.listen((m) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(m)));
    });
    _startLocation();
    _ticker = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() {}); // "heard 12 s ago" counters
    });
    if (!finder.isConnected) finder.startScan();
  }

  Future<void> _startLocation() async {
    var perm = await Geolocator.checkPermission();
    if (perm == LocationPermission.denied) perm = await Geolocator.requestPermission();
    if (perm == LocationPermission.denied || perm == LocationPermission.deniedForever) return;
    _posSub = Geolocator.getPositionStream(
      locationSettings: const LocationSettings(accuracy: LocationAccuracy.high, distanceFilter: 3),
    ).listen((p) {
      if (mounted) setState(() => _me = p);
    });
  }

  void _onFinder() {
    if (!mounted) return;
    setState(() {});
    final withPos = finder.fixes.values.where((f) => f.hasPosition).toList();
    if (!_followedFirstFix && withPos.isNotEmpty && _map != null) {
      _followedFirstFix = true;
      _map!.animateCamera(CameraUpdate.newLatLngZoom(LatLng(withPos.first.lat!, withPos.first.lng!), 16));
    }
  }

  @override
  void dispose() {
    finder.removeListener(_onFinder);
    _msgSub?.cancel();
    _posSub?.cancel();
    _ticker?.cancel();
    super.dispose();
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  String _ago(DateTime t) {
    final s = DateTime.now().difference(t).inSeconds;
    if (s < 60) return '${s}s ago';
    if (s < 3600) return '${s ~/ 60} min ago';
    return '${s ~/ 3600} h ago';
  }

  String _distance(double m) => m < 1000 ? '${m.round()} m' : '${(m / 1000).toStringAsFixed(2)} km';

  String _direction(double bearing) {
    const names = ['North', 'North-East', 'East', 'South-East', 'South', 'South-West', 'West', 'North-West'];
    return names[(((bearing + 360) % 360) / 45).round() % 8];
  }

  int _bars(int rssi) => rssi >= -90 ? 4 : rssi >= -105 ? 3 : rssi >= -115 ? 2 : 1;

  // ── UI ─────────────────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    final fixes = finder.fixes.values.toList()..sort((a, b) => b.receivedAt.compareTo(a.receivedAt));
    return GlassScaffold(
      appBar: AppBar(
        title: const Text('LoRa Finder · Offline', style: TextStyle(fontWeight: FontWeight.w800)),
        centerTitle: true,
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          if (finder.isConnected)
            IconButton(tooltip: 'Refresh', icon: const Icon(Icons.refresh_rounded), onPressed: finder.refresh),
        ],
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
          children: [
            _connectionCard(),
            if (finder.isConnected && finder.paired.isEmpty) ...[
              const SizedBox(height: 12),
              _pairCard(),
            ],
            if (finder.isConnected) ...[
              const SizedBox(height: 12),
              _mapCard(fixes),
              const SizedBox(height: 12),
              if (fixes.isEmpty && finder.paired.isNotEmpty) _waitingCard(),
              ...fixes.map(_trackerCard),
            ],
          ],
        ),
      ),
    );
  }

  Widget _card({required Widget child, Color? color}) => Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: color ?? Theme.of(context).cardColor.withValues(alpha: 0.92),
          borderRadius: BorderRadius.circular(22),
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 16, offset: const Offset(0, 6))],
        ),
        child: child,
      );

  Widget _connectionCard() {
    final s = finder.state;
    final (icon, title, subtitle) = switch (s) {
      FinderLinkState.connected => (
          Icons.bluetooth_connected_rounded,
          finder.connectedName ?? 'Finder connected',
          '${finder.paired.length} tracker(s) paired · listening on LoRa'
        ),
      FinderLinkState.connecting => (Icons.bluetooth_searching_rounded, 'Connecting…', 'If asked, enter the 6-digit passkey printed on the finder'),
      FinderLinkState.scanning => (Icons.radar_rounded, 'Looking for your finder…', 'Keep the finder powered on and close to your phone'),
      FinderLinkState.error => (Icons.error_outline_rounded, 'Not connected', finder.error ?? ''),
      FinderLinkState.idle => (Icons.bluetooth_disabled_rounded, 'Finder not connected', 'Tap Scan to connect over Bluetooth'),
    };
    return _card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.14), shape: BoxShape.circle),
                child: Icon(icon, color: AppColors.primary),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: GoogleFonts.plusJakartaSans(fontSize: 16, fontWeight: FontWeight.w800)),
                    const SizedBox(height: 2),
                    Text(subtitle, style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                  ],
                ),
              ),
              if (s == FinderLinkState.connected)
                TextButton(onPressed: finder.disconnect, child: const Text('Disconnect'))
              else if (s != FinderLinkState.connecting)
                FilledButton(
                  onPressed: s == FinderLinkState.scanning ? finder.stopScan : finder.startScan,
                  style: FilledButton.styleFrom(backgroundColor: AppColors.primary),
                  child: Text(s == FinderLinkState.scanning ? 'Stop' : 'Scan'),
                ),
            ],
          ),
          if (s == FinderLinkState.scanning || (s != FinderLinkState.connected && finder.discovered.isNotEmpty))
            ...finder.discovered.values.map((d) => ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.memory_rounded),
                  title: Text(d.name.isEmpty ? 'Pet Maya Finder' : d.name),
                  subtitle: Text('Signal ${d.rssi} dBm'),
                  trailing: const Icon(Icons.chevron_right_rounded),
                  onTap: () => finder.connect(d),
                )),
        ],
      ),
    );
  }

  Widget _pairCard() {
    final uid = context.read<AppStateRepository>().currentUser?.uid;
    return _card(
      color: AppColors.primary.withValues(alpha: 0.12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Pair your trackers', style: GoogleFonts.plusJakartaSans(fontSize: 16, fontWeight: FontWeight.w800)),
          const SizedBox(height: 6),
          const Text(
            'The finder needs your trackers\' keys once (requires internet for this step). '
            'After that it works completely offline.',
            style: TextStyle(fontSize: 13),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              style: FilledButton.styleFrom(backgroundColor: AppColors.primary),
              onPressed: finder.pairing || uid == null ? null : () => finder.pairMyTrackers(uid),
              icon: finder.pairing
                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Icon(Icons.link_rounded),
              label: Text(finder.pairing ? 'Pairing…' : 'Pair my LoRa trackers'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _waitingCard() => _card(
        child: Row(
          children: [
            const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.5)),
            const SizedBox(width: 14),
            Expanded(
              child: Text(
                'Waiting for a report from ${finder.paired.map((p) => p.name.isEmpty ? p.id : p.name).join(', ')}. '
                'Trackers report every 20 s – 30 min depending on their mode.',
                style: const TextStyle(fontSize: 13),
              ),
            ),
          ],
        ),
      );

  Widget _mapCard(List<FinderFix> fixes) {
    final markers = <Marker>{
      for (final f in fixes.where((f) => f.hasPosition))
        Marker(
          markerId: MarkerId(f.id),
          position: LatLng(f.lat!, f.lng!),
          infoWindow: InfoWindow(title: finder.displayName(f.id), snippet: 'Fix ${_ago(f.fixTakenAt)}'),
          icon: BitmapDescriptor.defaultMarkerWithHue(f.lostMode ? BitmapDescriptor.hueRed : BitmapDescriptor.hueGreen),
        ),
    };
    final start = fixes.where((f) => f.hasPosition).firstOrNull;
    final center = start != null
        ? LatLng(start.lat!, start.lng!)
        : _me != null
            ? LatLng(_me!.latitude, _me!.longitude)
            : const LatLng(23.8103, 90.4125);
    return ClipRRect(
      borderRadius: BorderRadius.circular(22),
      child: SizedBox(
        height: 300,
        child: Stack(
          children: [
            GoogleMap(
              initialCameraPosition: CameraPosition(target: center, zoom: 15),
              markers: markers,
              myLocationEnabled: _me != null,
              myLocationButtonEnabled: true,
              zoomControlsEnabled: false,
              onMapCreated: (c) => _map = c,
            ),
            Positioned(
              left: 10,
              bottom: 10,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(color: Colors.black.withValues(alpha: 0.6), borderRadius: BorderRadius.circular(12)),
                child: const Text('No internet? Distance & direction below still work',
                    style: TextStyle(color: Colors.white, fontSize: 10.5)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _trackerCard(FinderFix f) {
    final name = finder.displayName(f.id);
    double? dist;
    double? bearing;
    if (_me != null && f.hasPosition) {
      dist = Geolocator.distanceBetween(_me!.latitude, _me!.longitude, f.lat!, f.lng!);
      bearing = Geolocator.bearingBetween(_me!.latitude, _me!.longitude, f.lat!, f.lng!);
    }
    final cmd = finder.commandStatus[f.id];
    final bars = _bars(f.rssi);

    Widget chip(String text, Color color) => Container(
          margin: const EdgeInsets.only(right: 6, top: 6),
          padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
          decoration: BoxDecoration(color: color.withValues(alpha: 0.14), borderRadius: BorderRadius.circular(20)),
          child: Text(text, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w700)),
        );

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: _card(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.pets_rounded, color: AppColors.primary),
                const SizedBox(width: 8),
                Expanded(child: Text(name, style: GoogleFonts.plusJakartaSans(fontSize: 17, fontWeight: FontWeight.w800))),
                Icon(Icons.signal_cellular_alt_rounded, size: 18, color: bars >= 3 ? AppColors.healthGreen : AppColors.accentAmber),
                Text(' ${f.rssi} dBm', style: const TextStyle(fontSize: 11)),
              ],
            ),
            const SizedBox(height: 10),
            if (dist != null && bearing != null)
              Row(
                children: [
                  Transform.rotate(
                    angle: bearing * 3.14159265 / 180,
                    child: const Icon(Icons.navigation_rounded, size: 40, color: AppColors.primary),
                  ),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(_distance(dist), style: GoogleFonts.plusJakartaSans(fontSize: 26, fontWeight: FontWeight.w900)),
                      Text('${_direction(bearing)} of you · arrow points relative to North',
                          style: TextStyle(fontSize: 11.5, color: Colors.grey.shade600)),
                    ],
                  ),
                ],
              )
            else
              Text(
                f.hasPosition ? 'Turn on your phone\'s location to see distance and direction.' : 'Tracker has no GPS fix yet (needs open sky).',
                style: TextStyle(fontSize: 13, color: Colors.grey.shade700),
              ),
            const SizedBox(height: 6),
            Wrap(
              children: [
                chip('Heard ${_ago(f.receivedAt)}', AppColors.tertiary),
                if (f.hasPosition) chip('GPS fix ${_ago(f.fixTakenAt)}', AppColors.secondaryDark),
                chip('Battery ${f.battery}%', f.lowBattery ? AppColors.dangerRed : AppColors.healthGreen),
                if (!f.insideZone) chip('Outside safe zone', AppColors.dangerRed),
                if (f.lostMode) chip('Lost mode', AppColors.dangerRed),
                if (f.searchMode) chip('Search mode', AppColors.accentAmber),
                if (f.ringing) chip('Ringing', AppColors.accentAmber),
                if (cmd != null) chip('Command: $cmd', cmd == 'failed' ? AppColors.dangerRed : AppColors.primaryDark),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {
                      HapticFeedback.mediumImpact();
                      finder.ring(f.id);
                    },
                    icon: const Icon(Icons.volume_up_rounded),
                    label: const Text('Ring'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: FilledButton.icon(
                    style: FilledButton.styleFrom(backgroundColor: f.searchMode ? AppColors.accentAmber : AppColors.primary),
                    onPressed: () {
                      HapticFeedback.mediumImpact();
                      finder.search(f.id, minutes: f.searchMode ? 0 : 30);
                    },
                    icon: Icon(f.searchMode ? Icons.stop_circle_outlined : Icons.radar_rounded),
                    label: Text(f.searchMode ? 'Stop search' : 'Search 30 min'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              'Commands reach the collar right after its next report.',
              style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
            ),
          ],
        ),
      ),
    );
  }
}
