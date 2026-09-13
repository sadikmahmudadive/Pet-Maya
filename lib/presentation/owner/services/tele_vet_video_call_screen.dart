import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:animate_do/animate_do.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:camera/camera.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/models/vet_model.dart';
import '../../../data/models/pet_model.dart';
import '../../../data/models/service_record_model.dart';
import '../../../data/repositories/app_state_repository.dart';
import '../../common_widgets/resilient_network_image.dart';

class TeleVetVideoCallScreen extends StatefulWidget {
  final VetModel vet;
  final PetModel pet;
  final String channelId;

  const TeleVetVideoCallScreen({
    super.key,
    required this.vet,
    required this.pet,
    this.channelId = 'tele_vet_channel_default',
  });

  @override
  State<TeleVetVideoCallScreen> createState() => _TeleVetVideoCallScreenState();
}

class _TeleVetVideoCallScreenState extends State<TeleVetVideoCallScreen> {
  bool _isMuted = false;
  bool _isVideoOff = false;
  bool _isFrontCamera = true;
  bool _isConnected = false;
  int _callDurationSeconds = 0;
  Timer? _callTimer;

  List<CameraDescription> _cameras = [];
  CameraController? _cameraController;
  bool _cameraReady = false;
  String? _cameraError;

  @override
  void initState() {
    super.initState();
    _requestPermissionsAndConnect();
  }

  Future<void> _requestPermissionsAndConnect() async {
    final statuses = await [Permission.camera, Permission.microphone].request();
    final cameraGranted = statuses[Permission.camera]?.isGranted ?? false;
    final micGranted = statuses[Permission.microphone]?.isGranted ?? false;

    if (!mounted) return;

    if (!cameraGranted || !micGranted) {
      setState(() {
        _cameraError = cameraGranted
            ? 'Microphone permission is required for the call.'
            : 'Camera permission is required for the call.';
        _isConnected = true;
      });
      _startCallTimer();
      return;
    }

    await _initCamera(useFrontCamera: true);
    if (!mounted) return;
    setState(() => _isConnected = true);
    _startCallTimer();
    HapticFeedback.heavyImpact();
  }

  Future<void> _initCamera({required bool useFrontCamera}) async {
    try {
      if (_cameras.isEmpty) {
        _cameras = await availableCameras();
      }
      if (_cameras.isEmpty) {
        if (mounted) setState(() => _cameraError = 'No camera found on this device.');
        return;
      }
      final selected = _cameras.firstWhere(
        (c) => c.lensDirection == (useFrontCamera ? CameraLensDirection.front : CameraLensDirection.back),
        orElse: () => _cameras.first,
      );
      await _cameraController?.dispose();
      final controller = CameraController(selected, ResolutionPreset.medium, enableAudio: true);
      await controller.initialize();
      if (!mounted) { await controller.dispose(); return; }
      setState(() { _cameraController = controller; _cameraReady = true; _cameraError = null; });
    } catch (e) {
      if (mounted) setState(() => _cameraError = 'Camera error: $e');
    }
  }

  Future<void> _flipCamera() async {
    HapticFeedback.lightImpact();
    setState(() { _isFrontCamera = !_isFrontCamera; _cameraReady = false; });
    await _initCamera(useFrontCamera: _isFrontCamera);
  }

  Future<void> _toggleVideo() async {
    HapticFeedback.lightImpact();
    if (_cameraController == null || !_cameraReady) return;
    if (_isVideoOff) {
      await _cameraController!.resumePreview();
    } else {
      await _cameraController!.pausePreview();
    }
    setState(() => _isVideoOff = !_isVideoOff);
  }

