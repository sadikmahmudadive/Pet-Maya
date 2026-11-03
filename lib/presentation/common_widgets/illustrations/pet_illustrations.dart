import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../motion/soft_motion.dart';

/// Hand-built vector illustrations for Pet Maya, drawn with Flutter shapes (no image files): a dog and a cat with a
/// blink, a head tilt and drifting sparkles, plus small props for each empty state. They are sharp at any size and
/// follow the brand palette. When the phone asks for reduced motion they hold still.

enum PetKind { dog, cat }

/// Which situation an illustration shows: it picks the animal, the backdrop tint and the prop it holds.
enum IllustrationScene {
  welcome(PetKind.dog, AppColors.mintSoft, IllustrationProp.heart),
  noPets(PetKind.dog, AppColors.peach, IllustrationProp.paw),
  noOrders(PetKind.cat, AppColors.butter, IllustrationProp.bag),
  noNotifications(PetKind.cat, AppColors.lilac, IllustrationProp.bell),
  noTickets(PetKind.cat, AppColors.sky, IllustrationProp.envelope),
  noAnimals(PetKind.dog, AppColors.sky, IllustrationProp.magnifier),
  noAppointments(PetKind.dog, AppColors.butter, IllustrationProp.calendar),
  noResults(PetKind.cat, AppColors.peach, IllustrationProp.magnifier),
  offline(PetKind.cat, AppColors.lilac, IllustrationProp.wifiOff),
  success(PetKind.dog, AppColors.mintSoft, IllustrationProp.check),
  care(PetKind.cat, AppColors.rose, IllustrationProp.heart);

  final PetKind pet;
  final Color tint;
  final IllustrationProp prop;
  const IllustrationScene(this.pet, this.tint, this.prop);
}

enum IllustrationProp { paw, bag, bell, envelope, magnifier, calendar, wifiOff, check, heart }

const _period = Duration(seconds: 8);

/// A scene: pastel blob, drifting sparkles, the animal, and a prop. Square; [size] is the side.
class SoftIllustration extends StatefulWidget {
  final IllustrationScene scene;
  final double size;
  const SoftIllustration({super.key, required this.scene, this.size = 190});

  @override
  State<SoftIllustration> createState() => _SoftIllustrationState();
}

class _SoftIllustrationState extends State<SoftIllustration> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(vsync: this, duration: _period);
  bool _started = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_started) return;
    _started = true;
    if (SoftMotion.reduced(context)) {
      _c.value = 0.15;
    } else {
      _c.repeat();
    }
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    return Semantics(
      label: 'Illustration of a ${widget.scene.pet.name}',
      image: true,
      excludeSemantics: true,
      child: RepaintBoundary(
        child: CustomPaint(
          size: Size.square(widget.size),
          painter: _ScenePainter(widget.scene, dark, _c),
        ),
      ),
    );
  }
}

/// Just the animal, for headers and small spots.
class PetCharacter extends StatefulWidget {
  final PetKind kind;
  final double size;
  const PetCharacter({super.key, required this.kind, this.size = 120});

  @override
  State<PetCharacter> createState() => _PetCharacterState();
}

class _PetCharacterState extends State<PetCharacter> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(vsync: this, duration: _period);
  bool _started = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_started) return;
    _started = true;
    if (SoftMotion.reduced(context)) {
      _c.value = 0.15;
    } else {
      _c.repeat();
    }
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'A friendly ${widget.kind.name}',
      image: true,
      excludeSemantics: true,
      child: RepaintBoundary(
        child: CustomPaint(size: Size.square(widget.size), painter: _PetOnlyPainter(widget.kind, _c)),
      ),
    );
  }
}

/// A paw print in one colour, for patterns and bullets.
class PawPrint extends StatelessWidget {
  final double size;
  final Color color;
  const PawPrint({super.key, this.size = 24, required this.color});

  @override
  Widget build(BuildContext context) =>
      ExcludeSemantics(child: CustomPaint(size: Size.square(size), painter: _PawPainter(color)));
}

// ───────────────────────────── painters ─────────────────────────────

class _ScenePainter extends CustomPainter {
  final IllustrationScene scene;
  final bool dark;
  final Animation<double> t;
  _ScenePainter(this.scene, this.dark, this.t) : super(repaint: t);

