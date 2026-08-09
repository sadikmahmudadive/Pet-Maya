import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import 'package:animate_do/animate_do.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:google_fonts/google_fonts.dart';
import 'dart:ui';
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

class _PetTrackerScreenState extends State<PetTrackerScreen> with SingleTickerProviderStateMixin {
  final MapController _mapController = MapController();
  LatLng _petLocation = const LatLng(23.8103, 90.4125); 
  LatLng _userLocation = const LatLng(23.8120, 90.4150);
  
  bool _isSafeZone = true;
  int _batteryLevel = 88;
  String _currentActivity = 'Resting in Backyard';
  
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat();
    
    _pulseAnimation = Tween<double>(begin: 1.0, end: 2.5).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeOut),
    );

    _initLiveTracking();
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _mapController.dispose();
    super.dispose();
  }

  void _initLiveTracking() async {
    // 1. Request high-accuracy permissions
    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }

    if (permission == LocationPermission.whileInUse || permission == LocationPermission.always) {
      // 2. Stream user location with high precision
      Geolocator.getPositionStream(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          distanceFilter: 5,
        ),
      ).listen((Position position) {
        if (mounted) {
          setState(() {
            _userLocation = LatLng(position.latitude, position.longitude);
            // Check geofence status dynamically
            _updateSafeZoneStatus();
          });
        }
      });
    }
    
    _startSimulatedMovement();
  }

  void _updateSafeZoneStatus() {
    const distanceCalc = Distance();
    final double meterDistance = distanceCalc.as(LengthUnit.Meter, _userLocation, _petLocation);
    
    setState(() {
      _isSafeZone = meterDistance < 800; // Premium Geofence Rule
    });
  }

  void _startSimulatedMovement() {
    setState(() {
      // Premium Simulation: Pet wandering near user
      _petLocation = LatLng(_userLocation.latitude + 0.0025, _userLocation.longitude + 0.0035);
      _updateSafeZoneStatus();
    });
    
    // Smooth camera transition to encompass both
    _mapController.move(_petLocation, 15);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GlassScaffold(
      body: Stack(
        children: [
          // ─── FULL SCREEN MAP ────────────────────────────────────────────────
          Positioned.fill(
            child: FlutterMap(
              mapController: _mapController,
              options: MapOptions(
                initialCenter: _petLocation,
                initialZoom: 16,
                maxZoom: 18,
                minZoom: 12,
              ),
              children: [
                TileLayer(
                  urlTemplate: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
                  subdomains: const ['a', 'b', 'c', 'd'],
                  userAgentPackageName: 'com.vertexhand.petmaya',
                ),
                
                // Safe Zone Circle
                CircleLayer(
                  circles: [
                    CircleMarker(
                      point: _userLocation,
                      color: AppColors.primary.withValues(alpha: 0.05),
                      borderStrokeWidth: 2,
                      borderColor: AppColors.primary.withValues(alpha: 0.15),
                      useRadiusInMeter: true,
                      radius: 800, // Premium Safe Zone Radius
                    ),
                  ],
                ),

                MarkerLayer(
                  markers: [
                    // User Location Marker
                    Marker(
                      point: _userLocation,
                      width: 40,
                      height: 40,
                      child: _buildUserMarker(),
                    ),
                    // Animated Pet Marker
                    Marker(
                      point: _petLocation,
                      width: 100,
                      height: 100,
                      alignment: Alignment.center,
                      child: _buildAnimatedPetMarker(),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // ─── FLOATING TOP BAR ───────────────────────────────────────────────
          Positioned(
            top: 60,
            left: 20,
            right: 20,
            child: FadeInDown(
              child: _buildFloatingAppBar(context),
            ),
          ),

          // ─── SIDE CONTROLS ──────────────────────────────────────────────────
          Positioned(
            right: 20,
            top: 250,
            child: FadeInRight(
              child: _buildMapControls(),
            ),
          ),

          // ─── PREMIUM TELEMETRY PANEL ────────────────────────────────────────
          Positioned(
            bottom: 40,
            left: 20,
            right: 20,
            child: FadeInUp(
              child: _buildTelemetryPanel(context),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFloatingAppBar(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(24),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.7),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: Colors.white.withValues(alpha: 0.3), width: 1.5),
            boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 20)],
          ),
          child: Row(
            children: [
              IconButton(
                icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18),
                onPressed: () => Navigator.pop(context),
              ),
              const SizedBox(width: 4),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text('${widget.pet.name}\'s Radar', 
                      style: GoogleFonts.fredoka(fontWeight: FontWeight.w700, fontSize: 16)),
                    Row(
                      children: [
                        Container(
                          width: 6, height: 6,
                          decoration: BoxDecoration(
                            color: _isSafeZone ? AppColors.healthGreen : AppColors.dangerRed,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 6),
                        Text(_isSafeZone ? 'Connected • Stable' : 'Alert • Outside Area', 
                          style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Colors.grey[600])),
                      ],
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.bolt_rounded, color: AppColors.primary, size: 14),
                    const SizedBox(width: 4),
                    Text('$_batteryLevel%', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 12, color: AppColors.primary)),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildUserMarker() {
    return Stack(
      alignment: Alignment.center,
      children: [
        ScaleTransition(
          scale: _pulseAnimation,
          child: Container(
            width: 30, height: 30,
            decoration: BoxDecoration(
              color: Colors.blue.withValues(alpha: 0.2),
              shape: BoxShape.circle,
            ),
          ),
        ),
        Container(
          width: 14, height: 14,
          decoration: BoxDecoration(
            color: Colors.white,
            shape: BoxShape.circle,
            boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.2), blurRadius: 5)],
          ),
          child: Center(
            child: Container(
              width: 10, height: 10,
              decoration: const BoxDecoration(color: Colors.blue, shape: BoxShape.circle),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildAnimatedPetMarker() {
    return Stack(
      alignment: Alignment.center,
      children: [
        // Pulse Ring
        FadeTransition(
          opacity: ReverseAnimation(_pulseController),
          child: ScaleTransition(
            scale: _pulseAnimation,
            child: Container(
              width: 60, height: 60,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: AppColors.primary.withValues(alpha: 0.5), width: 2),
              ),
            ),
          ),
        ),
        // Pet Avatar Squircle
        Container(
          width: 54, height: 54,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(18),
            boxShadow: [BoxShadow(color: AppColors.primary.withValues(alpha: 0.3), blurRadius: 15, offset: const Offset(0, 5))],
            border: Border.all(color: AppColors.primary, width: 2),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: widget.pet.photoUrl != null 
              ? CachedNetworkImage(imageUrl: widget.pet.photoUrl!, fit: BoxFit.cover)
              : const Icon(Icons.pets, color: AppColors.primary),
          ),
        ),
        // Status Badge
        Positioned(
          top: 0, right: 0,
          child: Container(
            width: 14, height: 14,
            decoration: BoxDecoration(
              color: _isSafeZone ? AppColors.healthGreen : AppColors.dangerRed,
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white, width: 2),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildMapControls() {
    return Column(
      children: [
        _buildControlBtn(Icons.my_location_rounded, () => _mapController.move(_userLocation, 16)),
        const SizedBox(height: 12),
        _buildControlBtn(Icons.pets_rounded, () => _mapController.move(_petLocation, 16)),
        const SizedBox(height: 12),
        _buildControlBtn(Icons.layers_rounded, () {}),
      ],
    );
  }

  Widget _buildControlBtn(IconData icon, VoidCallback onTap) {
    return PremiumCard(
      onTap: onTap,
      opacity: 0.8,
      borderRadius: 16,
      child: Container(
        width: 48, height: 48,
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.9),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Icon(icon, color: AppColors.primary, size: 22),
      ),
    );
  }

  Widget _buildTelemetryPanel(BuildContext context) {
    return PremiumCard(
      opacity: 0.9,
      borderRadius: 32,
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.85),
          borderRadius: BorderRadius.circular(32),
        ),
        child: Column(
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: const Icon(Icons.directions_run_rounded, color: AppColors.primary, size: 24),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('CURRENT ACTIVITY', style: TextStyle(fontWeight: FontWeight.w800, color: Colors.grey[500], fontSize: 9, letterSpacing: 1)),
                      Text(_currentActivity, style: GoogleFonts.fredoka(fontWeight: FontWeight.w700, fontSize: 18)),
                    ],
                  ),
                ),
                _buildLiveBadge(),
              ],
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                _buildTelemetryItem(Icons.speed_rounded, 'Speed', '2.4 km/h'),
                const SizedBox(width: 12),
                _buildTelemetryItem(Icons.history_rounded, 'Last Sync', '2m ago'),
                const SizedBox(width: 12),
                _buildTelemetryItem(Icons.gps_fixed_rounded, 'Accuracy', '98%'),
              ],
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                      HapticFeedback.heavyImpact();
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Collar siren triggered! 🔊'), behavior: SnackBarBehavior.floating),
                      );
                    },
                    icon: const Icon(Icons.volume_up_rounded, size: 18),
                    label: const Text('PLAY SOUND'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                _buildCircleAction(Icons.refresh_rounded, () {
                   HapticFeedback.mediumImpact();
                   _startSimulatedMovement();
                }),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTelemetryItem(IconData icon, String label, String value) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: Colors.black.withValues(alpha: 0.03),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          children: [
            Icon(icon, size: 14, color: Colors.grey[600]),
            const SizedBox(height: 4),
            Text(value, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 12)),
            Text(label, style: const TextStyle(fontSize: 8, color: Colors.grey, fontWeight: FontWeight.w700)),
          ],
        ),
      ),
    );
  }

  Widget _buildCircleAction(IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 56, height: 56,
        decoration: BoxDecoration(
          color: const Color(0xFFEDF4F8),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.primary.withValues(alpha: 0.1)),
        ),
        child: const Icon(Icons.refresh_rounded, color: AppColors.primary),
      ),
    );
  }

  Widget _buildLiveBadge() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: AppColors.healthGreen.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(width: 6, height: 6, decoration: const BoxDecoration(color: AppColors.healthGreen, shape: BoxShape.circle)),
          const SizedBox(width: 6),
          const Text('LIVE', style: TextStyle(color: AppColors.healthGreen, fontWeight: FontWeight.w900, fontSize: 8, letterSpacing: 1)),
        ],
      ),
    );
  }
}
