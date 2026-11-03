import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:tail_wagging_flutter/core/theme/app_colors.dart';
import 'package:tail_wagging_flutter/presentation/common_widgets/empty_state.dart';
import 'package:tail_wagging_flutter/presentation/common_widgets/illustrations/pet_illustrations.dart';
import 'package:tail_wagging_flutter/presentation/common_widgets/motion/soft_motion.dart';

Widget host(Widget child, {bool reduceMotion = false}) => MediaQuery(
  data: MediaQueryData(disableAnimations: reduceMotion),
  child: MaterialApp(home: Scaffold(body: child)),
);

void main() {
  setUpAll(() => GoogleFonts.config.allowRuntimeFetching = false);

  testWidgets(
    'every illustration scene draws, in motion and at rest, without errors',
    (tester) async {
      for (final reduce in [false, true]) {
        await tester.pumpWidget(
          host(
            SingleChildScrollView(
              child: Wrap(
                children: [
                  for (final s in IllustrationScene.values)
                    SoftIllustration(scene: s, size: 120),
                ],
              ),
            ),
            reduceMotion: reduce,
          ),
        );
        await tester.pump(
          const Duration(seconds: 3),
        ); // through a blink and a sparkle cycle
        expect(
          find.byType(SoftIllustration),
          findsNWidgets(IllustrationScene.values.length),
        );
        expect(tester.takeException(), isNull);
      }
    },
  );

  test(
    'empty-state icons pick a fitting scene, and unknown icons still get one',
    () {
      expect(
        EmptyState.sceneFor(Icons.notifications_off_rounded),
        IllustrationScene.noNotifications,
      );
      expect(
        EmptyState.sceneFor(Icons.receipt_long_rounded),
        IllustrationScene.noOrders,
      );
      expect(
        EmptyState.sceneFor(Icons.travel_explore_rounded),
        IllustrationScene.noAnimals,
      );
      expect(
        EmptyState.sceneFor(Icons.event_available_rounded),
        IllustrationScene.noAppointments,
      );
      expect(
        EmptyState.sceneFor(Icons.support_agent_rounded),
        IllustrationScene.noTickets,
      );
      expect(EmptyState.sceneFor(Icons.ac_unit), IllustrationScene.noPets);
    },
  );

  testWidgets('empty state shows its words and runs its action', (
    tester,
  ) async {
    var taps = 0;
    await tester.pumpWidget(
      host(
        EmptyState(
          icon: Icons.pets_rounded,
          title: 'No pets yet',
          message: 'Add one to begin.',
          actionLabel: 'Add a pet',
          onAction: () => taps++,
        ),
      ),
    );
    await tester.pump(const Duration(milliseconds: 100));
    for (var i = 0; i < 12; i++) {
      await tester.pump(const Duration(milliseconds: 100));
    }
    expect(find.text('No pets yet'), findsOneWidget);
    expect(find.text('Add one to begin.'), findsOneWidget);
    await tester.tap(find.text('Add a pet'));
    expect(taps, 1);
  });

  testWidgets('with reduce-motion on, content is visible straight away', (
    tester,
  ) async {
    await tester.pumpWidget(
      host(const Reveal(child: Text('hello')), reduceMotion: true),
    );
    final opacity = tester.widget<Opacity>(
      find
          .ancestor(of: find.text('hello'), matching: find.byType(Opacity))
          .first,
    );
    expect(opacity.opacity, 1);
  });

  testWidgets('a counter ends on its value; reduce-motion shows it at once', (
    tester,
  ) async {
    await tester.pumpWidget(host(const CountUp(value: 125)));
    await tester.pump(const Duration(seconds: 2));
    expect(find.text('125'), findsOneWidget);
    await tester.pumpWidget(host(const CountUp(value: 40), reduceMotion: true));
    expect(find.text('40'), findsOneWidget);
  });

  test(
    'text colours stay readable on the cream page and on white (WCAG 4.5:1)',
    () {
      double lum(Color c) {
        double ch(double v) => v <= 0.03928
            ? v / 12.92
            : math.pow((v + 0.055) / 1.055, 2.4).toDouble();
        return 0.2126 * ch(c.r) + 0.7152 * ch(c.g) + 0.0722 * ch(c.b);
      }

      double ratio(Color a, Color b) {
        final l1 = lum(a), l2 = lum(b);
        return (l1 > l2 ? l1 + 0.05 : l2 + 0.05) /
            (l1 > l2 ? l2 + 0.05 : l1 + 0.05);
      }

      for (final bg in [AppColors.background, AppColors.surface]) {
        expect(ratio(AppColors.textPrimary, bg), greaterThanOrEqualTo(4.5));
        expect(ratio(AppColors.textSecondary, bg), greaterThanOrEqualTo(4.5));
        expect(ratio(AppColors.textTertiary, bg), greaterThanOrEqualTo(4.5));
      }
      expect(
        ratio(Colors.white, AppColors.primaryStrong),
        greaterThanOrEqualTo(4.5),
      ); // white text on filled buttons
      expect(
        ratio(AppColors.peachInk, AppColors.peach),
        greaterThanOrEqualTo(4.5),
      );
      expect(ratio(AppColors.skyInk, AppColors.sky), greaterThanOrEqualTo(4.5));
      expect(
        ratio(AppColors.lilacInk, AppColors.lilac),
        greaterThanOrEqualTo(4.5),
      );
      expect(
        ratio(AppColors.mintInk, AppColors.mintSoft),
        greaterThanOrEqualTo(4.5),
      );
      expect(
        ratio(AppColors.butterInk, AppColors.butter),
        greaterThanOrEqualTo(4.5),
      );
    },
  );
}