  @override
  void paint(Canvas canvas, Size size) {
    final s = size.width / 200;
    canvas.save();
    canvas.scale(s);
    final v = t.value;

    // Backdrop: an organic blob that breathes very slightly.
    final tint = dark ? Color.alphaBlend(scene.tint.withValues(alpha: 0.16), AppColors.surfaceDark) : scene.tint;
    final breathe = 1 + math.sin(v * 2 * math.pi) * 0.012;
    canvas.save();
    canvas.translate(100, 104);
    canvas.scale(breathe);
    canvas.drawPath(_blob(88, 0.6), Paint()..color = tint);
    canvas.restore();

    _sparkles(canvas, v, dark);

    // Animal, nudged left and down so the prop has room at the right.
    canvas.save();
    canvas.translate(-6, 6 + math.sin(v * 2 * math.pi) * 1.6);
    _drawPet(canvas, scene.pet, v);
    canvas.restore();

    _drawProp(canvas, scene.prop, v, dark);
    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant _ScenePainter old) => old.scene != scene || old.dark != dark;
}

class _PetOnlyPainter extends CustomPainter {
  final PetKind kind;
  final Animation<double> t;
  _PetOnlyPainter(this.kind, this.t) : super(repaint: t);

  @override
  void paint(Canvas canvas, Size size) {
    canvas.save();
    canvas.scale(size.width / 200);
    _drawPet(canvas, kind, t.value);
    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant _PetOnlyPainter old) => old.kind != kind;
}

class _PawPainter extends CustomPainter {
  final Color color;
  _PawPainter(this.color);

  @override
  void paint(Canvas canvas, Size size) {
    canvas.save();
    canvas.scale(size.width / 100);
    _paw(canvas, color);
    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant _PawPainter old) => old.color != color;
}

// ───────────────────────────── shapes ─────────────────────────────

/// A smooth closed blob around the origin with [r] as its mean radius.
Path _blob(double r, double wobble) {
  const n = 9;
  final pts = <Offset>[];
  for (var i = 0; i < n; i++) {
    final a = i / n * 2 * math.pi;
    final k = 1 + 0.07 * wobble * math.sin(3 * a + 0.6) + 0.05 * wobble * math.sin(5 * a + 1.9);
    pts.add(Offset(math.cos(a) * r * k, math.sin(a) * r * k));
  }
  final path = Path();
  final first = Offset((pts[0].dx + pts[n - 1].dx) / 2, (pts[0].dy + pts[n - 1].dy) / 2);
  path.moveTo(first.dx, first.dy);
  for (var i = 0; i < n; i++) {
    final p = pts[i];
    final next = pts[(i + 1) % n];
    path.quadraticBezierTo(p.dx, p.dy, (p.dx + next.dx) / 2, (p.dy + next.dy) / 2);
  }
  return path..close();
}

void _sparkles(Canvas canvas, double v, bool dark) {
  final spots = <(Offset, double, double)>[
    (const Offset(34, 40), 7, 0.0),
    (const Offset(168, 52), 5, 0.33),
    (const Offset(158, 118), 4, 0.66),
    (const Offset(22, 120), 4, 0.5),
  ];
  for (final (p, r, phase) in spots) {
    final k = 0.55 + 0.45 * math.sin((v * 2 + phase) * 2 * math.pi);
    final c = (dark ? Colors.white : Colors.white).withValues(alpha: (dark ? 0.55 : 0.95) * k.clamp(0.0, 1.0));
    final path = Path()
      ..moveTo(p.dx, p.dy - r * (0.6 + 0.4 * k))
      ..quadraticBezierTo(p.dx, p.dy, p.dx + r * (0.6 + 0.4 * k), p.dy)
      ..quadraticBezierTo(p.dx, p.dy, p.dx, p.dy + r * (0.6 + 0.4 * k))
      ..quadraticBezierTo(p.dx, p.dy, p.dx - r * (0.6 + 0.4 * k), p.dy)
      ..quadraticBezierTo(p.dx, p.dy, p.dx, p.dy - r * (0.6 + 0.4 * k))
      ..close();
    canvas.drawPath(path, Paint()..color = c);
  }
}

