import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'core/providers/providers.dart';
import 'features/auth/screens/splash_screen.dart';
import 'features/auth/screens/onboarding_screen.dart';
import 'features/auth/screens/register_screen.dart';
import 'features/auth/screens/login_screen.dart';
import 'features/auth/screens/email_verification_screen.dart';
import 'features/auth/screens/forgot_password_screen.dart';
import 'features/auth/screens/home_screen.dart';
import 'features/auth/screens/profile_screen.dart';
import 'features/auth/screens/settings_screen.dart';
import 'features/room/screens/create_room_screen.dart';
import 'features/room/screens/join_room_screen.dart';
import 'features/room/screens/lobby_screen.dart';
import 'features/game/screens/game_screen.dart';
import 'features/auth/screens/history_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  runApp(const ProviderScope(child: GuessLevelApp()));
}

final _router = GoRouter(
  initialLocation: '/',
  redirect: (context, state) {
    final user = FirebaseAuth.instance.currentUser;
    final isPublic = ['/login', '/register', '/forgot-password', '/onboarding', '/'].contains(state.matchedLocation);
    if (user == null && !isPublic) return '/login';
    if (user != null && state.matchedLocation == '/login') return '/home';
    return null;
  },
  routes: [
    GoRoute(path: '/', builder: (_, __) => const SplashScreen()),
    GoRoute(path: '/onboarding', builder: (_, __) => const OnboardingScreen()),
    GoRoute(path: '/register', builder: (_, __) => const RegisterScreen()),
    GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
    GoRoute(path: '/verify-email', builder: (_, __) => const EmailVerificationScreen()),
    GoRoute(path: '/forgot-password', builder: (_, __) => const ForgotPasswordScreen()),
    GoRoute(path: '/home', builder: (_, __) => const HomeScreen()),
    GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
    GoRoute(path: '/settings', builder: (_, __) => const SettingsScreen()),
    GoRoute(path: '/create-room', builder: (_, __) => const CreateRoomScreen()),
    GoRoute(path: '/join-room', builder: (_, __) => const JoinRoomScreen()),
    GoRoute(path: '/lobby/:code', builder: (_, state) => LobbyScreen(code: state.pathParameters['code']!)),
    GoRoute(path: '/join/:code', builder: (_, state) => LobbyScreen(code: state.pathParameters['code']!)),
    GoRoute(path: '/game/:code', builder: (_, state) => GameScreen(code: state.pathParameters['code']!)),
    GoRoute(path: '/history', builder: (_, __) => const HistoryScreen()),
  ],
);

class GuessLevelApp extends ConsumerWidget {
  const GuessLevelApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return MaterialApp.router(
      title: 'GUESS LEVEL',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF6366F1),
          brightness: Brightness.light,
        ),
        useMaterial3: true,
        fontFamily: 'Roboto',
        inputDecorationTheme: InputDecorationTheme(
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            padding: const EdgeInsets.symmetric(vertical: 14),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
      ),
      routerConfig: _router,
    );
  }
}
