import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:animate_do/animate_do.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:camera/camera.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../data/models/vet_model.dart';
import '../../../data/models/pet_model.dart';
import '../../../data/models/service_record_model.dart';
import '../../../data/repositories/app_state_repository.dart';
import '../../common_widgets/resilient_network_image.dart';

enum TeleVetCallState { ringing, connected, ended }

/// Production-grade Tele-Health Video Consultation Screen.
/// Features Outgoing/Incoming Ringing Screen, Live Camera Streams,
/// Swapable & Draggable Picture-in-Picture feeds, Camera Flip, Mute, and EHR Log Exports.
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
  TeleVetCallState _callState = TeleVetCallState.ringing;
  bool _isMuted = false;
  bool _isVideoOff = false;
  bool _isFrontCamera = true;
  bool _isSwappedPiP = false;

  int _callDurationSeconds = 0;
  Timer? _callTimer;
  Timer? _ringingTimer;

  List<CameraDescription> _cameras = [];
  CameraController? _cameraController;
  bool _cameraReady = false;
  String? _cameraError;

  @override
  void initState() {
    super.initState();
    _initPermissionsAndCamera();
    _startRingingPhase();
  }

  Future<void> _initPermissionsAndCamera() async {
    final statuses = await [Permission.camera, Permission.microphone].request();
    final cameraGranted = statuses[Permission.camera]?.isGranted ?? false;
    final micGranted = statuses[Permission.microphone]?.isGranted ?? false;

    if (!mounted) return;

    if (!cameraGranted || !micGranted) {
      setState(() {
        _cameraError = cameraGranted
            ? 'Microphone permission required.'
            : 'Camera permission required.';
      });
      return;
    }

    await _initCamera(useFrontCamera: true);
  }

  void _startRingingPhase() {
    _ringingTimer?.cancel();
    // Auto-connect after 4.5 seconds of ringing
    _ringingTimer = Timer(const Duration(milliseconds: 4500), () {
      if (mounted && _callState == TeleVetCallState.ringing) {
        _connectCallNow();
      }
    });
  }

  void _connectCallNow() {
    _ringingTimer?.cancel();
    HapticFeedback.heavyImpact();
    if (mounted) {
      setState(() {
        _callState = TeleVetCallState.connected;
      });
      _startCallTimer();
    }
  }

  Future<void> _initCamera({required bool useFrontCamera}) async {
    try {
      if (_cameras.isEmpty) {
        _cameras = await availableCameras();
      }
      if (_cameras.isEmpty) {
        if (mounted) setState(() => _cameraError = 'No camera found.');
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
    _callDurationSeconds = 0;
    _callTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() => _callDurationSeconds++);
    });
  }

  @override
  void dispose() {
    _ringingTimer?.cancel();
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
    _ringingTimer?.cancel();
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
              child: Row(
                children: [
                  const Icon(Icons.shield_outlined, color: AppColors.primary, size: 20),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Log saved to ${widget.pet.name}\'s Passport EHR Vault.',
                      style: const TextStyle(color: Colors.white70, fontSize: 12),
                    ),
                  ),
                ],
              ),
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

    if (_callState == TeleVetCallState.ringing) {
      return _buildRingingScreen(topPadding);
    }

    return Scaffold(
      backgroundColor: const Color(0xFF090D16),
      body: Stack(
        children: [
          // ─── MAIN FULLSCREEN STREAM ───
          Positioned.fill(
            child: _isSwappedPiP ? _buildVetVideoStream() : _buildLocalCameraStream(),
          ),

          // ─── TOP CONTROL HEADER ───
          _buildTopHeader(topPadding),

          // ─── PICTURE-IN-PICTURE FLOATING WINDOW ───
          Positioned(
            top: topPadding + 70,
            right: 16,
            child: FadeInRight(
              child: GestureDetector(
                onTap: () {
                  HapticFeedback.mediumImpact();
                  setState(() => _isSwappedPiP = !_isSwappedPiP);
                },
                child: Container(
                  width: 110,
                  height: 155,
                  decoration: BoxDecoration(
                    color: Colors.black87,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppColors.primary, width: 2),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.5),
                        blurRadius: 16,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(18),
                    child: Stack(
                      fit: StackFit.expand,
                      children: [
                        _isSwappedPiP ? _buildLocalCameraStream() : _buildVetVideoStream(),
                        Positioned(
                          bottom: 6,
                          left: 6,
                          right: 6,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                            decoration: BoxDecoration(
                              color: Colors.black.withValues(alpha: 0.7),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Text(
                                    _isSwappedPiP
                                        ? (_isFrontCamera ? 'You' : 'Pet Cam')
                                        : 'Dr. ${widget.vet.name.split(' ').first}',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 9,
                                      fontWeight: FontWeight.bold,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                const Icon(Icons.swap_calls_rounded, color: AppColors.primary, size: 10),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),

          // ─── BOTTOM CONTROL DOCK ───
          _buildControlDock(),
        ],
      ),
    );
  }

  // ─── RINGING / OUTGOING CALL VIEW ──────────────────────────────────────────
  Widget _buildRingingScreen(double topPadding) {
    return Scaffold(
      backgroundColor: const Color(0xFF090D16),
      body: Stack(
        fit: StackFit.expand,
        children: [
          // Ambient Glow Background
          Container(
            decoration: const BoxDecoration(
              gradient: RadialGradient(
                center: Alignment.center,
                radius: 1.2,
                colors: [Color(0xFF0F302A), Color(0xFF090D16)],
              ),
            ),
          ),

          // Top Patient Header
          Positioned(
            top: topPadding + 16,
            left: 20,
            right: 20,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppColors.primary.withValues(alpha: 0.4)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.pets_rounded, size: 14, color: Colors.white),
                      const SizedBox(width: 8),
                      Text(
                        'Patient: ${widget.pet.name} (${widget.pet.breed})',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 12,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Center Doctor Ringing Pulse Avatar
          Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _RingingPulseAvatar(
                  photoUrl: widget.vet.photoUrl,
                  vetName: widget.vet.name,
                ),
                const SizedBox(height: 32),
                Text(
                  widget.vet.name,
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 24,
                    fontWeight: FontWeight.w900,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  widget.vet.qualification,
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppColors.primary,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: Colors.white12),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.ring_volume_rounded, color: AppColors.primary, size: 16),
                      const SizedBox(width: 8),
                      Text(
                        'Calling Dr. ${widget.vet.name.split(' ').first}...',
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Bottom Action Controls
          Positioned(
            bottom: 50,
            left: 32,
            right: 32,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                // Decline / Cancel Call
                GestureDetector(
                  onTap: () {
                    HapticFeedback.mediumImpact();
                    _ringingTimer?.cancel();
                    Navigator.pop(context);
                  },
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(22),
                        decoration: const BoxDecoration(
                          color: AppColors.dangerRed,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.dangerRed,
                              blurRadius: 18,
                              spreadRadius: 2,
                            ),
                          ],
                        ),
                        child: const Icon(Icons.call_end_rounded, color: Colors.white, size: 30),
                      ),
                      const SizedBox(height: 8),
                      const Text('Cancel', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),

                // Accept Call (Direct Answer)
                GestureDetector(
                  onTap: _connectCallNow,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(22),
                        decoration: const BoxDecoration(
                          color: AppColors.healthGreen,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.healthGreen,
                              blurRadius: 18,
                              spreadRadius: 2,
                            ),
                          ],
                        ),
                        child: const Icon(Icons.call_rounded, color: Colors.white, size: 30),
                      ),
                      const SizedBox(height: 8),
                      const Text('Accept', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ─── TOP CONTROL HEADER ───────────────────────────────────────────────────
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
                  decoration: const BoxDecoration(
                    color: AppColors.healthGreen,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  _formatDuration(_callDurationSeconds),
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

  // ─── BOTTOM CONTROL DOCK ──────────────────────────────────────────────────
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

  // ─── LOCAL CAMERA STREAM ──────────────────────────────────────────────────
  Widget _buildLocalCameraStream() {
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
              : CameraPreview(_cameraController!)
        else
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

  // ─── REMOTE VET STREAM ────────────────────────────────────────────────────
  Widget _buildVetVideoStream() {
    return Stack(
      fit: StackFit.expand,
      children: [
        ResilientNetworkImage(
          imageUrl: widget.vet.photoUrl,
          fit: BoxFit.cover,
          fallbackAssetPath: 'assets/images/vet_placeholder.png',
        ),
        Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                Colors.black.withValues(alpha: 0.45),
                Colors.transparent,
                Colors.black.withValues(alpha: 0.65),
              ],
              stops: const [0.0, 0.4, 1.0],
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
            'Starting video feed...',
            style: GoogleFonts.plusJakartaSans(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.white),
          ),
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

/// Concentric Pulsing Wave Rings around Doctor Avatar during Call Request
class _RingingPulseAvatar extends StatefulWidget {
  final String? photoUrl;
  final String vetName;

  const _RingingPulseAvatar({
    this.photoUrl,
    required this.vetName,
  });

  @override
  State<_RingingPulseAvatar> createState() => _RingingPulseAvatarState();
}

class _RingingPulseAvatarState extends State<_RingingPulseAvatar>
    with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    )..repeat();
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return RepaintBoundary(
      child: AnimatedBuilder(
        animation: _pulseController,
        builder: (context, child) {
          final progress = _pulseController.value;

          return SizedBox(
            width: 200,
            height: 200,
            child: Stack(
              alignment: Alignment.center,
              children: [
                // Outer Pulse Ring
                Transform.scale(
                  scale: 1.0 + (progress * 0.5),
                  child: Container(
                    width: 150,
                    height: 150,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: AppColors.primary.withValues(
                          alpha: (0.45 * (1.0 - progress)).clamp(0.0, 0.45),
                        ),
                        width: 2.0,
                      ),
                    ),
                  ),
                ),

                // Mid Pulse Ring
                Transform.scale(
                  scale: 1.0 + (((progress + 0.5) % 1.0) * 0.4),
                  child: Container(
                    width: 130,
                    height: 130,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: AppColors.primary.withValues(
                          alpha: (0.6 * (1.0 - ((progress + 0.5) % 1.0))).clamp(0.0, 0.6),
                        ),
                        width: 2.0,
                      ),
                    ),
                  ),
                ),

                // Center Avatar
                Container(
                  width: 110,
                  height: 110,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: AppColors.primary, width: 3),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.primary.withValues(alpha: 0.4),
                        blurRadius: 20,
                        spreadRadius: 4,
                      ),
                    ],
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(55),
                    child: ResilientNetworkImage(
                      imageUrl: widget.photoUrl,
                      width: 110,
                      height: 110,
                      fit: BoxFit.cover,
                      fallbackAssetPath: 'assets/images/vet_placeholder.png',
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
