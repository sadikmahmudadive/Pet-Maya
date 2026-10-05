import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:animate_do/animate_do.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:wakelock_plus/wakelock_plus.dart';
import '../../../core/services/call_service.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/models/vet_model.dart';
import '../../../data/models/pet_model.dart';
import '../../../data/models/service_record_model.dart';
import '../../../data/models/user_model.dart';
import '../../../data/repositories/app_state_repository.dart';
import '../../../data/services/call_session.dart';
import '../../common_widgets/resilient_network_image.dart';

/// Real-time Tele-Health video consultation (WebRTC, Firestore signaling).
///
/// Outgoing: leave [callId] null — the screen places the call to [calleeId]
/// (defaults to the vet for owners, or the pet's owner for vets).
/// Incoming: pass the [callId] the user already accepted from the native UI.
class TeleVetVideoCallScreen extends StatefulWidget {
  final VetModel vet;
  final PetModel pet;
  final String channelId; // appointment reference, kept for call-site compatibility
  final String? callId;
  final String? calleeId;

  const TeleVetVideoCallScreen({
    super.key,
    required this.vet,
    required this.pet,
    this.channelId = '',
    this.callId,
    this.calleeId,
  });

  @override
  State<TeleVetVideoCallScreen> createState() => _TeleVetVideoCallScreenState();
}

class _TeleVetVideoCallScreenState extends State<TeleVetVideoCallScreen> {
  CallSession? _session;
  bool _isSwappedPiP = false;
  bool _finishing = false;
  String? _startError;
  Timer? _ticker;

  bool get _isIncoming => widget.callId != null;
  CallPhase get _phase => _session?.phase ?? CallPhase.preparing;

  String get _ringingLabel {
    if (_startError != null) return _startError!;
    if (_isIncoming || _phase == CallPhase.connecting) return 'Connecting…';
    if (_phase == CallPhase.preparing) return 'Starting call…';
    return 'Calling ${widget.vet.name}…';
  }

  @override
  void initState() {
    super.initState();
    WakelockPlus.enable();
    _begin();
  }

