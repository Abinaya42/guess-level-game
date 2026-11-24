import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../../core/providers/providers.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);
    final initials = user?.username.substring(0, user.username.length >= 2 ? 2 : 1).toUpperCase() ?? '?';

    return Scaffold(
      appBar: AppBar(title: const Text('Profile'), leading: BackButton(onPressed: () => context.pop())),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(children: [
          CircleAvatar(radius: 48, backgroundColor: const Color(0xFF6366F1), child: Text(initials, style: const TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.w800))),
          const SizedBox(height: 12),
          Text(user?.username ?? '', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700)),
          Text(user?.email ?? '', style: const TextStyle(color: Colors.grey)),
          const SizedBox(height: 24),
          if (user != null) FutureBuilder(
            future: ref.read(apiServiceProvider).getUserStats(user.id),
            builder: (_, snap) {
              if (!snap.hasData) return const CircularProgressIndicator();
              final s = snap.data!;
              return Card(
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                child: Padding(padding: const EdgeInsets.all(20), child: Column(children: [
                  const Text('Statistics', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 16),
                  _statRow('🎮 Games Played', '${s.gamesPlayed}'),
                  _statRow('🏆 Games Won', '${s.gamesWon}'),
                  _statRow('📈 Avg Score', '${s.avgScore}'),
                  _statRow('⭐ Best Score', '${s.bestScore}'),
                  _statRow('💎 Total Points', '${s.totalPoints}'),
                  _statRow('🎯 Win Rate', s.gamesPlayed > 0 ? '${(s.gamesWon / s.gamesPlayed * 100).round()}%' : '0%'),
                ])),
              );
            },
          ),
        ]),
      ),
    );
  }

  Widget _statRow(String label, String value) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 6),
    child: Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [Text(label), Text(value, style: const TextStyle(fontWeight: FontWeight.w700, color: Color(0xFF6366F1)))],
    ),
  );
}
