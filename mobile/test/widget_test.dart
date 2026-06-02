import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mobile/providers/user_provider.dart';
import 'package:mobile/screens/onboarding_screen.dart';

void main() {
  testWidgets('Onboarding and Login screen navigation test', (WidgetTester tester) async {
    // Set mock initial values for SharedPreferences
    SharedPreferences.setMockInitialValues({});

    final userProvider = UserProvider();

    // Pump OnboardingScreen with UserProvider
    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider<UserProvider>.value(value: userProvider),
        ],
        child: const MaterialApp(
          home: OnboardingScreen(),
        ),
      ),
    );

    // Verify OnboardingScreen first page content
    expect(find.text('Commute with Community'), findsOneWidget);
    expect(find.text('Next'), findsOneWidget);

    // Tap "Next" button
    await tester.tap(find.text('Next'));
    await tester.pumpAndSettle();

    // Verify second page content
    expect(find.text('Verified & Trusted'), findsOneWidget);

    // Tap "Next" again
    await tester.tap(find.text('Next'));
    await tester.pumpAndSettle();

    // Verify third page content
    expect(find.text('Flexible Payments'), findsOneWidget);
    expect(find.text('Get Started'), findsOneWidget);

    // Tap "Get Started" to navigate to LoginScreen
    await tester.tap(find.text('Get Started'));
    await tester.pumpAndSettle();

    // Verify we are now on the LoginScreen
    expect(find.text('MyCommuteShare'), findsOneWidget);
    expect(find.text('Sign in with Google'), findsOneWidget);
  });
}