  Future<void> _begin() async {
    final statuses = await [Permission.camera, Permission.microphone].request();
    final granted = (statuses[Permission.camera]?.isGranted ?? false) &&
        (statuses[Permission.microphone]?.isGranted ?? false);
    if (!mounted) return;
    if (!granted) {
      setState(() => _startError = 'Camera and microphone access are required for video calls.');
      if (_isIncoming) CallService.declineCall(widget.callId!);
      return;
    }

    final repo = context.read<AppStateRepository>();
    final me = repo.currentUser;
    if (me == null) {
      setState(() => _startError = 'Please sign in to start a call.');
      return;
    }

    final CallSession session;
    if (_isIncoming) {
      session = await CallSession.answerIncoming(callId: widget.callId!, myUid: me.uid);
    } else {
      final iAmVet = me.role == UserRole.veterinarian;
      final calleeId = widget.calleeId ?? (iAmVet ? widget.pet.ownerID : widget.vet.id);
      session = await CallSession.startOutgoing(
        myUid: me.uid,
        myName: iAmVet && !me.name.toLowerCase().startsWith('dr') ? 'Dr. ${me.name}' : me.name,
        myPhoto: me.photoUrl,
        calleeId: calleeId,
        calleeName: iAmVet ? 'Pet owner' : widget.vet.name,
        petId: widget.pet.petID,
        petName: widget.pet.name,
        appointmentId: widget.channelId.isEmpty ? null : widget.channelId,
      );
    }
    if (!mounted) {
      await session.hangUp();
      session.dispose();
      return;
    }
    CallService().activeCallId = session.callId;
    session.addListener(_onSession);
    setState(() => _session = session);
    _ticker = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted && _phase == CallPhase.connected) setState(() {});
    });
    _onSession();
  }

  bool _markedConnected = false;

  void _onSession() {
    final s = _session;
    if (s == null || !mounted) return;
    if (s.phase == CallPhase.connected && !_markedConnected) {
      _markedConnected = true;
      CallService().markConnected(s.callId);
      HapticFeedback.heavyImpact();
    }
    if (s.phase == CallPhase.ended && !_finishing) {
      _finish();
      return;
    }
    setState(() {});
  }

  String _formatDuration(int totalSeconds) {
    final m = (totalSeconds ~/ 60).toString().padLeft(2, '0');
    final s = (totalSeconds % 60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  /// User pressed end / cancel / decline.
  Future<void> _endCall() async {
    HapticFeedback.mediumImpact();
    if (_session == null) {
      if (mounted) Navigator.pop(context);
      return;
    }
    await _session!.hangUp();
  }

  Future<void> _finish() async {
    if (_finishing) return;
    _finishing = true;
    _ticker?.cancel();
    final s = _session!;
    final seconds = s.elapsedSeconds;
    final wasConnected = s.connectedAt != null;
    CallService().markEnded(s.callId);
    WakelockPlus.disable();
    if (!mounted) return;

    if (!wasConnected) {
      final msg = s.endReason ?? 'Call ended.';
      final messenger = ScaffoldMessenger.maybeOf(context);
      Navigator.pop(context);
      messenger?.showSnackBar(SnackBar(content: Text(msg)));
      return;
    }

    final repo = context.read<AppStateRepository>();
    final me = repo.currentUser;
    final iAmVet = me?.role == UserRole.veterinarian;
    final call = s.call;
    final providerId = iAmVet ? me!.uid : (widget.calleeId ?? widget.vet.id);
    final providerName = iAmVet ? me!.name : widget.vet.name;
    final ts = DateTime.now().millisecondsSinceEpoch;
    // Same id on both devices so the two writers never create duplicates.
    repo.addServiceRecord(ServiceRecordModel(
      recordId: 'consult_${s.callId}',
      petId: (call?.petId.isNotEmpty ?? false) ? call!.petId : widget.pet.petID,
      petName: (call?.petName.isNotEmpty ?? false) ? call!.petName : widget.pet.name,
      serviceType: 'Tele-Consultation',
      providerId: providerId,
      providerName: providerName,
      providerRole: 'Veterinarian',
      date: DateTime.now().toString().substring(0, 10),
      title: 'Tele-Vet Consultation with $providerName',
      description: 'HD Video consultation completed. Duration: ${_formatDuration(seconds)}.',
      isSharedWithVets: true,
      timestamp: ts,
    ));

    final petName = widget.pet.name;
    final doctor = widget.vet.name;
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
            Text('Duration: ${_formatDuration(seconds)} • $doctor',
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
                      'Log saved to $petName\'s Passport EHR Vault.',
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
  void dispose() {
    _ticker?.cancel();
    WakelockPlus.disable();
    final s = _session;
    if (s != null) {
      s.removeListener(_onSession);
      if (s.phase != CallPhase.ended) s.hangUp(); // screen torn down mid-call
      CallService().markEnded(s.callId);
      s.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final topPadding = MediaQuery.of(context).padding.top;

    if (_phase == CallPhase.preparing || _phase == CallPhase.ringing || _startError != null) {
      return _buildRingingScreen(topPadding);
    }

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) _endCall();
      },
      child: Scaffold(
        backgroundColor: const Color(0xFF090D16),
        body: Stack(
          children: [
            Positioned.fill(
              child: _isSwappedPiP ? _buildLocalStream() : _buildRemoteStream(),
            ),
            _buildTopHeader(topPadding),
            if (_phase == CallPhase.connecting || _phase == CallPhase.reconnecting)
              Positioned(
                top: topPadding + 64,
                left: 0,
                right: 0,
                child: Center(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.65),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const SizedBox(
                          width: 14,
                          height: 14,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        ),
                        const SizedBox(width: 10),
                        Text(
                          _phase == CallPhase.reconnecting ? 'Poor connection — reconnecting…' : 'Connecting…',
                          style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
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
                      child: _isSwappedPiP ? _buildRemoteStream() : _buildLocalStream(),
                    ),
                  ),
                ),
              ),
            ),
            _buildControlDock(),
          ],
        ),
      ),
    );
  }

  // ─── RINGING / OUTGOING CALL VIEW ──────────────────────────────────────────
  Widget _buildRingingScreen(double topPadding) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) _endCall();
      },
      child: Scaffold(
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
                        _ringingLabel,
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
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Cancel / End
                GestureDetector(
                  onTap: () {
                    HapticFeedback.mediumImpact();
                    _endCall();
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
                      Text(_isIncoming ? 'End' : 'Cancel', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),

              ],
            ),
          ),
        ],
      ),
    ));
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
                  _formatDuration(_session?.elapsedSeconds ?? 0),
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
    final s = _session;
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
                icon: (s?.isMuted ?? false) ? Icons.mic_off_rounded : Icons.mic_rounded,
                isActive: s?.isMuted ?? false,
                activeColor: AppColors.dangerRed,
                onTap: () {
                  HapticFeedback.lightImpact();
                  s?.toggleMute();
                },
              ),
              _buildDockIconButton(
                icon: (s?.isVideoOff ?? false) ? Icons.videocam_off_rounded : Icons.videocam_rounded,
                isActive: s?.isVideoOff ?? false,
                activeColor: AppColors.dangerRed,
                onTap: () {
                  HapticFeedback.lightImpact();
                  s?.toggleVideo();
                },
              ),
              _buildDockIconButton(
                icon: Icons.flip_camera_ios_rounded,
                isActive: false,
                onTap: () {
                  HapticFeedback.lightImpact();
                  s?.switchCamera();
                },
              ),
              _buildDockIconButton(
                icon: (s?.speakerOn ?? true) ? Icons.volume_up_rounded : Icons.volume_down_rounded,
                isActive: !(s?.speakerOn ?? true),
                onTap: () {
                  HapticFeedback.lightImpact();
                  s?.toggleSpeaker();
                },
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
  Widget _buildLocalStream() {
    final s = _session;
    if (s == null) return const Center(child: CircularProgressIndicator(color: AppColors.primary));
    if (s.isVideoOff) {
      return Container(
        color: const Color(0xFF0F172A),
        child: const Center(child: Icon(Icons.videocam_off_rounded, color: Colors.white38, size: 36)),
      );
    }
    return RTCVideoView(
      s.localRenderer,
      mirror: s.isFrontCamera,
      objectFit: RTCVideoViewObjectFit.RTCVideoViewObjectFitCover,
    );
  }

  // ─── REMOTE STREAM (shows the other party's photo until video flows) ──────
  Widget _buildRemoteStream() {
    final s = _session;
    return Stack(
      fit: StackFit.expand,
      children: [
        ResilientNetworkImage(
          imageUrl: widget.vet.photoUrl,
          fit: BoxFit.cover,
          fallbackAssetPath: 'assets/images/vet_placeholder.png',
        ),
        if (s != null && s.hasRemoteVideo)
          RTCVideoView(
            s.remoteRenderer,
            objectFit: RTCVideoViewObjectFit.RTCVideoViewObjectFitCover,
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
