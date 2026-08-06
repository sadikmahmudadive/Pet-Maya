import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../data/models/pet_model.dart';
import '../../common_widgets/glass_scaffold.dart';
import '../../common_widgets/premium_card.dart';
import 'package:animate_do/animate_do.dart';

class PetTrackerScreen extends StatefulWidget {
  final PetModel pet;

  const PetTrackerScreen({super.key, required this.pet});

  @override
  State<PetTrackerScreen> createState() => _PetTrackerScreenState();
}

class _PetTrackerScreenState extends State<PetTrackerScreen> {
  final MapController _mapController = MapController();
  LatLng _petLocation = const LatLng(23.8103, 90.4125); // Simulated live position
  LatLng _userLocation = const LatLng(23.8120, 90.4150);
  
  bool _isSafeZone = true;
  int _batteryLevel = 88;
  String _currentActivity = 'Relaxing in the backyard';

  @override
  void initState() {
    super.initState();
    _initLiveTracking();
  }

  void _initLiveTracking() async {
    // 1. Get User Position
    try {
      Position pos = await Geolocator.getCurrentPosition();
      setState(() => _userLocation = LatLng(pos.latitude, pos.longitude));
    } catch (_) {}

    // 2. Simulate Pet Movement (In a real app, this would be a Firebase Stream)
    _startSimulatedMovement();
  }

  void _startSimulatedMovement() {
    // Set pet location near user for demo
    setState(() {
      _petLocation = LatLng(_userLocation.latitude + 0.002, _userLocation.longitude + 0.002);
    });
    _mapController.move(_petLocation, 16);
  }

  @override
  Widget build(BuildContext context) {
    return GlassScaffold(
      appBar: AppBar(
        title: Text('${widget.pet.name}\'s Location'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: Column(
        children: [
          // Functional Map
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
                          color: AppColors.primary.withOpacity(0.1),
                          borderStrokeWidth: 2,
                          borderColor: AppColors.primary.withOpacity(0.3),
                          useRadiusInMeter: true,
                          radius: 500, // 500m safe zone
                        ),
                      ],
                    ),
                    MarkerLayer(
                      markers: [
                        // User Marker
                        Marker(
                          point: _userLocation,
                          width: 40,
                          height: 40,
                          child: const Icon(Icons.person_pin_circle_rounded, color: AppColors.primary, size: 32),
                        ),
                        // Pet Marker
                        Marker(
                          point: _petLocation,
                          width: 60,
                          height: 60,
                          child: Column(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(2),
                                decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
                                child: CircleAvatar(
                                  radius: 18,
                                  backgroundImage: widget.pet.photoUrl != null ? NetworkImage(widget.pet.photoUrl!) : null,
                                  child: widget.pet.photoUrl == null ? const Icon(Icons.pets, size: 14) : null,
                                ),
                              ),
                              const Icon(Icons.arrow_drop_down, color: Colors.white, size: 16),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),

                // Live status overlay badge
                Positioned(
                  top: 100,
                  left: 20,
                  right: 20,
                  child: FadeInDown(
                    child: PremiumCard(
                      opacity: 0.8,
                      borderRadius: 20,
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                Container(
                                  width: 10,
                                  height: 10,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: _isSafeZone ? AppColors.healthGreen : AppColors.dangerRed,
                                    boxShadow: [BoxShadow(color: (_isSafeZone ? AppColors.healthGreen : AppColors.dangerRed).withOpacity(0.5), blurRadius: 8, spreadRadius: 2)],
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Text(
                                  _isSafeZone ? 'Inside Safe Zone' : 'Outside Perimeter!',
                                  style: AppTypography.titleMedium.copyWith(
                                    color: _isSafeZone ? AppColors.healthGreen : AppColors.dangerRed,
                                    fontSize: 14,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ],
                            ),
                            Row(
                              children: [
                                const Icon(Icons.battery_charging_full_rounded, color: AppColors.healthGreen, size: 20),
                                const SizedBox(width: 6),
                                Text('$_batteryLevel%', style: AppTypography.titleMedium.copyWith(fontSize: 14, fontWeight: FontWeight.w700)),
                              ],
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

          // Bottom Controls & Status Sheet
          FadeInUp(
            child: Container(
              padding: const EdgeInsets.fromLTRB(24, 24, 24, 40),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surface.withOpacity(0.95),
                borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
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
                            color: AppColors.primary.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: const Icon(Icons.directions_run_rounded, color: AppColors.primary, size: 28),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('LIVE ACTIVITY', style: AppTypography.labelSmall.copyWith(fontWeight: FontWeight.w700, color: Theme.of(context).colorScheme.outline, letterSpacing: 0.8)),
                              Text(_currentActivity, style: AppTypography.titleMedium.copyWith(fontWeight: FontWeight.w700, fontSize: 16)),
                            ],
                          ),
                        ),
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
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                              ),
                              child: Text('REFRESH', style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.primary, letterSpacing: 0.8)),
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
                                  const SnackBar(content: Text('Alarm triggered! 🔊'), behavior: SnackBarBehavior.floating),
                                );
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.accentAmber,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                              ),
                              child: const Text('PLAY SOUND', style: TextStyle(fontWeight: FontWeight.w700, letterSpacing: 0.8)),
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
}
