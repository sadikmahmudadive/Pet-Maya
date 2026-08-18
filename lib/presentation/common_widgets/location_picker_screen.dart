import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
import 'package:animate_do/animate_do.dart';
import 'package:google_fonts/google_fonts.dart';
import 'dart:ui';
import 'dart:async';
import '../../../core/theme/app_colors.dart';
import 'glass_scaffold.dart';
import 'premium_card.dart';

class LocationPickerScreen extends StatefulWidget {
  const LocationPickerScreen({super.key});

  @override
  State<LocationPickerScreen> createState() => _LocationPickerScreenState();
}

class _LocationPickerScreenState extends State<LocationPickerScreen> with SingleTickerProviderStateMixin {
  final MapController _mapController = MapController();
  final TextEditingController _searchController = TextEditingController();
  
  LatLng _selectedLocation = const LatLng(23.8103, 90.4125); // Default: Dhaka
  String _address = "Fetching your location...";
  bool _isLoading = true;
  bool _isSearching = false;
  Timer? _debounce;
  
  // High-Efficiency Map Layers
  String _mapStyle = 'streets'; // 'streets', 'satellite', 'terrain'
  late AnimationController _pinController;

  @override
  void initState() {
    super.initState();
    _pinController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
    _getCurrentLocation();
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _pinController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _getCurrentLocation() async {
    setState(() => _isLoading = true);
    
    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }

    if (permission == LocationPermission.whileInUse || permission == LocationPermission.always) {
      try {
        // Fast initial location check
        // Fast initial location check using the correct method for recent geolocator versions
        Position? position = await Geolocator.getLastKnownPosition();
        
        // If no last known, get current (but with lower accuracy for speed initially)
        position ??= await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.medium,
          timeLimit: const Duration(seconds: 5),
        );

        final latLng = LatLng(position.latitude, position.longitude);
        _animateToLocation(latLng);
        _getAddressFromLatLng(latLng);
      } catch (e) {
        debugPrint("Error getting location: $e");
      }
    }
    setState(() => _isLoading = false);
  }

  void _animateToLocation(LatLng target) {
    _mapController.move(target, 16);
    setState(() => _selectedLocation = target);
    _pinController.forward(from: 0);
  }

  Future<void> _getAddressFromLatLng(LatLng position) async {
    // Debounce address fetching to prevent UI lag on rapid movement
    if (_debounce?.isActive ?? false) _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 600), () async {
      try {
        List<Placemark> placemarks = await placemarkFromCoordinates(position.latitude, position.longitude);
        if (placemarks.isNotEmpty) {
          Placemark place = placemarks[0];
          if (mounted) {
            setState(() {
              _address = "${place.name != place.street ? place.name : ''} ${place.street}, ${place.subLocality}, ${place.locality}".trim();
              if (_address.startsWith(',')) _address = _address.substring(1).trim();
              if (_address.isEmpty) _address = "Unnamed Road";
            });
          }
        }
      } catch (_) {
        if (mounted) setState(() => _address = "Unknown Location");
      }
    });
  }

  Future<void> _searchLocation(String value) async {
    if (value.isEmpty) return;
    setState(() => _isSearching = true);
    try {
      List<Location> locations = await locationFromAddress(value);
      if (locations.isNotEmpty) {
        final loc = LatLng(locations[0].latitude, locations[0].longitude);
        _animateToLocation(loc);
        _getAddressFromLatLng(loc);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Address not found.')));
      }
    } finally {
      if (mounted) setState(() => _isSearching = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return GlassScaffold(
      body: Stack(
        children: [
          // ─── FULL SCREEN MAP ────────────────────────────────────────────────
          Positioned.fill(
            child: FlutterMap(
              mapController: _mapController,
              options: MapOptions(
                initialCenter: _selectedLocation,
                initialZoom: 16,
                onTap: (_, point) {
                  _animateToLocation(point);
                  _getAddressFromLatLng(point);
                  HapticFeedback.lightImpact();
                },
              ),
              children: [
                if (_mapStyle == 'streets')
                  TileLayer(
                    urlTemplate: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
                    subdomains: const ['a', 'b', 'c', 'd'],
                    tileDisplay: const TileDisplay.fadeIn(duration: Duration(milliseconds: 300)),
                    userAgentPackageName: 'com.vertexhand.petmaya',
                  )
                else if (_mapStyle == 'satellite')
                  TileLayer(
                    urlTemplate: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                    tileDisplay: const TileDisplay.fadeIn(duration: Duration(milliseconds: 300)),
                    userAgentPackageName: 'com.vertexhand.petmaya',
                  )
                else if (_mapStyle == 'terrain')
                  TileLayer(
                    urlTemplate: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
                    subdomains: const ['a', 'b', 'c'],
                    tileDisplay: const TileDisplay.fadeIn(duration: Duration(milliseconds: 300)),
                    userAgentPackageName: 'com.vertexhand.petmaya',
                  ),

                MarkerLayer(
                  markers: [
                    Marker(
                      point: _selectedLocation,
                      width: 60,
                      height: 60,
                      alignment: Alignment.topCenter,
                      child: AnimatedBuilder(
                        animation: _pinController,
                        builder: (context, child) {
                          final double offset = (1.0 - _pinController.value) * 20;
                          return Transform.translate(
                            offset: Offset(0, -offset),
                            child: Stack(
                              alignment: Alignment.center,
                              children: [
                                Positioned(
                                  bottom: 0,
                                  child: Container(
                                    width: 12, height: 4,
                                    decoration: BoxDecoration(
                                      color: Colors.black.withValues(alpha: 0.2),
                                      boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.1), blurRadius: 4, spreadRadius: 2)],
                                      borderRadius: const BorderRadius.all(Radius.elliptical(12, 4)),
                                    ),
                                  ),
                                ),
                                Icon(Icons.location_on_rounded, color: AppColors.dangerRed, size: 48),
                              ],
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // ─── PREMIUM SEARCH OVERLAY ─────────────────────────────────────────
          Positioned(
            top: 60,
            left: 20,
            right: 20,
            child: FadeInDown(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(24),
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.85),
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: Colors.white.withValues(alpha: 0.4), width: 1.5),
                      boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 20)],
                    ),
                    child: Row(
                      children: [
                        IconButton(
                          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18),
                          onPressed: () => Navigator.pop(context),
                        ),
                        Expanded(
                          child: TextField(
                            controller: _searchController,
                            onSubmitted: _searchLocation,
                            style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w600, fontSize: 15),
                            decoration: InputDecoration(
                              hintText: 'Search for your area...',
                              hintStyle: TextStyle(color: Colors.grey[400], fontSize: 14),
                              border: InputBorder.none,
                              contentPadding: const EdgeInsets.symmetric(vertical: 12),
                            ),
                          ),
                        ),
                        if (_isSearching)
                          const Padding(
                            padding: EdgeInsets.only(right: 12),
                            child: SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)),
                          )
                        else
                          IconButton(
                            icon: const Icon(Icons.my_location_rounded, color: AppColors.primary, size: 20),
                            onPressed: _getCurrentLocation,
                          ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),

          // ─── MAP STYLE CONTROLS ─────────────────────────────────────────────
          Positioned(
            right: 20,
            top: 140,
            child: FadeInRight(
              child: Column(
                children: [
                  _buildStyleBtn(Icons.map_outlined, 'streets'),
                  const SizedBox(height: 12),
                  _buildStyleBtn(Icons.satellite_alt_rounded, 'satellite'),
                  const SizedBox(height: 12),
                  _buildStyleBtn(Icons.terrain_rounded, 'terrain'),
                ],
              ),
            ),
          ),

          // ─── ACTION PANEL ───────────────────────────────────────────────────
          Positioned(
            bottom: 40,
            left: 20,
            right: 20,
            child: FadeInUp(
              child: PremiumCard(
                opacity: 0.95,
                borderRadius: 32,
                child: Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.9),
                    borderRadius: BorderRadius.circular(32),
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: AppColors.primary.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: const Icon(Icons.map_rounded, color: AppColors.primary, size: 24),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('SELECTED LOCATION', 
                                  style: TextStyle(fontWeight: FontWeight.w900, color: Colors.grey[500], fontSize: 9, letterSpacing: 1.2)),
                                const SizedBox(height: 4),
                                Text(_address, 
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w700, fontSize: 17)),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),
                      SizedBox(
                        width: double.infinity,
                        height: 64,
                        child: ElevatedButton(
                          onPressed: () {
                            HapticFeedback.heavyImpact();
                            Navigator.pop(context, _address);
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                            elevation: 8,
                            shadowColor: AppColors.primary.withValues(alpha: 0.3),
                          ),
                          child: const Text('CONFIRM ADDRESS', 
                            style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, letterSpacing: 1, fontSize: 13)),
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
    );
  }

  Widget _buildStyleBtn(IconData icon, String style) {
    final isSelected = _mapStyle == style;
    return PremiumCard(
      onTap: () => setState(() => _mapStyle = style),
      opacity: isSelected ? 0.9 : 0.6,
      borderRadius: 12,
      child: Container(
        width: 44, height: 44,
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : Colors.white.withValues(alpha: 0.9),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Icon(icon, color: isSelected ? Colors.white : AppColors.primary, size: 20),
      ),
    );
  }
}

