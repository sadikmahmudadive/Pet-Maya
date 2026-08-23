import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geolocator/geolocator.dart';
import 'package:animate_do/animate_do.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import 'dart:ui' as ui;
import '../../../core/theme/app_colors.dart';
import '../../../data/models/pet_model.dart';
import '../../common_widgets/glass_scaffold.dart';

class PetTrackerScreen extends StatefulWidget {
  final PetModel pet;

  const PetTrackerScreen({super.key, required this.pet});

  @override
  State<PetTrackerScreen> createState() => _PetTrackerScreenState();
}

class _PetTrackerScreenState extends State<PetTrackerScreen> with SingleTickerProviderStateMixin {
  GoogleMapController? _mapController;
  LatLng _petLocation = const LatLng(23.8103, 90.4125); 
  LatLng _userLocation = const LatLng(23.8120, 90.4150);
  
  bool _isSafeZone = true;
  bool _is3D = true;
  final int _batteryLevel = 88;
  final String _currentActivity = 'Resting in Backyard';
  
  MapType _mapType = MapType.normal;

  late AnimationController _pulseController;
  StreamSubscription<Position>? _positionSubscription;
  BitmapDescriptor? _petIcon;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat();

    _loadPetMarker();
    _initLiveTracking();
  }

  Future<void> _loadPetMarker() async {
    if (widget.pet.photoUrl == null) return;
    try {
      final response = await http.get(Uri.parse(widget.pet.photoUrl!));
      final bytes = response.bodyBytes;
      
      final codec = await ui.instantiateImageCodec(bytes, targetWidth: 100, targetHeight: 100);
      final frameInfo = await codec.getNextFrame();
      final image = frameInfo.image;

      final pictureRecorder = ui.PictureRecorder();
      final canvas = Canvas(pictureRecorder);
      final paint = Paint()..isAntiAlias = true;

      // Draw Avatar Circular Border
      paint.color = AppColors.primary;
      canvas.drawCircle(const Offset(50, 50), 48, paint);
      
      paint.color = Colors.white;
      canvas.drawCircle(const Offset(50, 50), 44, paint);

      // Clip Path for Circular Image
      final path = Path()..addOval(const Rect.fromLTWH(8, 8, 84, 84));
      canvas.clipPath(path);
      canvas.drawImageRect(image, Rect.fromLTWH(0, 0, image.width.toDouble(), image.height.toDouble()), const Rect.fromLTWH(8, 8, 84, 84), paint);

      final markerImage = await pictureRecorder.endRecording().toImage(100, 100);
      final pngBytes = await markerImage.toByteData(format: ui.ImageByteFormat.png);

      if (mounted && pngBytes != null) {
        setState(() {
          _petIcon = BitmapDescriptor.bytes(pngBytes.buffer.asUint8List());
        });
      }
    } catch (e) {
      debugPrint("Error creating pet marker: $e");
    }
  }

  void _initLiveTracking() async {
    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }

    if (permission == LocationPermission.whileInUse || permission == LocationPermission.always) {
      _positionSubscription = Geolocator.getPositionStream(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.high, distanceFilter: 5),
      ).listen((Position position) {
        if (mounted) {
          setState(() {
            _userLocation = LatLng(position.latitude, position.longitude);
            _checkSafeZone();
          });
        }
      });
    }
  }

  void _checkSafeZone() {
    double distance = Geolocator.distanceBetween(
      _userLocation.latitude, _userLocation.longitude,
      _petLocation.latitude, _petLocation.longitude,
    );
    setState(() {
      _isSafeZone = distance <= 800; // 800m Geofence
    });
  }

  void _startSimulatedMovement() {
    Timer.periodic(const Duration(seconds: 3), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      setState(() {
        _petLocation = LatLng(
          _petLocation.latitude + 0.0001,
          _petLocation.longitude + 0.0001,
        );
        _checkSafeZone();
      });
      _mapController?.animateCamera(
        CameraUpdate.newCameraPosition(
          CameraPosition(
            target: _petLocation,
            zoom: _is3D ? 17.5 : 16.0,
            tilt: _is3D ? 48.0 : 0.0,
            bearing: _is3D ? 25.0 : 0.0,
          ),
        ),
      );
    });
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _positionSubscription?.cancel();
    _mapController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GlassScaffold(
      body: Stack(
        children: [
          // ─── FULL SCREEN 3D MAP ─────────────────────────────────────────────
          Positioned.fill(
            child: Container(
              color: isDark ? const Color(0xFF131921) : Colors.white,
              child: GoogleMap(
                initialCameraPosition: CameraPosition(
                  target: _petLocation,
                  zoom: 17.5,
                  tilt: 48.0,
                  bearing: 25.0,
                ),
                style: (_mapType == MapType.normal && isDark) ? _googleMapsDarkTheme : null,
                onMapCreated: (controller) {
                  setState(() {
                    _mapController = controller;
                  });
                },
                mapType: _mapType,
                buildingsEnabled: true,
                tiltGesturesEnabled: true,
                rotateGesturesEnabled: true,
                compassEnabled: true,
                indoorViewEnabled: true,
                myLocationEnabled: true,
                myLocationButtonEnabled: false,
                zoomControlsEnabled: false,
                circles: {
                  Circle(
                    circleId: const CircleId('safe_zone'),
                    center: _userLocation,
                    radius: 800,
                    fillColor: AppColors.primary.withValues(alpha: isDark ? 0.12 : 0.05),
                    strokeColor: AppColors.primary.withValues(alpha: isDark ? 0.35 : 0.15),
                    strokeWidth: 2,
                  ),
                },
                markers: {
                  Marker(
                    markerId: const MarkerId('user_location'),
                    position: _userLocation,
                    anchor: const Offset(0.5, 0.5),
                    icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueAzure),
                    infoWindow: const InfoWindow(title: 'You'),
                  ),
                  Marker(
                    markerId: const MarkerId('pet_location'),
                    position: _petLocation,
                    anchor: const Offset(0.5, 0.5),
                    icon: _petIcon ?? BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueOrange),
                    infoWindow: InfoWindow(title: widget.pet.name),
                  ),
                },
              ),
            ),
          ),

          // ─── FLOATING TOP BAR ───────────────────────────────────────────────
          Positioned(
            top: MediaQuery.of(context).padding.top + 10,
            left: 16,
            right: 16,
            child: FadeInDown(
              child: _buildFloatingAppBar(context, isDark),
            ),
          ),

          // ─── SIDE CONTROLS ──────────────────────────────────────────────────
          Positioned(
            right: 16,
            top: MediaQuery.of(context).padding.top + 80,
            child: FadeInRight(
              child: _buildMapControls(isDark),
            ),
          ),

          // ─── PREMIUM TELEMETRY PANEL ────────────────────────────────────────
          Positioned(
            bottom: 24,
            left: 16,
            right: 16,
            child: FadeInUp(
              child: _buildTelemetryPanel(context, isDark),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFloatingAppBar(BuildContext context, bool isDark) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E242B) : Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: isDark ? const Color(0xFF2C3440) : Colors.black.withValues(alpha: 0.08),
          width: 1.2,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.4 : 0.12),
            blurRadius: 18,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          IconButton(
            icon: Icon(Icons.arrow_back_ios_new_rounded, size: 18, color: isDark ? Colors.white : Colors.black87),
            onPressed: () => Navigator.pop(context),
          ),
          const SizedBox(width: 4),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  '${widget.pet.name}\'s Radar', 
                  style: GoogleFonts.plusJakartaSans(
                    fontWeight: FontWeight.w800,
                    fontSize: 16,
                    color: isDark ? Colors.white : Colors.black87,
                  ),
                ),
                Row(
                  children: [
                    Container(
                      width: 7, height: 7,
                      decoration: BoxDecoration(
                        color: _isSafeZone ? AppColors.healthGreen : AppColors.dangerRed,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      _isSafeZone ? 'Connected • Safe Zone' : 'Alert • Outside Safe Area', 
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: _isSafeZone 
                            ? (isDark ? const Color(0xFF4ADE80) : AppColors.healthGreen)
                            : AppColors.dangerRed,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: isDark ? 0.2 : 0.1),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Row(
              children: [
                const Icon(Icons.bolt_rounded, color: AppColors.primary, size: 15),
                const SizedBox(width: 3),
                Text(
                  '$_batteryLevel%',
                  style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 12, color: AppColors.primary),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMapControls(bool isDark) {
    return Column(
      children: [
        _build3DControlBtn(isDark),
        const SizedBox(height: 12),
        _buildControlBtn(Icons.my_location_rounded, isDark, () {
          _mapController?.animateCamera(CameraUpdate.newCameraPosition(
            CameraPosition(
              target: _userLocation,
              zoom: _is3D ? 17.5 : 16.0,
              tilt: _is3D ? 48.0 : 0.0,
              bearing: _is3D ? 25.0 : 0.0,
            ),
          ));
        }),
        const SizedBox(height: 12),
        _buildControlBtn(Icons.pets_rounded, isDark, () {
          _mapController?.animateCamera(CameraUpdate.newCameraPosition(
            CameraPosition(
              target: _petLocation,
              zoom: _is3D ? 17.5 : 16.0,
              tilt: _is3D ? 48.0 : 0.0,
              bearing: _is3D ? 25.0 : 0.0,
            ),
          ));
        }),
        const SizedBox(height: 12),
        _buildControlBtn(Icons.layers_rounded, isDark, () => _showMapStylePicker(isDark)),
      ],
    );
  }

  Widget _build3DControlBtn(bool isDark) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.mediumImpact();
        setState(() => _is3D = !_is3D);
        if (_mapController != null) {
          _mapController!.animateCamera(
            CameraUpdate.newCameraPosition(
              CameraPosition(
                target: _petLocation,
                zoom: _is3D ? 17.5 : 16.0,
                tilt: _is3D ? 48.0 : 0.0,
                bearing: _is3D ? 25.0 : 0.0,
              ),
            ),
          );
        }
      },
      child: Container(
        width: 46,
        height: 46,
        decoration: BoxDecoration(
          color: _is3D ? AppColors.primary : (isDark ? const Color(0xFF1E242B) : Colors.white),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: _is3D ? AppColors.primary : (isDark ? const Color(0xFF2C3440) : Colors.black.withValues(alpha: 0.08)),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: isDark ? 0.4 : 0.12),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Center(
          child: Text(
            _is3D ? '3D' : '2D',
            style: GoogleFonts.plusJakartaSans(
              color: _is3D ? Colors.white : AppColors.primary,
              fontWeight: FontWeight.w900,
              fontSize: 13,
              letterSpacing: 0.5,
            ),
          ),
        ),
      ),
    );
  }

  void _showMapStylePicker(bool isDark) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        margin: const EdgeInsets.all(20),
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1A1F26) : Colors.white,
          borderRadius: BorderRadius.circular(28),
          border: Border.all(
            color: isDark ? const Color(0xFF2C3545) : Colors.black.withValues(alpha: 0.06),
          ),
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: isDark ? 0.5 : 0.15), blurRadius: 24)],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'MAP STYLE', 
              style: TextStyle(
                fontWeight: FontWeight.w900, 
                color: isDark ? Colors.grey[400] : Colors.grey[500], 
                fontSize: 10, 
                letterSpacing: 1.2,
              ),
            ),
            const SizedBox(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildStyleOption(Icons.map_outlined, 'Streets', MapType.normal, isDark),
                _buildStyleOption(Icons.satellite_alt_rounded, 'Satellite', MapType.satellite, isDark),
                _buildStyleOption(Icons.terrain_rounded, 'Terrain', MapType.terrain, isDark),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStyleOption(IconData icon, String label, MapType type, bool isDark) {
    final isSelected = _mapType == type;
    return GestureDetector(
      onTap: () {
        setState(() => _mapType = type);
        Navigator.pop(context);
      },
      child: Column(
        children: [
          Container(
            width: 60, height: 60,
            decoration: BoxDecoration(
              color: isSelected 
                  ? AppColors.primary.withValues(alpha: isDark ? 0.25 : 0.12)
                  : (isDark ? const Color(0xFF242C37) : Colors.grey[100]),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(
                color: isSelected ? AppColors.primary : (isDark ? const Color(0xFF2E3846) : Colors.grey[300]!),
                width: isSelected ? 2.5 : 1,
              ),
            ),
            child: Icon(icon, color: isSelected ? AppColors.primary : (isDark ? Colors.grey[300] : Colors.grey[700]), size: 28),
          ),
          const SizedBox(height: 8),
          Text(
            label, 
            style: TextStyle(
              fontSize: 11, 
              fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
              color: isSelected ? AppColors.primary : (isDark ? Colors.grey[300] : Colors.grey[700]),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildControlBtn(IconData icon, bool isDark, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 46, height: 46,
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1E242B) : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isDark ? const Color(0xFF2C3440) : Colors.black.withValues(alpha: 0.08),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: isDark ? 0.4 : 0.12),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Icon(icon, color: AppColors.primary, size: 20),
      ),
    );
  }

  Widget _buildTelemetryPanel(BuildContext context, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF161A20) : Colors.white,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(
          color: isDark ? const Color(0xFF2C3440) : Colors.black.withValues(alpha: 0.06),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.5 : 0.12),
            blurRadius: 30,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: isDark ? 0.2 : 0.1),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Icon(Icons.directions_run_rounded, color: AppColors.primary, size: 24),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'CURRENT ACTIVITY', 
                      style: TextStyle(
                        fontWeight: FontWeight.w800, 
                        color: isDark ? Colors.grey[400] : Colors.grey[500], 
                        fontSize: 9, 
                        letterSpacing: 1,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      _currentActivity, 
                      style: GoogleFonts.plusJakartaSans(
                        fontWeight: FontWeight.w800, 
                        fontSize: 16,
                        color: isDark ? Colors.white : Colors.black87,
                      ),
                    ),
                  ],
                ),
              ),
              _buildLiveBadge(isDark),
            ],
          ),
          const SizedBox(height: 18),
          Row(
            children: [
              _buildTelemetryItem(Icons.speed_rounded, 'Speed', '2.4 km/h', isDark),
              const SizedBox(width: 10),
              _buildTelemetryItem(Icons.history_rounded, 'Last Sync', '2m ago', isDark),
              const SizedBox(width: 10),
              _buildTelemetryItem(Icons.gps_fixed_rounded, 'Accuracy', '98%', isDark),
            ],
          ),
          const SizedBox(height: 18),
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
                  icon: const Icon(Icons.volume_up_rounded, size: 18, color: Colors.white),
                  label: Text(
                    'PLAY SOUND',
                    style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w800, fontSize: 13, letterSpacing: 0.5),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    elevation: 4,
                    shadowColor: AppColors.primary.withValues(alpha: 0.4),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              _buildCircleAction(Icons.refresh_rounded, isDark, () {
                 HapticFeedback.mediumImpact();
                 _startSimulatedMovement();
              }),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTelemetryItem(IconData icon, String label, String value, bool isDark) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF222933) : Colors.black.withValues(alpha: 0.03),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isDark ? const Color(0xFF2E3846) : Colors.transparent,
          ),
        ),
        child: Column(
          children: [
            Icon(icon, size: 15, color: isDark ? AppColors.primary : Colors.grey[700]),
            const SizedBox(height: 4),
            Text(
              value, 
              style: TextStyle(
                fontWeight: FontWeight.w800, 
                fontSize: 12,
                color: isDark ? Colors.white : Colors.black87,
              ),
            ),
            Text(
              label, 
              style: TextStyle(
                fontSize: 9, 
                color: isDark ? Colors.grey[400] : Colors.grey[600], 
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCircleAction(IconData icon, bool isDark, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 52, height: 52,
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF222933) : const Color(0xFFEDF4F8),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isDark ? const Color(0xFF2E3846) : AppColors.primary.withValues(alpha: 0.1),
          ),
        ),
        child: const Icon(Icons.refresh_rounded, color: AppColors.primary),
      ),
    );
  }

  Widget _buildLiveBadge(bool isDark) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: AppColors.healthGreen.withValues(alpha: isDark ? 0.2 : 0.1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(width: 6, height: 6, decoration: const BoxDecoration(color: AppColors.healthGreen, shape: BoxShape.circle)),
          const SizedBox(width: 6),
          const Text('LIVE', style: TextStyle(color: AppColors.healthGreen, fontWeight: FontWeight.w900, fontSize: 9, letterSpacing: 1)),
        ],
      ),
    );
  }

  // ─── AUTHENTIC GOOGLE MAPS DARK MODE STYLING ────────────────────────────────
  static const String _googleMapsDarkTheme = '''
[
  {
    "elementType": "geometry",
    "stylers": [{"color": "#1f242c"}]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#8c96a5"}]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{"color": "#191d24"}]
  },
  {
    "featureType": "administrative.country",
    "elementType": "geometry.stroke",
    "stylers": [{"color": "#333d4b"}]
  },
  {
    "featureType": "administrative.locality",
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#c4cbd4"}]
  },
  {
    "featureType": "poi",
    "elementType": "geometry",
    "stylers": [{"color": "#242a34"}]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#768294"}]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry.fill",
    "stylers": [{"color": "#152a22"}]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#4e8c72"}]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [{"color": "#2c3440"}]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#9ca7b6"}]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [{"color": "#3b4656"}]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry.stroke",
    "stylers": [{"color": "#28303b"}]
  },
  {
    "featureType": "transit",
    "elementType": "geometry",
    "stylers": [{"color": "#242c37"}]
  },
  {
    "featureType": "transit.station",
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#768294"}]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{"color": "#12171e"}]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#4a5a70"}]
  }
]
''';
}
