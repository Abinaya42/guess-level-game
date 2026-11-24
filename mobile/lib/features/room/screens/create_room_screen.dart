import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../../core/providers/providers.dart';
import '../../../core/services/socket_service.dart';

class CreateRoomScreen extends ConsumerStatefulWidget {
  const CreateRoomScreen({super.key});
  @override
  ConsumerState<CreateRoomScreen> createState() => _CreateRoomScreenState();
}

class _CreateRoomScreenState extends ConsumerState<CreateRoomScreen> {
  final _socket = SocketService();
  bool _creating = false;

  @override
  void initState() {
    super.initState();
    _setupSocket();
  }

  Future<void> _setupSocket() async {
    final fbUser = FirebaseAuth.instance.currentUser;
    if (fbUser == null) { context.go('/login'); return; }
    final token = await fbUser.getIdToken();
    _socket.connect(token!);

    _socket.on('room:created', (data) {
      if (!mounted) return;
      final map = data as Map<String, dynamic>;
      ref.read(roomProvider.notifier).state = RoomModel.fromJson({
        'id': map['roomId'],
        'code': map['code'],
        'hostId': ref.read(currentUserProvider)!.id,
        'status': 'WAITING',
        'maxPlayers': 11,
        'inviteLink': map['inviteLink'],
        'players': map['players'] ?? [],
      });
      ref.read(playersProvider.notifier).state = (map['players'] as List<dynamic>? ?? [])
          .map((p) => PlayerModel.fromJson(p as Map<String, dynamic>))
          .toList();
      context.go('/lobby/${map['code']}');
    });

    _socket.on('error', (data) {
      if (!mounted) return;
      final msg = (data as Map<String, dynamic>)['message'] as String? ?? 'Error';
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), backgroundColor: Colors.red));
      setState(() => _creating = false);
    });
  }

  void _createRoom() {
    if (_creating) return;
    setState(() => _creating = true);
    _socket.createRoom();
  }

  @override
  void dispose() {
    _socket.off('room:created');
    _socket.off('error');
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [Color(0xFF667eea), Color(0xFF764ba2)]),
        ),
        child: SafeArea(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Card(
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                elevation: 20,
                child: Padding(
                  padding: const EdgeInsets.all(32),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text('🚀', style: TextStyle(fontSize: 64)),
                      const SizedBox(height: 16),
                      const Text('Create a Room', style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800)),
                      const SizedBox(height: 8),
                      const Text('Start a private game for up to 11 players', textAlign: TextAlign.center, style: TextStyle(color: Colors.grey)),
                      const SizedBox(height: 24),
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(color: Colors.grey.shade50, borderRadius: BorderRadius.circular(12)),
                        child: const Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text('Room details', style: TextStyle(fontWeight: FontWeight.w600, color: Colors.grey)),
                          SizedBox(height: 8),
                          Row(children: [Text('👥 '), Text('Up to 11 players')]),
                          Row(children: [Text('🔄 '), Text('11 rounds (each player draws once)')]),
                          Row(children: [Text('⏱️ '), Text('60 seconds per round')]),
                        ]),
                      ),
                      const SizedBox(height: 24),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: _creating ? null : _createRoom,
                          style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF6366F1), foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 16)),
                          child: _creating
                              ? const Row(mainAxisAlignment: MainAxisAlignment.center, children: [SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)), SizedBox(width: 10), Text('Creating...')])
                              : const Text('✨ Create Room', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                        ),
                      ),
                      const SizedBox(height: 10),
                      TextButton(onPressed: () => context.go('/home'), child: const Text('← Back to Home')),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