  void _startCallTimer() {
    _callTimer?.cancel();
    _callTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() => _callDurationSeconds++);
    });
  }

  @override
  void dispose() {
    _callTimer?.cancel();
    _cameraController?.dispose();
    super.dispose();
  }

  String _formatDuration(int totalSeconds) {
    final m = (totalSeconds ~/ 60).toString().padLeft(2, '0');
    final s = (totalSeconds % 60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  void _endCall() {
    HapticFeedback.mediumImpact();
    _callTimer?.cancel();
    _cameraController?.dispose();
    _cameraController = null;

    final repo = context.read<AppStateRepository>();
    final ts = DateTime.now().millisecondsSinceEpoch;
    final record = ServiceRecordModel(
      recordId: 'consult_$ts',
      petId: widget.pet.petID,
      petName: widget.pet.name,
      serviceType: 'Tele-Consultation',
      providerId: widget.vet.id,
      providerName: widget.vet.name,
      providerRole: 'Veterinarian',
      date: DateTime.now().toString().substring(0, 10),
      title: 'Tele-Vet Consultation with ${widget.vet.name}',
      description: 'HD Video consultation completed. Duration: ${_formatDuration(_callDurationSeconds)}.',
      isSharedWithVets: true,
      timestamp: ts,
    );
    repo.addServiceRecord(record);

    showModalBottomSheet(
      context: context,
      isDismissible: false,
      enableDrag: false,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(28),
        decoration: const BoxDecoration(
          color: Color(0xFF0F172A),
          borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.healthGreen.withValues(alpha: 0.15),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.check_circle_rounded, color: AppColors.healthGreen, size: 40),
            ),
            const SizedBox(height: 16),
            Text('Consultation Ended',
                style: GoogleFonts.plusJakartaSans(fontSize: 20, fontWeight: FontWeight.w800, color: Colors.white)),
            const SizedBox(height: 6),
            Text('Duration: ${_formatDuration(_callDurationSeconds)} • Doctor: ${widget.vet.name}',
                style: const TextStyle(color: Colors.white60, fontSize: 13)),
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.05),
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: Colors.white10),
              ),
              child: Row(children: [
                const Icon(Icons.shield_outlined, color: AppColors.primary, size: 20),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Log saved to ${widget.pet.name}\'s Passport EHR Vault.',
                    style: const TextStyle(color: Colors.white70, fontSize: 12),
                  ),
                ),
              ]),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton(
                onPressed: () { Navigator.pop(ctx); Navigator.pop(context); },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: const Text('DONE',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, letterSpacing: 1.0)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final topPadding = MediaQuery.of(context).padding.top;
    return Scaffold(
      backgroundColor: const Color(0xFF090D16),
      body: Stack(
        children: [
          Positioned.fill(child: _buildMainVideoFeed()),
          _buildTopHeader(topPadding),
          if (_isConnected) _buildPipWindow(topPadding),
          _buildControlDock(),
        ],
      ),
    );
  }

  Widget _buildTopHeader(double topPadding) {
    return Positioned(
      top: topPadding + 12,
      left: 16,
      right: 16,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.black.withValues(alpha: 0.5),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: _isConnected ? AppColors.healthGreen : AppColors.accentAmber,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  _isConnected ? _formatDuration(_callDurationSeconds) : 'Connecting...',
                  style: GoogleFonts.plusJakartaSans(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 13),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.25),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.primary.withValues(alpha: 0.4)),
            ),
            child: Row(
              children: [
                const Icon(Icons.pets_rounded, size: 14, color: Colors.white),
                const SizedBox(width: 6),
                Text(
                  '${widget.pet.name} (${widget.pet.breed})',
                  style: GoogleFonts.plusJakartaSans(fontSize: 11.5, fontWeight: FontWeight.w800, color: Colors.white),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPipWindow(double topPadding) {
    return Positioned(
      top: topPadding + 70,
      right: 16,
      child: FadeInRight(
        child: Container(
          width: 105,
          height: 150,
          decoration: BoxDecoration(
            color: Colors.black87,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: AppColors.primary, width: 2),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(18),
            child: Stack(
              fit: StackFit.expand,
              children: [
                ResilientNetworkImage(
                  imageUrl: widget.vet.photoUrl,
                  fit: BoxFit.cover,
                  fallbackAssetPath: 'assets/images/vet_placeholder.png',
                ),
                Positioned(
                  bottom: 6,
                  left: 6,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.6),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      widget.vet.name.split(' ').first,
                      style: const TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildControlDock() {
    return Positioned(
      bottom: 40,
      left: 24,
      right: 24,
      child: FadeInUp(
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          decoration: BoxDecoration(
            color: const Color(0xCC0F172A),
            borderRadius: BorderRadius.circular(32),
            border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _buildDockIconButton(
                icon: _isMuted ? Icons.mic_off_rounded : Icons.mic_rounded,
                isActive: _isMuted,
                activeColor: AppColors.dangerRed,
                onTap: () { HapticFeedback.lightImpact(); setState(() => _isMuted = !_isMuted); },
              ),
              _buildDockIconButton(
                icon: _isVideoOff ? Icons.videocam_off_rounded : Icons.videocam_rounded,
                isActive: _isVideoOff,
                activeColor: AppColors.dangerRed,
                onTap: _toggleVideo,
              ),
              _buildDockIconButton(
                icon: Icons.flip_camera_ios_rounded,
                isActive: false,
                onTap: _flipCamera,
              ),
              GestureDetector(
                onTap: _endCall,
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: const BoxDecoration(
                    color: AppColors.dangerRed,
                    shape: BoxShape.circle,
                    boxShadow: [BoxShadow(color: AppColors.dangerRed, blurRadius: 14, spreadRadius: 2)],
                  ),
                  child: const Icon(Icons.call_end_rounded, color: Colors.white, size: 26),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMainVideoFeed() {
    if (!_isConnected) return _buildConnectingState();
    if (_cameraError != null) return _buildCameraErrorState();
    if (!_cameraReady || _cameraController == null) return _buildConnectingState();
    return Stack(
      fit: StackFit.expand,
      children: [
        if (!_isVideoOff)
          _isFrontCamera
              ? Transform(
                  alignment: Alignment.center,
                  transform: Matrix4.rotationY(3.14159),
                  child: CameraPreview(_cameraController!),
                )
              : CameraPreview(_cameraController!),
        if (_isVideoOff)
          Container(
            color: const Color(0xFF0F172A),
            child: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.videocam_off_rounded, color: Colors.white38, size: 48),
                  const SizedBox(height: 12),
                  Text('Camera Paused', style: GoogleFonts.plusJakartaSans(color: Colors.white54, fontSize: 14)),
                ],
              ),
            ),
          ),
        Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                Colors.black.withValues(alpha: 0.55),
                Colors.transparent,
                Colors.black.withValues(alpha: 0.7),
              ],
              stops: const [0.0, 0.4, 1.0],
            ),
          ),
        ),
        if (_isMuted)
          Positioned(
            top: 80,
            left: 16,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: AppColors.dangerRed.withValues(alpha: 0.85),
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.mic_off_rounded, color: Colors.white, size: 14),
                  SizedBox(width: 4),
                  Text('Muted', style: TextStyle(color: Colors.white, fontSize: 11)),
                ],
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildConnectingState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.15),
              shape: BoxShape.circle,
            ),
            child: const CircularProgressIndicator(color: AppColors.primary, strokeWidth: 3),
          ),
          const SizedBox(height: 20),
          Text(
            'Connecting to Dr. ${widget.vet.name}...',
            style: GoogleFonts.plusJakartaSans(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.white),
          ),
          const SizedBox(height: 6),
          const Text('Requesting camera & microphone access',
              style: TextStyle(color: Colors.white54, fontSize: 12)),
        ],
      ),
    );
  }

  Widget _buildCameraErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.videocam_off_rounded, color: Colors.white38, size: 56),
            const SizedBox(height: 16),
            Text('Camera Unavailable',
                style: GoogleFonts.plusJakartaSans(fontSize: 18, fontWeight: FontWeight.w700, color: Colors.white)),
            const SizedBox(height: 8),
            Text(_cameraError ?? 'Unknown error',
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.white54, fontSize: 13)),
            const SizedBox(height: 20),
            TextButton.icon(
              onPressed: openAppSettings,
              icon: const Icon(Icons.settings, color: AppColors.primary, size: 16),
              label: const Text('Open Settings', style: TextStyle(color: AppColors.primary)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDockIconButton({
    required IconData icon,
    required bool isActive,
    Color activeColor = AppColors.primary,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isActive ? activeColor : Colors.white.withValues(alpha: 0.12),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: Colors.white, size: 22),
      ),
    );
  }
}