void _paw(Canvas canvas, Color color) {
  final p = Paint()..color = color;
  // main pad
  final pad = Path()
    ..moveTo(50, 46)
    ..cubicTo(68, 46, 82, 64, 82, 76)
    ..cubicTo(82, 88, 70, 90, 60, 86)
    ..cubicTo(54, 84, 46, 84, 40, 86)
    ..cubicTo(30, 90, 18, 88, 18, 76)
    ..cubicTo(18, 64, 32, 46, 50, 46)
    ..close();
  canvas.drawPath(pad, p);
  canvas.drawOval(Rect.fromCenter(center: const Offset(20, 42), width: 15, height: 20), p);
  canvas.drawOval(Rect.fromCenter(center: const Offset(38, 26), width: 15, height: 22), p);
  canvas.drawOval(Rect.fromCenter(center: const Offset(62, 26), width: 15, height: 22), p);
  canvas.drawOval(Rect.fromCenter(center: const Offset(80, 42), width: 15, height: 20), p);
}

double _blinkFactor(double v) {
  // Two quick blinks per 8 s loop; 1 = open, 0.08 = closed.
  double dip(double centre) {
    final d = (v - centre).abs();
    return d < 0.014 ? 1 - math.cos(d / 0.014 * math.pi / 2) * 0.92 : 1;
  }

  return math.min(dip(0.31), dip(0.74));
}

void _drawPet(Canvas canvas, PetKind kind, double v) {
  final tilt = math.sin(v * 2 * math.pi) * 0.028;
  final blink = _blinkFactor(v);
  if (kind == PetKind.dog) {
    _dog(canvas, tilt, blink);
  } else {
    _cat(canvas, tilt, blink);
  }
}

const _ink = Color(0xFF3A2A28);

void _eyes(Canvas canvas, Offset l, Offset r, double rx, double ry, double blink) {
  for (final c in [l, r]) {
    canvas.save();
    canvas.translate(c.dx, c.dy);
    canvas.scale(1, blink);
    canvas.drawOval(Rect.fromCenter(center: Offset.zero, width: rx * 2, height: ry * 2), Paint()..color = _ink);
    canvas.drawCircle(Offset(-rx * 0.28, -ry * 0.34), rx * 0.34, Paint()..color = Colors.white);
    canvas.restore();
  }
}

void _dog(Canvas canvas, double tilt, double blink) {
  const fur = Color(0xFFF1BF86);
  const earC = Color(0xFFC98A52);
  const muzzle = Color(0xFFFFEBD2);

  // Body and collar
  canvas.drawRRect(RRect.fromRectAndCorners(const Rect.fromLTWH(46, 150, 108, 46), topLeft: const Radius.circular(44), topRight: const Radius.circular(44), bottomLeft: const Radius.circular(22), bottomRight: const Radius.circular(22)), Paint()..color = fur);
  canvas.drawRRect(RRect.fromRectAndRadius(const Rect.fromLTWH(62, 148, 76, 16), const Radius.circular(8)), Paint()..color = AppColors.primary);
  canvas.drawCircle(const Offset(100, 171), 8, Paint()..color = AppColors.butter);
  canvas.drawCircle(const Offset(100, 171), 3, Paint()..color = const Color(0xFFE0A100));

  // Head group, tilting around the neck
  canvas.save();
  canvas.translate(100, 152);
  canvas.rotate(tilt);
  canvas.translate(-100, -152);

  // Floppy ears
  for (final side in [-1.0, 1.0]) {
    canvas.save();
    canvas.translate(100 + side * 50, 96);
    canvas.rotate(side * -0.22);
    canvas.drawOval(Rect.fromCenter(center: const Offset(0, 14), width: 40, height: 76), Paint()..color = earC);
    canvas.restore();
  }

  canvas.drawOval(Rect.fromCenter(center: const Offset(100, 108), width: 122, height: 110), Paint()..color = fur);
  // Blaze and muzzle
  canvas.drawOval(Rect.fromCenter(center: const Offset(100, 88), width: 22, height: 52), Paint()..color = muzzle);
  canvas.drawOval(Rect.fromCenter(center: const Offset(100, 134), width: 70, height: 50), Paint()..color = muzzle);

  _eyes(canvas, const Offset(74, 106), const Offset(126, 106), 7.4, 8.2, blink);

  // Blush
  final blush = Paint()..color = const Color(0xFFFF9FA8).withValues(alpha: 0.5);
  canvas.drawCircle(const Offset(58, 128), 8.5, blush);
  canvas.drawCircle(const Offset(142, 128), 8.5, blush);

  // Nose
  final nose = Path()
    ..moveTo(89, 119)
    ..quadraticBezierTo(100, 114, 111, 119)
    ..quadraticBezierTo(111, 129, 100, 131)
    ..quadraticBezierTo(89, 129, 89, 119)
    ..close();
  canvas.drawPath(nose, Paint()..color = _ink);
  canvas.drawOval(Rect.fromCenter(center: const Offset(96, 120), width: 6, height: 3.4), Paint()..color = Colors.white.withValues(alpha: 0.6));

  // Mouth and tongue
  final mouth = Paint()
    ..color = _ink
    ..style = PaintingStyle.stroke
    ..strokeWidth = 2.6
    ..strokeCap = StrokeCap.round;
  canvas.drawPath(Path()..moveTo(100, 131)..lineTo(100, 138), mouth);
  canvas.drawPath(Path()..moveTo(87, 138)..quadraticBezierTo(94, 146, 100, 138)..quadraticBezierTo(106, 146, 113, 138), mouth);
  canvas.drawRRect(RRect.fromRectAndRadius(const Rect.fromLTWH(94.5, 141, 11, 13), const Radius.circular(5.5)), Paint()..color = const Color(0xFFFF7A8A));
  canvas.restore();
}

