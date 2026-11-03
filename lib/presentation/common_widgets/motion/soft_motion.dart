import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Motion toolkit for the soft & friendly look. Every widget here respects the phone's "reduce motion" setting
/// (it then shows the final state straight away) and animates only opacity, offset and scale, so it stays smooth
/// on low-end phones.
class SoftMotion {
  SoftMotion._();

  /// Strong ease-out: quick start, long gentle landing. Used for entrances.
  static const Curve out = Cubic(0.16, 1, 0.3, 1);
  static const Duration enter = Duration(milliseconds: 520);

  /// True when the user asked the system to cut motion down.
  static bool reduced(BuildContext context) => MediaQuery.maybeDisableAnimationsOf(context) ?? false;
}

/// Fades and slides its child up into place. Give each item in a list a growing [index] to stagger them
/// (45 ms apart, capped so a long list never makes anyone wait).
class Reveal extends StatefulWidget {
  final Widget child;
  final int index;
  final Duration delay;
  final double dy;

  const Reveal({super.key, required this.child, this.index = 0, this.delay = Duration.zero, this.dy = 22});

  @override
  State<Reveal> createState() => _RevealState();
}

class _RevealState extends State<Reveal> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(vsync: this, duration: SoftMotion.enter);
  late final Animation<double> _t = CurvedAnimation(parent: _c, curve: SoftMotion.out);
  bool _started = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_started) return;
    _started = true;
    if (SoftMotion.reduced(context)) {
      _c.value = 1;
      return;
    }
    final wait = widget.delay + Duration(milliseconds: 45 * widget.index.clamp(0, 8));
    Future<void>.delayed(wait, () {
      if (mounted) _c.forward();
    });
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _t,
      child: widget.child,
      builder: (context, child) => Opacity(
        opacity: _t.value.clamp(0.0, 1.0),
        child: Transform.translate(offset: Offset(0, (1 - _t.value) * widget.dy), child: child),
      ),
    );
  }
}

/// Press feedback for anything tappable: dips to 96% while held, springs back, and gives a light haptic tick.
class Pressable extends StatefulWidget {
  final Widget child;
  final VoidCallback? onTap;
  final double scale;
  final bool haptic;
  final BorderRadius? borderRadius;

  const Pressable({super.key, required this.child, this.onTap, this.scale = 0.96, this.haptic = true, this.borderRadius});

  @override
  State<Pressable> createState() => _PressableState();
}

class _PressableState extends State<Pressable> {
  bool _down = false;

  void _set(bool v) {
    if (widget.onTap == null || _down == v) return;
    setState(() => _down = v);
  }

  @override
  Widget build(BuildContext context) {
    final reduce = SoftMotion.reduced(context);
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTapDown: (_) {
        _set(true);
        if (widget.haptic && widget.onTap != null) HapticFeedback.selectionClick();
      },
      onTapUp: (_) => _set(false),
      onTapCancel: () => _set(false),
      onTap: widget.onTap,
      child: AnimatedScale(
        scale: _down && !reduce ? widget.scale : 1,
        duration: Duration(milliseconds: _down ? 90 : 220),
        curve: _down ? Curves.easeOut : Curves.easeOutBack,
        child: widget.child,
      ),
    );
  }
}

/// Counts a number up from zero the first time it appears (and between values when it changes).
class CountUp extends StatelessWidget {
  final int value;
  final TextStyle? style;
  final String prefix;
  final String suffix;

  const CountUp({super.key, required this.value, this.style, this.prefix = '', this.suffix = ''});

  @override
  Widget build(BuildContext context) {
    if (SoftMotion.reduced(context)) return Text('$prefix$value$suffix', style: style);
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: value.toDouble()),
      duration: const Duration(milliseconds: 900),
      curve: SoftMotion.out,
      builder: (context, v, _) => Text('$prefix${v.round()}$suffix', style: style),
    );
  }
}

/// A slow, gentle up-and-down drift for illustrations and decorative shapes. Not used on anything people tap.
class Floating extends StatefulWidget {
  final Widget child;
  final double distance;
  final Duration period;
  final double phase;

  const Floating({super.key, required this.child, this.distance = 6, this.period = const Duration(milliseconds: 3200), this.phase = 0});

  @override
  State<Floating> createState() => _FloatingState();
}

class _FloatingState extends State<Floating> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(vsync: this, duration: widget.period, value: widget.phase);
  bool _started = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_started) return;
    _started = true;
    if (!SoftMotion.reduced(context)) _c.repeat(reverse: true);
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _c,
      child: widget.child,
      builder: (context, child) => Transform.translate(
        offset: Offset(0, Curves.easeInOutSine.transform(_c.value) * -widget.distance),
        child: child,
      ),
    );
  }
}
