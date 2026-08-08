import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import 'package:animate_do/animate_do.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../data/models/pet_model.dart';
import '../../common_widgets/glass_scaffold.dart';
import '../../common_widgets/premium_card.dart';

class PetTrackerScreen extends StatefulWidget {
  final PetModel pet;

  const PetTrackerScreen({super.key, required this.pet});

  @override
  State<PetTrackerScreen> createState() => _PetTrackerScreenState();
}

class _PetTrackerScreenState extends State<PetTrackerScreen> {
  final MapController _mapController = MapController();
  LatLng _petLocation = const LatLng(23.8103, 90.4125); 
  LatLng _userLocation = const LatLng(23.8120, 90.4150);
  
  bool _isSafeZone = true;
  int _batteryLevel = 88;
  String _currentActivity = 'Resting in Backyard';

  @override
  void initState() {
    super.initState();
    _initLiveTracking();
  }

  void _initLiveTracking() async {
    try {
      Position pos = await Geolocator.getCurrentPosition();
      setState(() => _userLocation = LatLng(pos.latitude, pos.longitude));
    } catch (_) {}
    _startSimulatedMovement();
  }

  void _startSimulatedMovement() {
    setState(() {
      _petLocation = LatLng(_userLocation.latitude + 0.002, _userLocation.longitude + 0.002);
    });
    _mapController.move(_petLocation, 16);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GlassScaffold(
      appBar: AppBar(
        title: Text('${widget.pet.name}\'s Live Location', style: const TextStyle(fontWeight: FontWeight.w800)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        systemOverlayStyle: isDark ? SystemUiOverlayStyle.light : SystemUiOverlayStyle.dark,
      ),
      body: Column(
        children: [
          Expanded(
            child: Stack(
              children: [
                FlutterMap(
                  mapController: _mapController,
                  options: MapOptions(
                    initialCenter: _petLocation,
                    initialZoom: 16,
                  ),
                  children: [
                    TileLayer(
                      urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                      userAgentPackageName: 'com.example.tailwagging',
                    ),
                    CircleLayer(
                      circles: [
                        CircleMarker(
                          point: _userLocation,
                          color: AppColors.primary.withOpacity(0.08),
                          borderStrokeWidth: 2,
                          borderColor: AppColors.primary.withOpacity(0.2),
                          useRadiusInMeter: true,
                          radius: 500,
                        ),
                      ],
                    ),
                    MarkerLayer(
                      markers: [
                        Marker(
                          point: _userLocation,
                          width: 40,
                          height: 40,
                          child: Container(
                            decoration: BoxDecoration(color: Colors.white, shape: BoxShape.circle, boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 10)]),
                            child: const Icon(Icons.person_pin_circle_rounded, color: AppColors.primary, size: 28),
                          ),
                        ),
                        Marker(
                          point: _petLocation,
                          width: 64,
                          height: 64,
                          child: Column(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(3),
                                decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
                                child: CircleAvatar(
                                  radius: 20,
                                  backgroundImage: widget.pet.photoUrl != null ? NetworkImage(widget.pet.photoUrl!) : null,
                                  child: widget.pet.photoUrl == null ? const Icon(Icons.pets, size: 16) : null,
                                ),
                              ),
                              const Icon(Icons.arrow_drop_down, color: Colors.white, size: 18),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),

                Positioned(
                  top: 100,
                  left: 20,
                  right: 20,
                  child: FadeInDown(
                    child: PremiumCard(
                      opacity: 0.85,
                      borderRadius: 24,
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                Container(
                                  width: 8,
                                  height: 8,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: _isSafeZone ? AppColors.healthGreen : AppColors.dangerRed,
                                    boxShadow: [BoxShadow(color: (_isSafeZone ? AppColors.healthGreen : AppColors.dangerRed).withOpacity(0.4), blurRadius: 8, spreadRadius: 2)],
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Text(
                                  _isSafeZone ? 'SAFE ZONE' : 'OUTSIDE PERIMETER!',
                                  style: TextStyle(
                                    color: _isSafeZone ? AppColors.healthGreen : AppColors.dangerRed,
                                    fontSize: 11,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: 1,
                                  ),
                                ),
                              ],
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                              decoration: BoxDecoration(color: AppColors.healthGreen.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
                              child: Row(
                                children: [
                                  const Icon(Icons.bolt_rounded, color: AppColors.healthGreen, size: 16),
                                  const SizedBox(width: 4),
                                  Text('$_batteryLevel%', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: AppColors.healthGreen)),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          FadeInUp(
            child: Container(
              padding: const EdgeInsets.fromLTRB(24, 24, 24, 40),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surface.withOpacity(0.95),
                borderRadius: const BorderRadius.vertical(top: Radius.circular(36)),
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 40, offset: const Offset(0, -10))],
              ),
              child: SafeArea(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withOpacity(0.08),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: const Icon(Icons.pets_rounded, color: AppColors.primary, size: 24),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('CURRENT STATE', style: TextStyle(fontWeight: FontWeight.w800, color: Colors.grey[500], fontSize: 9, letterSpacing: 1)),
                              const SizedBox(height: 2),
                              Text(_currentActivity, style: AppTypography.titleMedium.copyWith(fontWeight: FontWeight.w800, fontSize: 18)),
                            ],
                          ),
                        ),
                        _buildPulseIndicator(),
                      ],
                    ),
                    const SizedBox(height: 32),
                    Row(
                      children: [
                        Expanded(
                          child: SizedBox(
                            height: 60,
                            child: OutlinedButton(
                              onPressed: () {
                                HapticFeedback.selectionClick();
                                _startSimulatedMovement();
                              },
                              style: OutlinedButton.styleFrom(
                                side: BorderSide(color: AppColors.primary.withOpacity(0.5)),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                              ),
                              child: const Text('REFRESH', style: TextStyle(fontWeight: FontWeight.w800, color: AppColors.primary, letterSpacing: 1.5, fontSize: 11)),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: SizedBox(
                            height: 60,
                            child: ElevatedButton(
                              onPressed: () {
                                HapticFeedback.heavyImpact();
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Paging device sound... 🔊'), behavior: SnackBarBehavior.floating),
                                );
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF006684),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                              ),
                              child: const Text('PLAY SOUND', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, letterSpacing: 1, fontSize: 11)),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPulseIndicator() {
    return Pulse(
      infinite: true,
      duration: const Duration(seconds: 2),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(color: AppColors.healthGreen.withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(width: 6, height: 6, decoration: const BoxDecoration(color: AppColors.healthGreen, shape: BoxShape.circle)),
            const SizedBox(width: 6),
            const Text('LIVE', style: TextStyle(color: AppColors.healthGreen, fontWeight: FontWeight.w900, fontSize: 8, letterSpacing: 1)),
          ],
        ),
      ),
    );
  }
}
