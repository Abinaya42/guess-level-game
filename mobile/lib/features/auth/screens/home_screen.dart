import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../../core/providers/providers.dart';
import '../../../core/services/api_service.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});
  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  final _joinCodeCtrl = TextEditingController();

  @override
  void dispose() { _joinCodeCtrl.dispose(); super.dispose(); }

  void _joinRoom() {
    final code = _joinCodeCtrl.text.trim().toUpperCase();
    if (code.length != 6) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Enter a 6-character room code'), backgroundColor: Colors.red));
      return;
    }
    context.push('/lobby/$code');
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(currentUserProvider);

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 140,
            floating: false,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [Color(0xFF667eea), Color(0xFF764ba2)])),
                child: SafeArea(child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Row(
                    children: [
                      const Text('🎨', style: TextStyle(fontSize: 28)),
                      const SizedBox(width: 10),
                      const Text('GUESS LEVEL', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w800, letterSpacing: 1)),
                      const Spacer(),
                      IconButton(icon: const Icon(Icons.person, color: Colors.white), onPressed: () => context.push('/profile')),
                      IconButton(icon: const Icon(Icons.settings, color: Colors.white), onPressed: () => context.push('/settings')),
                    ],
                  ),
                )),
              ),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.all(16),
            sliver: SliverList(children: [
              Text('Welcome, ${user?.username ?? 'Player'}! 👋', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
              const SizedBox(height: 20),

              // Action cards
              Row(children: [
                Expanded(child: _actionCard(context, '🚀', 'Create Room', 'Start a game', const Color(0xFF6366F1), () => context.push('/create-room'))),
                const SizedBox(width: 12),
                Expanded(child: _actionCard(context, '🏆', 'History', 'Past games', const Color(0xFF10B981), () => context.push('/history'))),
              ]),
              const SizedBox(height: 16),

              // Join room
              Card(
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                elevation: 2,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('🔗 Join a Room', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 10),
                      Row(children: [
                        Expanded(child: TextField(controller: _joinCodeCtrl, textCapitalization: TextCapitalization.characters, maxLength: 6, decoration: InputDecoration(hintText: 'Room code (XXXXXX)', counterText: '', border: OutlineInputBorder(borderRadius: BorderRadius.circular(10))), style: const TextStyle(letterSpacing: 3, fontWeight: FontWeight.w700))),
                        const SizedBox(width: 10),
                        ElevatedButton(onPressed: _joinRoom, style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10B981), foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14)), child: const Text('Join')),
                      ]),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Quick stats
              if (user != null) FutureBuilder(
                future: ref.read(apiServiceProvider).getUserStats(user.id),
                builder: (_, snap) {
                  if (!snap.hasData) return const SizedBox.shrink();
                  final stats = snap.data!;
                  return Card(
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    elevation: 2,
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        const Text('📊 Your Stats', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                        const SizedBox(height: 12),
                        Row(children: [
                          _statBox('Games', '${stats.gamesPlayed}'),
                          _statBox('Wins', '${stats.gamesWon}'),
                          _statBox('Avg', '${stats.avgScore}'),
                          _statBox('Best', '${stats.bestScore}'),
                        ]),
                      ]),
                    ),
                  );
                },
              ),
            ].map((w) => w).toList()),
          ),
        ],
      ),
    );
  }

  Widget _actionCard(BuildContext context, String emoji, String title, String sub, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(14), boxShadow: [BoxShadow(color: color.withOpacity(0.4), blurRadius: 12, offset: const Offset(0, 4))]),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(emoji, style: const TextStyle(fontSize: 32)),
          const SizedBox(height: 8),
          Text(title, style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w700)),
          Text(sub, style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 12)),
        ]),
      ),
    );
  }

  Widget _statBox(String label, String value) {
    return Expanded(child: Container(
      margin: const EdgeInsets.symmetric(horizontal: 4),
      padding: const EdgeInsets.symmetric(vertical: 10),
      decoration: BoxDecoration(color: Colors.indigo.shade50, borderRadius: BorderRadius.circular(10)),
      child: Column(children: [
        Text(value, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: Color(0xFF6366F1))),
        Text(label, style: const TextStyle(fontSize: 11, color: Colors.grey)),
      ]),
    ));
  }
}
