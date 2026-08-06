import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import 'glass_scaffold.dart';
import 'premium_card.dart';
import 'package:animate_do/animate_do.dart';

class LocationPickerScreen extends StatefulWidget {
  const LocationPickerScreen({super.key});

  @override
  State<LocationPickerScreen> createState() => _LocationPickerScreenState();
}

class _LocationPickerScreenState extends State<LocationPickerScreen> {
  final MapController _mapController = MapController();
  final TextEditingController _searchController = TextEditingController();
  
  LatLng _selectedLocation = const LatLng(23.8103, 90.4125); // Default: Dhaka
  String _address = "Fetching address...";
  bool _isLoading = true;

  final List<Map<String, dynamic>> _savedLocations = [
    {'name': 'Home', 'address': '123 Pet Lane, Paws City', 'icon': Icons.home_rounded, 'color': AppColors.primary},
    {'name': 'Work', 'address': '456 Tech Park, Innovate Ave', 'icon': Icons.work_rounded, 'color': AppColors.tertiary},
    {'name': 'Vet Clinic', 'address': '789 Health St, Care Valley', 'icon': Icons.medical_services_rounded, 'color': AppColors.healthGreen},
  ];

  @override
  void initState() {
    super.initState();
    _getCurrentLocation();
  }

  Future<void> _getCurrentLocation() async {
    bool serviceEnabled;
    LocationPermission permission;

    serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Location services are disabled.')),
        );
      }
      return;
    }

    permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Location permissions are denied.')),
          );
        }
        return;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Location permissions are permanently denied.')),
        );
      }
      return;
    }

    try {
      Position position = await Geolocator.getCurrentPosition();
      if (mounted) {
        setState(() {
          _selectedLocation = LatLng(position.latitude, position.longitude);
          _isLoading = false;
        });
        _mapController.move(_selectedLocation, 15);
        _getAddressFromLatLng(_selectedLocation);
      }
    } catch (e) {
      debugPrint("Error getting location: $e");
    }
  }

  Future<void> _getAddressFromLatLng(LatLng position) async {
    try {
      List<Placemark> placemarks = await placemarkFromCoordinates(
        position.latitude,
        position.longitude,
      );

      if (placemarks.isNotEmpty) {
        Placemark place = placemarks[0];
        if (mounted) {
          setState(() {
            _address = "${place.street}, ${place.subLocality}, ${place.locality}, ${place.country}";
          });
        }
      }
    } catch (e) {
      debugPrint("Error fetching address: $e");
      if (mounted) setState(() => _address = "Address not found");
    }
  }

  @override
  Widget build(BuildContext context) {
    return GlassScaffold(
      appBar: AppBar(
        title: const Text('Select Location'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: Column(
        children: [
          const SizedBox(height: 100),
          // Search Bar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: PremiumCard(
              opacity: 0.2,
              borderRadius: 20,
              child: TextField(
                controller: _searchController,
                decoration: InputDecoration(
                  hintText: 'Search for area, street...',
                  prefixIcon: const Icon(Icons.search_rounded),
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(vertical: 15),
                ),
                onSubmitted: (value) async {
                  try {
                    List<Location> locations = await locationFromAddress(value);
                    if (locations.isNotEmpty) {
                      final loc = LatLng(locations[0].latitude, locations[0].longitude);
                      _mapController.move(loc, 15);
                      setState(() => _selectedLocation = loc);
                      _getAddressFromLatLng(loc);
                    }
                  } catch (e) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Address not found.')),
                    );
                  }
                },
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Interactive Map
          Expanded(
            flex: 2,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: PremiumCard(
                opacity: 0.1,
                borderRadius: 32,
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(32),
                  child: Stack(
                    children: [
                      FlutterMap(
                        mapController: _mapController,
                        options: MapOptions(
                          initialCenter: _selectedLocation,
                          initialZoom: 15,
                          onTap: (tapPosition, point) {
                            setState(() => _selectedLocation = point);
                            _getAddressFromLatLng(point);
                          },
                        ),
                        children: [
                          TileLayer(
                            urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                            userAgentPackageName: 'com.example.tailwagging',
                          ),
                          MarkerLayer(
                            markers: [
                              Marker(
                                point: _selectedLocation,
                                width: 80,
                                height: 80,
                                child: const Icon(
                                  Icons.location_on_rounded,
                                  color: AppColors.dangerRed,
                                  size: 40,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                      // Floating "My Location" Button
                      Positioned(
                        bottom: 20,
                        right: 20,
                        child: FloatingActionButton(
                          mini: true,
                          backgroundColor: Colors.white,
                          onPressed: _getCurrentLocation,
                          child: const Icon(Icons.my_location_rounded, color: AppColors.primary),
                        ),
                      ),
                      if (_isLoading)
                        const Center(child: CircularProgressIndicator()),
                    ],
                  ),
                ),
              ),
            ),
          ),

          // Selected Address & Actions
          Expanded(
            flex: 1,
            child: Container(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('SELECTED ADDRESS', 
                    style: AppTypography.labelSmall.copyWith(fontWeight: FontWeight.w700, color: AppColors.primary, letterSpacing: 1)),
                  const SizedBox(height: 8),
                  Text(_address, 
                    style: AppTypography.bodyLarge.copyWith(fontWeight: FontWeight.w600, height: 1.4),
                    maxLines: 2, overflow: TextOverflow.ellipsis),
                  const Spacer(),
                  SizedBox(
                    width: double.infinity,
                    height: 60,
                    child: ElevatedButton(
                      onPressed: () {
                        HapticFeedback.mediumImpact();
                        Navigator.pop(context, _address);
                      },
                      style: ElevatedButton.styleFrom(
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                      ),
                      child: const Text('CONFIRM LOCATION', style: TextStyle(fontWeight: FontWeight.w700, letterSpacing: 0.8)),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