void _cat(Canvas canvas, double tilt, double blink) {
  const fur = Color(0xFFF7B880);
  const stripe = Color(0xFFE48B4A);
  const inner = Color(0xFFFFC7CF);
  const muzzle = Color(0xFFFFEBD6);

  // Body and scarf
  canvas.drawRRect(RRect.fromRectAndCorners(const Rect.fromLTWH(48, 152, 104, 44), topLeft: const Radius.circular(44), topRight: const Radius.circular(44), bottomLeft: const Radius.circular(22), bottomRight: const Radius.circular(22)), Paint()..color = fur);
  canvas.drawRRect(RRect.fromRectAndRadius(const Rect.fromLTWH(60, 148, 80, 18), const Radius.circular(9)), Paint()..color = AppColors.lilac);
  canvas.drawRRect(RRect.fromRectAndRadius(const Rect.fromLTWH(112, 158, 18, 28), const Radius.circular(8)), Paint()..color = const Color(0xFFD7CAFF));

  canvas.save();
  canvas.translate(100, 152);
  canvas.rotate(tilt);
  canvas.translate(-100, -152);

  // Ears
  for (final side in [-1.0, 1.0]) {
    final x = 100 + side * 46;
    final ear = Path()
      ..moveTo(x - side * 22, 92)
      ..quadraticBezierTo(x + side * 4, 36, x + side * 14, 40)
      ..quadraticBezierTo(x + side * 28, 56, x + side * 30, 96)
      ..close();
    canvas.drawPath(ear, Paint()..color = fur);
    final earIn = Path()
      ..moveTo(x - side * 8, 90)
      ..quadraticBezierTo(x + side * 8, 54, x + side * 14, 56)
      ..quadraticBezierTo(x + side * 22, 66, x + side * 20, 92)
      ..close();
    canvas.drawPath(earIn, Paint()..color = inner);
  }

  canvas.drawOval(Rect.fromCenter(center: const Offset(100, 110), width: 130, height: 104), Paint()..color = fur);

  // Forehead stripes
  final sp = Paint()
    ..color = stripe
    ..style = PaintingStyle.stroke
    ..strokeWidth = 4.2
    ..strokeCap = StrokeCap.round;
  canvas.drawLine(const Offset(100, 62), const Offset(100, 76), sp);
  canvas.drawLine(const Offset(86, 65), const Offset(88, 77), sp);
  canvas.drawLine(const Offset(114, 65), const Offset(112, 77), sp);

  canvas.drawOval(Rect.fromCenter(center: const Offset(100, 132), width: 54, height: 38), Paint()..color = muzzle);

  _eyes(canvas, const Offset(72, 108), const Offset(128, 108), 8.4, 9.4, blink);

  final blush = Paint()..color = const Color(0xFFFF9FA8).withValues(alpha: 0.5);
  canvas.drawCircle(const Offset(56, 128), 8.5, blush);
  canvas.drawCircle(const Offset(144, 128), 8.5, blush);

  // Nose, mouth, whiskers
  final nose = Path()
    ..moveTo(94, 123)
    ..lineTo(106, 123)
    ..lineTo(100, 130)
    ..close();
  canvas.drawPath(nose, Paint()..color = const Color(0xFFE9798B)..style = PaintingStyle.fill);
  canvas.drawPath(nose, Paint()..color = const Color(0xFFE9798B)..style = PaintingStyle.stroke..strokeWidth = 3..strokeJoin = StrokeJoin.round);
  final mouth = Paint()
    ..color = _ink
    ..style = PaintingStyle.stroke
    ..strokeWidth = 2.4
    ..strokeCap = StrokeCap.round;
  canvas.drawPath(Path()..moveTo(100, 130)..lineTo(100, 134), mouth);
  canvas.drawPath(Path()..moveTo(90, 135)..quadraticBezierTo(95, 141, 100, 134)..quadraticBezierTo(105, 141, 110, 135), mouth);
  final wh = Paint()
    ..color = const Color(0xFF8A6A5A).withValues(alpha: 0.55)
    ..style = PaintingStyle.stroke
    ..strokeWidth = 1.8
    ..strokeCap = StrokeCap.round;
  for (final side in [-1.0, 1.0]) {
    canvas.drawLine(Offset(100 + side * 40, 128), Offset(100 + side * 66, 122), wh);
    canvas.drawLine(Offset(100 + side * 40, 134), Offset(100 + side * 68, 134), wh);
    canvas.drawLine(Offset(100 + side * 40, 140), Offset(100 + side * 64, 146), wh);
  }
  canvas.restore();
}

