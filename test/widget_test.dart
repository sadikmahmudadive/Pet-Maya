import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:tail_wagging_flutter/main.dart';
import 'package:tail_wagging_flutter/data/repositories/app_state_repository.dart';

void main() {
  testWidgets('Tail Wagging App launches successfully and navigates past splash', (WidgetTester tester) async {
    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (_) => AppStateRepository()),
        ],
        child: const TailWaggingApp(),
      ),
    );

    // Initial frame shows Splash Branding
    expect(find.text('Tail Wagging'), findsOneWidget);

    // Advance time past the 2-second splash timer
    await tester.pump(const Duration(milliseconds: 2500));
    await tester.pumpAndSettle();

    // After splash, Login Screen appears
    expect(find.text('Welcome Back!'), findsOneWidget);
  });
}
