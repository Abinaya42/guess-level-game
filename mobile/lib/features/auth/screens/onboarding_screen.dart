import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:firebase_auth/firebase_auth.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});
  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  int _page = 0;
  final _slides = [
    {'emoji': '🎨', 'title': 'Find 11', 'desc': 'Express yourself with intuitive drawing tools — colors, brushes, undo, and more.'},
    {'emoji': '🧩', 'title': 'Guess the Word', 'desc': 'Watch the drawing come to life and type your guesses. Faster guesses earn more points!'},
    {'emoji': '🏆', 'title': 'Win Together', 'desc': 'Play with up to 11 friends in private rooms. Invite by code or link!'},
  ];

  @override
  Widget build(BuildContext context) {
    final slide = _slides[_page];
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              Expanded(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(slide['emoji']!, style: const TextStyle(fontSize: 80)),
                    const SizedBox(height: 24),
                    Text(slide['title']!, style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w800)),
                    const SizedBox(height: 12),
                    Text(slide['desc']!, textAlign: TextAlign.center, style: const TextStyle(fontSize: 16, color: Colors.grey, height: 1.6)),
                  ],
                ),
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(_slides.length, (i) => AnimatedContainer(duration: const Duration(milliseconds: 300), margin: const EdgeInsets.symmetric(horizontal: 4), width: i == _page ? 24 : 8, height: 8, decoration: BoxDecoration(color: i == _page ? const Color(0xFF6366F1) : Colors.grey.shade300, borderRadius: BorderRadius.circular(4)))),
              ),
              const SizedBox(height: 24),
              if (_page < _slides.length - 1)
                SizedBox(width: double.infinity, child: ElevatedButton(onPressed: () => setState(() => _page++), style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF6366F1), foregroundColor: Colors.white), child: const Text('Next →', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700))))
              else ...[
                SizedBox(width: double.infinity, child: ElevatedButton(onPressed: () => context.go('/register'), style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF6366F1), foregroundColor: Colors.white), child: const Text('Get Started', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)))),
                const SizedBox(height: 8),
                TextButton(onPressed: () => context.go('/login'), child: const Text('Already have an account')),
              ],
              TextButton(onPressed: () => context.go('/login'), child: const Text('Skip', style: TextStyle(color: Colors.grey))),
            ],
          ),
        ),
      ),
    );
  }
}