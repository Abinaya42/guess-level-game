import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/providers.dart';
import '../../../core/services/api_service.dart';

class HistoryScreen extends ConsumerStatefulWidget {
  const HistoryScreen({super.key});
  @override
  ConsumerState<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends ConsumerState<HistoryScreen> {
  List<Map<String, dynamic>> _history = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final user = ref.read(currentUserProvider);
    if (user == null) return;
    try {
      final h = await ref.read(apiServiceProvider).getUserHistory(user.id);
      if (mounted) setState(() { _history = h; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Game History')),
      body: _loading
        ? const Center(child: CircularProgressIndicator())
        : _history.isEmpty
          ? const Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [Text('🎮', style: TextStyle(fontSize: 48)), SizedBox(height: 12), Text('No games yet!', style: TextStyle(fontSize: 18, color: Colors.grey))]))
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _history.length,
              itemBuilder: (_, i) {
                final g = _history[i];
                final rank = g['rank'] as int;
                return Card(
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  margin: const EdgeInsets.only(bottom: 10),
                  child: Padding(padding: const EdgeInsets.all(14), child: Row(children: [
                    Container(width: 48, height: 48, decoration: BoxDecoration(color: rank == 1 ? Colors.amber.shade100 : Colors.indigo.shade50, borderRadius: BorderRadius.circular(10)), child: Center(child: Text('#$rank', style: TextStyle(fontWeight: FontWeight.w800, color: rank == 1 ? Colors.amber.shade700 : const Color(0xFF6366F1))))),
                    const SizedBox(width: 12),
                    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text('Room: ${g['roomCode']}', style: const TextStyle(fontWeight: FontWeight.w700)),
                      Text('${g['myScore']} pts · ${g['totalPlayers']} players', style: const TextStyle(color: Colors.grey, fontSize: 13)),
                    ])),
                    Text('${g['myScore']} pts', style: const TextStyle(fontWeight: FontWeight.w700, color: Color(0xFF6366F1))),
                  ])),
                );
              },
            ),
    );
  }
}
