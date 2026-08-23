import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
import 'package:animate_do/animate_do.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:url_launcher/url_launcher.dart';
import 'dart:async';
import 'dart:convert';
import '../../../core/theme/app_colors.dart';
import 'glass_scaffold.dart';

class PlaceSuggestion {
  final String title;
  final String subtitle;
  final String? placeId;
  final LatLng? coordinates;
  final IconData icon;

  const PlaceSuggestion({
    required this.title,
    required this.subtitle,
    this.placeId,
    this.coordinates,
    this.icon = Icons.location_on_outlined,
  });
}

class LocationPickerScreen extends StatefulWidget {
  const LocationPickerScreen({super.key});

  @override
  State<LocationPickerScreen> createState() => _LocationPickerScreenState();
}

class _LocationPickerScreenState extends State<LocationPickerScreen> with SingleTickerProviderStateMixin {
  GoogleMapController? _mapController;
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _searchFocusNode = FocusNode();
  
  LatLng _selectedLocation = const LatLng(23.8103, 90.4125); // Default: Dhaka
  String _placeName = "Selected Location";
  String _address = "Locating your area...";
  String _postalCode = "";
  String _country = "";
  
  bool _isSearching = false;
  bool _is3D = true;
  bool _trafficEnabled = false;
  bool _buildingsEnabled = true;
  bool _showSuggestions = false;
  
  List<PlaceSuggestion> _suggestions = [];
  Timer? _debounce;
  
  MapType _mapType = MapType.normal;
  late AnimationController _pinController;

  @override
  void initState() {
    super.initState();
    _pinController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
    
    _searchFocusNode.addListener(() {
      if (!_searchFocusNode.hasFocus && mounted) {
        Future.delayed(const Duration(milliseconds: 200), () {
          if (mounted && !_searchFocusNode.hasFocus) {
            setState(() => _showSuggestions = false);
          }
        });
      }
    });

    _getCurrentLocation();
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _pinController.dispose();
    _searchFocusNode.dispose();
    _searchController.dispose();
    _mapController?.dispose();
    super.dispose();
  }

  Future<void> _getCurrentLocation() async {
    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }

    if (permission == LocationPermission.whileInUse || permission == LocationPermission.always) {
      try {
        Position? position = await Geolocator.getLastKnownPosition();
        position ??= await Geolocator.getCurrentPosition(
          locationSettings: const LocationSettings(
            accuracy: LocationAccuracy.high,
            timeLimit: Duration(seconds: 5),
          ),
        );

        final latLng = LatLng(position.latitude, position.longitude);
        _animateToLocation(latLng);
        _getAddressFromLatLng(latLng);
      } catch (e) {
        debugPrint("Error getting location: $e");
      }
    }
  }

  void _animateToLocation(LatLng target) {
    _mapController?.animateCamera(
      CameraUpdate.newCameraPosition(
        CameraPosition(
          target: target,
          zoom: _is3D ? 17.5 : 16.0,
          tilt: _is3D ? 48.0 : 0.0,
          bearing: _is3D ? 25.0 : 0.0,
        ),
      ),
    );
    setState(() => _selectedLocation = target);
    _pinController.forward(from: 0);
  }

  void _toggle3D() {
    HapticFeedback.mediumImpact();
    setState(() => _is3D = !_is3D);
    if (_mapController != null) {
      _mapController!.animateCamera(
        CameraUpdate.newCameraPosition(
          CameraPosition(
            target: _selectedLocation,
            zoom: _is3D ? 17.5 : 16.0,
            tilt: _is3D ? 48.0 : 0.0,
            bearing: _is3D ? 25.0 : 0.0,
          ),
        ),
      );
    }
  }

  // ─── REVERSE GEOCODING (Coordinates -> Full Rich Address Metadata) ──────────
  Future<void> _getAddressFromLatLng(LatLng position) async {
    if (_debounce?.isActive ?? false) _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 350), () async {
      try {
        List<Placemark> placemarks = await placemarkFromCoordinates(position.latitude, position.longitude);
        if (placemarks.isNotEmpty && mounted) {
          final place = placemarks.first;
          final name = place.name?.trim() ?? '';
          final street = place.street?.trim() ?? '';
          final subLoc = place.subLocality?.trim() ?? '';
          final loc = place.locality?.trim() ?? place.subAdministrativeArea?.trim() ?? '';
          final postal = place.postalCode?.trim() ?? '';
          final country = place.country?.trim() ?? '';

          String title = name;
          if (title.isEmpty || RegExp(r'^\d+$').hasMatch(title)) {
            title = street.isNotEmpty ? street : (subLoc.isNotEmpty ? subLoc : (loc.isNotEmpty ? loc : 'Selected Location'));
          } else if (street.isNotEmpty && !name.contains(street) && !street.contains(name)) {
            title = "$name, $street";
          }

          final fullAddr = [street, subLoc, loc, country].where((s) => s.isNotEmpty).toSet().join(', ');
          
          setState(() {
            _placeName = title;
            _address = fullAddr.isNotEmpty ? fullAddr : "Selected Location on Map";
            _postalCode = postal;
            _country = country;
          });
        }
      } catch (_) {
        if (mounted) {
          setState(() {
            _placeName = "Selected Coordinates";
            _address = "${position.latitude.toStringAsFixed(6)}, ${position.longitude.toStringAsFixed(6)}";
          });
        }
      }
    });
  }

  // ─── ROBUST SEARCH SUGGESTIONS ENGINE ───────────────────────────────────────
  void _onSearchQueryChanged(String query) {
    if (query.trim().isEmpty) {
      setState(() {
        _suggestions = [];
        _showSuggestions = false;
        _isSearching = false;
      });
      return;
    }

    setState(() {
      _isSearching = true;
      _showSuggestions = true;
    });

    if (_debounce?.isActive ?? false) _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 300), () {
      _fetchSuggestions(query.trim());
    });
  }

  Future<void> _fetchSuggestions(String query) async {
    final apiKey = dotenv.env['GOOGLE_MAPS_API_KEY'] ?? '';
    List<PlaceSuggestion> results = [];

    // 1. Try Google Places Autocomplete API
    if (apiKey.isNotEmpty) {
      try {
        final url = Uri.parse(
          'https://maps.googleapis.com/maps/api/place/autocomplete/json?'
          'input=${Uri.encodeComponent(query)}&'
          'key=$apiKey&'
          'types=geocode|establishment',
        );

        final response = await http.get(url).timeout(const Duration(seconds: 3));
        if (response.statusCode == 200) {
          final data = json.decode(response.body);
          if (data['status'] == 'OK' && data['predictions'] != null) {
            for (var item in data['predictions']) {
              final structured = item['structured_formatting'] ?? {};
              final mainText = structured['main_text'] ?? item['description'] ?? query;
              final secondaryText = structured['secondary_text'] ?? '';
              final placeId = item['place_id'] as String?;

              results.add(
                PlaceSuggestion(
                  title: mainText,
                  subtitle: secondaryText,
                  placeId: placeId,
                  icon: _getIconForPlaceTypes(item['types'] as List?),
                ),
              );
            }
          }
        }
      } catch (e) {
        debugPrint("Google Places API error, using geocoding fallback: $e");
      }
    }

    // 2. Device Geocoding Fallback if Places API returned empty
    if (results.isEmpty) {
      try {
        List<Location> locations = await locationFromAddress(query);
        for (var loc in locations.take(5)) {
          List<Placemark> placemarks = await placemarkFromCoordinates(loc.latitude, loc.longitude);
          if (placemarks.isNotEmpty) {
            final p = placemarks.first;
            final title = p.name?.isNotEmpty == true ? p.name! : query;
            final subtitle = [p.street, p.subLocality, p.locality, p.country].where((s) => s != null && s.isNotEmpty).join(', ');
            results.add(
              PlaceSuggestion(
                title: title,
                subtitle: subtitle,
                coordinates: LatLng(loc.latitude, loc.longitude),
                icon: Icons.place_rounded,
              ),
            );
          }
        }
      } catch (_) {}
    }

    if (mounted) {
      setState(() {
        _suggestions = results;
        _isSearching = false;
      });
    }
  }

  IconData _getIconForPlaceTypes(List? types) {
    if (types == null) return Icons.location_on_outlined;
    final t = types.map((e) => e.toString().toLowerCase()).toSet();
    if (t.contains('restaurant') || t.contains('food') || t.contains('cafe')) return Icons.restaurant_rounded;
    if (t.contains('store') || t.contains('shopping_mall') || t.contains('supermarket')) return Icons.storefront_rounded;
    if (t.contains('park') || t.contains('natural_feature')) return Icons.park_rounded;
    if (t.contains('hospital') || t.contains('health') || t.contains('veterinary_care')) return Icons.local_hospital_rounded;
    if (t.contains('transit_station') || t.contains('airport') || t.contains('bus_station')) return Icons.directions_transit_rounded;
    if (t.contains('school') || t.contains('university')) return Icons.school_rounded;
    return Icons.place_rounded;
  }

  // ─── SELECT SUGGESTION & FLY TO PLACE ───────────────────────────────────────
  Future<void> _selectSuggestion(PlaceSuggestion suggestion) async {
    HapticFeedback.lightImpact();
    _searchFocusNode.unfocus();
    setState(() {
      _showSuggestions = false;
      _searchController.text = suggestion.title;
      _isSearching = true;
    });

    LatLng? targetCoords = suggestion.coordinates;

    // Resolve Place ID coordinates if needed
    if (targetCoords == null && suggestion.placeId != null) {
      final apiKey = dotenv.env['GOOGLE_MAPS_API_KEY'] ?? '';
      if (apiKey.isNotEmpty) {
        try {
          final url = Uri.parse(
            'https://maps.googleapis.com/maps/api/place/details/json?'
            'place_id=${suggestion.placeId}&'
            'fields=geometry,name,formatted_address&'
            'key=$apiKey',
          );
          final response = await http.get(url).timeout(const Duration(seconds: 4));
          if (response.statusCode == 200) {
            final data = json.decode(response.body);
            if (data['status'] == 'OK' && data['result']?['geometry']?['location'] != null) {
              final loc = data['result']['geometry']['location'];
              targetCoords = LatLng(loc['lat'], loc['lng']);
            }
          }
        } catch (_) {}
      }
    }

    // Fallback Geocoding query
    if (targetCoords == null) {
      try {
        final query = "${suggestion.title} ${suggestion.subtitle}".trim();
        List<Location> locs = await locationFromAddress(query);
        if (locs.isNotEmpty) {
          targetCoords = LatLng(locs.first.latitude, locs.first.longitude);
        }
      } catch (_) {}
    }

    if (targetCoords != null && mounted) {
      _animateToLocation(targetCoords);
      _getAddressFromLatLng(targetCoords);
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not navigate to selected place.')),
      );
    }

    if (mounted) setState(() => _isSearching = false);
  }

  // ─── OPEN IN GOOGLE MAPS APP ────────────────────────────────────────────────
  Future<void> _openInExternalGoogleMaps() async {
    HapticFeedback.lightImpact();
    final url = Uri.parse('https://www.google.com/maps/search/?api=1&query=${_selectedLocation.latitude},${_selectedLocation.longitude}');
    try {
      if (await canLaunchUrl(url)) {
        await launchUrl(url, mode: LaunchMode.externalApplication);
      }
    } catch (_) {}
  }

  // ─── MAP LAYERS BOTTOM SHEET (Full Map Modes: Normal, Satellite, Hybrid, Terrain) ──
  void _showLayersSheet(bool isDark) {
    HapticFeedback.lightImpact();
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => StatefulBuilder(
        builder: (context, setSheetState) => Container(
          margin: const EdgeInsets.all(20),
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1A1F26) : Colors.white,
            borderRadius: BorderRadius.circular(28),
            border: Border.all(
              color: isDark ? const Color(0xFF2C3545) : Colors.black.withValues(alpha: 0.06),
              width: 1,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: isDark ? 0.5 : 0.15),
                blurRadius: 30,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 36, height: 4,
                  decoration: BoxDecoration(
                    color: isDark ? Colors.grey[700] : Colors.grey[300],
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 18),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Map details & layers',
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: isDark ? Colors.white : Colors.black87,
                    ),
                  ),
                  IconButton(
                    icon: Icon(Icons.close_rounded, size: 20, color: isDark ? Colors.grey[400] : Colors.black54),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _buildLayerOption('Default', Icons.map_outlined, MapType.normal, isDark, setSheetState),
                  _buildLayerOption('Satellite', Icons.satellite_alt_rounded, MapType.satellite, isDark, setSheetState),
                  _buildLayerOption('Hybrid', Icons.public_rounded, MapType.hybrid, isDark, setSheetState),
                  _buildLayerOption('Terrain', Icons.terrain_rounded, MapType.terrain, isDark, setSheetState),
                ],
              ),
              Divider(height: 28, color: isDark ? const Color(0xFF2C3545) : Colors.grey[200]),
              
              // Traffic Layer Toggle
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.orange.withValues(alpha: isDark ? 0.2 : 0.12),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.traffic_rounded, color: Colors.orange, size: 18),
                      ),
                      const SizedBox(width: 12),
                      Text(
                        'Live Traffic Flow',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: isDark ? Colors.white : Colors.black87,
                        ),
                      ),
                    ],
                  ),
                  Switch(
                    value: _trafficEnabled,
                    activeThumbColor: AppColors.primary,
                    onChanged: (val) {
                      setSheetState(() => _trafficEnabled = val);
                      setState(() => _trafficEnabled = val);
                    },
                  ),
                ],
              ),
              const SizedBox(height: 10),

              // 3D Buildings Toggle
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: isDark ? 0.2 : 0.12),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.apartment_rounded, color: AppColors.primary, size: 18),
                      ),
                      const SizedBox(width: 12),
                      Text(
                        '3D Buildings & Landmarks',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: isDark ? Colors.white : Colors.black87,
                        ),
                      ),
                    ],
                  ),
                  Switch(
                    value: _buildingsEnabled,
                    activeThumbColor: AppColors.primary,
                    onChanged: (val) {
                      setSheetState(() => _buildingsEnabled = val);
                      setState(() => _buildingsEnabled = val);
                    },
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLayerOption(String name, IconData icon, MapType type, bool isDark, StateSetter setSheetState) {
    final isSelected = _mapType == type;
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        setSheetState(() => _mapType = type);
        setState(() => _mapType = type);
      },
      child: Column(
        children: [
          Container(
            width: 58,
            height: 58,
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
            child: Icon(
              icon,
              color: isSelected ? AppColors.primary : (isDark ? Colors.grey[300] : Colors.grey[700]),
              size: 26,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            name,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 11,
              fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
              color: isSelected ? AppColors.primary : (isDark ? Colors.grey[300] : Colors.grey[700]),
            ),
          ),
        ],
      ),
    );
  }

  // ─── MAIN BUILD ─────────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GlassScaffold(
      body: Stack(
        children: [
          // ─── 1. FULL SCREEN 3D GOOGLE MAP (Full Data + POIs + 3D Buildings) ──
          Positioned.fill(
            child: GoogleMap(
              initialCameraPosition: CameraPosition(
                target: _selectedLocation,
                zoom: 17.5,
                tilt: 48.0,
                bearing: 25.0,
              ),
              style: (_mapType == MapType.normal && isDark) ? _googleMapsDarkTheme : null,
              onMapCreated: (controller) => _mapController = controller,
              onTap: (point) {
                _searchFocusNode.unfocus();
                setState(() => _showSuggestions = false);
                _animateToLocation(point);
                _getAddressFromLatLng(point);
                HapticFeedback.lightImpact();
              },
              mapType: _mapType,
              trafficEnabled: _trafficEnabled,
              buildingsEnabled: _buildingsEnabled,
              indoorViewEnabled: true,
              tiltGesturesEnabled: true,
              rotateGesturesEnabled: true,
              scrollGesturesEnabled: true,
              zoomGesturesEnabled: true,
              compassEnabled: true,
              mapToolbarEnabled: true,
              myLocationEnabled: true,
              myLocationButtonEnabled: false,
              zoomControlsEnabled: false,
              markers: {
                Marker(
                  markerId: const MarkerId('selected_location'),
                  position: _selectedLocation,
                  icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueRed),
                  infoWindow: InfoWindow(title: _placeName, snippet: _address),
                ),
              },
            ),
          ),

          // ─── 2. GOOGLE MAPS FLOATING SEARCH PILL & SUGGESTIONS ─────────────
          Positioned(
            top: MediaQuery.of(context).padding.top + 10,
            left: 16,
            right: 16,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Floating Google Maps Style Search Bar
                FadeInDown(
                  duration: const Duration(milliseconds: 300),
                  child: Container(
                    height: 52,
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF1E242B) : Colors.white,
                      borderRadius: BorderRadius.circular(26),
                      border: Border.all(
                        color: isDark ? const Color(0xFF2C3440) : Colors.black.withValues(alpha: 0.08),
                        width: 1.2,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: isDark ? 0.4 : 0.14),
                          blurRadius: 18,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Row(
                      children: [
                        IconButton(
                          icon: Icon(
                            Icons.arrow_back_rounded,
                            color: isDark ? Colors.white : Colors.black87,
                            size: 22,
                          ),
                          onPressed: () => Navigator.pop(context),
                        ),
                        Expanded(
                          child: TextField(
                            controller: _searchController,
                            focusNode: _searchFocusNode,
                            onChanged: _onSearchQueryChanged,
                            textInputAction: TextInputAction.search,
                            cursorColor: AppColors.primary,
                            onSubmitted: (val) {
                              if (_suggestions.isNotEmpty) {
                                _selectSuggestion(_suggestions.first);
                              } else {
                                _onSearchQueryChanged(val);
                              }
                            },
                            style: GoogleFonts.plusJakartaSans(
                              fontWeight: FontWeight.w600,
                              fontSize: 15,
                              color: isDark ? Colors.white : Colors.black87,
                            ),
                            decoration: InputDecoration(
                              filled: false,
                              fillColor: Colors.transparent,
                              hoverColor: Colors.transparent,
                              focusColor: Colors.transparent,
                              hintText: 'Search here...',
                              hintStyle: GoogleFonts.plusJakartaSans(
                                color: isDark ? Colors.grey[400] : Colors.grey[500],
                                fontSize: 14,
                                fontWeight: FontWeight.w500,
                              ),
                              border: InputBorder.none,
                              enabledBorder: InputBorder.none,
                              focusedBorder: InputBorder.none,
                              disabledBorder: InputBorder.none,
                              errorBorder: InputBorder.none,
                              contentPadding: const EdgeInsets.symmetric(vertical: 14, horizontal: 4),
                            ),
                          ),
                        ),
                        if (_searchController.text.isNotEmpty)
                          IconButton(
                            icon: Icon(Icons.clear_rounded, color: isDark ? Colors.grey[400] : Colors.grey, size: 18),
                            onPressed: () {
                              _searchController.clear();
                              _onSearchQueryChanged('');
                            },
                          ),
                        if (_isSearching)
                          const Padding(
                            padding: EdgeInsets.symmetric(horizontal: 14),
                            child: SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
                            ),
                          )
                        else
                          IconButton(
                            icon: Icon(
                              Icons.layers_outlined,
                              color: isDark ? Colors.white70 : Colors.black87,
                              size: 22,
                            ),
                            onPressed: () => _showLayersSheet(isDark),
                          ),
                      ],
                    ),
                  ),
                ),

                // Live Autocomplete Suggestions Card
                if (_showSuggestions && _suggestions.isNotEmpty)
                  FadeIn(
                    duration: const Duration(milliseconds: 200),
                    child: Container(
                      margin: const EdgeInsets.only(top: 8),
                      constraints: BoxConstraints(
                        maxHeight: MediaQuery.of(context).size.height * 0.4,
                      ),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF1E242B) : Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: isDark ? const Color(0xFF2C3440) : Colors.black.withValues(alpha: 0.08),
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: isDark ? 0.5 : 0.16),
                            blurRadius: 24,
                            offset: const Offset(0, 8),
                          ),
                        ],
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(20),
                        child: ListView.separated(
                          padding: const EdgeInsets.symmetric(vertical: 6),
                          shrinkWrap: true,
                          itemCount: _suggestions.length,
                          separatorBuilder: (context, index) => Divider(
                            height: 1,
                            color: isDark ? const Color(0xFF2C3440) : Colors.grey[200],
                          ),
                          itemBuilder: (context, index) {
                            final item = _suggestions[index];
                            return ListTile(
                              leading: Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: isDark ? const Color(0xFF28313D) : Colors.grey[100],
                                  shape: BoxShape.circle,
                                ),
                                child: Icon(
                                  item.icon,
                                  color: isDark ? AppColors.primary : Colors.grey[700],
                                  size: 18,
                                ),
                              ),
                              title: Text(
                                item.title,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w700,
                                  color: isDark ? Colors.white : Colors.black87,
                                ),
                              ),
                              subtitle: item.subtitle.isNotEmpty
                                  ? Text(
                                      item.subtitle,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: GoogleFonts.plusJakartaSans(
                                        fontSize: 12,
                                        color: isDark ? Colors.grey[400] : Colors.grey[600],
                                      ),
                                    )
                                  : null,
                              trailing: Icon(
                                Icons.north_west_rounded,
                                size: 14,
                                color: isDark ? Colors.grey[500] : Colors.grey,
                              ),
                              onTap: () => _selectSuggestion(item),
                            );
                          },
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),

          // ─── 3. GOOGLE MAPS FLOATING SIDE ACTION CONTROLS (Top-Right) ───────
          Positioned(
            right: 16,
            top: MediaQuery.of(context).padding.top + 76,
            child: FadeInRight(
              duration: const Duration(milliseconds: 300),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // 3D / 2D Perspective Toggle
                  _buildFloatingActionBtn(
                    onTap: _toggle3D,
                    isDark: isDark,
                    isActive: _is3D,
                    child: Center(
                      child: Text(
                        _is3D ? '3D' : '2D',
                        style: GoogleFonts.plusJakartaSans(
                          color: _is3D ? Colors.white : (isDark ? Colors.white : AppColors.primary),
                          fontWeight: FontWeight.w900,
                          fontSize: 13,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),
                  
                  // Map Layers / Traffic / Hybrid Toggle
                  _buildFloatingActionBtn(
                    onTap: () => _showLayersSheet(isDark),
                    isDark: isDark,
                    child: Icon(
                      Icons.layers_rounded,
                      color: isDark ? Colors.white70 : Colors.black87,
                      size: 20,
                    ),
                  ),
                  const SizedBox(height: 10),

                  // GPS Re-Center Button
                  _buildFloatingActionBtn(
                    onTap: () {
                      HapticFeedback.lightImpact();
                      _getCurrentLocation();
                    },
                    isDark: isDark,
                    child: const Icon(Icons.my_location_rounded, color: AppColors.primary, size: 20),
                  ),
                ],
              ),
            ),
          ),

          // ─── 4. GOOGLE MAPS STYLE BOTTOM PLACE INFO SHEET (Full Metadata) ───
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: FadeInUp(
              duration: const Duration(milliseconds: 350),
              child: Container(
                padding: EdgeInsets.fromLTRB(20, 14, 20, MediaQuery.of(context).padding.bottom + 16),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF161A20) : Colors.white,
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
                  border: Border(
                    top: BorderSide(
                      color: isDark ? const Color(0xFF2C3440) : Colors.black.withValues(alpha: 0.06),
                      width: 1,
                    ),
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: isDark ? 0.5 : 0.12),
                      blurRadius: 30,
                      offset: const Offset(0, -6),
                    ),
                  ],
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Sheet Drag Handle
                    Center(
                      child: Container(
                        width: 40,
                        height: 4.5,
                        decoration: BoxDecoration(
                          color: isDark ? Colors.grey[700] : Colors.grey[300],
                          borderRadius: BorderRadius.circular(3),
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Place Title & Badge
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withValues(alpha: isDark ? 0.2 : 0.12),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: const Icon(Icons.location_on_rounded, color: AppColors.primary, size: 24),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                _placeName,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: GoogleFonts.plusJakartaSans(
                                  fontWeight: FontWeight.w800,
                                  fontSize: 17,
                                  color: isDark ? Colors.white : Colors.black87,
                                ),
                              ),
                              const SizedBox(height: 3),
                              Text(
                                _address,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: GoogleFonts.plusJakartaSans(
                                  fontWeight: FontWeight.w500,
                                  fontSize: 13,
                                  color: isDark ? Colors.grey[400] : Colors.grey[600],
                                  height: 1.3,
                                ),
                              ),
                              if (_postalCode.isNotEmpty || _country.isNotEmpty)
                                Padding(
                                  padding: const EdgeInsets.only(top: 4),
                                  child: Text(
                                    [_postalCode, _country].where((s) => s.isNotEmpty).join(' • '),
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w700,
                                      color: isDark ? AppColors.primary : AppColors.primaryDark,
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 14),

                    // Quick Map Action Chips
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          _buildActionChip(
                            icon: _is3D ? Icons.view_in_ar_rounded : Icons.map_rounded,
                            label: _is3D ? '3D View: On' : '3D View: Off',
                            isDark: isDark,
                            onTap: _toggle3D,
                          ),
                          const SizedBox(width: 8),
                          _buildActionChip(
                            icon: Icons.layers_outlined,
                            label: _mapType == MapType.normal
                                ? 'Streets'
                                : _mapType == MapType.satellite
                                    ? 'Satellite'
                                    : _mapType == MapType.hybrid
                                        ? 'Hybrid'
                                        : 'Terrain',
                            isDark: isDark,
                            onTap: () => _showLayersSheet(isDark),
                          ),
                          const SizedBox(width: 8),
                          _buildActionChip(
                            icon: Icons.directions_outlined,
                            label: 'Open in Maps',
                            isDark: isDark,
                            onTap: _openInExternalGoogleMaps,
                          ),
                          const SizedBox(width: 8),
                          _buildActionChip(
                            icon: Icons.gps_fixed_rounded,
                            label: 'Re-center',
                            isDark: isDark,
                            onTap: _getCurrentLocation,
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Primary CTA: Confirm Location
                    SizedBox(
                      width: double.infinity,
                      height: 54,
                      child: ElevatedButton(
                        onPressed: () {
                          HapticFeedback.heavyImpact();
                          Navigator.pop(context, _address);
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          elevation: 4,
                          shadowColor: AppColors.primary.withValues(alpha: 0.4),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.check_circle_rounded, color: Colors.white, size: 20),
                            const SizedBox(width: 8),
                            Text(
                              'CONFIRM THIS ADDRESS',
                              style: GoogleFonts.plusJakartaSans(
                                color: Colors.white,
                                fontWeight: FontWeight.w800,
                                fontSize: 14,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ],
                        ),
                      ),
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

  // ─── UI HELPER WIDGETS ──────────────────────────────────────────────────────
  Widget _buildFloatingActionBtn({
    required VoidCallback onTap,
    required Widget child,
    required bool isDark,
    bool isActive = false,
  }) {
    return Container(
      width: 46,
      height: 46,
      decoration: BoxDecoration(
        color: isActive ? AppColors.primary : (isDark ? const Color(0xFF1E242B) : Colors.white),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isActive ? AppColors.primary : (isDark ? const Color(0xFF2C3440) : Colors.black.withValues(alpha: 0.08)),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.35 : 0.12),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: onTap,
          child: child,
        ),
      ),
    );
  }

  Widget _buildActionChip({
    required IconData icon,
    required String label,
    required bool isDark,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF222933) : Colors.grey[100],
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: isDark ? const Color(0xFF2E3846) : Colors.grey[300]!),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 16, color: isDark ? AppColors.primary : Colors.grey[800]),
            const SizedBox(width: 6),
            Text(
              label,
              style: GoogleFonts.plusJakartaSans(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: isDark ? Colors.grey[200] : Colors.grey[800],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ─── AUTHENTIC GOOGLE MAPS FULL-DATA NIGHT PALETTE ──────────────────────────
  static const String _googleMapsDarkTheme = '''
[
  {
    "elementType": "geometry",
    "stylers": [{"color": "#242f3e"}]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#746855"}]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{"color": "#242f3e"}]
  },
  {
    "featureType": "administrative.locality",
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#d59563"}]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#d59563"}]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [{"color": "#263c3f"}]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#6b9a76"}]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [{"color": "#38414e"}]
  },
  {
    "featureType": "road",
    "elementType": "geometry.stroke",
    "stylers": [{"color": "#212a37"}]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#9ca5b3"}]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [{"color": "#746855"}]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry.stroke",
    "stylers": [{"color": "#1f2835"}]
  },
  {
    "featureType": "road.highway",
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#f3d19c"}]
  },
  {
    "featureType": "transit",
    "elementType": "geometry",
    "stylers": [{"color": "#2f3948"}]
  },
  {
    "featureType": "transit.station",
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#d59563"}]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{"color": "#17263c"}]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#515c6d"}]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.stroke",
    "stylers": [{"color": "#17263c"}]
  }
]
''';
}
