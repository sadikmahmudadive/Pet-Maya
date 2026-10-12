import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tail_wagging_flutter/core/responsive.dart';

void main() {
  Future<Size> pumpAt(WidgetTester tester, Size screen) async {
    tester.view.physicalSize = screen;
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);
    late Size seen;
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: ResponsiveCenter(
            child: Builder(
              builder: (context) {
                seen = MediaQuery.sizeOf(context);
                return const SizedBox.expand();
              },
            ),
          ),
        ),
      ),
    );
    return seen;
  }

  testWidgets('phones keep the full width', (tester) async {
    final seen = await pumpAt(tester, const Size(360, 740));
    expect(seen.width, 360);
    expect(tester.getSize(find.byType(SizedBox).last).width, 360);
  });

  testWidgets('tablets cap the column and narrow MediaQuery', (tester) async {
    final seen = await pumpAt(tester, const Size(1280, 800));
    expect(seen.width, Responsive.contentMaxWidth);
    final rect = tester.getRect(find.byType(SizedBox).last);
    expect(rect.width, Responsive.contentMaxWidth);
    expect(rect.center.dx, 640); // centred
  });

  test('size classes and columns', () {
    expect(Responsive.sizeForWidth(320), ScreenSize.compact);
    expect(Responsive.sizeForWidth(700), ScreenSize.medium);
    expect(Responsive.sizeForWidth(1024), ScreenSize.expanded);
    expect(Responsive.columnsFor(319, minTileWidth: 160, max: 4), 1);
    expect(Responsive.columnsFor(350, minTileWidth: 160, max: 4), 2);
    expect(Responsive.columnsFor(1176, minTileWidth: 160, max: 4), 4);
  });
}