// ───────────────────────────── props ─────────────────────────────

void _drawProp(Canvas canvas, IllustrationProp prop, double v, bool dark) {
  final bob = math.sin((v * 2 + 0.25) * 2 * math.pi) * 2.6;
  canvas.save();
  canvas.translate(150, 156 + bob);
  final shadow = Paint()
    ..color = Colors.black.withValues(alpha: dark ? 0.35 : 0.12)
    ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 5);
  canvas.drawOval(Rect.fromCenter(center: const Offset(0, 32), width: 44, height: 8), shadow);

  switch (prop) {
    case IllustrationProp.paw:
      canvas.save();
      canvas.translate(-24, -26);
      canvas.scale(0.5);
      _paw(canvas, AppColors.primary);
      canvas.restore();
    case IllustrationProp.heart:
      final h = Path()
        ..moveTo(0, 26)
        ..cubicTo(-34, 2, -22, -26, 0, -10)
        ..cubicTo(22, -26, 34, 2, 0, 26)
        ..close();
      canvas.drawPath(h, Paint()..color = const Color(0xFFFF6F86));
      canvas.drawOval(Rect.fromCenter(center: const Offset(-12, -8), width: 9, height: 6), Paint()..color = Colors.white.withValues(alpha: 0.6));
    case IllustrationProp.bag:
      final handle = Paint()
        ..color = AppColors.primaryDark
        ..style = PaintingStyle.stroke
        ..strokeWidth = 4
        ..strokeCap = StrokeCap.round;
      canvas.drawArc(Rect.fromCenter(center: const Offset(0, -14), width: 24, height: 28), math.pi, math.pi, false, handle);
      canvas.drawRRect(RRect.fromRectAndRadius(const Rect.fromLTWH(-24, -12, 48, 44), const Radius.circular(12)), Paint()..color = AppColors.primary);
      canvas.drawCircle(const Offset(-8, 2), 2.6, Paint()..color = Colors.white);
      canvas.drawCircle(const Offset(8, 2), 2.6, Paint()..color = Colors.white);
    case IllustrationProp.bell:
      final body = Path()
        ..moveTo(-22, 22)
        ..quadraticBezierTo(-20, 22, -20, 4)
        ..quadraticBezierTo(-20, -22, 0, -22)
        ..quadraticBezierTo(20, -22, 20, 4)
        ..quadraticBezierTo(20, 22, 22, 22)
        ..close();
      canvas.drawPath(body, Paint()..color = const Color(0xFFFFC53D));
      canvas.drawCircle(const Offset(0, -25), 4, Paint()..color = const Color(0xFFE0A100));
      canvas.drawCircle(const Offset(0, 28), 5, Paint()..color = const Color(0xFFE0A100));
      canvas.drawOval(Rect.fromCenter(center: const Offset(-8, -6), width: 6, height: 16), Paint()..color = Colors.white.withValues(alpha: 0.5));
    case IllustrationProp.envelope:
      canvas.drawRRect(RRect.fromRectAndRadius(const Rect.fromLTWH(-30, -16, 60, 42), const Radius.circular(9)), Paint()..color = Colors.white);
      final flap = Paint()
        ..color = AppColors.skyInk.withValues(alpha: 0.55)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 3
        ..strokeJoin = StrokeJoin.round
        ..strokeCap = StrokeCap.round;
      canvas.drawPath(Path()..moveTo(-26, -10)..lineTo(0, 10)..lineTo(26, -10), flap);
      canvas.drawCircle(const Offset(0, 12), 5, Paint()..color = const Color(0xFFFF6F86));
    case IllustrationProp.magnifier:
      final ring = Paint()
        ..color = AppColors.secondaryDark
        ..style = PaintingStyle.stroke
        ..strokeWidth = 6
        ..strokeCap = StrokeCap.round;
      canvas.drawCircle(const Offset(-4, -6), 18, Paint()..color = Colors.white.withValues(alpha: 0.7));
      canvas.drawCircle(const Offset(-4, -6), 18, ring);
      canvas.drawLine(const Offset(9, 7), const Offset(24, 24), ring..strokeWidth = 8);
    case IllustrationProp.calendar:
      canvas.drawRRect(RRect.fromRectAndRadius(const Rect.fromLTWH(-26, -22, 52, 52), const Radius.circular(11)), Paint()..color = Colors.white);
      canvas.drawRRect(RRect.fromRectAndCorners(const Rect.fromLTWH(-26, -22, 52, 16), topLeft: const Radius.circular(11), topRight: const Radius.circular(11)), Paint()..color = const Color(0xFFFF8F6B));
      final dot = Paint()..color = AppColors.primary;
      for (var r = 0; r < 2; r++) {
        for (var c = 0; c < 3; c++) {
          canvas.drawCircle(Offset(-14.0 + c * 14, 4.0 + r * 13), 3.2, dot);
        }
      }
    case IllustrationProp.wifiOff:
      final arc = Paint()
        ..color = AppColors.lilacInk
        ..style = PaintingStyle.stroke
        ..strokeWidth = 5
        ..strokeCap = StrokeCap.round;
      for (final r in [30.0, 20.0, 10.0]) {
        canvas.drawArc(Rect.fromCenter(center: const Offset(0, 14), width: r * 2, height: r * 2), math.pi * 1.2, math.pi * 0.6, false, arc);
      }
      canvas.drawCircle(const Offset(0, 14), 3.4, Paint()..color = AppColors.lilacInk);
      canvas.drawLine(const Offset(-26, -22), const Offset(26, 26), Paint()
        ..color = const Color(0xFFFF6F86)
        ..strokeWidth = 5
        ..strokeCap = StrokeCap.round);
    case IllustrationProp.check:
      canvas.drawCircle(Offset.zero, 26, Paint()..color = AppColors.primary);
      canvas.drawPath(
        Path()..moveTo(-12, 1)..lineTo(-3, 11)..lineTo(14, -9),
        Paint()
          ..color = Colors.white
          ..style = PaintingStyle.stroke
          ..strokeWidth = 6
          ..strokeCap = StrokeCap.round
          ..strokeJoin = StrokeJoin.round,
      );
  }
  canvas.restore();
}
